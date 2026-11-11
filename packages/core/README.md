# `@later/core`

Pure, runtime-agnostic domain logic: canonical hashing, the policy gate, approvals, the price table and the budget ledger. No I/O. Time (`now: Date`) and ids are always parameters. Money is integer micro-USD.

Expected failures return `Result` values (from `@later/protocol`). Programmer errors (negative amounts, non-integer token counts, non-JSON arguments, duplicate reservation ids) throw `RangeError`, `TypeError` or `Error`.

Inputs take plain `string` ids and ISO 8601 UTC timestamp strings, so branded protocol ids are accepted but not required. Every returned object is frozen.

This file lists the names and shapes that `docs/specs/m0-foundation.md` left open.

## Canonical hashing

- `canonicalJson(value): string`. Keys are sorted by UTF-16 code unit (as RFC 8785). Numbers and strings are formatted as `JSON.stringify` formats them (`-0` becomes `0`). Throws `CanonicalJsonError` (a `TypeError`) for `undefined` anywhere (including object values and array holes), functions, symbols, bigints, non-finite numbers, cycles and non-plain objects (`Date`, `Map`, class instances). Shared references that are not cycles are fine. Symbol keys are ignored.
- `hashArgs(tool, args): Promise<string>` hashes `tool + '\n' + canonicalJson(args)` with WebCrypto SHA-256 and returns lowercase hex.

## Policy gate

- `ToolRequest`: `{ tool: ToolDescriptor; args: unknown; argsHash: string }`.
- `buildRequest(tool, args): Promise<ToolRequest>` copies `args` through canonical JSON, deep-freezes the copy and computes `argsHash`, so the arguments cannot change after hashing.
- `decide(request, context): Decision` is synchronous and treats the request as trusted: it does not recompute the hash. Requests must come from `buildRequest`. `verifyRequest(request): Promise<boolean>` is provided for callers that receive a request from elsewhere.
- `PolicyContext` is as specified; `RunContext` is `{ initiatedBy, ingestedUntrusted }`.
- Rule 4 (approval) additionally requires `approval.spaceId === context.spaceId`, so an approval cannot be redeemed in another Space. An approval that does not match falls through to the later rules.
- `addAlwaysAllow(set, tool): Result<ReadonlySet<string>, 'not-reversible-write'>` returns a new set.
- `markIngested(run, source): RunContext` takes anything with a `kind`. `email` and `web` set `ingestedUntrusted`; it never returns to false. `UNTRUSTED_SOURCE_KINDS` lists them.

`ReasonCode` (also `REASON_CODES`):

| Code                                                                                                                        | Outcome          | Rule                                                       |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------- |
| `connector-not-granted`                                                                                                     | deny             | 1                                                          |
| `budget-paused`                                                                                                             | deny             | 2                                                          |
| `read-only`                                                                                                                 | allow            | 3                                                          |
| `approved`                                                                                                                  | allow            | 4                                                          |
| `user-confirmed`                                                                                                            | allow            | 5                                                          |
| `always-allowed`                                                                                                            | allow            | 6                                                          |
| `not-always-allowed`                                                                                                        | require-approval | 6, tool not in `alwaysAllow`                               |
| `untrusted-content`                                                                                                         | require-approval | 6, tool allowlisted but the run ingested untrusted content |
| `irreversible`                                                                                                              | require-approval | 7                                                          |
| `approval-not-granted`, `approval-already-redeemed`, `approval-expired`, `approval-tool-mismatch`, `approval-args-mismatch` |                  | `redeem` failures                                          |

## Approvals

- `Approval` is as specified; timestamps are ISO strings.
- `requestApproval(input, now, id)`, with `input: { spaceId, tool, argsHash, tier, ttlMs? }`. `ttlMs` defaults to `DEFAULT_APPROVAL_TTL_MS` (24 hours). Throws for a `read` tier or a non-positive TTL.
- `grant(approval, now): Approval` and `deny(approval, now): Approval` return an approval, not a `Result`. `grant` moves `pending` to `granted`, or to `expired` if past expiry. `deny` moves `pending` or `granted` to `denied` (so it also revokes), or a pending approval past expiry to `expired`. Any other status is returned unchanged.
- `expire(approval, now)` marks a pending or granted approval `expired` once due. `isExpired(approval, now)` is true at and after `expiresAt`.
- `redeem(approval, request, now): Result<Approval, ReasonCode>` succeeds only for a `granted`, unexpired approval whose tool name and `argsHash` both match. The result is `redeemed`, and redeeming it again fails with `approval-already-redeemed`. `approvalFailure(approval, request, now)` returns the failure reason or `null`.

## Price table and cost

- `PRICE_TABLE` is the shipped table. Its `source` records the URL (Anthropic's pricing page), the retrieval date, the Claude API model each tier is priced as, and `isVerified: true`. `isPriceTableVerified(table)` checks that flag; a placeholder table must set it to `false`.
- `version` and `effectiveDate` are strings (`'2026-11-11'`).
- `batchDiscount` is the fraction taken off: batch price = price x (1 - num/den). It applies to every token category, because Anthropic states that caching multipliers stack with the batch discount.
- Additions to the specified shape, all optional:
  - `cacheWrite1hPerMTok` on a model, and `cacheWrite1hTokens` on usage, for 1-hour cache writes. `cacheWriteTokens` means 5-minute writes. Usage with 1-hour writes against a table without that price throws.
  - `longContext: { thresholdTokens, prices }` on a model. When prompt tokens (input + all cache writes + cache reads) are strictly greater than the threshold, the whole request uses those prices. Claude Haiku 5.5 is priced this way above 100,000 tokens.
- `costMicroUsd(usage, model, table, opts?)` uses exact `BigInt` arithmetic and rounds up once, at the end. It throws `RangeError` for negative, fractional or unsafe token counts, an unknown model, a malformed table, or a result above `Number.MAX_SAFE_INTEGER`.
- Not modelled: US-only inference (`inference_geo: "us"`, x1.1), fast mode, data residency, server-tool charges (web search and similar), and partner cloud pricing. Later uses global routing at standard speed.

## Budget ledger

- `createLedger({ scope, id, cycleStart, cycleEnd, capMicroUsd, spentMicroUsd? })` builds a ledger with its status computed.
- The specified signatures are kept: `reserve` and `settle` return `Result<LedgerStep, ...>`, and `release`, `rollover` and `setCap` return a `LedgerStep`. A `LedgerStep` is a frozen `Ledger` with one extra, **non-enumerable** property, `events: readonly LedgerEvent[]`. Because it is non-enumerable, spreading, `JSON.stringify` and equality matchers ignore it, and the value can be passed straight back in as a `Ledger`.
- `LedgerEvent` is a string: `'warned' | 'paused' | 'resumed' | 'rolled-over'`. Status events are emitted on transitions only: entering `paused` gives `paused`; leaving `paused` gives `resumed`; going from `ok` to `warned` gives `warned`; going from `warned` to `ok` gives nothing. `rollover` adds `rolled-over` first.
- Status is computed from spending alone: `paused` when `spent >= cap`, `warned` when `spent >= 80%` of cap (`statusFor`, `WARN_AT`), else `ok`. Reservations do not change status. A cap of 0 is always `paused`.
- `reserve` checks, in order: `cycle-ended` (now at or after `cycleEnd`), `paused`, `over-cap` (`spent + reserved + estimate > cap`). A duplicate reservation id throws.
- `settle(ledger, id, actual, now)` never fails because a cycle ended; `now` is unused today.
- `release` with an unknown id returns the ledger unchanged.
- `rollover(ledger, now, nextCycleEnd)` does nothing before `cycleEnd`. After it, the new cycle runs from the old `cycleEnd` to `nextCycleEnd`, `spent` is 0 and all reservations are cleared. Throws if `nextCycleEnd` is not after `now`.
- `reserveBoth(spaceLedger, accountLedger, estimate, id, now): Result<{ space, account }, { ledger: 'space' | 'account'; error }>` reserves the same id on both or changes neither. The space ledger is checked first. Settle and release each ledger separately.
