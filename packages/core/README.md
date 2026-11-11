# `@later/core`

Pure, runtime-agnostic domain logic: canonical hashing, the policy gate, approvals, the price table and the budget ledger. No I/O. Time (`now: Date`) and ids are always parameters. Money is integer micro-USD.

Expected failures return `Result` values (from `@later/protocol`). Programmer errors (negative amounts, non-integer token counts, non-JSON arguments, duplicate reservation ids) throw `RangeError`, `TypeError` or `Error`.

Inputs take plain `string` ids and ISO 8601 UTC timestamp strings, so branded protocol ids are accepted but not required. Returned state objects (approvals, ledgers, run contexts, requests) are frozen.

This file lists the names and shapes that `docs/specs/m0-foundation.md` left open.

## Canonical hashing

- `canonicalJson(value): string`. Keys are sorted by UTF-16 code unit (as RFC 8785). Numbers and strings are formatted as `JSON.stringify` formats them (`-0` becomes `0`). Throws `CanonicalJsonError` (a `TypeError`) for `undefined` anywhere (including object values and array holes), functions, symbols, bigints, non-finite numbers, cycles and non-plain objects (`Date`, `Map`, class instances). Shared references that are not cycles are fine. Symbol keys are ignored.
- `hashArgs(tool, args): Promise<string>` hashes `tool + '\n' + canonicalJson(args)` with WebCrypto SHA-256 and returns lowercase hex.

## Policy gate

Amended by M0.1 (A1 to A4).

- `ToolRequest`: `{ tool: ToolDescriptor; args: unknown; argsHash: string }`.
- `buildRequest(tool, args): Promise<ToolRequest>` copies `args` through canonical JSON, deep-freezes the copy and computes `argsHash`.
- `decide(request, context): Promise<Decision>` recomputes the hash first and denies a mismatch (`request-tampered`), including arguments that are not JSON values. It consumes nothing and is for previews. `verifyRequest(request): Promise<boolean>` is the same check on its own.
- `authorize(request, context): Promise<Authorization>` returns `{ decision, consumed? }`. When an approval allowed the call, `consumed.approval` is that approval, now `redeemed`. When a device confirmation allowed it, `consumed.nonce` is its nonce. The host persists `consumed` before executing. Hosts execute tools only on `authorize`.
- `RunContext` is `{ initiatedBy, ingestedUntrusted, touchedPrivate }`. Both flags are sticky.
  - `markIngested(run, source)` takes anything with a `trust` and sets `ingestedUntrusted` for `external`.
  - `markToolUsed(run, tool, opts?)` sets `touchedPrivate` when `tool.readsPrivate` or `opts.privateResult` is true.
  - `memoryTaintFor(run)` returns the trust a memory entry written by this run must carry.
  - Addition: `memoryPrivacyFor(run)` returns whether that entry must be marked private (`run.touchedPrivate`). Without it, private data written to memory by an inbox run would read back as non-private in a later run.
- `DeviceConfirmation` is `{ argsHash, deviceId, nonce, confirmedAt }`. `PolicyContext` gains `knownDevices?`, `usedNonces?` (a missing set means none) and `confirmationMaxAgeMs?` (default `DEFAULT_CONFIRMATION_MAX_AGE_MS`, 120000). A confirmation dated in the future, older than the maximum age, or with an unparseable date is ignored. **The runtime must verify the device signature before putting a confirmation in the context.** Core cannot.
- The approval rule also requires `approval.spaceId === context.spaceId`. An approval or confirmation that does not match falls through to the later rules.
- **Rule 3 interpretation.** A `read` tool at exfiltration risk (it has egress, and the run has both ingested untrusted content and touched private data) is not refused outright. Rules 4 and 5 still apply, so a matching approval or device confirmation allows it. Without one, the result is `require-approval` (`exfiltration-risk`). If rule 3 returned before rule 4, as the amended text reads literally, approving such a call would be impossible.
- **Approving a read tool.** `requestApproval` rejects the `read` tier, and approval cards never carry it. Hosts request approval for an exfiltration-risk read with tier `irreversible`, since data that has left cannot be recalled. Redemption matches on tool name and hash only.
- `addAlwaysAllow(set, tool): Result<ReadonlySet<string>, 'not-reversible-write'>` returns a new set.

`ReasonCode` (also `REASON_CODES`):

| Code                                                                                                                        | Outcome          | Rule                                                                     |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------ |
| `request-tampered`                                                                                                          | deny             | 0, hash mismatch                                                         |
| `connector-not-granted`                                                                                                     | deny             | 1                                                                        |
| `budget-paused`                                                                                                             | deny             | 2                                                                        |
| `read-only`                                                                                                                 | allow            | 3                                                                        |
| `approved`                                                                                                                  | allow            | 4                                                                        |
| `user-confirmed`                                                                                                            | allow            | 5                                                                        |
| `exfiltration-risk`                                                                                                         | require-approval | 3, after rules 4 and 5                                                   |
| `always-allowed`                                                                                                            | allow            | 6                                                                        |
| `not-always-allowed`                                                                                                        | require-approval | 6, tool not in `alwaysAllow`                                             |
| `untrusted-content`                                                                                                         | require-approval | 6, allowlisted, but the run is untrusted and the tool is not `contained` |
| `irreversible`                                                                                                              | require-approval | 7                                                                        |
| `approval-not-granted`, `approval-already-redeemed`, `approval-expired`, `approval-tool-mismatch`, `approval-args-mismatch` |                  | `redeem` failures                                                        |

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

Amended by M0.1 (A5).

- `createLedger({ scope, id, cycleStart, cycleEnd, capMicroUsd, spentMicroUsd? }): Ledger` builds a ledger with its status computed.
- Every operation returns a plain `LedgerUpdate`, `{ ledger: Ledger; events: LedgerEvent[] }`: `reserve` and `settle` inside a `Result`, and `release`, `rollover` and `setCap` directly. Ledgers are frozen and have no hidden properties.
- `LedgerEvent` is a string: `'warned' | 'paused' | 'resumed' | 'rolled-over'`. Events are emitted on transitions only: entering `paused` gives `paused`; leaving `paused` gives `resumed`; going from `ok` to `warned` gives `warned`; going from `warned` to `ok` gives nothing. `rollover` puts `rolled-over` first.
- Status is computed from spending alone: `paused` when `spent >= cap`, `warned` when `spent >= 80%` of cap (`statusFor`, `WARN_AT`), else `ok`. Reservations do not change status. A cap of 0 is always `paused`.
- `reserve` checks, in order: `cycle-ended` (now at or after `cycleEnd`), `paused`, `over-cap` (`spent + reserved + estimate > cap`). A duplicate reservation id throws.
- `settle(ledger, id, actual, now)` never fails because a cycle ended. `now` is unused for now.
- `release` with an unknown id returns the ledger unchanged.
- `rollover(ledger, now, nextCycleEnd)` does nothing before `cycleEnd`. After it, the new cycle runs from the old `cycleEnd` to `nextCycleEnd`, `spent` is 0 and all reservations are cleared. Throws if `nextCycleEnd` is not after `now`.
- `reserveBoth(spaceLedger, accountLedger, estimate, id, now): Result<{ space: LedgerUpdate; account: LedgerUpdate }, { ledger: 'space' | 'account'; error }>` reserves the same id on both, or changes neither. Each side carries its own ledger and events. The space ledger is checked first. Settle and release each ledger separately.
