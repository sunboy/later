# Later — Architecture Decision Brief

Status: v0.1, 2026-11-11. Owner: architect session. Supersedes the "Later — Product Framing" doc where they conflict.

Evidence tags: **[V]** read on an official page by a research agent, **[S]** secondary source, **[?]** unconfirmed, **[J]** architect's judgment.
Research agents read pages through a summarising fetcher, so every number here must be rechecked before it is hard-coded.

## 1. Product in one paragraph

Later is an open-source personal agent team that runs in infrastructure the user owns (their Cloudflare account, their Anthropic API key). We operate nothing on the request path and hold no user data or keys. The user gets a chat app with a DM per agent, an approvals inbox, a spend meter per agent, and installable agent templates.

## 2. What the research established

| Question | Finding | Tag |
|---|---|---|
| Do Max plans include API credits? | Yes. Max $100/mo, Ultra $200/mo, Team $20–$100 per seat. Pro gets none. Claimed by linking one Console org in claude.ai billing settings. Expire each billing cycle, no rollover. Cover Messages API, Agent SDK, Managed Agents. | V |
| May a third-party app use them via the user's key? | Terms are silent. Credits "may only be used by the holder of the Anthropic account" and are discretionary. Offering claude.ai login is prohibited; API keys are the sanctioned path. | V / ? |
| Is Anthropic a direct competitor? | Yes. Claude Duet: free in preview to Pro/Max/Ultra, US waitlist, Opus only, single agent, draws on plan limits, interval polling, 6,000+ connectors. | V |
| Can Cloudflare Free run the agent? | State, scheduling, webhooks, storage and outbound model calls: yes, within daily caps. Linux sandbox (Containers/Sandbox): no, Workers Paid only ($5/mo). Browser: 10 min/day free. | V |
| Is there a Cloudflare-native OSS base to fork? | No. Rakazo, OpenBot, Paperclip, OpenClaw, NanoClaw, Hermes all need a Node/Python server plus Postgres or host containers. | V |
| Memory products | Dragonfly is a source-available Redis-compatible store, not agent memory. Supermemory's self-host engine is a closed binary. mem0/Cognee/Graphiti/Letta need servers. | V |
| Which uses retain? | Inbox/calendar triage and recurring monitoring/reports. Shopping, travel and phone calls fail on logins and CAPTCHAs in every product. No retention data exists; inferred from reviews. | S / J |
| Shared skills ecosystems | OpenClaw's hub: 341 of 2,857 audited skills flagged malicious. Open publishing drove growth and caused the damage. | S |
| Gmail access | Restricted Gmail scopes require Google verification plus an annual CASA assessment when our server handles the data. | S / ? |

## 3. Decisions

**D1. User-owned deployment. We host nothing on the request path.**
Backend deploys into the user's Cloudflare account. The API key is a secret in that account and never reaches our servers or the clients. This is also the strongest answer to the bring-your-own-key ambiguity: the account holder is running open-source software themselves; we relay and resell nothing. The hosted Firecracker tier from the framing doc is dropped.

**D2. Build fresh on Cloudflare's Agents SDK. No fork.**
One Durable Object per agent, one per user "team", SQLite state inside each. Borrow designs, not code: Paperclip's budget rules (warn at 80%, pause at 100%), OpenBot's policy/approval/audit model, NanoClaw's credential-gateway pattern, Rakazo's client split.

**D3. Agent loop on the Messages API directly, behind a `Runner` interface.**
The Agent SDK spawns a CLI process needing about 1 GiB RAM, which the free plan cannot host. The free lane is our own loop: Messages API + tool calls + prompt caching.
Runner implementations, in build order:
1. `edge` — in the Durable Object. Free. v1.
2. `managed` — Anthropic Managed Agents: cloud sandbox, cron, tool confirmation, $0.08/session-hour billed only while running, paid from the same credits. Needs a spike; beta. v1.5 candidate.
3. `cf-sandbox` — Cloudflare Sandbox in the user's account ($5/mo to Cloudflare). v1.5 candidate.
4. `local` — desktop app lends the user's machine. Later.

**D4. v1 scope.**
In: chat with DM per agent; approvals inbox; per-agent budget and spend meter; three launch agents (Inbox Watcher, Research Analyst, Monitor & Report); memory; templates (install from URL); short browser tasks with live view.
Out of v1: Linux sandbox, errands on logged-in sites, voice, SMS/WhatsApp channels, team plans, open marketplace, native mobile apps.

**D5. Memory: self-built.**
Markdown memory files per agent plus a shared team space, stored in Durable Object SQLite, edited by the model through Anthropic's memory tool, with full-text search. Vector recall only if evaluation shows a need. User can read, edit and delete every file. We do not claim end-to-end encryption: an always-on agent reads memory in plaintext inside the user's own account.

**D6. Side effects are gated by code, not by the model.**
- Every tool is classified `read`, `reversible-write`, or `irreversible` (send, pay, share, post, delete).
- `irreversible` always produces an approval card rendered from the actual tool-call arguments, never from a model summary.
- `reversible-write` follows a per-agent allowlist, to avoid the confirmation-loop complaint.
- Content from untrusted sources (email bodies, web pages) is marked; a run that has ingested untrusted content cannot execute `irreversible` tools without approval even if allowlisted.
- Append-only action log per agent, replayable in the UI.

**D7. Budget enforcement at three levels.**
1. Per-run token ceiling and turn limit in the runner.
2. Per-agent monthly budget metered from API `usage` fields and a versioned price table; warn at 80%, pause at 100%.
3. Onboarding instructs the user to set a Console spend limit as the provider-level backstop. Our meter is an estimate and is labelled as one.
Agents are event-driven (webhooks, alarms), never heartbeat-polling with a model call. Default routing: Haiku for watching and triage, Sonnet for work, Opus on request.

**D8. Connectors are MCP-first, credentials are the user's own.**
Gmail in v1 offers two paths: a guided "create your own Google OAuth client" flow, and IMAP with an app password. Both need a spike (see §5). Slack, Notion and Microsoft 365 via user-created apps or existing MCP servers. A verified one-click connector service is a future paid convenience, not v1.

**D9. Templates: declarative, permission-scoped, no code.**
A template is a manifest: agent personas, model routing, schedules/triggers, budgets, required connector scopes, references to Agent Skills (`SKILL.md`) folders and MCP server configs. The install screen shows every permission and the budget before anything runs; routines install paused. Distribution is by git URL plus a curated gallery we review. No executable code in v1 templates. Signing and an open marketplace come only with a review process.

**D10. Clients: one responsive installable web app first.**
Served by the user's own Worker, paired to phone by QR code, web push for approvals. Stack: React + Tailwind + shadcn with a token file shared with the prototype. Expo native apps and a desktop shell (needed for the `local` runner) come after the prototype is validated.

**D11. Prototype in Claude Artifacts before production code.**
Paper's agent integration requires its desktop app on a local machine and cannot be driven from a cloud session [V]. Figma stays available if hand-editing is wanted.

## 4. Positioning against Duet

Duet is free, first-party and aimed at the same subscribers. We do not win on connectors or polish. We win where Duet is structurally constrained:

| | Duet | Later |
|---|---|---|
| Pays from | Plan limits shared with chat | Expiring API credits, or any API key |
| Models | Opus only | Routed per task, user-selectable |
| Shape | One agent | Team, installable templates |
| Where it runs | Anthropic | User's own account, open source |
| Availability | US waitlist; not Pro-with-key, not Team | Anywhere the API is available |
| Visibility | Browser not user-visible [S] | Live view, replayable log |

The credits are a launch hook, not the foundation. They are promotional and can be withdrawn. The durable assets are open source, user-owned deployment, and the template ecosystem.

## 4a. Lessons from Town (added 2026-11-11)

Town (town.com) is a venture-funded independent ($163M raised, closed source, hosted, credit-metered) growing alongside Duet and Muse. Figures are company-supplied [S]. Reviewers attribute its traction to experience, not capability: value inside five minutes, drafts in the user's voice, a named assistant, ready-made routines, approval before send. Its reported weak spots are unpredictable credit bills, no self-hosting and no custom skills.

Amendments:

- **D12. First value inside five minutes of connecting mail.** After connecting, the user gets a short "what I learned about you" summary and three to five suggested actions. Deployment and key steps must be compressed so they do not delay this.
- **D13. Onboarding ingestion has its own hard budget.** Town reportedly spends about $100 per user building context. On a user's own key that would consume a month of credit. Ingestion is capped (default $5, Haiku, most-recent-first, resumable) and shown on the meter.
- **D14. Three routines ship enabled-on-approval:** morning brief, inbox sort and draft, meeting briefs. Calendar therefore joins Gmail as a v1 connector.
- **D15. Voice matching is a first-class quality target** for drafts, evaluated with a test set, not left to prompt luck.
- **D16. Memory includes people files** (a lightweight contact memory), since briefs and drafts depend on knowing who someone is.
- **D17. Agents are named and customisable.** Personality is part of the product, kept restrained.
- **D8 amended:** installer uses Cloudflare OAuth or an API token to deploy directly; the "Deploy to Cloudflare" button (which requires a GitHub or GitLab account) is the developer path only. OAuth deploy scope is unconfirmed and joins R3.

## 4b. Card-first experience (added 2026-11-11, founder direction)

**D18. The card is the primary output primitive; chat is the escape hatch.**
Agents emit typed, structured cards, not prose, wherever a card type fits. Every card can open a chat with that card as context.

- **Card protocol.** A versioned schema of card types: `brief`, `digest`, `meeting`, `needs-reply`, `triage-item`, `draft`, `monitor`, `approval`, `fyi`. Each has a fixed data shape, a provenance field (agent, run, sources) and a declared action set. Clients render from the schema; the model never emits UI markup.
- **Today deck.** A finite, ordered deck generated on a schedule, with a real end state. Deck length is capped; overflow is summarised, not appended.
- **Triage stack.** One decision per card. Swipe right queues a draft, left ignores; snooze and unsubscribe are explicit buttons. A swipe never performs an irreversible action. Every swipe is undoable. Buttons and keyboard shortcuts are equal citizens to gestures.
- **Drafts queue.** Send is always a separate explicit action with the recipient shown (consistent with D6).
- **Templates declare the card types they emit** (extends D9), which keeps third-party templates inside the reviewed visual vocabulary.
- **Cost.** The morning deck is not latency-sensitive, so it is produced with the Batch API where the 50% discount applies, on Haiku with Sonnet for drafts.
- **Accessibility.** Each card type has a defined reading order and non-gesture path from the first version.

Risks: decision fatigue if the deck is long; binary swipes hiding nuance; visual richness tempting us to render unverified model claims as confident tiles. Digest tiles therefore always carry a source link.

## 4c. Spaces: organising many projects and areas (added 2026-11-11)

**D19. The Space is the unit of organisation, and replaces the agent roster as the primary structure.**
People think in terms of their projects and life areas, not in terms of bots. Agents become staff assigned to Spaces and appear as attribution on cards.

Model:
- **Card**: atomic unit. Lives in exactly one Space. Lifecycle: new → decided (acted, ignored, snoozed) → filed.
- **Space**: a persistent home for a project (has a finish line), an area (ongoing, has a rhythm) or a list. Holds its cards, memory files, people, routines, assigned agents, connector scopes and budget.
- **Today**: the cross-Space view by time. Pulls what needs attention from every Space, each card marked with its Space's colour and emblem.
- **Lenses**: the same cards viewed as Stack (decide), Board (Next / Doing / Waiting on someone / Done), Timeline (when), List (scan). Cards are data; views are lenses.
- **Zoom levels**: Life (all Spaces) → Space → Card → Detail or chat.

Rules:
- **Space tile.** Each Space has a living cover: stable colour and emblem, agent-written one-line status with an "as of" time, progress if it has a finish line, next date, count of cards needing the user, and a state (on track, needs you, waiting, stalled, quiet). The overview is ordered by need, not alphabet; position within a group is stable so spatial memory works.
- **Stacking.** Cards of the same kind collapse into a counted stack. Stacks are the compression mechanism at every level.
- **Agent files, user corrects.** Captured items (typed, spoken, shared, forwarded) are filed by the agent into a Space with the placement shown and one tap to move. Unfiled items go to an Inbox Space. The agent proposes a new Space when a cluster emerges, and proposes pausing Spaces that go quiet.
- **Weekly review deck.** One card per Space: progress, what stalled, a proposal (keep, pause, archive, nudge). Uses the same swipe mechanic.
- **Focus.** The user pins a small number of Spaces for the week; they get priority in Today. Today has a length cap with a per-Space quota.
- **Scope guard.** We are not building a project-management tool. Tasks are a minimal card type (title, due, owner: me or agent, status). No dependencies, no Gantt, no custom fields in v1.

Architecture consequences:
- **One Durable Object per Space** (state, cards, memory, budget, scopes), plus one index object per user that materialises Today. This replaces "one object per agent" in D2. Agents are configurations (persona, model, tools) instantiated inside a Space.
- **Isolation by Space.** Connector scopes and memory are per Space. Untrusted content ingested in one Space cannot reach another Space's connectors. This strengthens D6.
- **Budgets are per Space** (extends D7). Quiet Spaces run nothing; tile status is regenerated on change, not on a timer.
- **A template is a Space blueprint** (extends D9). Installing a template creates a Space. "Export this Space as a template" strips personal data and is the path for user-made templates.
- New card types: `task`, `status`, `review`, `filed`.

Risks: scope creep into project management; mis-filing eroding trust; model-written status lines read as fact (hence the "as of" time and source links); cost growing with the number of active Spaces.

## 5. Open risks and the spikes that close them

| # | Risk | Spike (owner) |
|---|---|---|
| R1 | Free-plan daily caps (100k row writes, 10 ms Worker CPU, DO duration) too tight for three agents | Load model and test on a free account (Sonnet) |
| R2 | Gmail connection is too painful or tokens expire weekly in Google's Testing mode | Walk both Gmail paths end to end, document every step and limit (Sonnet) |
| R3 | "Deploy to Cloudflare" requires a GitHub account and has no clean update path; credit-card requirement unknown | Test deploy, upgrade and rollback on a fresh account (Sonnet) |
| R4 | Managed Agents may not fit (beta, browser support, tool confirmation semantics) | Capability check against docs and a minimal session (Sonnet) |
| R5 | Bring-your-own-key use of promotional credits is not addressed in Anthropic's terms | Founder asks Anthropic for written confirmation before launch |
| R6 | Browser sessions may not persist logins on Cloudflare | Confirm from docs; keeps logged-in errands out of v1 regardless |
| R7 | Prompt injection through email | Red-team suite against D6 before the Inbox Watcher ships (Sonnet writes, Haiku runs) |

## 6. Commercial path (not v1)

Managed convenience on top of a free core: verified one-click connectors, optional hosted deployment for non-technical users, curated/paid templates with revenue share, team workspaces.

## 7. Delivery plan

| Phase | Outcome | Gate |
|---|---|---|
| P0 | Clickable prototype; spikes R1–R4 reported | Founder reacts to prototype; spikes show no blocker |
| P1 | Walking skeleton: deploy → chat → Research Analyst with web search → spend meter | Runs on a free account end to end |
| P2 | Inbox Watcher, approvals, push, action log | R7 suite passes |
| P3 | Templates, Monitor & Report agent, browser live view | Third-party template installs safely |
| P4 | Sandbox runner(s), native apps | Decided after P3 usage |

## 8. Working agreement

- Architect (this session): specs, interfaces, acceptance criteria, review. Writes no code.
- Opus agents: implementation, one work package at a time against a written spec.
- Sonnet agents: research spikes; tests written from the spec, not from the implementation.
- Haiku agents: run tests and lint, report results verbatim.
- No work package merges until the architect has reviewed the diff and the independent tests pass.
