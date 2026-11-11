import type { ModelTier } from '@later/protocol';

/** Prices for one model, in integer micro-USD per million tokens. */
export interface TokenPrices {
  readonly inputPerMTok: number;
  readonly outputPerMTok: number;
  /** Cache write with the default 5-minute lifetime. */
  readonly cacheWritePerMTok: number;
  readonly cacheReadPerMTok: number;
  /** Cache write with the 1-hour lifetime. Required only if usage reports 1-hour writes. */
  readonly cacheWrite1hPerMTok?: number;
}

export interface ModelPrices extends TokenPrices {
  /**
   * Higher prices for requests whose prompt (input + cache writes + cache reads)
   * is strictly greater than `thresholdTokens`. The whole request is billed at
   * these prices.
   */
  readonly longContext?: { readonly thresholdTokens: number; readonly prices: TokenPrices };
}

/** A non-negative rational `num / den`, with `0 <= num <= den`. */
export interface Rational {
  readonly num: number;
  readonly den: number;
}

export interface PriceSource {
  readonly url: string;
  /** ISO date the source was read. */
  readonly retrievedOn: string;
  /** False for placeholder tables whose figures were not checked against the source. */
  readonly isVerified: boolean;
  /** The Claude API model each tier is priced as. */
  readonly modelIds: Readonly<Record<ModelTier, string>>;
  readonly notes?: readonly string[];
}

export interface PriceTable {
  readonly version: string;
  /** ISO date from which this table applies. */
  readonly effectiveDate: string;
  readonly currency: 'USD';
  readonly models: Readonly<Record<ModelTier, ModelPrices>>;
  /** Fraction taken off every price for Batch API requests: batch price = price x (1 - num/den). */
  readonly batchDiscount: Rational;
  readonly source?: PriceSource;
}

export interface Usage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  /** 5-minute cache writes. */
  readonly cacheWriteTokens: number;
  readonly cacheReadTokens: number;
  /** 1-hour cache writes. Optional; defaults to 0. */
  readonly cacheWrite1hTokens?: number;
}

/** True when the table's figures were checked against its recorded source. */
export function isPriceTableVerified(table: PriceTable): boolean {
  return table.source?.isVerified === true;
}

const checkTokens = (name: string, n: number): bigint => {
  if (!Number.isSafeInteger(n) || n < 0) {
    throw new RangeError(`costMicroUsd: ${name} must be a non-negative integer, got ${String(n)}`);
  }
  return BigInt(n);
};

const checkPrice = (name: string, n: number): bigint => {
  if (!Number.isSafeInteger(n) || n < 0) {
    throw new RangeError(`costMicroUsd: price ${name} must be a non-negative integer`);
  }
  return BigInt(n);
};

/**
 * Cost of one request in integer micro-USD, rounded up to the next micro-USD.
 * Exact integer arithmetic throughout. Throws `RangeError` for negative or
 * non-integer token counts, a malformed table, or a result beyond
 * `Number.MAX_SAFE_INTEGER`.
 */
export function costMicroUsd(
  usage: Usage,
  model: ModelTier,
  table: PriceTable,
  opts?: { batch?: boolean },
): number {
  const input = checkTokens('inputTokens', usage.inputTokens);
  const output = checkTokens('outputTokens', usage.outputTokens);
  const write = checkTokens('cacheWriteTokens', usage.cacheWriteTokens);
  const read = checkTokens('cacheReadTokens', usage.cacheReadTokens);
  const write1h = checkTokens('cacheWrite1hTokens', usage.cacheWrite1hTokens ?? 0);

  const entry = Object.hasOwn(table.models, model) ? table.models[model] : undefined;
  if (entry === undefined) throw new RangeError(`costMicroUsd: no prices for model "${model}"`);

  const prompt = input + write + write1h + read;
  const long = entry.longContext;
  const prices: TokenPrices =
    long !== undefined && prompt > BigInt(long.thresholdTokens) ? long.prices : entry;

  let numerator =
    input * checkPrice('inputPerMTok', prices.inputPerMTok) +
    output * checkPrice('outputPerMTok', prices.outputPerMTok) +
    write * checkPrice('cacheWritePerMTok', prices.cacheWritePerMTok) +
    read * checkPrice('cacheReadPerMTok', prices.cacheReadPerMTok);
  if (write1h > 0n) {
    if (prices.cacheWrite1hPerMTok === undefined) {
      throw new RangeError('costMicroUsd: table has no 1-hour cache write price');
    }
    numerator += write1h * checkPrice('cacheWrite1hPerMTok', prices.cacheWrite1hPerMTok);
  }
  let denominator = 1_000_000n;

  if (opts?.batch === true) {
    const { num, den } = table.batchDiscount;
    if (
      !Number.isSafeInteger(num) ||
      !Number.isSafeInteger(den) ||
      den <= 0 ||
      num < 0 ||
      num > den
    ) {
      throw new RangeError('costMicroUsd: batchDiscount must satisfy 0 <= num <= den, den > 0');
    }
    numerator *= BigInt(den - num);
    denominator *= BigInt(den);
  }

  const cost = (numerator + denominator - 1n) / denominator;
  if (cost > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('costMicroUsd: cost too large');
  return Number(cost);
}
