# `@later/protocol` reference

Protocol version 1. The zod schemas in `packages/protocol/src` are the source of truth; this page describes them. The field tables below are checked against the schemas by `packages/protocol/test/docs.test.ts`, so a schema change that is not reflected here fails `pnpm check`.

Every object schema is strict: unknown keys are rejected at every level. A field marked `?` is optional and may be omitted; it may not be `null` unless the type says so.

## Common rules

### Text

Plain text only. Any string containing a C0 control character (U+0000 to U+001F) other than `\n` and `\t` is rejected; carriage return is rejected too. Markup is not stripped or rejected: clients must render all strings as text, never as HTML.

Lengths are counted in UTF-16 code units (JavaScript `string.length`).

| Kind  | Limit | Empty allowed     | Used for                                    |
| ----- | ----- | ----------------- | ------------------------------------------- |
| Title | 120   | no                | card titles, headlines, labels, names       |
| Short | 280   | yes, unless noted | one-line text: gist, reason, subject        |
| Body  | 4000  | yes, unless noted | summaries, personas, preview values         |
| Long  | 20000 | yes               | draft bodies, captured text and transcripts |

### Ids

`SpaceId`, `CardId`, `AgentId`, `RunId`, `ApprovalId` and `TemplateId` are branded strings matching `^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$`. Tool names match `^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$`. Connector ids, routine ids, categories, action ids and MCP server names are lowercase slugs (`^[a-z][a-z0-9-]*$`, at most 40 characters; connector ids also allow `_`).

### Other scalars

- Timestamps are ISO 8601 UTC with a `Z` suffix (`2026-11-11T09:00:00Z`, fractional seconds allowed). Offsets such as `+01:00` are rejected.
- URLs are absolute `https:` URLs, at most 2048 characters.
- `argsHash` is a 64-character lowercase hex SHA-256 (see `@later/core` `hashArgs`).
- Email addresses use zod's `z.email()` check.
- `Result<T, E>` is `{ ok: true; value: T } | { ok: false; error: E }`.
- Validation failures are `ValidationIssue[]`: `{ code, path, message }`. `code` is the zod issue code (`invalid_type`, `unrecognized_keys`, `custom`, ...) unless a more specific code is listed below.

### Source

| Field    | Type                                                              | Notes                                                                                                                            |
| -------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `kind`   | `email` \| `web` \| `calendar` \| `memory` \| `capture` \| `tool` |                                                                                                                                  |
| `ref`    | string, 1 to 280                                                  | opaque reference within the connector                                                                                            |
| `trust`  | `user` \| `external`                                              | `email`, `web` and `calendar` must be `external`; `capture` must be `user`; `memory` and `tool` carry what the producer recorded |
| `title?` | Title                                                             |                                                                                                                                  |
| `url?`   | https URL                                                         | required inside digest tiles                                                                                                     |

### Provenance

| Field       | Type                 | Notes                                                              |
| ----------- | -------------------- | ------------------------------------------------------------------ |
| `agentId`   | AgentId              |                                                                    |
| `runId`     | RunId                |                                                                    |
| `createdAt` | timestamp            |                                                                    |
| `sources`   | Source[], at most 50 |                                                                    |
| `untrusted` | boolean              | true when the run ingested content from outside the user's control |

## Cards

`parseCard(input): Result<Card, ValidationIssue[]>` never throws. `CardSchema` is a discriminated union on `type`; each member is also exported (`BriefCardSchema`, ...), as is each data schema (`BriefDataSchema`, ...) and the map `CARD_DATA_SCHEMAS`.

### Base card fields

| Field            | Type                                       | Notes                                                       |
| ---------------- | ------------------------------------------ | ----------------------------------------------------------- |
| `id`             | CardId                                     |                                                             |
| `v`              | literal `1`                                |                                                             |
| `type`           | card type                                  | discriminator                                               |
| `spaceId`        | SpaceId                                    | `null` allowed only for `brief`, `needs-reply` and `review` |
| `title`          | Title                                      |                                                             |
| `provenance`     | Provenance                                 |                                                             |
| `state`          | `new` \| `decided` \| `snoozed` \| `filed` |                                                             |
| `priority`       | integer 0 to 100                           |                                                             |
| `createdAt`      | timestamp                                  |                                                             |
| `expiresAt?`     | timestamp                                  |                                                             |
| `snoozedUntil?`  | timestamp                                  | required when, and only when, `state` is `snoozed`          |
| `decidedAction?` | action id                                  | must be one of the card type's actions in `CARD_ACTIONS`    |
| `data`           | per type, below                            |                                                             |

### `brief`

| Field      | Type                                                                       | Notes                                |
| ---------- | -------------------------------------------------------------------------- | ------------------------------------ |
| `headline` | Title                                                                      |                                      |
| `dayShape` | `{ start, end, label: Title, spaceId? }[]`, at most 24                     | timestamps; `end` not before `start` |
| `top`      | `{ text: Short (non-empty), detail?: Body, cardId?: CardId }[]`, at most 3 |                                      |
| `stats?`   | `{ value: Short (1 to 40), label: Title }[]`, at most 3                    |                                      |

### `digest`

| Field         | Type                                                           | Notes                                        |
| ------------- | -------------------------------------------------------------- | -------------------------------------------- |
| `tiles`       | `{ headline: Title, summary: Body, source: Source }[]`, 1 to 6 | every tile's source must have an https `url` |
| `foldedCount` | non-negative integer                                           | items summarised rather than shown           |

### `meeting`

| Field       | Type                                                       | Notes              |
| ----------- | ---------------------------------------------------------- | ------------------ |
| `start`     | timestamp                                                  |                    |
| `end`       | timestamp                                                  | not before `start` |
| `title`     | Title                                                      |                    |
| `attendees` | `{ name: Short (non-empty), note?: Short }[]`, at most 100 |                    |
| `prep`      | Short (non-empty)[], at most 5                             |                    |
| `joinUrl?`  | https URL                                                  |                    |

### `needs-reply`

| Field     | Type                  | Notes                       |
| --------- | --------------------- | --------------------------- |
| `count`   | non-negative integer  | may exceed `itemIds.length` |
| `itemIds` | CardId[], at most 500 |                             |

### `triage-item`

| Field         | Type                              | Notes |
| ------------- | --------------------------------- | ----- |
| `from`        | `{ name: Short, address: email }` |       |
| `subject`     | Short                             |       |
| `gist`        | Short                             |       |
| `why`         | Short                             |       |
| `personNote?` | Short                             |       |
| `intents`     | Short (non-empty)[], at most 4    |       |
| `messageRef`  | string, 1 to 280                  |       |

### `draft`

| Field                  | Type                                                                           | Notes                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `to`                   | `{ name?: Short, address: email, origin: thread \| known \| new }[]`, 1 to 100 | `origin` is set by the host, never the model: a thread participant, an address in people memory, or neither |
| `cc?`                  | same shape, at most 100                                                        |                                                                                                             |
| `subject`              | Short                                                                          |                                                                                                             |
| `body`                 | Long                                                                           |                                                                                                             |
| `inReplyTo?`           | message ref                                                                    |                                                                                                             |
| `tone?`                | Short, at most 40                                                              |                                                                                                             |
| `needsRecipientCheck?` | boolean                                                                        | must be `true` when provenance is `untrusted` and any `to` or `cc` recipient is `new`                       |
| `recipientConfirmed?`  | boolean                                                                        | set once the user has separately confirmed the recipients                                                   |

### `monitor`

| Field     | Type                 | Notes          |
| --------- | -------------------- | -------------- |
| `subject` | Short, non-empty     |                |
| `change`  | Short, non-empty     |                |
| `before?` | Short                |                |
| `after?`  | Short                |                |
| `series?` | number[], at most 60 | finite numbers |
| `source`  | Source               |                |

### `approval`

| Field         | Type                                                   | Notes                                                                            |
| ------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `approvalId`  | ApprovalId                                             |                                                                                  |
| `tool`        | tool name                                              |                                                                                  |
| `argsHash`    | argsHash                                               |                                                                                  |
| `argsPreview` | `{ label: Title, value: Body }[]`, at most 50          | rendered from the actual tool arguments, never a model summary                   |
| `recipient?`  | Short                                                  |                                                                                  |
| `tier`        | RiskTier                                               | the tool's tier; `read` only when `risk` is `exfiltration`                       |
| `risk`        | `reversible-write` \| `irreversible` \| `exfiltration` | what the approval covers; an `irreversible` tier cannot carry `reversible-write` |
| `reason`      | Short, non-empty                                       |                                                                                  |
| `expiresAt`   | timestamp                                              |                                                                                  |

### `fyi`

| Field     | Type                                              | Notes                       |
| --------- | ------------------------------------------------- | --------------------------- |
| `summary` | Body, non-empty                                   |                             |
| `undo?`   | `{ tool: tool name, argsHash, until: timestamp }` | enables the `revert` action |

### `task`

| Field        | Type                                     | Notes |
| ------------ | ---------------------------------------- | ----- |
| `due?`       | timestamp                                |       |
| `owner`      | `me` \| `agent`                          |       |
| `status`     | `next` \| `doing` \| `waiting` \| `done` |       |
| `waitingOn?` | Short                                    |       |
| `chaseAt?`   | timestamp                                |       |

### `status`

| Field       | Type                                                           | Notes                          |
| ----------- | -------------------------------------------------------------- | ------------------------------ |
| `line`      | Short, non-empty                                               |                                |
| `asOf`      | timestamp                                                      | required                       |
| `health`    | `on-track` \| `needs-you` \| `waiting` \| `stalled` \| `quiet` |                                |
| `progress?` | `{ done, total }` non-negative integers                        | `done` must not exceed `total` |
| `nextDate?` | timestamp                                                      |                                |

### `review`

| Field       | Type                                      | Notes                  |
| ----------- | ----------------------------------------- | ---------------------- |
| `spaceId`   | SpaceId                                   | the Space under review |
| `moved`     | Short (non-empty)[], at most 20           |                        |
| `stalled`   | Short (non-empty)[], at most 20           |                        |
| `proposal`  | `keep` \| `pause` \| `archive` \| `nudge` |                        |
| `nudgeWho?` | Short                                     |                        |

### `filed`

| Field         | Type             | Notes                         |
| ------------- | ---------------- | ----------------------------- |
| `summary`     | Short, non-empty |                               |
| `filedInto`   | SpaceId          |                               |
| `fromCapture` | Long             | the captured text as received |

## Card actions

`CARD_ACTIONS: Record<CardType, readonly CardAction[]>` is the closed list of actions a client may offer; `CardAction` is `{ id, effect }` with effect `none`, `local`, `reversible` or `irreversible`. Action ids are bare (`send`); the qualified form `draft.send` names the same action.

| Type          | Actions (effect)                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `brief`       | discuss (none), dismiss, snooze, undo (local)                                                   |
| `digest`      | discuss (none), dismiss, snooze, file, undo (local)                                             |
| `meeting`     | discuss (none), dismiss, snooze, undo (local)                                                   |
| `needs-reply` | discuss (none), dismiss, snooze, undo (local)                                                   |
| `triage-item` | discuss (none), reply, ignore, snooze, mute, undo (local)                                       |
| `draft`       | discuss (none), edit, confirm-recipient, discard, snooze, undo (local), **send (irreversible)** |
| `monitor`     | discuss (none), dismiss, snooze, mute, file, undo (local)                                       |
| `approval`    | discuss (none), deny (local), **approve (irreversible)**                                        |
| `fyi`         | discuss (none), dismiss, undo (local), revert (reversible)                                      |
| `task`        | discuss (none), start, wait, complete, reopen, snooze, move, undo (local)                       |
| `status`      | discuss (none), dismiss (local)                                                                 |
| `review`      | discuss (none), keep, pause, archive, nudge, snooze, undo (local)                               |
| `filed`       | discuss (none), dismiss, move, undo (local)                                                     |

- `actionsFor(card)` returns the list for the card with effects resolved: `approve` is `irreversible` when the approval's risk is `irreversible` or `exfiltration`, and `reversible` when it is `reversible-write`, and `revert` is only offered when an `fyi` card has `data.undo`.
- `isActionAllowed(card, actionId)` is true when the id (bare, or qualified with the card's own type) is in `actionsFor(card)`. It does not consider card state.
- A draft with `needsRecipientCheck: true` offers `confirm-recipient` and withholds `send` until `recipientConfirmed` is true. Other drafts never offer `confirm-recipient`. Clients must show the recipient confirmation as a separate step from Send.
- `undo` (local) reverses the last card-state change. `fyi.revert` runs the card's undo tool call and so is a reversible write that goes through the policy gate.
- `triage-item.reply` and `review.nudge` only create a draft card; sending is a separate `draft.send`.

## Tools

`RiskTier` is `read`, `reversible-write` or `irreversible`. `ToolDescriptor`:

| Field           | Type                        | Notes                                                                                                                                                                                                            |
| --------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`          | tool name                   | for example `mail.send`                                                                                                                                                                                          |
| `connector`     | connector id                |                                                                                                                                                                                                                  |
| `tier`          | RiskTier                    |                                                                                                                                                                                                                  |
| `description`   | Body, non-empty             |                                                                                                                                                                                                                  |
| `egress`        | `none` \| `fixed` \| `open` | `open`: the model chooses the destination or recipient (the exfiltration channel). `fixed`: only to a service fixed by the user or template, with constrained arguments; the query is disclosed to that provider |
| `readsPrivate`  | boolean                     | the result contains the user's private data                                                                                                                                                                      |
| `contained`     | boolean                     | reversible-write only: the effect stays in the user's own account; must be `false` for other tiers                                                                                                               |
| `argsSchemaId?` | string, 1 to 128            |                                                                                                                                                                                                                  |

`BUILTIN_TOOLS` is a frozen array. Each tool's connector is the part of its name before the dot (`mail`, `calendar`, `web`, `memory`, `browser`, `weather`). Flags not listed are `egress: 'none'`, `readsPrivate: false`, `contained: false`.

| Tool                                                              | Tier             | Flags                                             |
| ----------------------------------------------------------------- | ---------------- | ------------------------------------------------- |
| `mail.search`, `mail.read`, `calendar.read`, `browser.read`       | read             | readsPrivate                                      |
| `web.fetch`, `browser.open`                                       | read             | egress `open`                                     |
| `web.search`, `weather.get`                                       | read             | egress `fixed`                                    |
| `memory.read`                                                     | read             | none (privacy is per entry, reported by the host) |
| `mail.create_draft`, `mail.label`, `mail.archive`, `memory.write` | reversible-write | contained                                         |
| `mail.send`, `browser.submit`                                     | irreversible     | egress `open`                                     |
| `mail.delete`                                                     | irreversible     | none                                              |

A `ToolRegistry` is an array of descriptors, a `Map` keyed by name, or a record keyed by name. `findTool(registry, name)` looks one up.

## Template manifest

### Template manifest fields

| Field             | Type                                                                                                                     | Notes                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `manifestVersion` | literal `1`                                                                                                              |                                                                                     |
| `id`              | TemplateId                                                                                                               |                                                                                     |
| `name`            | Title                                                                                                                    |                                                                                     |
| `description`     | Body                                                                                                                     |                                                                                     |
| `author`          | `{ name: Title, url?: https URL }`                                                                                       |                                                                                     |
| `category`        | slug                                                                                                                     |                                                                                     |
| `space`           | `{ kind: project \| area \| list, emblem: Short (1 to 32), color: #rrggbb }`                                             |                                                                                     |
| `agents`          | `{ id: AgentId, name: Title, persona: Body (non-empty), model: haiku \| sonnet \| opus, tools: tool name[] }[]`, 1 to 16 |                                                                                     |
| `routines`        | `{ id: slug, name: Title, agentId, trigger, emits: CardType[] (at least 1), startsPaused: true }[]`, at most 32          |                                                                                     |
| `connectors`      | `{ id: connector id, scopes: string[], reason: Short (non-empty) }[]`, at most 16                                        |                                                                                     |
| `budget`          | `{ monthlyMicroUsd, perRunMicroUsd }` positive integers                                                                  |                                                                                     |
| `skills?`         | `{ path }[]`, at most 32                                                                                                 | relative path: segments of `[A-Za-z0-9._-]`, no `.` or `..`, no leading `/`, no `\` |
| `mcpServers?`     | `{ name: slug, url: https URL }[]`, at most 16                                                                           |                                                                                     |

`trigger` is `{ kind: 'schedule', cron }` (five space-separated cron fields) or `{ kind: 'event', event }` (dotted lowercase name such as `mail.received`).

### Validation

- `parseTemplateManifest(input): Result<TemplateManifest, ValidationIssue[]>` checks shape plus the rules that need no tool registry.
- `validateTemplateManifest(input, registry = BUILTIN_TOOLS): ValidationIssue[]` runs every check and returns every issue; empty means valid. Structural checks run on the raw input, so they are reported alongside shape issues.

| Code                                                                   | Meaning                                                                        |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `starts-paused-not-true`                                               | a routine's `startsPaused` is not literally `true`                             |
| `model-not-tier`                                                       | an agent's `model` is not `haiku`, `sonnet` or `opus` (for example a model id) |
| `budget-invalid`                                                       | a budget amount is not a positive integer                                      |
| `per-run-exceeds-monthly`                                              | `perRunMicroUsd > monthlyMicroUsd`                                             |
| `duplicate-agent-id`, `duplicate-routine-id`, `duplicate-connector-id` | ids must be unique                                                             |
| `unknown-agent`                                                        | a routine's `agentId` names no agent                                           |
| `unknown-tool`                                                         | an agent lists a tool not in the registry (registry check only)                |
| `connector-not-declared`                                               | a tool's connector is not in `connectors` (registry check only)                |
| `unsafe-skill-path`                                                    | a skill path is absolute or contains `..`                                      |
| zod codes                                                              | any other shape problem, for example `unrecognized_keys`                       |

### Permission summary

`summarizePermissions(manifest, registry = BUILTIN_TOOLS): PermissionSummary` returns:

- `connectors`: id, scopes and reason for each declared connector.
- `toolsByTier`: `{ read, 'reversible-write', irreversible }`, each a name-sorted list of `{ name, connector, tier, description, agentIds }`.
- `irreversibleTools`: the name of every irreversible tool any agent may call, listed explicitly.
- `openEgressTools` and `fixedEgressTools`: tool names by egress level, listed separately. The install screen names the provider each fixed tool discloses queries to. Each `toolsByTier` entry also carries `egress` and `readsPrivate`.
- `unknownTools`: tool names missing from the registry (a manifest with any should not be installed).
- `routines`: id, name, agentId, trigger, emitted card types and `startsPaused`.
- `models`: tiers used, in the order haiku, sonnet, opus.
- `budget`, `skills` (paths) and `mcpServers` (name and url).

## Client rules

- Render every string as text, never as HTML or markup.
- **Clients never fetch a model-supplied URL automatically**: no image loading, link previews or prefetching. Any URL in a card (source links, `joinUrl`, digest tiles) is followed only on an explicit user action. An automatic fetch would let injected content send private data out through the URL.
- Approval cards are rendered from `argsPreview`, which the host builds from the actual tool arguments.

## Known limits

Accepted residual risks in protocol version 1:

- A `fixed` egress tool with free-text arguments, such as a search query, can disclose private text to that fixed provider. The text does not reach an attacker, and the install screen names the provider.
- A user-requested lookup of an arbitrary site during a run that has read mail needs one approval, because `web.fetch` has `open` egress. A per-Space domain allowlist is planned for M1.

## Fixtures

`packages/protocol/fixtures/cards/<type>.json` holds one valid card per type. `packages/protocol/fixtures/manifests/valid.json` is a valid manifest; `invalid.json` violates, among others, `startsPaused`, model tier, budget order, duplicate agent id, unknown agent, unknown tool, undeclared connector, skill path traversal, a non-https MCP url and an unknown top-level key.
