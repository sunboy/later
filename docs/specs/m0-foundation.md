# M0 — Foundation: repository, protocol, policy and budget

Status: ready for implementation. Owner: architect.

M0 builds the contracts and the two safety-critical cores before any runtime or UI code exists. Everything here is pure TypeScript with no I/O, so it is fully testable in this repository without a Cloudflare or Anthropic account.

Three work packages, in order. Each ends with `pnpm check` passing.

---

## WP0 — Repository scaffold

Deliver:
- pnpm workspace at the root; Node 22 (`engines`, `.nvmrc`); TypeScript 5 with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`; ESM only.
- Packages `packages/protocol` (`@later/protocol`) and `packages/core` (`@later/core`, depends on protocol). Do not create `apps/` yet.
- vitest; ESLint with typescript-eslint (type-aware); Prettier; `.editorconfig`; `.gitignore`.
- Root scripts: `typecheck`, `lint`, `test`, `check` (all three), `format`.
- GitHub Actions workflow running `pnpm check` on push and pull request.
- `LICENSE` (Apache-2.0), `NOTICE`, and a short honest `README.md`: what Later is, that it is pre-alpha with no runnable product yet, and links to `docs/architecture.md`.
- Leave `CLAUDE.md`, `docs/`, `design/` and `.claude/` as they are.

Acceptance: on a clean clone, `pnpm install --frozen-lockfile && pnpm check` passes.

---

## WP1 — `@later/protocol`

The shared contract: cards, tools, template manifests. zod schemas are the source of truth; TypeScript types are inferred from them. The only runtime dependency is zod.

### 1.1 Common

- `PROTOCOL_VERSION = 1`.
- Branded id types: `SpaceId`, `CardId`, `AgentId`, `RunId`, `ApprovalId`, `TemplateId`.
- `Result<T, E>` = `{ ok: true; value: T } | { ok: false; error: E }`.
- Text rules, enforced by schema: plain text only. Reject any string containing a C0 control character other than `\n` and `\t`. Length limits: title 120, short text 280, body 4000, long body (draft bodies, transcripts) 20000.
- Timestamps are ISO 8601 UTC strings.
- `Source`: `{ kind: 'email' | 'web' | 'calendar' | 'memory' | 'capture' | 'tool'; ref: string; title?: string; url?: string (https only) }`.
- `Provenance`: `{ agentId; runId; createdAt; sources: Source[]; untrusted: boolean }`. `untrusted` is true when the producing run ingested content from outside the user's control (email bodies, web pages).

### 1.2 Cards

`CARD_TYPES`: `brief`, `digest`, `meeting`, `needs-reply`, `triage-item`, `draft`, `monitor`, `approval`, `fyi`, `task`, `status`, `review`, `filed`.

Base fields on every card: `id`, `v` (literal 1), `type`, `spaceId` (nullable only for `brief`, `needs-reply` and `review`, which may span Spaces), `title`, `provenance`, `state` (`new` | `decided` | `snoozed` | `filed`), `priority` (integer 0–100), `createdAt`, optional `expiresAt`, optional `snoozedUntil` (required when and only when state is `snoozed`), optional `decidedAction`.

A discriminated union on `type` with a `data` object per type. Minimum data per type (add fields only if needed, and document them):

| Type | Data |
|---|---|
| `brief` | `headline`, `dayShape`: blocks `{ start, end, label, spaceId? }[]`, `top`: up to 3 `{ text, detail?, cardId? }`, `stats?`: up to 3 `{ value, label }` |
| `digest` | `tiles`: 1–6 `{ headline, summary, source: Source with url required }`, `foldedCount` |
| `meeting` | `start`, `end`, `title`, `attendees`: `{ name, note? }[]`, `prep`: up to 5 strings, `joinUrl?` |
| `needs-reply` | `count`, `itemIds: CardId[]` |
| `triage-item` | `from: { name, address }`, `subject`, `gist`, `why`, `personNote?`, `intents`: up to 4 strings, `messageRef` |
| `draft` | `to: { name?, address }[]` (at least 1), `cc?`, `subject`, `body` (long), `inReplyTo?: messageRef`, `tone?` |
| `monitor` | `subject`, `change`, `before?`, `after?`, `series?`: up to 60 numbers, `source: Source` |
| `approval` | `approvalId`, `tool`, `argsHash`, `argsPreview`: `{ label, value }[]`, `recipient?`, `tier` (`reversible-write` \| `irreversible`), `reason`, `expiresAt` |
| `fyi` | `summary`, `undo?`: `{ tool, argsHash, until }` |
| `task` | `due?`, `owner` (`me` \| `agent`), `status` (`next` \| `doing` \| `waiting` \| `done`), `waitingOn?`, `chaseAt?` |
| `status` | `line`, `asOf` (required), `health` (`on-track` \| `needs-you` \| `waiting` \| `stalled` \| `quiet`), `progress?`: `{ done, total }`, `nextDate?` |
| `review` | `spaceId`, `moved`: strings, `stalled`: strings, `proposal` (`keep` \| `pause` \| `archive` \| `nudge`), `nudgeWho?` |
| `filed` | `summary`, `filedInto: SpaceId`, `fromCapture: string` |

Invariants the schemas or validators must enforce:
- Every `digest` tile has a source with an `https` url.
- `status.asOf` is present.
- `approval.tier` is never `read`.
- `snoozedUntil` present iff state is `snoozed`.
- Unknown keys are rejected at every level (strict objects).

### 1.3 Card actions

`CARD_ACTIONS`: for each card type, the closed list of actions a client may offer, each `{ id, effect }` where `effect` is `none` | `local` | `reversible` | `irreversible`.

- `local` changes only card state (dismiss, ignore, snooze, undo, file, move).
- The only actions with effect `irreversible` are `draft.send` and `approval.approve` (when the approval's tier is irreversible). A test must assert this over the whole table.
- `triage-item` actions: `reply` (creates a draft; effect `local`), `ignore`, `snooze`, `mute`, `undo`. None may be `reversible` or `irreversible`.
- Every card type includes `discuss` (effect `none`).

Export `actionsFor(card): readonly CardAction[]` and `isActionAllowed(card, actionId): boolean`.

### 1.4 Tools

- `RiskTier` = `read` | `reversible-write` | `irreversible`.
- `ToolDescriptor`: `{ name; connector; tier; description; argsSchemaId? }`. `name` matches `^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$` (for example `mail.send`).
- A small built-in registry `BUILTIN_TOOLS` covering v1: `mail.search`, `mail.read` (read); `mail.create_draft`, `mail.label`, `mail.archive` (reversible-write); `mail.send`, `mail.delete` (irreversible); `calendar.read` (read); `web.search`, `web.fetch` (read); `memory.read` (read), `memory.write` (reversible-write); `browser.open`, `browser.read` (read), `browser.submit` (irreversible).

### 1.5 Template manifest

`TemplateManifest` v1, strict:

```
manifestVersion: 1
id, name, description, author: { name, url? }, category
space: { kind: 'project' | 'area' | 'list', emblem, color }
agents: [{ id, name, persona (body), model: 'haiku' | 'sonnet' | 'opus', tools: string[] }]
routines: [{ id, name, agentId, trigger: { kind: 'schedule', cron } | { kind: 'event', event }, emits: CardType[], startsPaused: true }]
connectors: [{ id, scopes: string[], reason }]
budget: { monthlyMicroUsd, perRunMicroUsd }
skills?: [{ path }]            // relative paths to Agent Skills folders, no '..', no absolute paths
mcpServers?: [{ name, url }]   // https only
```

Validation beyond shape, returned as a list of issues:
- `startsPaused` must be literally `true`.
- Every routine's `agentId` exists; agent and routine ids are unique.
- Every tool an agent lists exists in the tool registry passed to the validator, and its connector is declared in `connectors`.
- `perRunMicroUsd` ≤ `monthlyMicroUsd`; both positive integers.
- Model is a tier name, never a model id.

`summarizePermissions(manifest, registry)` returns what the install screen must show: connectors with scopes and reasons; tools grouped by risk tier; routines with trigger and emitted card types; models used; monthly and per-run budget. It must list every irreversible tool explicitly.

### 1.6 Exports and docs

Export all schemas, inferred types, `parseCard`, `parseTemplateManifest`, `validateTemplateManifest`, `summarizePermissions`, `actionsFor`, `isActionAllowed`, `CARD_TYPES`, `CARD_ACTIONS`, `BUILTIN_TOOLS`, `PROTOCOL_VERSION`. Write `docs/protocol.md` describing the final shapes, generated from or checked against the schemas.

Include one valid fixture per card type and two manifests (one valid, one with several violations) under `packages/protocol/fixtures/`.

---

## WP2 — `@later/core`: policy gate and budget ledger

Pure functions and reducers. No I/O. Time and ids are parameters.

### 2.1 Canonical hashing

`canonicalJson(value)`: deterministic JSON (object keys sorted recursively, no whitespace, rejects `undefined`, functions, non-finite numbers, and cycles).
`hashArgs(tool, args): Promise<string>`: SHA-256 (WebCrypto) of `tool + '\n' + canonicalJson(args)`, lowercase hex. Must run on Node 22 and Cloudflare Workers.

### 2.2 Policy gate

```
decide(request, context): Decision
request: { tool: ToolDescriptor; args: unknown; argsHash: string }
context: {
  spaceId
  grantedConnectors: ReadonlySet<string>
  alwaysAllow: ReadonlySet<string>          // tool names
  run: { initiatedBy: 'user' | 'agent' | 'routine'; ingestedUntrusted: boolean }
  budgetStatus: 'ok' | 'warned' | 'paused'
  userConfirmation?: { argsHash: string }    // the user pressed the explicit action in the client
  approval?: Approval                        // a previously granted approval being redeemed
  now: Date
}
Decision: { outcome: 'allow' | 'require-approval' | 'deny'; reason: ReasonCode; detail: string }
```

Rules, evaluated in this order:
1. Connector not in `grantedConnectors` → `deny` (`connector-not-granted`).
2. `budgetStatus` is `paused` and tier is not `read` → `deny` (`budget-paused`).
3. Tier `read` → `allow`.
4. A valid `approval` (see 2.3) for this exact `argsHash` and tool → `allow` (`approved`).
5. `userConfirmation.argsHash` equals `request.argsHash` and `run.initiatedBy` is `user` → `allow` (`user-confirmed`).
6. Tier `reversible-write`: `allow` if the tool is in `alwaysAllow` and `run.ingestedUntrusted` is false; otherwise `require-approval`.
7. Tier `irreversible`: always `require-approval`. `alwaysAllow` is ignored.

Also:
- `addAlwaysAllow(set, tool)` returns an error for any tool whose tier is not `reversible-write`.
- `markIngested(run, source)` returns a run context with `ingestedUntrusted` true when the source kind is `email` or `web`; it is sticky and can never return to false within a run.
- `request.argsHash` must equal `hashArgs(tool.name, args)`; provide `buildRequest(tool, args)` that computes it, and have `decide` treat a request as trusted input from `buildRequest` only.

### 2.3 Approvals

```
Approval: { id; spaceId; tool; argsHash; tier; requestedAt; expiresAt; status: 'pending' | 'granted' | 'denied' | 'redeemed' | 'expired' }
requestApproval(input, now, id) → Approval (pending)
grant(approval, now) / deny(approval, now)
redeem(approval, request, now) → Result<Approval(redeemed), ReasonCode>
```

- Redeem succeeds only if status is `granted`, not expired at `now`, and both tool name and `argsHash` match. Single use.
- Any change to the arguments after approval produces a different hash and therefore fails redemption.
- Default expiry: 24 hours, configurable.

### 2.4 Price table and cost

- `PriceTable`: `{ version; effectiveDate; currency: 'USD'; models: Record<'haiku' | 'sonnet' | 'opus', { inputPerMTok; outputPerMTok; cacheWritePerMTok; cacheReadPerMTok }>; batchDiscount }`, all prices in micro-USD per million tokens as integers; `batchDiscount` as a rational `{ num, den }`.
- Ship one table as data. Before writing any number, check Anthropic's current published pricing and model lineup and record the source URL and date in the file. The figures in `docs/architecture.md` came through a summarising reader and must not be copied. If pricing has a tiered structure (for example by prompt size), model it explicitly or document the simplification.
- `costMicroUsd(usage, model, table, opts?: { batch?: boolean }): number` with `usage: { inputTokens; outputTokens; cacheWriteTokens; cacheReadTokens }`. Integer arithmetic, rounding up to the next micro-USD. Reject negative or non-integer token counts.

### 2.5 Budget ledger

A reducer over an immutable state:

```
Ledger: { scope: 'space' | 'account'; id; cycleStart; cycleEnd; capMicroUsd; spentMicroUsd;
          reservations: Record<ReservationId, { amountMicroUsd; createdAt }>; status: 'ok' | 'warned' | 'paused' }
reserve(ledger, estimateMicroUsd, id, now) → Result<Ledger, 'over-cap' | 'paused' | 'cycle-ended'>
settle(ledger, id, actualMicroUsd, now) → Result<Ledger, 'unknown-reservation'>
release(ledger, id) → Ledger
rollover(ledger, now, nextCycleEnd) → Ledger
setCap(ledger, capMicroUsd) → Ledger
```

Rules:
- `reserve` fails with `over-cap` if `spent + sum(reservations) + estimate > cap`. It never authorises a run that could exceed the cap by its own estimate.
- `settle` replaces the reservation with the actual cost. Actual may exceed the estimate; if `spent ≥ cap` afterwards the status becomes `paused`.
- Status: `warned` at `spent ≥ 80%` of cap, `paused` at `≥ 100%`. Recomputed after every operation, including `setCap`.
- `rollover` after `cycleEnd` resets `spent` to zero, clears stale reservations, sets status `ok`.
- `reserveBoth(spaceLedger, accountLedger, …)` reserves against a Space and the account-wide ledger atomically: either both succeed or neither changes.
- Each operation returns the new state plus a list of events (`warned`, `paused`, `resumed`, `rolled-over`) for the caller to surface.

### Acceptance for WP1 and WP2

- `pnpm check` passes.
- The implementer writes only smoke tests. The full test suite is written separately from this spec by another agent, so the public API must match the names above exactly; where this spec leaves a name open, choose one and list it in `docs/protocol.md` or `packages/core/README.md`.
- No dependency beyond zod (protocol) and dev tooling.
- Report every place where the spec was ambiguous or where you deviated, with the reason.

---

## Amendments after architect review (M0.1)

These override the text above where they conflict.

### A1 — The gate verifies the request itself
`decide` becomes `async` and recomputes `hashArgs(tool.name, args)`. A mismatch returns `deny` with reason `request-tampered`. Correctness must not depend on callers using `buildRequest`.

### A2 — Trust and privacy are properties of sources and tools, not of source kinds
The original rule (only `email` and `web` taint a run) is too narrow, and tainting alone is too blunt: an inbox agent reads email on every run, so "tainted means ask" would produce constant approvals.

The danger is the combination: **private data + untrusted content + a way to send data out**. The gate enforces that combination.

Protocol changes:
- `ToolDescriptor` gains:
  - `egress: boolean` — the call can transmit data to a party the user did not choose (any web fetch or search, opening a URL, external MCP calls, sending).
  - `readsPrivate: boolean` — the result contains the user's private data (mail, calendar, logged-in pages).
  - `contained: boolean` — meaningful for `reversible-write` only: the effect stays inside the user's own account and is not visible to anyone else (create a draft, label, archive, write memory). Must be `false` for `read` and `irreversible` tools.
- `Source` gains `trust: 'user' | 'external'`. `email`, `web` and `calendar` sources are always `external` (schema-enforced). `capture` is always `user`. `memory` and `tool` carry whichever the producer recorded.
- Update `BUILTIN_TOOLS` accordingly: `web.search`, `web.fetch`, `browser.open`, `browser.submit`, `mail.send` are `egress`; `mail.search`, `mail.read`, `calendar.read`, `browser.read` are `readsPrivate`; `memory.read` is `readsPrivate: false` at descriptor level (see run tracking); `mail.create_draft`, `mail.label`, `mail.archive`, `memory.write` are `contained`.

Run tracking in core:
- `RunContext` becomes `{ initiatedBy; ingestedUntrusted: boolean; touchedPrivate: boolean }`. Both flags are sticky for the life of a run.
- `markIngested(run, source)` sets `ingestedUntrusted` when `source.trust === 'external'`.
- `markToolUsed(run, tool, opts?: { privateResult?: boolean })` sets `touchedPrivate` when `tool.readsPrivate` or `opts.privateResult` is true (the host passes `privateResult` for a memory read that returned an entry marked private).
- `memoryTaintFor(run): 'user' | 'external'` returns the trust a memory entry written by this run must carry, so content laundered through memory keeps its taint.

Revised rules (replace rules 3 and 6):
- 3. Tier `read`: if `tool.egress && run.ingestedUntrusted && run.touchedPrivate` → `require-approval` (`exfiltration-risk`). Otherwise `allow`.
- 6. Tier `reversible-write`: not in `alwaysAllow` → `require-approval`. In `alwaysAllow` but `run.ingestedUntrusted && !tool.contained` → `require-approval` (`untrusted-content`). Otherwise `allow`.
- `addAlwaysAllow` is unchanged (reversible-write only).

Consequences to keep true in tests: a research run that never touches private data may fetch freely; an inbox run may draft, label and archive without asking; an inbox run that has read mail and an external message cannot fetch a URL or search the web without approval; nothing is ever sent without approval or an explicit user confirmation.

### A3 — User confirmation is a verified, short-lived, single-use object
Replace `userConfirmation?: { argsHash }` with `userConfirmation?: DeviceConfirmation`:
`{ argsHash; deviceId; nonce; confirmedAt }`. Rule 5 passes only if the hash matches, `run.initiatedBy === 'user'`, `deviceId` is in `context.knownDevices`, `nonce` is not in `context.usedNonces`, and `confirmedAt` is no more than `context.confirmationMaxAgeMs` (default 120000) before `now` and not in the future. Verifying the device's signature happens at the runtime boundary, outside core; document that requirement on the type.

### A4 — One call that decides and consumes
Add `authorize(request, context): Promise<{ decision: Decision; consumed?: { approval?: Approval /* now redeemed */; nonce?: string } }>`. When the decision is `allow` because of an approval or a user confirmation, `consumed` carries what the host must persist so it cannot be used twice. `decide` remains for read-only evaluation (previews). Hosts execute tools only on `authorize`.

### A5 — Ledger operations return events explicitly
No non-enumerable properties. Each ledger operation returns `Result<{ ledger: Ledger; events: LedgerEvent[] }, E>` (or `{ ledger, events }` directly where the spec gives no error case). `reserveBoth` returns both ledgers and both event lists.

### A6 — Model-supplied URLs
Add to the protocol docs as a client rule: clients never fetch a model-supplied URL automatically (no image loading, link previews or prefetching). URLs are followed only on an explicit user action.

Keep the implementer's additions: approval must match the Space; `decidedAction` must belong to the card's type; `end ≥ start`; `done ≤ total`; `deny` may revoke a granted approval.

### A7 — Nothing an agent does on tainted input is silent
`Decision` gains `surface: boolean`. It is `true` whenever a write is allowed without a human decision while `run.ingestedUntrusted` is true (rule 6 allow). Hosts must then emit an `fyi` card with an `undo` for that action, and count it in the day's brief. This is the answer to "an injected email makes the agent archive the bank's fraud alert": the action stays reversible and is always shown.

### A8 — Egress has three levels
`ToolDescriptor.egress` becomes `'none' | 'fixed' | 'open'`.
- `open`: the model chooses the destination or recipient (fetch or open an arbitrary URL, send mail, call an external MCP server). This is the exfiltration channel.
- `fixed`: data goes only to a service fixed by the user or the template, with constrained arguments (a search provider, a weather lookup). It discloses the query to that provider, which the install screen must list, but an attacker does not receive it.
- Rule 3 applies to `open` only. `fixed` egress is allowed in any run.
- `BUILTIN_TOOLS`: `web.search` is `fixed`; `web.fetch`, `browser.open`, `browser.submit`, `mail.send` are `open`. Add `weather.get` (`read`, `fixed`, connector `weather`) as the reference example of a constrained fixed tool.
- `summarizePermissions` lists `fixed` and `open` egress tools separately.

### A9 — Approvals name the risk they cover
Replace the workaround of approving risky reads as `irreversible`. `Approval` and the `approval` card data gain `risk: 'reversible-write' | 'irreversible' | 'exfiltration'`. `requestApproval` accepts a `read`-tier tool only with `risk: 'exfiltration'`. The earlier invariant becomes: an approval card's `tier` may be `read` only when `risk` is `exfiltration`. `actionsFor` treats approving an `exfiltration` or `irreversible` risk as effect `irreversible`.

Accepted from the implementer: a risky read falls through to rules 4 and 5 before requiring approval; `memoryPrivacyFor(run)` marks memory written by a run that touched private data.

Constraint recorded for the runner spec (M1), not implemented here: tool availability is fixed when a run starts. A run that can read private data is never given model-provider server-side tools with open egress, because those execute outside this gate.

### A10 — Draft recipients declare where they came from
An injected message could have an agent prepare a draft addressed to an attacker, waiting for one tap on Send. Each recipient in `draft` data (`to` and `cc`) gains `origin: 'thread' | 'known' | 'new'`: a participant in the thread being answered, an address already in the user's people memory, or neither. The host sets `origin`; the model never does. Validation: a draft whose provenance is `untrusted` and which has any `new` recipient must set `data.needsRecipientCheck: true`, and clients must then require a separate confirmation of the recipient before Send. `actionsFor` exposes `confirm-recipient` (effect `local`) on such drafts and withholds `send` until `data.recipientConfirmed` is true.

Accepted residual risks, to be documented in `docs/protocol.md` under "Known limits":
- A `fixed` egress tool with free-text arguments (a search query) can disclose private text to that fixed provider. It does not reach an attacker; the install screen discloses the provider.
- A user-requested lookup of an arbitrary site during a run that has read mail needs one approval. A per-Space allowlist of domains is planned for M1.

M0 is closed to further rule changes after A10. Further scenarios go to the M1 backlog.
