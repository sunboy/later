import { describe, expect, it } from 'vitest';
import {
  createLedger,
  release,
  reserve,
  reserveBoth,
  rollover,
  setCap,
  settle,
  type Ledger,
  type LedgerUpdate,
} from '../../src/index.js';

const T0 = new Date('2026-11-01T00:00:00Z');
const END = '2026-12-01T00:00:00Z';
const mk = (cap: number, spent = 0, scope: 'space' | 'account' = 'space'): Ledger =>
  createLedger({ scope, id: `${scope}_1`, cycleStart: T0.toISOString(), cycleEnd: END, capMicroUsd: cap, spentMicroUsd: spent });
const must = <T,>(r: { ok: true; value: T } | { ok: false; error: unknown }): T => {
  if (!r.ok) throw new Error(`unexpected error ${String(r.error)}`);
  return r.value;
};
const reserved = (l: Ledger): number => Object.values(l.reservations).reduce((s, r) => s + r.amountMicroUsd, 0);

describe('reserve', () => {
  it('reserves within the cap and records the reservation', () => {
    const { ledger, events } = must(reserve(mk(100), 40, 'r1', T0));
    expect(ledger.reservations['r1']?.amountMicroUsd).toBe(40);
    expect(ledger.spentMicroUsd).toBe(0);
    expect(events).toEqual([]);
  });
  it('allows reserving exactly up to the cap', () => {
    expect(reserve(mk(100), 100, 'r1', T0).ok).toBe(true);
  });
  it('fails over-cap for an estimate above the cap', () => {
    expect(reserve(mk(100), 101, 'r1', T0)).toEqual({ ok: false, error: 'over-cap' });
  });
  it('counts outstanding reservations towards the cap', () => {
    const a = must(reserve(mk(100), 60, 'r1', T0)).ledger;
    expect(reserve(a, 41, 'r2', T0)).toEqual({ ok: false, error: 'over-cap' });
    const b = must(reserve(a, 40, 'r2', T0)).ledger;
    expect(reserve(b, 1, 'r3', T0)).toEqual({ ok: false, error: 'over-cap' });
  });
  it('counts spend towards the cap', () => {
    expect(reserve(mk(100, 70), 31, 'r1', T0)).toEqual({ ok: false, error: 'over-cap' });
    expect(reserve(mk(100, 70), 30, 'r1', T0).ok).toBe(true);
  });
  it('spend plus reservations plus estimate is what is compared', () => {
    const a = must(reserve(mk(100, 30), 30, 'r1', T0)).ledger;
    expect(reserve(a, 41, 'r2', T0).ok).toBe(false);
    expect(reserve(a, 40, 'r2', T0).ok).toBe(true);
  });
  it('fails with paused when spent has reached the cap', () => {
    expect(reserve(mk(100, 100), 0, 'r1', T0)).toEqual({ ok: false, error: 'paused' });
    expect(reserve(mk(100, 150), 1, 'r1', T0)).toEqual({ ok: false, error: 'paused' });
  });
  it('fails with cycle-ended at and after cycleEnd', () => {
    expect(reserve(mk(100), 1, 'r1', new Date(END))).toEqual({ ok: false, error: 'cycle-ended' });
    expect(reserve(mk(100), 1, 'r1', new Date('2027-01-01T00:00:00Z'))).toEqual({ ok: false, error: 'cycle-ended' });
    expect(reserve(mk(100), 1, 'r1', new Date('2026-11-30T23:59:59Z')).ok).toBe(true);
  });
  it('does not mutate its input', () => {
    const l = mk(100);
    reserve(l, 10, 'r1', T0);
    expect(l.reservations).toEqual({});
  });
  it('rejects negative or fractional estimates', () => {
    expect(() => reserve(mk(100), -1, 'r1', T0)).toThrow();
    expect(() => reserve(mk(100), 1.5, 'r1', T0)).toThrow();
  });
});

describe('settle', () => {
  it('replaces the reservation with the actual cost', () => {
    const l = must(reserve(mk(100), 40, 'r1', T0)).ledger;
    const { ledger } = must(settle(l, 'r1', 25, T0));
    expect(ledger.spentMicroUsd).toBe(25);
    expect(ledger.reservations).toEqual({});
  });
  it('accepts an actual above the estimate', () => {
    const l = must(reserve(mk(100), 10, 'r1', T0)).ledger;
    const { ledger } = must(settle(l, 'r1', 30, T0));
    expect(ledger.spentMicroUsd).toBe(30);
  });
  it('fails for an unknown reservation', () => {
    expect(settle(mk(100), 'nope', 1, T0)).toEqual({ ok: false, error: 'unknown-reservation' });
  });
  it('cannot settle the same reservation twice', () => {
    const l = must(reserve(mk(100), 10, 'r1', T0)).ledger;
    const once = must(settle(l, 'r1', 10, T0)).ledger;
    expect(settle(once, 'r1', 10, T0)).toEqual({ ok: false, error: 'unknown-reservation' });
  });
  it('leaves other reservations alone', () => {
    let l = must(reserve(mk(1000), 10, 'a', T0)).ledger;
    l = must(reserve(l, 20, 'b', T0)).ledger;
    l = must(settle(l, 'a', 5, T0)).ledger;
    expect(l.reservations['b']?.amountMicroUsd).toBe(20);
    expect(Object.keys(l.reservations)).toEqual(['b']);
  });
  it('settling past the cap pauses the ledger and emits paused', () => {
    const l = must(reserve(mk(100), 50, 'r1', T0)).ledger;
    const { ledger, events } = must(settle(l, 'r1', 120, T0));
    expect(ledger.status).toBe('paused');
    expect(events).toContain('paused');
  });
  it('rejects a negative or fractional actual', () => {
    const l = must(reserve(mk(100), 10, 'r1', T0)).ledger;
    expect(() => settle(l, 'r1', -1, T0)).toThrow();
    expect(() => settle(l, 'r1', 0.5, T0)).toThrow();
  });
});

describe('status thresholds and events', () => {
  const settleTo = (cap: number, spend: number): LedgerUpdate => {
    const l = must(reserve(mk(cap), Math.min(spend, cap), 'r', T0)).ledger;
    return must(settle(l, 'r', spend, T0));
  };
  it('is ok below 80%', () => {
    const u = settleTo(100, 79);
    expect(u.ledger.status).toBe('ok');
    expect(u.events).toEqual([]);
  });
  it('is warned at exactly 80% and emits warned', () => {
    const u = settleTo(100, 80);
    expect(u.ledger.status).toBe('warned');
    expect(u.events).toContain('warned');
  });
  it('is warned between 80% and 100%', () => {
    expect(settleTo(100, 99).ledger.status).toBe('warned');
  });
  it('is paused at exactly 100% and emits paused', () => {
    const u = settleTo(100, 100);
    expect(u.ledger.status).toBe('paused');
    expect(u.events).toContain('paused');
  });
  it('is paused above 100%', () => {
    expect(settleTo(100, 150).ledger.status).toBe('paused');
  });
  it('uses exact integer thresholds on awkward caps', () => {
    expect(settleTo(7, 5).ledger.status).toBe('ok'); // 71.4%
    expect(settleTo(7, 6).ledger.status).toBe('warned'); // 85.7%
    expect(settleTo(10, 8).ledger.status).toBe('warned');
    expect(settleTo(3, 2).ledger.status).toBe('ok'); // 66.7%
    expect(settleTo(5, 4).ledger.status).toBe('warned'); // exactly 80%
  });
  it('a created ledger already over its thresholds starts with that status', () => {
    expect(mk(100, 85).status).toBe('warned');
    expect(mk(100, 100).status).toBe('paused');
    expect(mk(100, 0).status).toBe('ok');
  });
  it('the warned event is not repeated while staying warned', () => {
    const w = mk(100, 85);
    const l = must(reserve(w, 5, 'r', T0)).ledger;
    const u = must(settle(l, 'r', 5, T0));
    expect(u.ledger.status).toBe('warned');
    expect(u.events).not.toContain('warned');
  });
  it('pending reservations do not change status', () => {
    expect(must(reserve(mk(100), 100, 'r', T0)).ledger.status).toBe('ok');
  });
});

describe('setCap', () => {
  it('raising the cap resumes a paused ledger', () => {
    const { ledger, events } = setCap(mk(100, 100), 500);
    expect(ledger.status).toBe('ok');
    expect(events).toContain('resumed');
  });
  it('lowering the cap pauses and emits paused', () => {
    const { ledger, events } = setCap(mk(100, 50), 40);
    expect(ledger.status).toBe('paused');
    expect(events).toContain('paused');
  });
  it('lowering the cap into the warning band warns', () => {
    const { ledger, events } = setCap(mk(100, 50), 60);
    expect(ledger.status).toBe('warned');
    expect(events).toContain('warned');
  });
  it('recomputes from spend alone and keeps reservations', () => {
    const l = must(reserve(mk(100, 10), 20, 'r', T0)).ledger;
    const { ledger } = setCap(l, 200);
    expect(ledger.capMicroUsd).toBe(200);
    expect(ledger.spentMicroUsd).toBe(10);
    expect(ledger.reservations['r']?.amountMicroUsd).toBe(20);
    expect(ledger.status).toBe('ok');
  });
  it('after a cap raise, reserve works again', () => {
    const paused = mk(100, 100);
    expect(reserve(paused, 1, 'r', T0).ok).toBe(false);
    expect(reserve(setCap(paused, 200).ledger, 1, 'r', T0).ok).toBe(true);
  });
  it('rejects a negative or fractional cap', () => {
    expect(() => setCap(mk(100), -1)).toThrow();
    expect(() => setCap(mk(100), 1.5)).toThrow();
  });
});

describe('rollover', () => {
  const NEXT = '2027-01-01T00:00:00Z';
  const after = new Date('2026-12-01T00:00:01Z');
  it('resets spend, clears stale reservations and sets status ok after the cycle ends', () => {
    let l = mk(100, 90);
    l = must(reserve(l, 5, 'stale', T0)).ledger;
    const { ledger, events } = rollover(l, after, NEXT);
    expect(ledger.spentMicroUsd).toBe(0);
    expect(ledger.reservations).toEqual({});
    expect(ledger.status).toBe('ok');
    expect(ledger.cycleEnd).toBe(NEXT);
    expect(ledger.capMicroUsd).toBe(100);
    expect(events).toContain('rolled-over');
  });
  it('a paused ledger resumes on rollover', () => {
    const { ledger, events } = rollover(mk(100, 100), after, NEXT);
    expect(ledger.status).toBe('ok');
    expect(events).toContain('resumed');
  });
  it('the new cycle allows reserving again', () => {
    const { ledger } = rollover(mk(100, 100), after, NEXT);
    expect(reserve(ledger, 50, 'r', after).ok).toBe(true);
  });
  it('does not roll over before the cycle ends', () => {
    const l = mk(100, 90);
    const { ledger, events } = rollover(l, new Date('2026-11-15T00:00:00Z'), NEXT);
    expect(ledger.spentMicroUsd).toBe(90);
    expect(events).not.toContain('rolled-over');
  });
});

describe('release', () => {
  it('drops the reservation without spending', () => {
    const l = must(reserve(mk(100), 40, 'r', T0)).ledger;
    const { ledger } = release(l, 'r');
    expect(ledger.reservations).toEqual({});
    expect(ledger.spentMicroUsd).toBe(0);
    expect(reserve(ledger, 100, 'again', T0).ok).toBe(true);
  });
  it('an unknown id leaves the ledger as it was', () => {
    const l = must(reserve(mk(100), 40, 'r', T0)).ledger;
    const { ledger, events } = release(l, 'ghost');
    expect(ledger).toEqual(l);
    expect(events).toEqual([]);
  });
});

describe('reserveBoth', () => {
  const acct = (cap: number, spent = 0): Ledger => mk(cap, spent, 'account');
  it('reserves on both ledgers', () => {
    const r = must(reserveBoth(mk(100), acct(500), 40, 'r', T0));
    expect(r.space.ledger.reservations['r']?.amountMicroUsd).toBe(40);
    expect(r.account.ledger.reservations['r']?.amountMicroUsd).toBe(40);
    expect(r.space.events).toEqual([]);
    expect(r.account.events).toEqual([]);
  });
  it('fails and changes neither when the Space ledger refuses', () => {
    const space = mk(100);
    const account = acct(500);
    const r = reserveBoth(space, account, 101, 'r', T0);
    expect(r.ok).toBe(false);
    expect(space.reservations).toEqual({});
    expect(account.reservations).toEqual({});
  });
  it('fails and changes neither when the account ledger refuses', () => {
    const space = mk(100);
    const account = acct(30);
    const r = reserveBoth(space, account, 40, 'r', T0);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(JSON.stringify(r.error)).toContain('over-cap');
    expect(space.reservations).toEqual({});
    expect(account.reservations).toEqual({});
  });
  it('fails when either ledger is paused or ended', () => {
    expect(reserveBoth(mk(100, 100), acct(500), 1, 'r', T0).ok).toBe(false);
    expect(reserveBoth(mk(100), acct(500, 500), 1, 'r', T0).ok).toBe(false);
    expect(reserveBoth(mk(100), acct(500), 1, 'r', new Date(END)).ok).toBe(false);
  });
  it('both ledgers count the other reservations made through it', () => {
    const first = must(reserveBoth(mk(100), acct(100), 60, 'a', T0));
    expect(reserveBoth(first.space.ledger, first.account.ledger, 41, 'b', T0).ok).toBe(false);
    expect(reserveBoth(first.space.ledger, first.account.ledger, 40, 'b', T0).ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Property-style test with a seeded PRNG
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('property: random operation sequences keep the ledger invariants', () => {
  const statusOf = (spent: number, cap: number): string =>
    spent >= cap ? 'paused' : spent * 5 >= cap * 4 ? 'warned' : 'ok';

  const checkInvariants = (l: Ledger, ctxMsg: string): void => {
    expect(Number.isInteger(l.spentMicroUsd) && l.spentMicroUsd >= 0, `spent ${ctxMsg}`).toBe(true);
    expect(Number.isInteger(l.capMicroUsd) && l.capMicroUsd >= 0, `cap ${ctxMsg}`).toBe(true);
    for (const r of Object.values(l.reservations))
      expect(Number.isInteger(r.amountMicroUsd) && r.amountMicroUsd >= 0, `reservation ${ctxMsg}`).toBe(true);
    expect(l.status, `status ${ctxMsg}`).toBe(statusOf(l.spentMicroUsd, l.capMicroUsd));
  };

  it('holds over thousands of random sequences', () => {
    const SEQUENCES = 3000;
    const STEPS = 30;
    let reserveSuccesses = 0;
    let overCap = 0;
    let paused = 0;
    for (let seed = 1; seed <= SEQUENCES; seed++) {
      const rnd = mulberry32(seed);
      const int = (n: number): number => Math.floor(rnd() * n);
      let now = new Date(T0);
      let ledger = mk(1 + int(200), int(3) === 0 ? int(100) : 0);
      let nextId = 0;
      checkInvariants(ledger, `seed ${seed} init`);
      for (let step = 0; step < STEPS; step++) {
        const prev = ledger;
        const where = `seed ${seed} step ${step}`;
        const op = int(7);
        let events: readonly string[] = [];
        if (op <= 1) {
          const est = int(80);
          const id = `r${nextId++}`;
          const r = reserve(ledger, est, id, now);
          if (r.ok) {
            reserveSuccesses++;
            ledger = r.value.ledger;
            events = r.value.events;
            expect(ledger.spentMicroUsd + reserved(ledger), `no over-cap authorisation ${where}`).toBeLessThanOrEqual(ledger.capMicroUsd);
          } else {
            if (r.error === 'over-cap') overCap++;
            if (r.error === 'paused') paused++;
            expect(ledger, `failed reserve changes nothing ${where}`).toBe(prev);
          }
        } else if (op === 2 || op === 3) {
          const ids = Object.keys(ledger.reservations);
          const known = ids.length > 0 && int(5) !== 0;
          const id = known ? (ids[int(ids.length)] as string) : 'ghost';
          const est = ledger.reservations[id]?.amountMicroUsd ?? 0;
          const actual = int(3) === 0 ? est + int(120) : int(est + 1);
          const r = settle(ledger, id, actual, now);
          if (r.ok) {
            expect(known, where).toBe(true);
            ledger = r.value.ledger;
            events = r.value.events;
            expect(ledger.spentMicroUsd).toBe(prev.spentMicroUsd + actual);
            expect(id in ledger.reservations).toBe(false);
          } else {
            expect(r.error).toBe('unknown-reservation');
          }
        } else if (op === 4) {
          const ids = Object.keys(ledger.reservations);
          const u = release(ledger, ids.length > 0 && int(4) !== 0 ? (ids[int(ids.length)] as string) : 'ghost');
          ledger = u.ledger;
          events = u.events;
          expect(ledger.spentMicroUsd).toBe(prev.spentMicroUsd);
        } else if (op === 5) {
          const u = setCap(ledger, int(300));
          ledger = u.ledger;
          events = u.events;
          expect(ledger.spentMicroUsd).toBe(prev.spentMicroUsd);
        } else {
          now = new Date(now.getTime() + int(20) * 86_400_000);
          if (now.getTime() >= Date.parse(ledger.cycleEnd)) {
            const u = rollover(ledger, now, new Date(now.getTime() + 30 * 86_400_000).toISOString());
            ledger = u.ledger;
            events = u.events;
            expect(ledger.spentMicroUsd).toBe(0);
            expect(ledger.reservations).toEqual({});
            expect(events[0]).toBe('rolled-over');
          }
        }
        checkInvariants(ledger, where);
        if (prev.status !== 'paused' && ledger.status === 'paused') expect(events, where).toContain('paused');
        if (prev.status === 'paused' && ledger.status !== 'paused') expect(events, where).toContain('resumed');
        if (prev.status === 'ok' && ledger.status === 'warned') expect(events, where).toContain('warned');
      }
    }
    // The generator must actually exercise the interesting paths.
    expect(reserveSuccesses).toBeGreaterThan(1000);
    expect(overCap).toBeGreaterThan(50);
    expect(paused).toBeGreaterThan(10);
  });
});
