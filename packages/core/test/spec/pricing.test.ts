import { describe, expect, it } from 'vitest';
import { PRICE_TABLE, costMicroUsd, isPriceTableVerified, type PriceTable, type Usage } from '../../src/index.js';

// A synthetic table with round numbers: micro-USD per million tokens, so a price of
// 1_000_000 means exactly 1 micro-USD per token.
const T: PriceTable = {
  version: 'test',
  effectiveDate: '2026-01-01',
  currency: 'USD',
  models: {
    haiku: { inputPerMTok: 1_000_000, outputPerMTok: 5_000_000, cacheWritePerMTok: 1_250_000, cacheReadPerMTok: 100_000 },
    sonnet: { inputPerMTok: 3_000_000, outputPerMTok: 15_000_000, cacheWritePerMTok: 3_750_000, cacheReadPerMTok: 300_000 },
    opus: { inputPerMTok: 10_000_000, outputPerMTok: 50_000_000, cacheWritePerMTok: 12_500_000, cacheReadPerMTok: 1_000_000 },
  },
  batchDiscount: { num: 1, den: 2 },
};
const zero: Usage = { inputTokens: 0, outputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0 };
const u = (over: Partial<Usage>): Usage => ({ ...zero, ...over });

describe('costMicroUsd', () => {
  it('is zero for no usage', () => {
    expect(costMicroUsd(zero, 'haiku', T)).toBe(0);
  });
  it('prices each token class', () => {
    expect(costMicroUsd(u({ inputTokens: 1000 }), 'haiku', T)).toBe(1000);
    expect(costMicroUsd(u({ outputTokens: 1000 }), 'haiku', T)).toBe(5000);
    expect(costMicroUsd(u({ cacheWriteTokens: 1000 }), 'haiku', T)).toBe(1250);
    expect(costMicroUsd(u({ cacheReadTokens: 1000 }), 'haiku', T)).toBe(100);
  });
  it('sums the classes', () => {
    expect(costMicroUsd({ inputTokens: 1000, outputTokens: 1000, cacheWriteTokens: 1000, cacheReadTokens: 1000 }, 'haiku', T)).toBe(
      1000 + 5000 + 1250 + 100,
    );
  });
  it('uses each model tier price', () => {
    const usage = u({ inputTokens: 2000, outputTokens: 1000 });
    expect(costMicroUsd(usage, 'haiku', T)).toBe(2000 + 5000);
    expect(costMicroUsd(usage, 'sonnet', T)).toBe(6000 + 15000);
    expect(costMicroUsd(usage, 'opus', T)).toBe(20000 + 50000);
  });
  it('is an integer and exact for a million tokens', () => {
    expect(costMicroUsd(u({ inputTokens: 1_000_000 }), 'haiku', T)).toBe(1_000_000);
  });
  it('rounds up to the next micro-USD', () => {
    // 1 cache-read token = 0.1 micro-USD
    expect(costMicroUsd(u({ cacheReadTokens: 1 }), 'haiku', T)).toBe(1);
    expect(costMicroUsd(u({ cacheReadTokens: 9 }), 'haiku', T)).toBe(1);
    expect(costMicroUsd(u({ cacheReadTokens: 10 }), 'haiku', T)).toBe(1);
    expect(costMicroUsd(u({ cacheReadTokens: 11 }), 'haiku', T)).toBe(2);
  });
  it('rounds the total up, not each class (0.1 + 0.1 micro-USD is 1, not 2)', () => {
    const t: PriceTable = { ...T, models: { ...T.models, haiku: { ...T.models.haiku, inputPerMTok: 100_000, outputPerMTok: 100_000 } } };
    expect(costMicroUsd(u({ inputTokens: 1, outputTokens: 1 }), 'haiku', t)).toBe(1);
  });
  it('never returns less than the exact cost', () => {
    for (let n = 1; n < 200; n += 7) {
      const exact = (n * 1_250_000) / 1_000_000;
      const c = costMicroUsd(u({ cacheWriteTokens: n }), 'haiku', T);
      expect(Number.isInteger(c)).toBe(true);
      expect(c).toBeGreaterThanOrEqual(exact);
      expect(c).toBeLessThan(exact + 1);
    }
  });
  it('applies the batch discount to every class', () => {
    const usage: Usage = { inputTokens: 1000, outputTokens: 1000, cacheWriteTokens: 1000, cacheReadTokens: 1000 };
    expect(costMicroUsd(usage, 'haiku', T, { batch: true })).toBe(3675);
    expect(costMicroUsd(u({ inputTokens: 1000 }), 'haiku', T, { batch: true })).toBe(500);
    expect(costMicroUsd(u({ outputTokens: 1000 }), 'haiku', T, { batch: true })).toBe(2500);
  });
  it('batch false or omitted gives the standard price', () => {
    const usage = u({ inputTokens: 1000 });
    expect(costMicroUsd(usage, 'haiku', T, { batch: false })).toBe(1000);
    expect(costMicroUsd(usage, 'haiku', T, {})).toBe(1000);
  });
  it('batch discount is a rational and the result is rounded up after discounting', () => {
    const t: PriceTable = { ...T, batchDiscount: { num: 1, den: 3 } };
    // 3 input tokens = 3 micro-USD; two thirds = 2
    expect(costMicroUsd(u({ inputTokens: 3 }), 'haiku', t, { batch: true })).toBe(2);
    // 1 token: 1 * 2/3 = 0.67 -> 1
    expect(costMicroUsd(u({ inputTokens: 1 }), 'haiku', t, { batch: true })).toBe(1);
  });
  it.each([
    ['negative input', { inputTokens: -1 }],
    ['negative output', { outputTokens: -1 }],
    ['negative cache write', { cacheWriteTokens: -1 }],
    ['negative cache read', { cacheReadTokens: -1 }],
    ['fractional input', { inputTokens: 1.5 }],
    ['fractional output', { outputTokens: 0.1 }],
    ['fractional cache write', { cacheWriteTokens: 2.5 }],
    ['fractional cache read', { cacheReadTokens: 0.5 }],
    ['NaN', { inputTokens: Number.NaN }],
    ['Infinity', { outputTokens: Number.POSITIVE_INFINITY }],
  ])('rejects %s', (_n, over) => {
    expect(() => costMicroUsd(u(over), 'haiku', T)).toThrow();
  });
  it('rejects an unknown model tier', () => {
    expect(() => costMicroUsd(zero, 'gpt' as never, T)).toThrow();
  });
  it('does not lose precision on large counts', () => {
    expect(costMicroUsd(u({ inputTokens: 123_456_789 }), 'haiku', T)).toBe(123_456_789);
    expect(costMicroUsd(u({ outputTokens: 987_654_321 }), 'opus', T)).toBe(987_654_321 * 50);
  });
  it('is monotonic in every token class', () => {
    for (const k of ['inputTokens', 'outputTokens', 'cacheWriteTokens', 'cacheReadTokens'] as const) {
      let prev = -1;
      for (const n of [0, 1, 2, 3, 10, 1000, 99_999]) {
        const c = costMicroUsd(u({ [k]: n }), 'sonnet', T);
        expect(c).toBeGreaterThanOrEqual(prev);
        prev = c;
      }
    }
  });
});

describe('shipped PRICE_TABLE', () => {
  it('has all three tiers with positive integer prices', () => {
    for (const tier of ['haiku', 'sonnet', 'opus'] as const) {
      const m = PRICE_TABLE.models[tier];
      for (const v of [m.inputPerMTok, m.outputPerMTok, m.cacheWritePerMTok, m.cacheReadPerMTok]) {
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThan(0);
      }
      expect(m.outputPerMTok).toBeGreaterThan(m.inputPerMTok);
      expect(m.cacheReadPerMTok).toBeLessThan(m.inputPerMTok);
    }
  });
  it('is USD, versioned, and records a source and date', () => {
    expect(PRICE_TABLE.currency).toBe('USD');
    expect(PRICE_TABLE.version.length).toBeGreaterThan(0);
    expect(PRICE_TABLE.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(PRICE_TABLE.source?.url).toMatch(/^https:\/\//);
    expect(PRICE_TABLE.source?.retrievedOn).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(isPriceTableVerified(PRICE_TABLE)).toBe(true);
  });
  it('batch discount is a proper rational', () => {
    const { num, den } = PRICE_TABLE.batchDiscount;
    expect(Number.isInteger(num) && Number.isInteger(den)).toBe(true);
    expect(den).toBeGreaterThan(0);
    expect(num).toBeGreaterThanOrEqual(0);
    expect(num).toBeLessThanOrEqual(den);
  });
  it('prices a small call to an integer', () => {
    const c = costMicroUsd({ inputTokens: 1234, outputTokens: 567, cacheWriteTokens: 89, cacheReadTokens: 10 }, 'sonnet', PRICE_TABLE);
    expect(Number.isInteger(c)).toBe(true);
    expect(c).toBeGreaterThan(0);
    expect(costMicroUsd({ inputTokens: 1234, outputTokens: 567, cacheWriteTokens: 89, cacheReadTokens: 10 }, 'sonnet', PRICE_TABLE, { batch: true })).toBeLessThanOrEqual(c);
  });
});
