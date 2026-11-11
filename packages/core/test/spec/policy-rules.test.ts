import type { ToolDescriptor } from '@later/protocol';
import { describe, expect, it } from 'vitest';
import {
  addAlwaysAllow,
  authorize,
  decide,
  type Decision,
  type DeviceConfirmation,
  type PolicyContext,
  type RunContext,
  type ToolRequest,
} from '../../src/index.js';
import { NOW, SPACE, addMs, crmUpdate, ctx, grantedApproval, iso, req, run, tool } from './helpers.js';

const tainted = run({ ingestedUntrusted: true });
const priv = run({ touchedPrivate: true });
const both = run({ ingestedUntrusted: true, touchedPrivate: true });

interface Row {
  name: string;
  tool: ToolDescriptor | string;
  over?: Partial<PolicyContext> | (() => Promise<Partial<PolicyContext>>);
  outcome: Decision['outcome'];
  reason: Decision['reason'];
  surface?: boolean;
}

const confirmation = (hash: string): DeviceConfirmation => ({
  argsHash: hash,
  deviceId: 'dev1',
  nonce: 'n1',
  confirmedAt: iso(addMs(NOW, -1000)),
});

const rows: Row[] = [
  // Rule 1
  { name: 'r1 connector not granted (read)', tool: 'mail.read', over: { grantedConnectors: new Set(['web']) }, outcome: 'deny', reason: 'connector-not-granted' },
  { name: 'r1 connector not granted (irreversible)', tool: 'mail.send', over: { grantedConnectors: new Set() }, outcome: 'deny', reason: 'connector-not-granted' },
  { name: 'r1 beats rule 2 (paused)', tool: 'mail.archive', over: { grantedConnectors: new Set(), budgetStatus: 'paused' }, outcome: 'deny', reason: 'connector-not-granted' },
  { name: 'r1 beats alwaysAllow', tool: 'mail.archive', over: { grantedConnectors: new Set(), alwaysAllow: new Set(['mail.archive']) }, outcome: 'deny', reason: 'connector-not-granted' },
  // Rule 2
  { name: 'r2 paused blocks reversible-write', tool: 'mail.archive', over: { budgetStatus: 'paused', alwaysAllow: new Set(['mail.archive']) }, outcome: 'deny', reason: 'budget-paused' },
  { name: 'r2 paused blocks irreversible', tool: 'mail.send', over: { budgetStatus: 'paused' }, outcome: 'deny', reason: 'budget-paused' },
  { name: 'r2 paused blocks irreversible even with a valid approval', tool: 'mail.send', over: async () => ({ budgetStatus: 'paused', approval: grantedApproval(await req('mail.send')) }), outcome: 'deny', reason: 'budget-paused' },
  { name: 'r2 paused does not block read', tool: 'mail.read', over: { budgetStatus: 'paused' }, outcome: 'allow', reason: 'read-only' },
  { name: 'r2 warned does not block writes', tool: 'mail.archive', over: { budgetStatus: 'warned', alwaysAllow: new Set(['mail.archive']) }, outcome: 'allow', reason: 'always-allowed' },
  // Rule 3
  { name: 'r3 plain read allowed', tool: 'mail.search', outcome: 'allow', reason: 'read-only' },
  { name: 'r3 open-egress read in a clean run', tool: 'web.fetch', outcome: 'allow', reason: 'read-only' },
  { name: 'r3 open-egress read, tainted only', tool: 'web.fetch', over: { run: tainted }, outcome: 'allow', reason: 'read-only' },
  { name: 'r3 open-egress read, private only', tool: 'web.fetch', over: { run: priv }, outcome: 'allow', reason: 'read-only' },
  { name: 'r3 open-egress read, tainted and private', tool: 'web.fetch', over: { run: both }, outcome: 'require-approval', reason: 'exfiltration-risk' },
  { name: 'r3 browser.open, tainted and private', tool: 'browser.open', over: { run: both }, outcome: 'require-approval', reason: 'exfiltration-risk' },
  { name: 'r3 fixed-egress read, tainted and private', tool: 'web.search', over: { run: both }, outcome: 'allow', reason: 'read-only' },
  { name: 'r3 weather.get, tainted and private', tool: 'weather.get', over: { run: both }, outcome: 'allow', reason: 'read-only' },
  { name: 'r3 non-egress private read, tainted and private', tool: 'mail.read', over: { run: both }, outcome: 'allow', reason: 'read-only' },
  { name: 'r3 browser.read, tainted and private', tool: 'browser.read', over: { run: both }, outcome: 'allow', reason: 'read-only' },
  // Rule 4
  { name: 'r4 valid approval allows irreversible', tool: 'mail.send', over: async () => ({ approval: grantedApproval(await req('mail.send')) }), outcome: 'allow', reason: 'approved' },
  { name: 'r4 valid approval allows exfiltration read', tool: 'web.fetch', over: async () => ({ run: both, approval: grantedApproval(await req('web.fetch')) }), outcome: 'allow', reason: 'approved' },
  { name: 'r4 valid approval allows reversible-write', tool: 'mail.label', over: async () => ({ approval: grantedApproval(await req('mail.label')) }), outcome: 'allow', reason: 'approved' },
  { name: 'r4 approval for different args falls through', tool: 'mail.send', over: async () => ({ approval: grantedApproval(await req('mail.send', { id: 2 })) }), outcome: 'require-approval', reason: 'irreversible' },
  { name: 'r4 approval for different tool falls through', tool: 'mail.send', over: async () => ({ approval: grantedApproval(await req('mail.delete')) }), outcome: 'require-approval', reason: 'irreversible' },
  { name: 'r4 approval for different Space falls through', tool: 'mail.send', over: async () => ({ approval: grantedApproval(await req('mail.send'), { spaceId: 'space_other' }) }), outcome: 'require-approval', reason: 'irreversible' },
  { name: 'r4 expired approval falls through', tool: 'mail.send', over: async () => ({ approval: grantedApproval(await req('mail.send'), { ttlMs: 1000 }), now: addMs(NOW, 1000) }), outcome: 'require-approval', reason: 'irreversible' },
  { name: 'r4 pending approval falls through', tool: 'mail.send', over: async () => {
    const { requestApproval } = await import('../../src/index.js');
    const r = await req('mail.send');
    return { approval: requestApproval({ spaceId: SPACE, tool: 'mail.send', argsHash: r.argsHash, tier: 'irreversible' }, NOW, 'a') };
  }, outcome: 'require-approval', reason: 'irreversible' },
  // Rule 5
  { name: 'r5 user confirmation by a known device', tool: 'mail.send', over: async () => ({ run: run({ initiatedBy: 'user' }), knownDevices: new Set(['dev1']), userConfirmation: confirmation((await req('mail.send')).argsHash) }), outcome: 'allow', reason: 'user-confirmed' },
  { name: 'r5 confirmation in an agent-initiated run is ignored', tool: 'mail.send', over: async () => ({ run: run({ initiatedBy: 'agent' }), knownDevices: new Set(['dev1']), userConfirmation: confirmation((await req('mail.send')).argsHash) }), outcome: 'require-approval', reason: 'irreversible' },
  { name: 'r5 confirmation in a routine run is ignored', tool: 'mail.send', over: async () => ({ run: run({ initiatedBy: 'routine' }), knownDevices: new Set(['dev1']), userConfirmation: confirmation((await req('mail.send')).argsHash) }), outcome: 'require-approval', reason: 'irreversible' },
  { name: 'r5 confirmation allows an exfiltration read', tool: 'web.fetch', over: async () => ({ run: run({ initiatedBy: 'user', ingestedUntrusted: true, touchedPrivate: true }), knownDevices: new Set(['dev1']), userConfirmation: confirmation((await req('web.fetch')).argsHash) }), outcome: 'allow', reason: 'user-confirmed' },
  // Rule 6
  { name: 'r6 reversible-write not in alwaysAllow', tool: 'mail.archive', outcome: 'require-approval', reason: 'not-always-allowed' },
  { name: 'r6 allowlisted, clean run', tool: 'mail.archive', over: { alwaysAllow: new Set(['mail.archive']) }, outcome: 'allow', reason: 'always-allowed', surface: false },
  { name: 'r6 allowlisted, private-only run', tool: 'mail.archive', over: { alwaysAllow: new Set(['mail.archive']), run: priv }, outcome: 'allow', reason: 'always-allowed', surface: false },
  { name: 'r6 allowlisted contained tool, tainted run: allowed and surfaced', tool: 'mail.archive', over: { alwaysAllow: new Set(['mail.archive']), run: tainted }, outcome: 'allow', reason: 'always-allowed', surface: true },
  { name: 'r6 allowlisted contained tool, tainted and private run: allowed and surfaced', tool: 'mail.create_draft', over: { alwaysAllow: new Set(['mail.create_draft']), run: both }, outcome: 'allow', reason: 'always-allowed', surface: true },
  { name: 'r6 allowlisted non-contained tool, tainted run', tool: crmUpdate, over: { alwaysAllow: new Set(['crm.update']), run: tainted }, outcome: 'require-approval', reason: 'untrusted-content' },
  { name: 'r6 allowlisted non-contained tool, clean run', tool: crmUpdate, over: { alwaysAllow: new Set(['crm.update']) }, outcome: 'allow', reason: 'always-allowed', surface: false },
  { name: 'r6 non-allowlisted non-contained tool, clean run', tool: crmUpdate, outcome: 'require-approval', reason: 'not-always-allowed' },
  { name: 'r6 memory.write allowlisted in a tainted run is allowed and surfaced', tool: 'memory.write', over: { alwaysAllow: new Set(['memory.write']), run: tainted }, outcome: 'allow', reason: 'always-allowed', surface: true },
  // Rule 7
  { name: 'r7 irreversible always requires approval', tool: 'mail.send', outcome: 'require-approval', reason: 'irreversible' },
  { name: 'r7 alwaysAllow is ignored for irreversible', tool: 'mail.send', over: { alwaysAllow: new Set(['mail.send']) }, outcome: 'require-approval', reason: 'irreversible' },
  { name: 'r7 mail.delete in alwaysAllow', tool: 'mail.delete', over: { alwaysAllow: new Set(['mail.delete']) }, outcome: 'require-approval', reason: 'irreversible' },
  { name: 'r7 browser.submit', tool: 'browser.submit', outcome: 'require-approval', reason: 'irreversible' },
  { name: 'r7 irreversible in a clean run still needs approval', tool: 'mail.send', over: { run: run({ initiatedBy: 'user' }) }, outcome: 'require-approval', reason: 'irreversible' },
];

describe('policy gate: every rule, in order', () => {
  it.each(rows)('$name', async (row) => {
    const over = typeof row.over === 'function' ? await row.over() : (row.over ?? {});
    const r = await req(row.tool);
    const d = await decide(r, ctx(over));
    expect(d.outcome).toBe(row.outcome);
    expect(d.reason).toBe(row.reason);
    expect(d.surface).toBe(row.surface ?? false);
    expect(typeof d.detail).toBe('string');
    expect(d.detail.length).toBeGreaterThan(0);
  });

  it('decide and authorize agree on the decision for every row', async () => {
    for (const row of rows) {
      const over = typeof row.over === 'function' ? await row.over() : (row.over ?? {});
      const r = await req(row.tool);
      const c = ctx(over);
      expect((await authorize(r, c)).decision).toEqual(await decide(r, c));
    }
  });
});

describe('request integrity (A1)', () => {
  it('a hash that does not match the arguments is denied', async () => {
    const good = await req('mail.send', { to: 'a@example.com' });
    const forged: ToolRequest = { tool: good.tool, args: { to: 'evil@example.net' }, argsHash: good.argsHash };
    const d = await decide(forged, ctx());
    expect(d).toMatchObject({ outcome: 'deny', reason: 'request-tampered' });
  });
  it('tampering is denied even when a valid approval for the claimed hash exists', async () => {
    const good = await req('mail.send', { to: 'a@example.com' });
    const approval = grantedApproval(good);
    const forged: ToolRequest = { tool: good.tool, args: { to: 'evil@example.net' }, argsHash: good.argsHash };
    const d = await decide(forged, ctx({ approval }));
    expect(d).toMatchObject({ outcome: 'deny', reason: 'request-tampered' });
  });
  it('tampering is denied for read tools too', async () => {
    const good = await req('mail.read', { id: 1 });
    const d = await decide({ tool: good.tool, args: { id: 2 }, argsHash: good.argsHash }, ctx());
    expect(d).toMatchObject({ outcome: 'deny', reason: 'request-tampered' });
  });
  it('a tampered tool name is denied', async () => {
    const good = await req('mail.read', { id: 1 });
    const d = await decide({ tool: tool('mail.search'), args: good.args, argsHash: good.argsHash }, ctx());
    expect(d).toMatchObject({ outcome: 'deny', reason: 'request-tampered' });
  });
  it('an arbitrary string hash is denied', async () => {
    const good = await req('mail.read', { id: 1 });
    const d = await decide({ ...good, argsHash: 'f'.repeat(64) }, ctx());
    expect(d.reason).toBe('request-tampered');
  });
  it('a hand-built request with a correct hash is accepted (no reliance on buildRequest)', async () => {
    const { hashArgs } = await import('../../src/index.js');
    const args = { id: 1 };
    const d = await decide({ tool: tool('mail.read'), args, argsHash: await hashArgs('mail.read', args) }, ctx());
    expect(d.outcome).toBe('allow');
  });
  it('arguments that are not JSON are denied rather than thrown', async () => {
    const good = await req('mail.read', { id: 1 });
    const d = await decide({ tool: good.tool, args: { f: () => 1 }, argsHash: good.argsHash }, ctx());
    expect(d.outcome).toBe('deny');
  });
  it('authorize also denies and consumes nothing for a tampered request', async () => {
    const good = await req('mail.send', { to: 'a' });
    const a = await authorize({ tool: good.tool, args: { to: 'b' }, argsHash: good.argsHash }, ctx({ approval: grantedApproval(good) }));
    expect(a.decision.outcome).toBe('deny');
    expect(a.consumed).toBeUndefined();
  });
});

describe('addAlwaysAllow', () => {
  it('accepts reversible-write tools and returns a new set', () => {
    const base: ReadonlySet<string> = new Set(['mail.label']);
    const r = addAlwaysAllow(base, tool('mail.archive'));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.has('mail.archive')).toBe(true);
      expect(r.value.has('mail.label')).toBe(true);
    }
    expect(base.has('mail.archive')).toBe(false);
  });
  it.each(['mail.send', 'mail.delete', 'browser.submit', 'mail.read', 'web.fetch', 'memory.read', 'weather.get'])(
    'rejects %s',
    (name) => {
      const r = addAlwaysAllow(new Set(), tool(name));
      expect(r.ok).toBe(false);
    },
  );
});

type _Unused = RunContext;
