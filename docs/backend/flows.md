# End-to-end flows (draft 1, 2026-11-12)

Companion to `plan.md` section 2. Planning only; nothing here is built.

**Actors.** `Dev` a paired device. `W` the `later` Worker (edge: static app, authentication, routing). `A` the Account object. `S` a Space object. `U` the `later-updater` Worker. `P` the model provider. `X` a connector's remote service (mail server, calendar feed, MCP server).

**Step tags.** `[API]` a client call from `client-api.md`. `[MODEL]` a provider call, with tier. `[GATE]` a policy decision from `@later/core`. `[LEDGER]` a budget operation. `[STORE]` a storage write. `[PUSH]` a web push. Costs are estimates from `research/free-plan-budget.md` (the repository's price table of 2026-11-11 and assumed token counts); they are not measurements.

**Rules that hold in every flow.**

- R1. Before any `[MODEL]` call: check `halted`, then `reserve` (system runs) or `reserveBoth` (Space runs). After it: `settle` with the provider's reported usage. A failed call is `release`d.
- R2. Every connector call goes through one executor that calls `authorize` first and writes an action-log entry after, including reads made by host code.
- R3. Every model output is parsed against a strict schema; a failure is retried once with the validation issues, then dropped with a log entry. Nothing unvalidated is stored or shown.
- R4. A run's tool set, model and taint flags are fixed at start, except that taint flags only ever turn on.
- R5. Anything a Space does that changes Today or its tile is mirrored to `A` in a coalesced notification (at most one per 30 seconds per Space).

---

## 1. First-run install and pairing

| # | Step |
|---|---|
| 1 | User opens the pre-filled Cloudflare token link, creates an API token, runs the command-line installer and pastes the token and their Anthropic key. Neither leaves their machine except to Cloudflare's API |
| 2 | Installer checks the account and `workers.dev` subdomain (creates it if missing), generates a master key, a session-signing key, push keys and a 128-bit bootstrap code |
| 3 | Installer uploads `later-updater` with the deploy token as its only secret, then `later` with the two object classes, static web app, and its secrets (provider key, master key, session key, push private key, hash of the bootstrap code). The installer keeps nothing |
| 4 | Installer calls `GET /v1/selftest` with the bootstrap code. `A` is created on first request `[STORE: schema, account row, account ledger with the default cap]` and runs the provider check `[MODEL: one minimal call, watch tier, under 0.0001 USD]` `[LEDGER: reserve, settle]`, push-key check and storage check |
| 5 | Installer prints the result and a QR code: backend address plus bootstrap code |
| 6 | Phone scans, loads the web app from `W`, generates a device key, `[API] POST /v1/pair/claim`. `W` rate-limits; `A` compares the code hash, marks it used `[STORE: device row, bootstrap consumed]` |
| 7 | `[API] POST /v1/session/challenge`, `POST /v1/session`, `GET /v1/bootstrap`. App shows the self-test and asks the user to add it to the Home Screen and allow notifications `[API] POST /v1/push/subscriptions` `[STORE]` `[PUSH: test]` |
| 8 | App shows the provider-side spend-limit instruction (architecture D7) and the account budget; user confirms or changes the cap `[API] PUT /v1/budget/account` `[LEDGER: setCap]` |

Failure handling: each self-test line names what failed and the fix. A wrong provider key is replaced from the app (stored encrypted in `A`, overriding the Worker secret) without a redeploy.

## 2. Onboarding ingestion to first value

Starts when the mail connection passes its test. Target: something useful within five minutes of that moment.

| # | Step |
|---|---|
| 1 | `[API] POST /v1/connections` (app password). `W` to `A`: credential encrypted under the master key `[STORE]`; `[GATE: authorize mail.search as a host read: allow]`; `X` IMAP login, list folders, fetch 1 header. Health `ok` `[STORE]` |
| 2 | `[API] POST /v1/onboarding/ingest` with a budget (default proposed: 1 USD) and look-back. `[LEDGER: reserve the budget on the account ledger as an ingestion reservation]` |
| 3 | **Stage 1, synchronous, about 60 seconds.** `A` fetches the 50 most recent threads (headers and the first 1,500 characters of text) and 30 recent sent messages `[GATE: read, allow; run marked private and tainted]` `[STORE: message refs only, no bodies]` |
| 4 | Code, no model: sender frequency, who the user replies to (these become **protected senders** and seed people files), newsletter detection by list headers |
| 5 | `[MODEL: watch tier, one call under 100k tokens, tool-less ingest run]` Output: a "what I learned" summary, 3 to 5 suggested actions, candidate Spaces with the threads that justify each. About 0.01 USD `[LEDGER: settle part]` |
| 6 | `[MODEL: work tier, one call]` over the sent messages with quoted text stripped: a voice profile (length, greeting, sign-off, register). About 0.02 USD. `[STORE: memory file `voice.md`, trust user, private]` |
| 7 | `A` writes proposal cards (new Space, enable routine) and an `fyi` "what I learned" card, all `untrusted: true` with email sources `[STORE]`; events `onboarding.progress`, `card.created` |
| 8 | User accepts Spaces `[API] POST /v1/onboarding/proposals/{id}`: `A` creates each `S` `[STORE: Space row, grant with sender filters, Space ledger]` |
| 9 | Flow 5 runs once over the last 48 hours of mail so the first triage stack exists. **This is first value** |
| 10 | **Stage 2, background, batch.** Remaining look-back in chunks under 100k tokens `[MODEL: watch tier, batch]`: people notes, more Space candidates, routing rules (sender to Space). Polled by alarm; results validated and stored as proposals. About 0.03 USD |
| 11 | Calendar: user pastes the secret iCal address `[API] POST /v1/connections`; `A` fetches and parses `[STORE: events for 14 days]`; meeting-brief routine proposed |
| 12 | Ingestion ends: `[LEDGER: settle actual, release the rest]`; an `fyi` card states what was read and what it cost |

Resumable: stage 2 keeps a cursor per chunk; a pause at the budget, a platform limit or `halted` leaves it where it stopped.

## 3. Morning deck build

Triggered by an alarm on `A` 90 minutes before the user's deck time.

| # | Step |
|---|---|
| 1 | `A` wakes; refreshes the calendar feed `[GATE: read]`; asks each active `S` (one call each, only those with changes since the last deck) for its candidates |
| 2 | Code selects candidates from the index: cards in state `new`, approvals pending, tasks due, meetings today, returns from Later due today. Applies the length cap and per-Space quota, pinned Spaces first. No model so far |
| 3 | For `needs-reply` items above the draft threshold, `A` asks the owning `S` to queue a draft run (flow 6, steps 3 to 7, submitted as a batch request) `[LEDGER: reserveBoth per Space]` |
| 4 | `[LEDGER: reserve on the account ledger]` `[MODEL: watch tier, batch, tool-less]` Input: candidate summaries (tainted), day's events. Output: one `brief` card (headline, day shape, top three, stats), an order for the rest, layout hints, a folded-count line for overflow. About 0.002 USD |
| 5 | `[STORE: batch id, job id, deadline]`. `A` sets a poll alarm every 10 minutes and sleeps |
| 6 | On results: validate each card with `parseCard`; check every `cardId` the model referenced exists and was a candidate; clamp hints (plan section 4.4); `[LEDGER: settle]` |
| 7 | Deadline (10 minutes before deck time) without results: cancel the batch, run the same request synchronously; if that fails, publish the code-ranked deck without a brief |
| 8 | `[STORE: Today view, new `rev`]`; event `view.patch`; optional `[PUSH: "Today is ready"]` |
| 9 | During the day the deck is not rebuilt. New items enter by code (flow 5) as `view.patch` inserts within the cap; overflow is counted, not appended |

## 4. Read-feed edition build

Triggered by an alarm on `A` before the user's feed time. Two separate runs, because one handles private mail and the other must be free to browse.

| # | Step |
|---|---|
| 1 | **Newsletters.** `A` takes the message refs that triage classed as newsletters since the last edition (flow 5), fetches their text `[GATE: read; run private and tainted]` |
| 2 | `[LEDGER: reserve against the feed sub-cap]` `[MODEL: watch tier, batch, tool-less, chunks under 100k tokens]` Output: snippets of `headline`, `text`, `sourceRef`, `url?`. About 0.004 USD for 15 newsletters |
| 3 | Host checks: every `url` appears verbatim in the source message (a tool-observed address, M1 backlog 4); otherwise the snippet keeps only its email source |
| 4 | **Interests.** A second run with **no private context**: system prompt holds only the user's followed topics (user-authored). `[MODEL: watch tier]` with `web.search` (fixed egress) and `web.fetch` (open egress) `[GATE: read, allow, since the run has touched nothing private]`. Capped at a fixed number of searches |
| 5 | Code merges: de-duplicate by address and title, per-source quota, total cap (default 12), order by the user's past `more` and `less` signals |
| 6 | `[STORE: edition, snippets, feed view `rev`]` `[LEDGER: settle]`; event `view.patch` |
| 7 | The edition ends with a fixed end marker. Nothing loads after it. `save` on a snippet creates a card in a Space `[API] POST /v1/feed/snippets/{id}/actions` |

If the feed sub-cap or a platform limit is hit, the edition is shorter or skipped, with one line saying so.

## 5. Mail arrives and is triaged

One poller on `A`. Interval adapts: 5 minutes in active hours, 15 otherwise.

| # | Step |
|---|---|
| 1 | Alarm on `A`. `[GATE: host read mail.search, allow]` `X` IMAP: connect, search since the stored cursor, fetch headers and the first text part of new messages, close `[STORE: cursor, platform meter]` |
| 2 | No new mail: set the next alarm; done. No model call |
| 3 | Code first: muted senders dropped; a waking condition from flow 9 matched; sender-to-Space rules applied; newsletters (list headers) set aside for flow 4; calendar invitations parsed |
| 4 | `[LEDGER: reserve on the account ledger]` `[MODEL: watch tier, one call for the whole poll, tool-less ingest run]` Input: each remaining message as quoted data (sender, subject, 1,500 characters), and each Space's name and user-written purpose. Output per message: `spaceId` or inbox, `kind`, `gist`, `why`, up to 4 `intents`, `priority`. About 0.0015 USD for ten messages |
| 5 | Host validation: the Space exists and holds a mail grant whose filters admit this sender, otherwise the Inbox Space; strings within limits; `priority` clamped; a protected sender can never be classed as noise `[LEDGER: settle]` |
| 6 | `A` calls each target `S` once with its messages. `S` `[STORE: `triage-item` cards with `provenance.untrusted: true`, message refs, action-log entry]`; emits `card.created`; notifies `A` (R5) |
| 7 | `A` `[STORE: index rows]`; if the card qualifies for today's deck and the cap allows, `view.patch` insert; if it is from a watched sender or a waking condition, `[PUSH]` |
| 8 | Event-triggered routines in the Space (`mail.received`) are queued as runs, subject to R1 |

## 6. A triage swipe becomes a draft

| # | Step |
|---|---|
| 1 | Swipe right. Client applies it at once and shows the undo row. `[API] POST /v1/cards/{id}/actions` (`reply`, `intent?`, `clientMutationId`) |
| 2 | `S`: `isActionAllowed`; `[STORE: card state `decided`, `decidedAction: reply`, undo token; run row, trigger `user`]`; returns the card, undo token and `runId` |
| 3 | Run starts on an alarm (R1) `[LEDGER: reserveBoth]`. Tool set fixed: `mail.read`, `memory.read`, `calendar.read`, local `emit_card` |
| 4 | `[MODEL: work tier]` turn 1. Model calls `mail.read` for the thread `[GATE: read, allow]`; run becomes private and tainted `[STORE: checkpoint]` |
| 5 | `[MODEL]` turn 2 with the thread, the voice profile and the person note. Model calls `emit_card` with a `draft`. About 0.016 USD in total |
| 6 | Host builds the stored draft: recipients' `origin` set by code (`thread`, `known` from user-trust people files, or `new`); `needsRecipientCheck` when tainted with a `new` recipient; `provenance.untrusted: true`; `parseCard` `[STORE: draft card, action log]` `[LEDGER: settle]` |
| 7 | Events `card.created`, `run.finished`. The draft waits in the drafts queue. **Nothing has been written to the mailbox** |
| 8 | Undo before the draft is opened: `[API] POST /v1/cards/{id}/undo` restores the triage card, cancels the run if still going, removes the draft |

## 7. Send (user confirmation path)

| # | Step |
|---|---|
| 1 | User opens the draft. `[API] GET /v1/cards/{id}` returns the card and, for `send`, the `argsHash` and `argsPreview` the host computed from the exact arguments (recipients, subject, body, thread reference, connection) |
| 2 | If `needsRecipientCheck`: the client shows the recipient step; `[API] POST …/actions` (`confirm-recipient`, hash of the recipient set) `[STORE: confirmed recipient-set hash]` |
| 3 | User presses and holds. The device signs a confirmation (purpose `send`, the `argsHash`, a fresh nonce). `[API] POST …/actions` (`send`, `ifRev`, `confirmation`) |
| 4 | `W` verifies the session and the signature. `S` rebuilds the request from the stored draft at that `rev` and checks: not `halted`; daily send caps; confirmed recipient-set hash equals the current one |
| 5 | `[GATE: authorize]` with a user run context and the confirmation: `allow`, reason `user-confirmed`. `[STORE: consumed nonce, outbox row with `releaseAt` = now + send delay, action log]`. Response: `outboxId`, `releaseAt` |
| 6 | Client shows "Sends at … Stop". `[API] POST /v1/outbox/{id}/cancel` returns the draft to the queue |
| 7 | Alarm at `releaseAt`: re-check `halted` and not cancelled; `X` SMTP send. On success `[STORE: outbox released, card `filed`, action log with the provider's message id]`; events `outbox.released`, `card.updated` |
| 8 | Failure before the server accepted the message: draft returns with the reason. Failure after the body was transmitted: marked "may have been sent", **not retried**, user told to check Sent |

No model call and no ledger operation: a send costs nothing on the meter.

## 8. Agent-initiated approval

| # | Step |
|---|---|
| 1 | In a routine run, the model calls `mail.send` (for example a chase the routine exists to write) |
| 2 | Host `buildRequest`; `[GATE: authorize]` gives `require-approval`, reason `irreversible`. For a bulk or destructive call the host also resolves and freezes the id list first (plan section 6) |
| 3 | `requestApproval` `[STORE: approval `pending`, expiry 24 hours; `approval` card with `argsPreview` rendered by host code from the arguments; action log]` |
| 4 | The model receives a tool result "queued for approval" and finishes its turn. The run ends as `done`; it does not stay suspended `[LEDGER: settle]` |
| 5 | Events `approval.requested`; `[PUSH: type and id only]` |
| 6 | User opens it. `[API] GET /v1/approvals/{id}`. The fixed approval screen shows the preview, the reason, the source, the hash |
| 7 | Press and hold. `[API] POST /v1/approvals/{id}/grant` with a confirmation (purpose `approve`, same hash) |
| 8 | `W` verifies the signature. `S`: `grant`; then `[GATE: authorize]` with the approval: `allow`, reason `approved`; `[STORE: approval `redeemed`, nonce, outbox row]` |
| 9 | Release as flow 7 steps 6 to 8. The host executes the stored call itself; **the model is not consulted again** |
| 10 | Surface: an `fyi` card "Sent to …" with the action-log link, counted in the next brief. If the routine declared a follow-up step, a new run is queued with the result as input |
| 11 | Deny: `[STORE: approval `denied`]`. Expiry: `[STORE: `expired`]`, card removed from Today, one line in the brief |

## 9. Flick to Later and return

| # | Step |
|---|---|
| 1 | User flicks a card to Later and picks a return ("This evening", "When a reply lands"). Client applies it at once. `[API] POST /v1/cards/{id}/actions` (`snooze`, `until` or `wake`) |
| 2 | `S` `[STORE: state `snoozed`, `snoozedUntil` or a wake condition, undo token]`. Timed: an alarm. Conditional: `S` registers the thread reference with `A` `[STORE: watch row]` |
| 3 | Event `card.updated`; `A` moves it to the Later band (`view.patch`) |
| 4 | Return by time: alarm on `S` `[STORE: state `new`, priority raised]`; `view.patch`; `[PUSH]` if the user asked for one |
| 5 | Return by event: flow 5 step 3 matches the thread; `A` tells `S`; same as step 4 with the reason shown ("A reply landed") |

No model call anywhere in this flow.

## 10. Voice capture to filed cards

| # | Step |
|---|---|
| 1 | User records. The device transcribes on its own where it can. Offline: stored on the device with a client id |
| 2 | `[API] POST /v1/captures` (`transcript`, `recordedAt`). If the device could not transcribe: `PUT /v1/captures/{id}/audio`; `A` passes the stream to speech recognition in the user's Cloudflare account and keeps only the text |
| 3 | `A` `[STORE: capture with raw text]` `[LEDGER: reserve]` `[MODEL: watch tier, one call]`. Input: the transcript (trust `user`), Space names and purposes. Output: a clean note, and items with `title`, `due?`, `people?`, `spaceId`, `confidence`. About 0.0005 USD |
| 4 | Validation; `[LEDGER: settle]`. Items above the confidence threshold are filed: `A` calls each `S` `[STORE: `filed` and `task` cards, `fromCapture` holding the raw text, source kind `capture`]`. The rest go to the Inbox Space |
| 5 | Events `capture.progress`, `card.created`. Client shows the note, the cards and where each went, with one tap to move `[API] POST /v1/cards/{id}/move` or `POST /v1/captures/{id}/confirm` |

The run is untainted (the only input is the user's own words), so the cards are not marked untrusted.

## 11. A chat message

### 11a. In a Space thread

| # | Step |
|---|---|
| 1 | `[API] POST /v1/threads/{id}/messages`. `S` `[STORE: user message, run row]`; 202 with ids. The client already holds the Space socket |
| 2 | `[LEDGER: reserveBoth]`. Run context: `initiatedBy: user`; tools from the assigned crew member's configuration; if the message carries `context.cardId`, that card and its sources are loaded and the run is tainted accordingly |
| 3 | `[MODEL: work tier, streaming]`. Stable prefix (tools, persona, Space memory index) is cached; the thread tail and the new message follow. `message.delta` events go down the Space socket. About 0.01 USD a turn |
| 4 | Each tool call: `buildRequest`, `[GATE: authorize]`, execute or request approval (flow 8), `[STORE: action log, checkpoint]`. Cards are produced with `emit_card` and validated |
| 5 | End of turn: `[STORE: agent message with blocks]` `[LEDGER: settle]`; `message.completed`, `run.finished` |

### 11b. In the general thread, with the chief

| # | Step |
|---|---|
| 1 | `[API] POST /v1/threads/general/messages`. `A` `[STORE: message]` |
| 2 | `[LEDGER: reserve]` `[MODEL: watch tier, tool-less]` routing call. Input: the message, the last few routing decisions, Space names and user-written purposes. Output: `space` with an id, `chief`, or `ask`. About 0.0002 USD |
| 3 | `space`: `A` forwards **the user's words unchanged** to that `S` as a user-initiated message, and records a `routed` block. The client opens that Space's socket and 11a runs. The reply is attributed to the crew member and referenced from the general thread |
| 4 | `chief`: a question across Spaces ("what is waiting on me?"). `[MODEL: watch or work tier]` with index-only read tools (cards by state, tiles, today's events). The chief has no connector grants and no egress, so nothing it has read can leave. The answer is text plus `card-ref` blocks |
| 5 | `ask`: the chief replies with a `choice` block naming two or three Spaces |
| 6 | A request that spans Spaces is split by the chief into one forwarded message per Space, each shown to the user as a `routed` block before it runs |

If the chief ever passes on text it composed rather than the user's own words, the receiving run starts as agent-initiated and already tainted (plan section 1.4).

## 12. The chief assigns a crew member to a Space

| # | Step |
|---|---|
| 1 | Trigger: the user asks in the general thread, accepts a template, or the weekly review proposes it |
| 2 | The chief emits a `proposal` card (new type, plan section 12): crew member, Space, role, tools to grant grouped by tier, model tier, routines, estimated monthly cost. Fields are filled by host code from the crew member's configuration; the model supplies only the choice and a one-line reason |
| 3 | User accepts. `[API] PUT /v1/spaces/{id}/assignments`; needs a confirmation (`widen-permission`) when any write or egress tool is included |
| 4 | `S` `[STORE: assignment, tool list, tier; routines created paused; action log]`. A crew member in two Spaces is two separate instances with separate memory |
| 5 | Events `space.updated`, `crew.status`. The mascot appears on the Space; enabling each routine is its own step |

No model call is needed when the user makes the assignment directly in settings.

## 13. Template install and Space export

**Install**

| # | Step |
|---|---|
| 1 | `[API] POST /v1/templates/inspect` with an address or a gallery entry. `A` fetches the manifest and any referenced skill folders (a host fetch of a user-chosen address; size-capped; text only) |
| 2 | `validateTemplateManifest` against the registry; `summarizePermissions`; cost estimate from the routines' schedules and tiers; missing connectors listed `[STORE: inspect record, content hash]` |
| 3 | The fixed install screen shows every connector and scope, tools by tier with irreversible and open-egress ones listed, routines, models, budget, author and whether it came from the reviewed gallery |
| 4 | Hold to install. `[API] POST /v1/templates/install` with a confirmation bound to the manifest hash |
| 5 | `A` creates `S` `[STORE: Space, manifest copy, assignments, routines paused, Space ledger with the template's caps (the user may lower them), grants the user chose]` |
| 6 | Nothing runs until the user enables a routine |

**Export**

| # | Step |
|---|---|
| 1 | `[API] POST /v1/spaces/{id}/export` (`template`) |
| 2 | `S` builds a manifest from its configuration only: agents, routines, tools, connector scopes, budget, card types. Cards, memory, people, threads, logs, credentials and grants' filters are left out |
| 3 | Personas the user has edited are shown for review before download, since they are the one place personal text can remain |
| 4 | `validateTemplateManifest`; download. `data` exports instead produce the full Space as a bundle (plan section 8) |

## 14. A run interrupted and resumed

| # | Step |
|---|---|
| 1 | Every run has a row with a lease that a heartbeat extends while it works, and a checkpoint after each completed model turn and each tool execution |
| 2 | Before executing a write, the executor stores an intent record with an execution id; after, the outcome |
| 3 | The object is evicted, a deploy lands, or the provider stream drops. Nothing runs |
| 4 | Next wake (an alarm set at run start as a watchdog): `S` finds a run whose lease expired `[STORE: status `interrupted`]` |
| 5 | Resume from the last checkpoint. A model turn that was in flight is repeated; its lost usage is charged from the reservation as an estimate and marked as such `[LEDGER: settle estimate, reserve for the remainder]` |
| 6 | A read that was in flight is repeated. A contained write with an intent but no outcome is repeated only if it is idempotent (label, archive). Anything else with an unknown outcome is **not** repeated: the run stops and an `fyi` card says what may or may not have happened |
| 7 | More than two interruptions: the run fails with a card; the routine waits for its next trigger |
| 8 | Client: the Space socket reconnects, calls `GET /v1/runs/{id}`, and receives the stored message so far followed by live deltas |

## 15. Budget warning and pause

| # | Step |
|---|---|
| 1 | `settle` returns the event `warned` (80% of the Space's or the account's cap) `[STORE: ledger]`. `S` or `A` emits `budget.changed`, writes one `fyi` card, `[PUSH]` once per cycle |
| 2 | Deck and feed builds reduce their work at `warned` (fewer drafts, shorter edition) |
| 3 | `settle` returns `paused` (100%). `[GATE]`: every non-read tool is denied with `budget-paused`; `reserve` fails with `paused`, so no new run starts. A run in progress finishes its current turn and stops |
| 4 | Routines skip, with one card for the Space rather than one per skipped run. Local card actions, reading, sending and approving still work: they involve no model call |
| 5 | The user raises the cap `[API] PUT …/budget` with a confirmation `[LEDGER: setCap, event `resumed`]`, or waits for `rollover` at the cycle end |
| 6 | The platform meter follows the same pattern for the free-plan allowance: at 70% the degradation order in plan section 9 begins; at 90% only user-initiated work runs; `503 platform-limit` tells the client when it resets |

## 16. Self-update

| # | Step |
|---|---|
| 1 | Daily alarm on `A`: fetch the release manifest from the published release address; verify its signature against the key pinned in the running code `[STORE: available version]`; event `update.available` |
| 2 | The fixed update screen shows the version, notes, whether storage schemas change and that it cannot be rolled back across a schema change |
| 3 | Hold to update. `[API] POST /v1/update/apply` with a confirmation bound to the release hash. `[GATE: authorize, irreversible, user-confirmed]` |
| 4 | `A` sets `updating`, lets running turns finish, and calls `U` over a service binding with the version and the confirmation |
| 5 | `U` verifies the signature again with its own pinned key, downloads the bundle, checks its hash, and uploads the new `later` script with the deploy token. The token never exists in `later` |
| 6 | Objects migrate their own storage on first wake: additive changes only, version recorded in each object |
| 7 | `U` calls the self-test. On failure, and only if the release changed no object classes, `U` restores the previous script version; otherwise it reports the failure and the app shows recovery steps |
| 8 | `A` clears `updating`; clients reconnect and refetch `bootstrap` |

`U` itself changes only through the installer.
