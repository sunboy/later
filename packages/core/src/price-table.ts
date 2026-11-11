import type { PriceTable } from './pricing.js';

/**
 * Anthropic Claude API prices, first-party, global routing, standard speed.
 *
 * Source: https://platform.claude.com/docs/en/about-claude/pricing
 * (the Markdown rendering at .../pricing.md), retrieved 2026-11-11.
 * Tier-to-model mapping checked against
 * https://platform.claude.com/docs/en/models/overview ("Latest models"), retrieved 2026-11-11.
 *
 * Figures in USD per million tokens, as published, and here in micro-USD (x 1,000,000):
 *
 * | Tier   | Model             | Input | 5m write | 1h write | Cache read | Output |
 * |--------|-------------------|-------|----------|----------|------------|--------|
 * | haiku  | Claude Haiku 5.5, prompt <= 100k | 0.10 | 0.125 | 0.20 | 0.01 | 0.50 |
 * | haiku  | Claude Haiku 5.5, prompt > 100k  | 0.50 | 0.625 | 1.00 | 0.05 | 2.50 |
 * | sonnet | Claude Sonnet 5.5 | 2     | 2.50     | 4        | 0.10       | 10     |
 * | opus   | Claude Opus 5.5   | 4     | 5        | 8        | 0.20       | 20     |
 *
 * Batch API: 50% off input and output; the pricing page states the caching
 * multipliers stack with the batch discount, so it is applied to every category.
 *
 * Not modelled (see packages/core/README.md): US-only inference (`inference_geo`,
 * x1.1), fast mode, data residency, tool-use surcharges such as web search, and
 * partner cloud pricing (Bedrock, Vertex).
 */
export const PRICE_TABLE: PriceTable = Object.freeze({
  version: '2026-11-11',
  effectiveDate: '2026-11-11',
  currency: 'USD',
  models: Object.freeze({
    haiku: Object.freeze({
      inputPerMTok: 100_000,
      outputPerMTok: 500_000,
      cacheWritePerMTok: 125_000,
      cacheWrite1hPerMTok: 200_000,
      cacheReadPerMTok: 10_000,
      longContext: Object.freeze({
        thresholdTokens: 100_000,
        prices: Object.freeze({
          inputPerMTok: 500_000,
          outputPerMTok: 2_500_000,
          cacheWritePerMTok: 625_000,
          cacheWrite1hPerMTok: 1_000_000,
          cacheReadPerMTok: 50_000,
        }),
      }),
    }),
    sonnet: Object.freeze({
      inputPerMTok: 2_000_000,
      outputPerMTok: 10_000_000,
      cacheWritePerMTok: 2_500_000,
      cacheWrite1hPerMTok: 4_000_000,
      cacheReadPerMTok: 100_000,
    }),
    opus: Object.freeze({
      inputPerMTok: 4_000_000,
      outputPerMTok: 20_000_000,
      cacheWritePerMTok: 5_000_000,
      cacheWrite1hPerMTok: 8_000_000,
      cacheReadPerMTok: 200_000,
    }),
  }),
  batchDiscount: Object.freeze({ num: 1, den: 2 }),
  source: Object.freeze({
    url: 'https://platform.claude.com/docs/en/about-claude/pricing',
    retrievedOn: '2026-11-11',
    isVerified: true,
    modelIds: Object.freeze({
      haiku: 'claude-haiku-5-5',
      sonnet: 'claude-sonnet-5-5',
      opus: 'claude-opus-5-5',
    }),
    notes: Object.freeze([
      'Haiku 5.5 is priced by prompt length: over 100,000 prompt tokens (input + cache writes + cache reads) the whole request pays the higher prices.',
      'Sonnet 5.5 and Opus 5.5 have one price across the full 1M context window.',
    ]),
  }),
});
