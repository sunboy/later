import { readFileSync } from 'node:fs';
import { BUILTIN_TOOLS, type ToolDescriptor } from '@later/protocol';
import { describe, expect, it } from 'vitest';
import {
  PRICE_TABLE,
  buildRequest,
  canonicalJson,
  costMicroUsd,
  createLedger,
  authorize,
  decide,
  grant,
  hashArgs,
  isPriceTableVerified,
  markIngested,
  markToolUsed,
  memoryTaintFor,
  redeem,
  requestApproval,
  reserve,
  reserveBoth,
  settle,
  type PolicyContext,
  type RunContext,
} from '../src/index.js';

const tool = (name: string): ToolDescriptor => {
  const found = BUILTIN_TOOLS.find((t) => t.name === name);
  if (found === undefined) throw new Error(name);
  return found;
};
const now = new Date('2026-11-11T09:00:00Z');

const fresh: RunContext = { initiatedBy: 'agent', ingestedUntrusted: false, touchedPrivate: false };

const context = (over: Partial<PolicyContext> = {}): PolicyContext => ({
  spaceId: 'space_home',
  grantedConnectors: new Set(['mail', 'web', 'weather']),
  alwaysAllow: new Set(['mail.create_draft', 'mail.archive']),
  run: fresh,
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
    // The send arguments carry name and address only; `origin` is card metadata.
    const recipients = (to as { name: string; address: string }[]).map(({ name, address }) => ({
      name,
      address,
    }));
    expect(await hashArgs('mail.send', { to: recipients, subject, body })).toBe(
      read('approval').data.argsHash,
    );
  });
});

describe('policy gate and approvals', () => {
  it('requires approval for send, then authorises the exact approved args once', async () => {
    const request = await buildRequest(tool('mail.send'), { to: 'sam@example.com', body: 'Hi' });
    expect((await decide(request, context())).outcome).toBe('require-approval');

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
    const auth = await authorize(request, context({ approval: granted }));
    expect(auth.decision.reason).toBe('approved');
    expect(auth.consumed?.approval?.status).toBe('redeemed');

    const changed = await buildRequest(tool('mail.send'), { to: 'sam@example.com', body: 'Hi!' });
    expect(redeem(granted, changed, now)).toEqual({ ok: false, error: 'approval-args-mismatch' });
  });

  it('denies a tampered request', async () => {
    const request = await buildRequest(tool('mail.read'), { id: 'm1' });
    const tampered = { ...request, args: { id: 'm2' } };
    expect((await decide(tampered, context())).reason).toBe('request-tampered');
  });

  it('lets an inbox run draft but not fetch after reading external mail', async () => {
    const run = markIngested(markToolUsed(fresh, tool('mail.read')), { trust: 'external' });
    expect(memoryTaintFor(run)).toBe('external');
    const draft = await buildRequest(tool('mail.create_draft'), { to: 'sam@example.com' });
    const fetch = await buildRequest(tool('web.fetch'), { url: 'https://example.com/?q=secret' });
    expect(await decide(draft, context({ run }))).toMatchObject({
      outcome: 'allow',
      surface: true,
    });
    expect((await decide(draft, context())).surface).toBe(false);
    const weather = await buildRequest(tool('weather.get'), { place: 'Leeds' });
    expect((await decide(weather, context({ run }))).outcome).toBe('allow');
    expect(await decide(fetch, context({ run }))).toMatchObject({ reason: 'exfiltration-risk' });
    expect((await decide(fetch, context())).outcome).toBe('allow');

    const approval = grant(
      requestApproval(
        {
          spaceId: 'space_home',
          tool: 'web.fetch',
          argsHash: fetch.argsHash,
          tier: 'read',
          risk: 'exfiltration',
        },
        now,
        'appr_2',
      ),
      now,
    );
    expect((await authorize(fetch, context({ run, approval }))).decision.reason).toBe('approved');
    expect(() =>
      requestApproval(
        { spaceId: 's', tool: 'web.fetch', argsHash: fetch.argsHash, tier: 'read' },
        now,
        'x',
      ),
    ).toThrow();
  });

  it('accepts a fresh device confirmation once', async () => {
    const request = await buildRequest(tool('mail.send'), { to: 'sam@example.com', body: 'Hi' });
    const userContext = context({
      run: { ...fresh, initiatedBy: 'user' },
      knownDevices: new Set(['phone']),
      userConfirmation: {
        argsHash: request.argsHash,
        deviceId: 'phone',
        nonce: 'n1',
        confirmedAt: '2026-11-11T08:59:30Z',
      },
    });
    const auth = await authorize(request, userContext);
    expect(auth).toMatchObject({
      decision: { reason: 'user-confirmed' },
      consumed: { nonce: 'n1' },
    });
    const replay = await decide(request, { ...userContext, usedNonces: new Set(['n1']) });
    expect(replay.outcome).toBe('require-approval');
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
    const settled = settle(reserved.value.ledger, 'r1', 1200, now);
    if (!settled.ok) throw new Error(settled.error);
    expect(settled.value.ledger.status).toBe('paused');
    expect(settled.value.events).toEqual(['paused']);

    const account = createLedger({ ...ledger, scope: 'account', id: 'acct', capMicroUsd: 100 });
    const both = reserveBoth(ledger, account, 500, 'r2', now);
    expect(both).toEqual({ ok: false, error: { ledger: 'account', error: 'over-cap' } });
  });
});
