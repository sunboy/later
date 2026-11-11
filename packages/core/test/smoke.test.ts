import { readFileSync } from 'node:fs';
import { BUILTIN_TOOLS, type ToolDescriptor } from '@later/protocol';
import { describe, expect, it } from 'vitest';
import {
  PRICE_TABLE,
  buildRequest,
  canonicalJson,
  costMicroUsd,
  createLedger,
  decide,
  grant,
  hashArgs,
  isPriceTableVerified,
  markIngested,
  redeem,
  requestApproval,
  reserve,
  reserveBoth,
  settle,
  type PolicyContext,
} from '../src/index.js';

const tool = (name: string): ToolDescriptor => {
  const found = BUILTIN_TOOLS.find((t) => t.name === name);
  if (found === undefined) throw new Error(name);
  return found;
};
const now = new Date('2026-11-11T09:00:00Z');

const context = (over: Partial<PolicyContext> = {}): PolicyContext => ({
  spaceId: 'space_home',
  grantedConnectors: new Set(['mail']),
  alwaysAllow: new Set(),
  run: { initiatedBy: 'agent', ingestedUntrusted: false },
  budgetStatus: 'ok',
  now,
  ...over,
});

describe('canonical hashing', () => {
  it('sorts keys and hashes', async () => {
    expect(canonicalJson({ b: 1, a: [true, null, 'x'] })).toBe('{"a":[true,null,"x"],"b":1}');
    expect(() => canonicalJson({ a: undefined })).toThrow();
    expect(await hashArgs('mail.send', { a: 1 })).toMatch(/^[0-9a-f]{64}$/);
  });

  it('matches the approval fixture', async () => {
    const read = (name: string) =>
      JSON.parse(
        readFileSync(
          new URL(`../../protocol/fixtures/cards/${name}.json`, import.meta.url),
          'utf8',
        ),
      ) as { data: Record<string, unknown> };
    const { to, subject, body } = read('draft').data;
    expect(await hashArgs('mail.send', { to, subject, body })).toBe(read('approval').data.argsHash);
  });
});

describe('policy gate and approvals', () => {
  it('requires approval for send, then allows the exact approved args once', async () => {
    const request = await buildRequest(tool('mail.send'), { to: 'sam@example.com', body: 'Hi' });
    expect(decide(request, context()).outcome).toBe('require-approval');

    const pending = requestApproval(
      {
        spaceId: 'space_home',
        tool: 'mail.send',
        argsHash: request.argsHash,
        tier: 'irreversible',
      },
      now,
      'appr_1',
    );
    const granted = grant(pending, now);
    expect(decide(request, context({ approval: granted }))).toMatchObject({ reason: 'approved' });

    const redeemed = redeem(granted, request, now);
    expect(redeemed.ok).toBe(true);
    if (redeemed.ok) expect(redeem(redeemed.value, request, now).ok).toBe(false);

    const changed = await buildRequest(tool('mail.send'), { to: 'sam@example.com', body: 'Hi!' });
    expect(redeem(granted, changed, now)).toEqual({ ok: false, error: 'approval-args-mismatch' });
  });

  it('untrusted content defeats the allowlist', async () => {
    const request = await buildRequest(tool('mail.archive'), { id: 'm1' });
    const run = markIngested({ initiatedBy: 'agent', ingestedUntrusted: false }, { kind: 'email' });
    const allow = new Set(['mail.archive']);
    expect(decide(request, context({ alwaysAllow: allow })).outcome).toBe('allow');
    expect(decide(request, context({ alwaysAllow: allow, run })).outcome).toBe('require-approval');
  });
});

describe('pricing', () => {
  it('is verified and rounds up', () => {
    expect(isPriceTableVerified(PRICE_TABLE)).toBe(true);
    const usage = { inputTokens: 1, outputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0 };
    expect(costMicroUsd(usage, 'haiku', PRICE_TABLE)).toBe(1);
    const million = { ...usage, inputTokens: 1_000_000 };
    expect(costMicroUsd(million, 'opus', PRICE_TABLE)).toBe(4_000_000);
    expect(costMicroUsd(million, 'opus', PRICE_TABLE, { batch: true })).toBe(2_000_000);
    expect(() => costMicroUsd({ ...usage, inputTokens: -1 }, 'opus', PRICE_TABLE)).toThrow();
  });
});

describe('ledger', () => {
  it('reserves, settles, warns and pauses', () => {
    const ledger = createLedger({
      scope: 'space',
      id: 'space_home',
      cycleStart: '2026-11-01T00:00:00Z',
      cycleEnd: '2026-12-01T00:00:00Z',
      capMicroUsd: 1000,
    });
    expect(reserve(ledger, 1001, 'r0', now)).toEqual({ ok: false, error: 'over-cap' });
    const reserved = reserve(ledger, 800, 'r1', now);
    if (!reserved.ok) throw new Error(reserved.error);
    const settled = settle(reserved.value, 'r1', 1200, now);
    if (!settled.ok) throw new Error(settled.error);
    expect(settled.value.status).toBe('paused');
    expect(settled.value.events).toEqual(['paused']);

    const account = createLedger({ ...ledger, scope: 'account', id: 'acct', capMicroUsd: 100 });
    const both = reserveBoth(ledger, account, 500, 'r2', now);
    expect(both).toEqual({ ok: false, error: { ledger: 'account', error: 'over-cap' } });
  });
});
