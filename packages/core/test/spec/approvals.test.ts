import { describe, expect, it } from 'vitest';
import {
  DEFAULT_APPROVAL_TTL_MS,
  deny,
  grant,
  redeem,
  requestApproval,
  type Approval,
} from '../../src/index.js';
import { NOW, SPACE, addMs, grantedApproval, iso, req, tool } from './helpers.js';

const HOUR = 3_600_000;

describe('requestApproval', () => {
  it('creates a pending approval with a 24 hour default expiry', async () => {
    const r = await req('mail.send');
    const a = requestApproval({ spaceId: SPACE, tool: 'mail.send', argsHash: r.argsHash, tier: 'irreversible' }, NOW, 'a1');
    expect(a).toMatchObject({
      id: 'a1',
      spaceId: SPACE,
      tool: 'mail.send',
      argsHash: r.argsHash,
      tier: 'irreversible',
      risk: 'irreversible',
      status: 'pending',
      requestedAt: iso(NOW),
      expiresAt: iso(addMs(NOW, 24 * HOUR)),
    });
    expect(DEFAULT_APPROVAL_TTL_MS).toBe(24 * HOUR);
  });
  it('expiry is configurable', () => {
    const a = requestApproval({ spaceId: SPACE, tool: 'mail.send', argsHash: 'h'.repeat(64), tier: 'irreversible', ttlMs: HOUR }, NOW, 'a1');
    expect(a.expiresAt).toBe(iso(addMs(NOW, HOUR)));
  });
  it('rejects a non-positive ttl', () => {
    for (const ttlMs of [0, -1])
      expect(() => requestApproval({ spaceId: SPACE, tool: 'mail.send', argsHash: 'h', tier: 'irreversible', ttlMs }, NOW, 'a')).toThrow();
  });
  it('a reversible-write tool defaults to reversible-write risk', () => {
    const a = requestApproval({ spaceId: SPACE, tool: 'mail.label', argsHash: 'h', tier: 'reversible-write' }, NOW, 'a');
    expect(a.risk).toBe('reversible-write');
  });
  it('accepts a read tool only with exfiltration risk (A9)', () => {
    const base = { spaceId: SPACE, tool: 'web.fetch', argsHash: 'h', tier: 'read' as const };
    expect(() => requestApproval(base, NOW, 'a')).toThrow();
    expect(() => requestApproval({ ...base, risk: 'irreversible' }, NOW, 'a')).toThrow();
    expect(() => requestApproval({ ...base, risk: 'reversible-write' }, NOW, 'a')).toThrow();
    expect(requestApproval({ ...base, risk: 'exfiltration' }, NOW, 'a')).toMatchObject({ tier: 'read', risk: 'exfiltration' });
  });
  it('an irreversible tool cannot carry reversible-write risk', () => {
    expect(() =>
      requestApproval({ spaceId: SPACE, tool: 'mail.send', argsHash: 'h', tier: 'irreversible', risk: 'reversible-write' }, NOW, 'a'),
    ).toThrow();
  });
});

describe('grant, deny and status', () => {
  const pending = (): Approval =>
    requestApproval({ spaceId: SPACE, tool: 'mail.send', argsHash: 'h'.repeat(64), tier: 'irreversible' }, NOW, 'a');
  it('grant moves pending to granted without mutating the input', () => {
    const p = pending();
    expect(grant(p, NOW).status).toBe('granted');
    expect(p.status).toBe('pending');
  });
  it('deny moves pending to denied', () => {
    expect(deny(pending(), NOW).status).toBe('denied');
  });
  it('deny revokes a granted approval', () => {
    expect(deny(grant(pending(), NOW), NOW).status).toBe('denied');
  });
  it('a denied approval cannot be granted again', () => {
    expect(grant(deny(pending(), NOW), NOW).status).toBe('denied');
  });
  it('a redeemed approval cannot be denied back to life', async () => {
    const r = await req('mail.send');
    const a = grantedApproval(r);
    const red = redeem(a, r, NOW);
    expect(red.ok).toBe(true);
    if (red.ok) expect(deny(red.value, NOW).status).toBe('redeemed');
  });
});

describe('redeem', () => {
  it('succeeds for a granted, unexpired approval with matching tool and args, and marks it redeemed', async () => {
    const r = await req('mail.send', { to: 'a@example.com' });
    const a = grantedApproval(r);
    const out = redeem(a, r, NOW);
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.value.status).toBe('redeemed');
    expect(a.status).toBe('granted');
  });
  it('is single use', async () => {
    const r = await req('mail.send');
    const first = redeem(grantedApproval(r), r, NOW);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = redeem(first.value, r, NOW);
    expect(second).toEqual({ ok: false, error: 'approval-already-redeemed' });
  });
  it('fails when pending or denied', async () => {
    const r = await req('mail.send');
    const p = requestApproval({ spaceId: SPACE, tool: 'mail.send', argsHash: r.argsHash, tier: 'irreversible' }, NOW, 'a');
    expect(redeem(p, r, NOW)).toEqual({ ok: false, error: 'approval-not-granted' });
    expect(redeem(deny(p, NOW), r, NOW)).toEqual({ ok: false, error: 'approval-not-granted' });
  });
  it('a denial after grant revokes it', async () => {
    const r = await req('mail.send');
    const a = deny(grantedApproval(r), NOW);
    expect(redeem(a, r, NOW).ok).toBe(false);
  });
  it('fails when any argument changed after approval', async () => {
    const approved = await req('mail.send', { to: 'a@example.com', body: 'hi' });
    const a = grantedApproval(approved);
    const changed = await req('mail.send', { to: 'evil@example.net', body: 'hi' });
    expect(redeem(a, changed, NOW)).toEqual({ ok: false, error: 'approval-args-mismatch' });
  });
  it('key order does not matter, values do', async () => {
    const a = grantedApproval(await req('mail.send', { to: 'a', body: 'b' }));
    expect(redeem(a, await req('mail.send', { body: 'b', to: 'a' }), NOW).ok).toBe(true);
  });
  it('fails for a different tool even with the same args', async () => {
    const send = await req('mail.send', { id: 1 });
    const a = grantedApproval(send);
    const del = await req('mail.delete', { id: 1 });
    const out = redeem(a, del, NOW);
    expect(out.ok).toBe(false);
  });
  it('expires exactly at expiresAt (valid one ms before)', async () => {
    const r = await req('mail.send');
    const a = grantedApproval(r, { ttlMs: HOUR });
    expect(redeem(a, r, addMs(NOW, HOUR - 1)).ok).toBe(true);
    expect(redeem(a, r, addMs(NOW, HOUR))).toEqual({ ok: false, error: 'approval-expired' });
    expect(redeem(a, r, addMs(NOW, HOUR + 1))).toEqual({ ok: false, error: 'approval-expired' });
  });
  it('default approvals are valid at 23h59m and expired at 24h', async () => {
    const r = await req('mail.send');
    const a = grantedApproval(r);
    expect(redeem(a, r, addMs(NOW, 24 * HOUR - 60_000)).ok).toBe(true);
    expect(redeem(a, r, addMs(NOW, 24 * HOUR)).ok).toBe(false);
  });
  it('a risky read is redeemable with exfiltration risk', async () => {
    const r = await req('web.fetch', { url: 'https://example.com' });
    const a = grantedApproval(r);
    expect(a.risk).toBe('exfiltration');
    expect(redeem(a, r, NOW).ok).toBe(true);
  });
  it('tier and risk of the approval match the tool', async () => {
    const r = await req('mail.send');
    const a = grantedApproval(r);
    expect(a.tier).toBe(tool('mail.send').tier);
    expect(a.risk).toBe('irreversible');
  });
});
