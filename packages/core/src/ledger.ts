import type { Result } from '@later/protocol';

export type LedgerScope = 'space' | 'account';
export type LedgerStatus = 'ok' | 'warned' | 'paused';
export type LedgerEvent = 'warned' | 'paused' | 'resumed' | 'rolled-over';
export type ReservationId = string;

export interface Reservation {
  readonly amountMicroUsd: number;
  /** ISO 8601 UTC. */
  readonly createdAt: string;
}

export interface Ledger {
  readonly scope: LedgerScope;
  readonly id: string;
  /** ISO 8601 UTC. */
  readonly cycleStart: string;
  /** ISO 8601 UTC. The cycle has ended at and after this instant. */
  readonly cycleEnd: string;
  readonly capMicroUsd: number;
  readonly spentMicroUsd: number;
  readonly reservations: Readonly<Record<ReservationId, Reservation>>;
  readonly status: LedgerStatus;
}

/**
 * A ledger returned by an operation. It is a plain `Ledger` with one extra,
 * non-enumerable property, `events`: the status events this operation caused.
 * Being non-enumerable, `events` is dropped by spreading, `JSON.stringify` and
 * equality matchers, so the value can be stored and passed back as a `Ledger`.
 */
export type LedgerStep = Ledger & { readonly events: readonly LedgerEvent[] };

export type ReserveError = 'over-cap' | 'paused' | 'cycle-ended';

/** Warn threshold: 80% of cap, as the rational 4/5. */
export const WARN_AT = { num: 4, den: 5 } as const;

export function statusFor(spentMicroUsd: number, capMicroUsd: number): LedgerStatus {
  const spent = BigInt(spentMicroUsd);
  const cap = BigInt(capMicroUsd);
  if (spent >= cap) return 'paused';
  if (spent * BigInt(WARN_AT.den) >= cap * BigInt(WARN_AT.num)) return 'warned';
  return 'ok';
}

function transitionEvents(from: LedgerStatus, to: LedgerStatus): LedgerEvent[] {
  if (from === to) return [];
  if (to === 'paused') return ['paused'];
  if (from === 'paused') return ['resumed'];
  if (to === 'warned') return ['warned'];
  return [];
}

const amount = (fn: string, name: string, n: number): number => {
  if (!Number.isSafeInteger(n) || n < 0) {
    throw new RangeError(`${fn}: ${name} must be a non-negative integer micro-USD amount`);
  }
  return n;
};

/** Strips any `events`, recomputes status, freezes, and attaches this step's events. */
function step(prev: Ledger, next: Omit<Ledger, 'status'>, extra: LedgerEvent[] = []): LedgerStep {
  const status = statusFor(next.spentMicroUsd, next.capMicroUsd);
  const ledger: Ledger = {
    scope: next.scope,
    id: next.id,
    cycleStart: next.cycleStart,
    cycleEnd: next.cycleEnd,
    capMicroUsd: next.capMicroUsd,
    spentMicroUsd: next.spentMicroUsd,
    reservations: Object.freeze({ ...next.reservations }),
    status,
  };
  const events = Object.freeze([...extra, ...transitionEvents(prev.status, status)]);
  Object.defineProperty(ledger, 'events', { value: events, enumerable: false });
  return Object.freeze(ledger) as LedgerStep;
}

const without = (
  reservations: Readonly<Record<ReservationId, Reservation>>,
  id: ReservationId,
): Record<ReservationId, Reservation> =>
  Object.fromEntries(Object.entries(reservations).filter(([key]) => key !== id));

const reservedTotal = (ledger: Ledger): number =>
  Object.values(ledger.reservations).reduce((sum, r) => sum + r.amountMicroUsd, 0);

export interface LedgerInput {
  scope: LedgerScope;
  id: string;
  cycleStart: string;
  cycleEnd: string;
  capMicroUsd: number;
  spentMicroUsd?: number;
}

/** Creates a ledger with no reservations and its status computed. */
export function createLedger(input: LedgerInput): LedgerStep {
  const base = {
    scope: input.scope,
    id: input.id,
    cycleStart: input.cycleStart,
    cycleEnd: input.cycleEnd,
    capMicroUsd: amount('createLedger', 'capMicroUsd', input.capMicroUsd),
    spentMicroUsd: amount('createLedger', 'spentMicroUsd', input.spentMicroUsd ?? 0),
    reservations: {},
  };
  return step({ ...base, status: 'ok' }, base);
}

/**
 * Reserves an estimate before a run. Fails with `cycle-ended` at or after
 * `cycleEnd`, `paused` when the ledger is paused, and `over-cap` when
 * `spent + reserved + estimate > cap`. Throws for a duplicate reservation id.
 */
export function reserve(
  ledger: Ledger,
  estimateMicroUsd: number,
  id: ReservationId,
  now: Date,
): Result<LedgerStep, ReserveError> {
  amount('reserve', 'estimateMicroUsd', estimateMicroUsd);
  if (Object.hasOwn(ledger.reservations, id)) {
    throw new Error(`reserve: reservation "${id}" already exists`);
  }
  if (now.getTime() >= Date.parse(ledger.cycleEnd)) return { ok: false, error: 'cycle-ended' };
  if (ledger.status === 'paused') return { ok: false, error: 'paused' };
  if (ledger.spentMicroUsd + reservedTotal(ledger) + estimateMicroUsd > ledger.capMicroUsd) {
    return { ok: false, error: 'over-cap' };
  }
  return {
    ok: true,
    value: step(ledger, {
      ...ledger,
      reservations: {
        ...ledger.reservations,
        [id]: Object.freeze({ amountMicroUsd: estimateMicroUsd, createdAt: now.toISOString() }),
      },
    }),
  };
}

/**
 * Replaces a reservation with the actual cost. The actual may exceed the estimate;
 * the ledger pauses if spending reaches the cap. `now` is accepted for symmetry
 * and future auditing; settling never fails because a cycle ended.
 */
export function settle(
  ledger: Ledger,
  id: ReservationId,
  actualMicroUsd: number,
  _now: Date,
): Result<LedgerStep, 'unknown-reservation'> {
  amount('settle', 'actualMicroUsd', actualMicroUsd);
  if (!Object.hasOwn(ledger.reservations, id)) return { ok: false, error: 'unknown-reservation' };
  const rest = without(ledger.reservations, id);
  return {
    ok: true,
    value: step(ledger, {
      ...ledger,
      spentMicroUsd: ledger.spentMicroUsd + actualMicroUsd,
      reservations: rest,
    }),
  };
}

/** Drops a reservation without spending. Unknown ids leave the ledger unchanged. */
export function release(ledger: Ledger, id: ReservationId): LedgerStep {
  if (!Object.hasOwn(ledger.reservations, id)) return step(ledger, ledger);
  const rest = without(ledger.reservations, id);
  return step(ledger, { ...ledger, reservations: rest });
}

/**
 * Starts the next cycle once `now` is at or after `cycleEnd`: spending resets to
 * zero, all reservations are cleared, and the new cycle runs from the old
 * `cycleEnd` to `nextCycleEnd`. Before `cycleEnd` the ledger is returned
 * unchanged with no events. Throws if `nextCycleEnd` is not after `now`.
 */
export function rollover(ledger: Ledger, now: Date, nextCycleEnd: string): LedgerStep {
  if (now.getTime() < Date.parse(ledger.cycleEnd)) return step(ledger, ledger);
  if (!(Date.parse(nextCycleEnd) > now.getTime())) {
    throw new RangeError('rollover: nextCycleEnd must be after now');
  }
  return step(
    ledger,
    {
      ...ledger,
      cycleStart: ledger.cycleEnd,
      cycleEnd: nextCycleEnd,
      spentMicroUsd: 0,
      reservations: {},
    },
    ['rolled-over'],
  );
}

/** Changes the cap and recomputes status. Existing reservations are kept. */
export function setCap(ledger: Ledger, capMicroUsd: number): LedgerStep {
  amount('setCap', 'capMicroUsd', capMicroUsd);
  return step(ledger, { ...ledger, capMicroUsd });
}

export interface ReserveBothError {
  /** Which ledger refused. The space ledger is checked first. */
  ledger: LedgerScope;
  error: ReserveError;
}

/**
 * Reserves the same estimate under the same id against a Space ledger and the
 * account ledger. Either both succeed or neither changes.
 */
export function reserveBoth(
  spaceLedger: Ledger,
  accountLedger: Ledger,
  estimateMicroUsd: number,
  id: ReservationId,
  now: Date,
): Result<{ space: LedgerStep; account: LedgerStep }, ReserveBothError> {
  if (spaceLedger.scope !== 'space' || accountLedger.scope !== 'account') {
    throw new Error('reserveBoth: expected a space ledger and an account ledger');
  }
  const space = reserve(spaceLedger, estimateMicroUsd, id, now);
  if (!space.ok) return { ok: false, error: { ledger: 'space', error: space.error } };
  const account = reserve(accountLedger, estimateMicroUsd, id, now);
  if (!account.ok) return { ok: false, error: { ledger: 'account', error: account.error } };
  return { ok: true, value: { space: space.value, account: account.value } };
}
