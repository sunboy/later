import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIRMATION_MAX_AGE_MS, authorize, decide, type PolicyContext } from '../../src/index.js';
import { NOW, addMs, ctx, iso, req, run } from './helpers.js';

describe('device confirmation (A3)', () => {
  const base = async (
    conf: Record<string, unknown> = {},
    over: Partial<PolicyContext> = {},
  ): Promise<{ r: Awaited<ReturnType<typeof req>>; c: PolicyContext }> => {
    const r = await req('mail.send', { to: 'a@example.com' });
    return {
      r,
      c: ctx({
        run: run({ initiatedBy: 'user' }),
        knownDevices: new Set(['dev1']),
        usedNonces: new Set(['old']),
        userConfirmation: { argsHash: r.argsHash, deviceId: 'dev1', nonce: 'n1', confirmedAt: iso(addMs(NOW, -1000)), ...conf },
        ...over,
      }),
    };
  };
  const reasonOf = async (conf: Record<string, unknown> = {}, over: Partial<PolicyContext> = {}): Promise<string> => {
    const { r, c } = await base(conf, over);
    return (await decide(r, c)).reason;
  };

  it('the default maximum age is 120000 ms', () => {
    expect(DEFAULT_CONFIRMATION_MAX_AGE_MS).toBe(120_000);
  });
  it('passes with a known device, fresh nonce, recent time and matching hash', async () => {
    expect(await reasonOf()).toBe('user-confirmed');
  });
  it('fails for an unknown device', async () => {
    expect(await reasonOf({ deviceId: 'stranger' })).toBe('irreversible');
  });
  it('fails when no devices are known, or knownDevices is missing', async () => {
    expect(await reasonOf({}, { knownDevices: new Set() })).toBe('irreversible');
    const { r, c } = await base();
    const { knownDevices: _k, ...rest } = c;
    expect((await decide(r, rest)).reason).toBe('irreversible');
  });
  it('fails for a reused nonce', async () => {
    expect(await reasonOf({ nonce: 'old' })).toBe('irreversible');
  });
  it('treats a missing usedNonces as none used', async () => {
    const { r, c } = await base();
    const { usedNonces: _u, ...rest } = c;
    expect((await decide(r, rest)).reason).toBe('user-confirmed');
  });
  it('fails when the confirmation is older than the max age; exactly the max age passes', async () => {
    expect(await reasonOf({ confirmedAt: iso(addMs(NOW, -120_001)) })).toBe('irreversible');
    expect(await reasonOf({ confirmedAt: iso(addMs(NOW, -120_000)) })).toBe('user-confirmed');
    expect(await reasonOf({ confirmedAt: iso(addMs(NOW, -119_999)) })).toBe('user-confirmed');
  });
  it('fails when the confirmation is dated in the future; now itself passes', async () => {
    expect(await reasonOf({ confirmedAt: iso(addMs(NOW, 1)) })).toBe('irreversible');
    expect(await reasonOf({ confirmedAt: iso(addMs(NOW, 60_000)) })).toBe('irreversible');
    expect(await reasonOf({ confirmedAt: iso(NOW) })).toBe('user-confirmed');
  });
  it('fails for an unparseable date', async () => {
    expect(await reasonOf({ confirmedAt: 'yesterday-ish' })).toBe('irreversible');
  });
  it('honours confirmationMaxAgeMs', async () => {
    expect(await reasonOf({ confirmedAt: iso(addMs(NOW, -5000)) }, { confirmationMaxAgeMs: 4000 })).toBe('irreversible');
    expect(await reasonOf({ confirmedAt: iso(addMs(NOW, -5000)) }, { confirmationMaxAgeMs: 5000 })).toBe('user-confirmed');
    expect(await reasonOf({ confirmedAt: iso(addMs(NOW, -300_000)) }, { confirmationMaxAgeMs: 600_000 })).toBe('user-confirmed');
  });
  it('fails for a non-user run', async () => {
    for (const initiatedBy of ['agent', 'routine'] as const)
      expect(await reasonOf({}, { run: run({ initiatedBy }) })).toBe('irreversible');
  });
  it('fails when the hash does not match the request', async () => {
    expect(await reasonOf({ argsHash: 'a'.repeat(64) })).toBe('irreversible');
  });
  it('a confirmation for one call cannot be used for another with different arguments', async () => {
    const { c } = await base();
    const other = await req('mail.send', { to: 'evil@example.net' });
    expect((await decide(other, c)).reason).toBe('irreversible');
  });
  it('failing confirmations fall through to later rules (reversible-write: not always allowed)', async () => {
    const r = await req('mail.label');
    const d = await decide(r, ctx({ run: run({ initiatedBy: 'user' }), userConfirmation: { argsHash: r.argsHash, deviceId: 'x', nonce: 'n', confirmedAt: iso(NOW) } }));
    expect(d.reason).toBe('not-always-allowed');
  });
  it('authorize returns the nonce used', async () => {
    const { r, c } = await base({ nonce: 'fresh' });
    const out = await authorize(r, c);
    expect(out.consumed).toEqual({ nonce: 'fresh' });
  });
  it('once the host records the nonce, the same confirmation no longer passes', async () => {
    const { r, c } = await base({ nonce: 'fresh' });
    const out = await authorize(r, c);
    const second = await authorize(r, { ...c, usedNonces: new Set([...(c.usedNonces ?? []), out.consumed?.nonce ?? '']) });
    expect(second.decision.outcome).toBe('require-approval');
    expect(second.consumed).toBeUndefined();
  });
  it('authorize consumes nothing when the confirmation fails', async () => {
    const { r, c } = await base({ deviceId: 'stranger' });
    expect((await authorize(r, c)).consumed).toBeUndefined();
  });
});
