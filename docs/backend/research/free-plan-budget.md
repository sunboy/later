# Research: free-plan runtime and money model, updated for feed, chief and threads (2026-11-12)

Purpose: arithmetic behind `../plan.md` section 9. **This is a model, not a measurement.** Nothing here has run on a real Cloudflare or Anthropic account.

Tags: **[O]** official page read today through a summarising fetcher; **[R]** from `docs/spikes/runtime-feasibility.md` with its own tag; **[A]** assumption; **[U]** untested.

## 1. Limits used

| Limit (Workers Free) | Value | Tag |
|---|---|---|
| Worker requests | 100,000 a day | O |
| Worker CPU | 10 ms per HTTP request | O |
| Subrequests | 50 per request | O |
| Simultaneous outgoing connections | 6 per request | O |
| Cron triggers | 5 per account | O |
| Workers per account | 100 | O |
| Durable Object requests | 100,000 a day | O |
| Durable Object duration | 13,000 GB-s a day | O |
| SQLite rows read / written | 5,000,000 / 100,000 a day | O |
| SQLite stored data | 5 GB | O |
| Incoming WebSocket messages | billed 20:1 as requests | O |
| Queues | 10,000 operations a day, 24 h retention | O |
| Reset | 00:00 UTC; "exceeding any limit causes further operations of that type to fail" | O |

A Durable Object is billed at 128 MB [R], so 13,000 GB-s is about 101,500 object-seconds (28 hours) a day across all objects.

The pricing page says "Durable Objects that are idle and eligible for hibernation are not billed for duration" [O]. The spike nevertheless assumed an idle tail of 10 to 140 seconds is billed after each wake [R, U]. Both ends are modelled below; the truth must be measured (plan section 10, verification list).

## 2. Load assumptions for one active day

Carried from the spike: 192 mail polls, 36 routine runs of about 150 s, 20 captures, 50 decisions. New or changed:

| Activity | Where | Count a day | Active seconds each | Tag |
|---|---|---|---|---|
| Mail poll (open, search, close) | Account | 192 | 3 | A |
| Triage call when a poll finds mail | Account | 50 | 8 | A |
| Client request bursts and socket wakes | Account | 60 | 3 | A |
| Space-to-index notifications (coalesced) | Account | 120 | 1 | A |
| Chief routing call | Account | 20 | 4 | A |
| Deck build by batch (submit, poll, assemble) and refreshes | Account | 7 | about 15 | A |
| Feed edition by batch | Account | 1 | 30 | A |
| Routine runs | Space | 36 | 150 | R |
| Chat messages (streamed) | Space | 30 | 20 | A |
| Drafts from triage swipes | Space | 10 | 15 | A |
| Capture filing | Space | 20 | 15 | R |
| Decisions | Space | 40 wakes | 1 | R |
| Tile status regeneration | Space | 20 | 5 | A |

## 3. Durable Object duration

Active time: Account about 1,500 s, Spaces about 6,600 s; total about 8,100 s = **1,040 GB-s (8%)**.

Wake windows (bursts that do not overlap another): Account about 340, Spaces about 140; total about 480.

| Idle tail billed per window | Tail seconds | Total GB-s | Share of 13,000 |
|---|---|---|---|
| 10 s | 4,800 | 1,650 | 13% |
| 70 s | 33,600 | 5,340 | 41% |
| 140 s | 67,200 | 9,640 | 74% |

The spike's range for the earlier feature set was 11% to 49%. Feed, chief and threads add about 150 windows and 800 active seconds. **Duration is still what breaks first, and the pessimistic case now leaves about 1.35x headroom instead of 2x.**

What moves the number most, in order:

1. Mail polling: 192 isolated windows, 40% of all windows. Adaptive polling (5 minutes in the user's active hours, 15 otherwise, none overnight unless a watch rule says so) brings this to about 120.
2. Index notifications: sending them only for changes that alter Today, and coalescing to at most one every 30 seconds, brings 120 windows to about 40.
3. Routines: 5,400 active seconds. Single-shot jobs (triage summaries, deck, feed, tile status) move to the batch interface where the provider has one, so the object sleeps while the provider works.
4. Chat streams go directly from the Space object to the client; relaying them through the Account object would double their cost.

With 1 and 2 applied, the pessimistic case is about 8,000 GB-s (62%).

## 4. Rows written

Index maintenance counts as rows written, so a card insert with three indexes in a Space plus its mirror row in the Account index is about 6 rows [A].

| Source | Rows a day |
|---|---|
| Polls (cursor, alarm, meter) | 580 |
| Triage, 100 messages at about 9 | 900 |
| Decisions, 50 at about 8 | 400 |
| Routines, 36 at about 55 | 1,980 |
| Chat, 30 messages at about 20 (messages, checkpoints, ledger, log, coarse stream chunks) | 600 |
| Deck, feed edition, view revisions | 280 |
| Captures, 20 at about 15 | 300 |
| Alarms set | 500 |
| Platform meter | 100 |
| **Total** | **about 5,600 (6%)** |

Persisting stream output every token instead of every two seconds, or adding indexes freely, takes this to 15,000 to 25,000 (15% to 25%). Rows written is second to break, at roughly 4x load.

## 5. Other resources

| Resource | Estimate | Share |
|---|---|---|
| Worker requests (static assets excluded [R]) | 600 to 1,500 | under 2% |
| Durable Object requests (alarms, calls, sockets at 20:1) | about 1,200 | about 1% |
| Rows read, indexed | about 0.3 M; full-text memory search cost per query is unknown [U] | 6% |
| Subrequests per invocation | triage batched into one model call; whether a TCP socket counts as a subrequest is [U] | within 50 |
| Stored data | text only; no mail bodies, audio or attachments kept | far under 5 GB |

## 6. Money (the user's key)

Prices are the repository's verified table of 2026-11-11 (`packages/core/src/price-table.ts`): per million tokens, Haiku tier 0.10 in / 0.50 out / 0.01 cache read; Sonnet tier 2 in / 10 out / 0.10 cache read; batch half price. Token counts are assumptions [A].

| Job | Tier | Tokens assumed | Cost each (USD) |
|---|---|---|---|
| Triage of one poll (10 messages) | watch | 9.5k in, 1k out | 0.0015 |
| Chief routing | watch | 2k in, 60 out | 0.0002 |
| Capture rewrite and extraction | watch | 1.5k in, 600 out | 0.0005 |
| Tile status line | watch | 2k in, 80 out | 0.0003 |
| Morning deck (batch) | watch | 20k in, 3k out | 0.002 |
| Feed edition, 15 newsletters (batch) | watch | 60k in, 3k out | 0.004 |
| One draft | work | 6k in, 400 out | 0.016 |
| One chat turn in a Space, cached prefix | work | 8k cache read, 2k in, 500 out | 0.010 |
| Chat message with a three-turn tool loop | work | — | about 0.03 |
| Routine, watch tier | watch | 15k in, 1.5k out | 0.0023 |
| Routine, work tier | work | 20k in (half cached), 2k out | about 0.04 |
| Onboarding ingestion, 400 threads | watch | 480k in over 8 or more requests each under 100k, 30k out; first 50 threads synchronous, rest batch | about 0.05 |

| Day | Composition | Per day | Per month |
|---|---|---|---|
| Typical | 50 triage polls, deck, 3 drafts, feed, 12 watch and 2 work routines, 8 chat messages, 10 captures | about 0.40 | about 12 |
| Heavy | 50 triage polls, deck, 8 drafts, feed, 30 watch and 6 work routines, 30 chat messages with tools, 20 captures | about 1.50 | about 45 |

Observations:

- Chat and work-tier routines are 80% of spend. Watching, triage, deck and feed together are a few cents a day.
- Requests to the Haiku tier must stay under 100,000 prompt tokens: above that the whole request is priced five times higher (repository price table). Ingestion and feed jobs are chunked accordingly.
- D13's ingestion cap of 5 USD is about one hundred times the modelled cost at current prices. The plan proposes a default of 1 USD and a deeper look-back instead.
- These figures say nothing about non-Anthropic providers; no price for any other provider is recorded in this repository.

## 7. What must be measured on a real account

1. Billed duration per wake, including the idle tail, with and without a connected hibernatable socket.
2. Rows written per card insert with the real indexes.
3. Rows read by a full-text search.
4. Whether TCP sockets count toward the 50-subrequest limit.
5. Actual token counts for triage, deck and chat with real mail.
6. Time for an Anthropic batch of deck size to end.
