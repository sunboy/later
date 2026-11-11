# Spike: runtime feasibility on Cloudflare Free (2026-11-11)

Evidence tags: **[D]** official docs read today, **[L]** run locally (wrangler 4.160.1 / workerd, `agents` 0.33.0, scratchpad `spike-runtime`), **[T]** third-party or search snippet, **[U]** untested. No Cloudflare account, no Anthropic key. Raw TCP to Google was refused by the sandbox, so nothing touching real Gmail was run.

## Verdicts

| # | Question | Verdict |
|---|---|---|
| 1 | Agents SDK + SQLite DOs on Free, one DO per Space | **Go** |
| 2 | Free-plan daily budget, long Anthropic streams | **Go with constraints** (DO duration binds first) |
| 3 | Gmail IMAP/SMTP over `connect()` | **Go with constraints** (live connection untested) |
| 4 | Calendar secret iCal address | **Go with constraints** |
| 5 | Secrets storage | **Go with constraints** |
| 6 | Web push, no third party | **Go with constraints** |

## 1. Agents SDK on Free
- SQLite-backed DOs are the only DO type on Free: 100k requests/day, 13,000 GB-s/day, 5M rows read/day, 100k rows written/day, 5 GB total [D: developers.cloudflare.com/durable-objects/platform/pricing/]. The Agents docs say nothing about plans; an agent is a SQLite DO, so Free applies [D, inferred].
- Objects per class are unlimited, 100 classes per account on Free [D: .../durable-objects/platform/limits/]. 30 Space instances is a non-issue; hibernated ones cost nothing.
- [L] Ran two instances (`/agents/space/space-a`, `space-b`) of one class: isolated `this.state`, `this.sql` tables, and an idempotent cron `schedule()` created one row each. Installed docs: `node_modules/agents/docs/*`.
- Current API (0.33): `Agent<Env,State>` with `initialState`, `setState`/`onStateChanged`, tagged-template `this.sql`; `schedule(delaySec | Date | cron, "method", payload)`, `scheduleEvery(sec, ...)`, `cancelSchedule`, `keepAliveWhile(fn)`; `onConnect/onMessage/broadcast`. WebSockets always use the Hibernation API [D: agents docs/agent-class.md]. Human-in-the-loop: Workflow `waitForApproval`/`approveWorkflow`, `needsApproval` for chat tools, Code Mode `requiresApproval`. We should store approval cards in SQLite ourselves (D6).
- Minimal shape [L, ran]:
```ts
export class Space extends Agent<Env, S> {
  initialState = { n: 0 };
  async onStart() { this.sql`CREATE TABLE IF NOT EXISTS cards(id INTEGER PRIMARY KEY, t TEXT)`;
                    await this.schedule("*/5 * * * *", "poll"); }
}
export default { fetch: async (r, env) => (await routeAgentRequest(r, env)) ?? new Response("nf", {status:404}) };
```
```jsonc
{ "name":"later","main":"src/index.ts","compatibility_date":"2026-10-01","compatibility_flags":["nodejs_compat"],
  "durable_objects":{"bindings":[{"name":"SPACE","class_name":"Space"}]},
  "migrations":[{"tag":"v1","new_sqlite_classes":["Space"]}] }
```
- Caveat: the API is moving (docs now describe a "Lifecycle" owning the alarm; some doc URLs 404). Pin the version.

## 2. Daily budget
Limits [D]: Worker 100k req/day, 10 ms CPU, 50 subrequests per invocation, 5 cron triggers; DO CPU 30 s per request/message (reset each event), alarm 15 min wall, 6 simultaneous outbound connections. Hibernating DOs accrue no duration; incoming WS messages bill 20:1; each alarm is a request and each `setAlarm` is a row written.

Assumptions: 192 polls/day; 36 routines (~150 s wall each); 12 deck builds (~120 s); 20 captures (~15 s); 50 decisions in ~40 wakes; idle-before-eviction 10 to 140 s (Agents docs say 70 to 140 s); 128 MB billed per DO.

| Resource | Estimate/day | Limit | Share |
|---|---|---|---|
| DO requests (alarms, RPC, WS/20) | ~700 | 100k | <1% |
| Worker requests (static assets excluded) | ~400 | 100k | <1% |
| Rows written (~8 per decision incl. index entries, ~55 per routine, ~3 per poll) | ~5k, up to ~25k if stream chunks are persisted | 100k | 5-25% |
| Rows read (indexed) | ~0.2M; ~2M if Today scans unindexed | 5M | 4-40% |
| DO duration | 1.4k GB-s (10 s idle) to 6.4k (140 s idle) | 13k | 11-49% |
| Subrequests | <=15 per routine invocation | 50 | ok if triage batched |

**Duration breaks first.** 13,000 GB-s equals about 28 DO-hours. Polling is the largest share (192 wakes x idle tail, up to 3.5k GB-s). At the pessimistic idle tail, roughly 2x this load (polling every 2 min, or ~25 busy Spaces) exhausts it; rows written follows at ~4x. Mitigations: poll from one index DO only, poll fewer hours, adaptive backoff, batch work so wakes share an idle window. This is a model, not a measurement [U].

CPU: the 10 ms limit is the Worker's; cron Workers must only poke a DO. MIME parsing and SSE parsing belong in the DO (30 s CPU) [D; DO CPU on Free in practice U].
Long Anthropic stream from a DO: wall time is unlimited, CPU is only active JS time (SSE parsing, ms), one subrequest. Risks: idle eviction after ~70-140 s without events, so wrap in `keepAliveWhile`; deploys/crashes still kill it [D: agents docs/scheduling.md]. Start long calls from an alarm/scheduled callback (15 min wall), checkpoint per turn, make resume idempotent. Heartbeats add ~2 rows/min.

## 3. Gmail IMAP/SMTP
- `connect()` launched to everyone in 2023 [T: blog.cloudflare.com/workers-tcp-socket-api-connect-databases, infoq]; the current docs list no plan restriction [D]. Free-plan use is not explicitly stated [U].
- Port 25 blocked, Cloudflare IP ranges blocked, others allowed; `secureTransport: "on" | "starttls" | "off"`, `startTls()` supported [D: workers/runtime-apis/tcp-sockets/]. Gmail: IMAP 993 implicit TLS, SMTP 465 TLS, 587 STARTTLS [D: developers.google.com/workspace/gmail/imap/imap-smtp].
- Library: **ImapFlow 2.11** documents a Workers transport `createSocketsTransport(connect)`; IDLE and STARTTLS are said to work, certs are verified, socket closes when the DO event ends [D: its README]. [L] it bundles and runs in workerd with `nodejs_compat`; connect attempt failed only because the sandbox blocks TCP. Smaller option: `cf-imap` [T]. For SMTP no maintained Workers library was verified; plan a ~150-line client or test `worker-mailer` [U].
- [L] `connect({hostname:"imap.gmail.com",port:993},{secureTransport:"on"})` in workerd: "Stream was cancelled"; no greeting. **Greeting not verified.**
- Google blocking Cloudflare egress, outbound-IP reputation and rate limits: no evidence found either way [U]. This is the biggest open risk; first deploy test needed.
- Auth: app passwords need 2-Step Verification, are unavailable for Workspace accounts with admin restrictions, Advanced Protection, or security-key-only 2SV, and are revoked on password change [D: support.google.com/mail/answer/185833]. OAuth XOAUTH2 is supported by all three servers.
- Limits: IMAP download 2,500 MB/day, upload 500 MB/day [D: knowledge.workspace.google.com/admin/gmail/gmail-bandwidth-limits]; 15 concurrent connections only from a blog [T]; send 500/day (2,000 Workspace). A 5-minute poll with UID SEARCH + header fetch is tiny; open, poll, close.
- Labels: `STORE +X-GM-LABELS (foo)` works, plus X-GM-RAW/THRID/MSGID [D: Google IMAP extensions]. Drafts: `[Gmail]/Drafts` exists with `\Drafts`; Google's page does not document APPEND, though APPEND of an RFC 5322 message with `\Draft` is standard and widely used [U on Gmail].

## 4. Calendar secret iCal
- Still referenced in Google help (support.google.com/calendar/answer/37111, /37648) [D]. Admin may hide it for work/school accounts; Reset invalidates the old URL [D]. A Workspace admin setting for it exists per third-party docs [T].
- Contents (attendees, descriptions, conferencing links) and freshness are not documented by Google [U]; third parties say the URL grants view of all event details. Subscribers report multi-hour lag [U]. Fetching is a plain HTTPS GET with no auth, one subrequest; parse with a small ICS parser (recurrence expansion is the work). Test with a real calendar.

## 5. Secrets
- Worker secrets: set via `wrangler secret put`, dashboard, or `PUT /accounts/{id}/workers/scripts/{name}/secrets` (also bulk patch) [D]. Values are hidden afterwards, readable only by the Worker through `env`. Each change creates a new version, so wrangler/API write needs a CF API token at install time only.
- Secrets Store: open beta, account-level, Workers bindings [D]; Free-plan quota and read-back not confirmed [U]. Not recommended for v1.
- Recommendation (design, not tested): install-time Worker secrets for the Anthropic key, VAPID private key and a random master key; user-supplied connector credentials (app passwords, iCal URLs) entered in the app, encrypted with AES-GCM under the master key, stored in DO SQLite. No CF token in the Worker, no redeploys, per-Space scoping. Worker secrets are write-only via API; DO-stored ones are readable back only if we build that.

## 6. Web push
- Feasible: no third-party service; push endpoints (`web.push.apple.com`, `fcm.googleapis.com`) are plain HTTPS from a DO. iOS requires 16.4+, an installed Home Screen app with a standalone manifest, and permission requested on a user gesture [D: webkit.org/blog/13878].
- Library: Cloudflare's own docs example uses `web-push`, which uses Node `createECDH` and reportedly fails on Workers [T: web-push issue 718]; I could not verify (v4.0.0 failed to bundle). Use **@pushforge/builder 2.0.5** (MIT, zero deps, Web Crypto). [L] In workerd it built a VAPID-signed, aes128gcm-encrypted request (75-byte body) for a fake Apple subscription; actual delivery untested [U].
- Each push is one subrequest; expired subscriptions (404/410) must be pruned.

## Design constraints for the architecture
1. Per-Space DOs are fine; only one poller (the index DO) touches IMAP. Quiet Spaces schedule nothing.
2. Budget the daily meter in GB-s and rows written; surface it, and back off polling adaptively. Never run model calls from cron Workers (10 ms CPU).
3. All parsing and LLM streaming inside DOs; start long calls from alarms with `keepAliveWhile`, checkpoint per turn, resume idempotently.
4. Persist stream output in coarse batches, not per token (rows written).
5. Batch mail triage into one model call per poll (50-subrequest cap); keep fan-out in RPC.
6. Index every Today query; avoid scans (rows read).
7. IMAP sessions open-poll-close; wrap behind a `MailTransport` interface so OAuth/Gmail API can replace it if Google blocks Worker egress. Make the first deploy run a connectivity self-test and show the result at onboarding.
8. Credentials: Worker secrets for global keys, encrypted DO storage for connector credentials; never redeploy to change them.
9. Calendar iCal is a best-effort, possibly stale source; label "as of".
10. Pin `agents` version; push via Web Crypto library; onboarding must walk iOS users through Add to Home Screen.

## Executed locally
`npm i agents wrangler @pushforge/builder web-push imapflow`; `wrangler dev --local` with a Space agent (SQL, state, cron, two instances), `/imap` raw socket (blocked by sandbox), `/imapflow` (bundled, ran, blocked), `/push` (worked), `/wp` (build error, inconclusive). Project: /tmp/claude-0/-home-user-later/ab727459-d517-5fe9-be48-7de1f17d6a2f/scratchpad/spike-runtime
