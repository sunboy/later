import { describe, expect, it } from 'vitest';
import { CARD_TYPES, parseCard } from '../../src/index.js';
import { cardFixture, draftCard, withPath, withPaths, type Obj } from './helpers.js';

const ok = (x: unknown): boolean => parseCard(x).ok;

// Fixtures that A10 changes are replaced by a draft with recipient origins.
const valid = (type: string): Obj => (type === 'draft' ? draftCard() : cardFixture(type));

describe('every card type parses a valid example', () => {
  it.each(CARD_TYPES)('%s', (type) => {
    const r = parseCard(valid(type));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.type).toBe(type);
  });

  it('there is exactly one fixture per card type, and 13 types', () => {
    expect(CARD_TYPES).toHaveLength(13);
  });

  it('never throws on garbage', () => {
    for (const g of [null, undefined, 1, 'x', [], {}, { type: 'nope' }]) {
      expect(parseCard(g).ok).toBe(false);
    }
  });

  it('returns issues with code and path on failure', () => {
    const r = parseCard(withPath(valid('brief'), 'extra', 1));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.length).toBeGreaterThan(0);
      expect(r.error[0]).toHaveProperty('code');
      expect(r.error[0]).toHaveProperty('path');
    }
  });
});

describe('strict objects at every level', () => {
  it.each(CARD_TYPES)('%s rejects unknown keys at card, provenance, source and data level', (type) => {
    const base = valid(type);
    expect(ok(withPath(base, 'extra', 1))).toBe(false);
    expect(ok(withPath(base, 'provenance.extra', 1))).toBe(false);
    expect(ok(withPath(base, 'data.extra', 1))).toBe(false);
    const withSource = withPath(base, 'provenance.sources', [
      { kind: 'tool', ref: 'r', trust: 'user' },
    ]);
    expect(ok(withSource)).toBe(true);
    expect(
      ok(withPath(withSource, 'provenance.sources', [{ kind: 'tool', ref: 'r', trust: 'user', x: 1 }])),
    ).toBe(false);
  });

  it('rejects unknown keys in nested data objects', () => {
    expect(ok(withPath(valid('brief'), 'data.dayShape.0.extra', 1))).toBe(false);
    expect(ok(withPath(valid('brief'), 'data.top.0.extra', 1))).toBe(false);
    expect(ok(withPath(valid('brief'), 'data.stats.0.extra', 1))).toBe(false);
    expect(ok(withPath(valid('digest'), 'data.tiles.0.extra', 1))).toBe(false);
    expect(ok(withPath(valid('triage-item'), 'data.from.extra', 1))).toBe(false);
    expect(ok(withPath(valid('draft'), 'data.to.0.extra', 1))).toBe(false);
    expect(ok(withPath(valid('approval'), 'data.argsPreview.0.extra', 1))).toBe(false);
    expect(ok(withPath(valid('fyi'), 'data.undo.extra', 1))).toBe(false);
    expect(ok(withPath(valid('status'), 'data.progress.extra', 1))).toBe(false);
  });

  it('rejects unknown type and wrong version', () => {
    expect(ok(withPath(valid('brief'), 'type', 'banner'))).toBe(false);
    expect(ok(withPath(valid('brief'), 'v', 2))).toBe(false);
  });
});

describe('base card invariants', () => {
  it('priority is an integer 0 to 100', () => {
    const b = valid('fyi');
    expect(ok(withPath(b, 'priority', 0))).toBe(true);
    expect(ok(withPath(b, 'priority', 100))).toBe(true);
    expect(ok(withPath(b, 'priority', -1))).toBe(false);
    expect(ok(withPath(b, 'priority', 101))).toBe(false);
    expect(ok(withPath(b, 'priority', 50.5))).toBe(false);
  });

  it('state must be a known value', () => {
    for (const s of ['new', 'decided', 'filed']) expect(ok(withPath(valid('fyi'), 'state', s))).toBe(true);
    expect(ok(withPath(valid('fyi'), 'state', 'archived'))).toBe(false);
  });

  it('timestamps are ISO 8601 UTC', () => {
    expect(ok(withPath(valid('fyi'), 'createdAt', 'yesterday'))).toBe(false);
    expect(ok(withPath(valid('fyi'), 'createdAt', '2026-11-11T09:00:00+01:00'))).toBe(false);
    expect(ok(withPath(valid('fyi'), 'expiresAt', '2026-11-12T09:00:00Z'))).toBe(true);
    expect(ok(withPath(valid('fyi'), 'expiresAt', 'soon'))).toBe(false);
  });

  it('snoozedUntil is present iff state is snoozed', () => {
    const b = valid('fyi');
    const T = '2026-11-12T09:00:00Z';
    expect(ok(withPaths(b, { state: 'snoozed', snoozedUntil: T }))).toBe(true);
    expect(ok(withPaths(b, { state: 'snoozed' }))).toBe(false);
    for (const s of ['new', 'decided', 'filed']) {
      expect(ok(withPaths(b, { state: s, snoozedUntil: T }))).toBe(false);
    }
    expect(ok(withPaths(b, { state: 'new' }))).toBe(true);
  });

  it('decidedAction must belong to the card type', () => {
    const fyi = valid('fyi');
    expect(ok(withPath(fyi, 'decidedAction', 'dismiss'))).toBe(true);
    expect(ok(withPath(fyi, 'decidedAction', 'send'))).toBe(false);
    expect(ok(withPath(valid('draft'), 'decidedAction', 'send'))).toBe(true);
    expect(ok(withPath(valid('draft'), 'decidedAction', 'approve'))).toBe(false);
  });

  it('spaceId is nullable only for brief, needs-reply and review', () => {
    for (const type of CARD_TYPES) {
      const nullable = ['brief', 'needs-reply', 'review'].includes(type);
      expect(ok(withPath(valid(type), 'spaceId', null)), type).toBe(nullable);
    }
  });

  it('spaceId may not be missing', () => {
    expect(ok(withPath(valid('brief'), 'spaceId', undefined))).toBe(false);
  });
});

describe('text rules', () => {
  it('rejects C0 control characters other than newline and tab', () => {
    for (const ch of ['\u0000', '\u0007', '\u001b', '\r', '\u001f']) {
      expect(ok(withPath(valid('fyi'), 'title', `a${ch}b`)), JSON.stringify(ch)).toBe(false);
      expect(ok(withPath(valid('fyi'), 'data.summary', `a${ch}b`)), JSON.stringify(ch)).toBe(false);
    }
  });

  it('accepts newline and tab in body text', () => {
    expect(ok(withPath(valid('fyi'), 'data.summary', 'line one\n\tline two'))).toBe(true);
  });

  it('title length limit is 120 and titles are non-empty', () => {
    expect(ok(withPath(valid('fyi'), 'title', 'x'.repeat(120)))).toBe(true);
    expect(ok(withPath(valid('fyi'), 'title', 'x'.repeat(121)))).toBe(false);
    expect(ok(withPath(valid('fyi'), 'title', ''))).toBe(false);
  });

  it('short text limit is 280', () => {
    const t = valid('triage-item');
    expect(ok(withPath(t, 'data.gist', 'x'.repeat(280)))).toBe(true);
    expect(ok(withPath(t, 'data.gist', 'x'.repeat(281)))).toBe(false);
  });

  it('body text limit is 4000', () => {
    expect(ok(withPath(valid('fyi'), 'data.summary', 'x'.repeat(4000)))).toBe(true);
    expect(ok(withPath(valid('fyi'), 'data.summary', 'x'.repeat(4001)))).toBe(false);
  });

  it('long text limit is 20000 (draft body)', () => {
    expect(ok(withPath(valid('draft'), 'data.body', 'x'.repeat(20000)))).toBe(true);
    expect(ok(withPath(valid('draft'), 'data.body', 'x'.repeat(20001)))).toBe(false);
  });

  it('draft body rejects control characters', () => {
    expect(ok(withPath(valid('draft'), 'data.body', 'hi\u0000'))).toBe(false);
  });
});

describe('source rules (A2)', () => {
  const src = (s: Obj): Obj => withPath(valid('fyi'), 'provenance.sources', [s]);
  it('email, web and calendar are always external', () => {
    for (const kind of ['email', 'web', 'calendar']) {
      expect(ok(src({ kind, ref: 'r', trust: 'external' }))).toBe(true);
      expect(ok(src({ kind, ref: 'r', trust: 'user' }))).toBe(false);
    }
  });
  it('capture is always user', () => {
    expect(ok(src({ kind: 'capture', ref: 'r', trust: 'user' }))).toBe(true);
    expect(ok(src({ kind: 'capture', ref: 'r', trust: 'external' }))).toBe(false);
  });
  it('memory and tool carry either trust', () => {
    for (const kind of ['memory', 'tool'])
      for (const trust of ['user', 'external'])
        expect(ok(src({ kind, ref: 'r', trust }))).toBe(true);
  });
  it('trust is required and must be a known value', () => {
    expect(ok(src({ kind: 'memory', ref: 'r' }))).toBe(false);
    expect(ok(src({ kind: 'memory', ref: 'r', trust: 'maybe' }))).toBe(false);
  });
  it('url must be https', () => {
    const s = { kind: 'web', ref: 'r', trust: 'external' };
    expect(ok(src({ ...s, url: 'https://example.com/a' }))).toBe(true);
    expect(ok(src({ ...s, url: 'http://example.com/a' }))).toBe(false);
    expect(ok(src({ ...s, url: 'javascript:alert(1)' }))).toBe(false);
    expect(ok(src({ ...s, url: 'not a url' }))).toBe(false);
  });
  it('kind must be known and ref non-empty', () => {
    expect(ok(src({ kind: 'sms', ref: 'r', trust: 'external' }))).toBe(false);
    expect(ok(src({ kind: 'tool', ref: '', trust: 'user' }))).toBe(false);
  });
  it('provenance requires agentId, runId, createdAt, untrusted', () => {
    for (const k of ['agentId', 'runId', 'createdAt', 'untrusted', 'sources']) {
      expect(ok(withPath(valid('fyi'), `provenance.${k}`, undefined)), k).toBe(false);
    }
  });
});

describe('brief', () => {
  const b = valid('brief');
  it('allows at most 3 top items and 3 stats', () => {
    const item = { text: 'x' };
    expect(ok(withPath(b, 'data.top', [item, item, item]))).toBe(true);
    expect(ok(withPath(b, 'data.top', [item, item, item, item]))).toBe(false);
    const stat = { value: '1', label: 'l' };
    expect(ok(withPath(b, 'data.stats', [stat, stat, stat]))).toBe(true);
    expect(ok(withPath(b, 'data.stats', [stat, stat, stat, stat]))).toBe(false);
  });
  it('day block end must not precede start', () => {
    const blk = (start: string, end: string): unknown[] => [{ start, end, label: 'x' }];
    expect(ok(withPath(b, 'data.dayShape', blk('2026-11-11T09:00:00Z', '2026-11-11T09:00:00Z')))).toBe(true);
    expect(ok(withPath(b, 'data.dayShape', blk('2026-11-11T09:00:00Z', '2026-11-11T08:00:00Z')))).toBe(false);
  });
  it('stats is optional', () => {
    expect(ok(withPath(b, 'data.stats', undefined))).toBe(true);
  });
});

describe('digest', () => {
  const d = valid('digest');
  const tile = (source: Obj): Obj => ({ headline: 'h', summary: 's', source });
  it('every tile needs a source with an https url', () => {
    const base = { kind: 'web', ref: 'r', trust: 'external' };
    expect(ok(withPath(d, 'data.tiles', [tile({ ...base, url: 'https://example.com' })]))).toBe(true);
    expect(ok(withPath(d, 'data.tiles', [tile(base)]))).toBe(false);
    expect(ok(withPath(d, 'data.tiles', [tile({ ...base, url: 'http://example.com' })]))).toBe(false);
    expect(
      ok(withPath(d, 'data.tiles', [tile({ ...base, url: 'https://example.com' }), tile(base)])),
    ).toBe(false);
  });
  it('has 1 to 6 tiles', () => {
    const t = tile({ kind: 'web', ref: 'r', trust: 'external', url: 'https://example.com' });
    expect(ok(withPath(d, 'data.tiles', []))).toBe(false);
    expect(ok(withPath(d, 'data.tiles', Array<unknown>(6).fill(t)))).toBe(true);
    expect(ok(withPath(d, 'data.tiles', Array<unknown>(7).fill(t)))).toBe(false);
  });
  it('foldedCount is a non-negative integer', () => {
    expect(ok(withPath(d, 'data.foldedCount', 0))).toBe(true);
    expect(ok(withPath(d, 'data.foldedCount', -1))).toBe(false);
    expect(ok(withPath(d, 'data.foldedCount', 1.5))).toBe(false);
  });
});

describe('meeting, needs-reply, triage-item, monitor, task, review, filed', () => {
  it('meeting: end not before start, at most 5 prep items, https joinUrl', () => {
    const m = valid('meeting');
    expect(ok(withPaths(m, { 'data.start': '2026-11-11T10:00:00Z', 'data.end': '2026-11-11T09:00:00Z' }))).toBe(false);
    expect(ok(withPath(m, 'data.prep', ['a', 'b', 'c', 'd', 'e']))).toBe(true);
    expect(ok(withPath(m, 'data.prep', ['a', 'b', 'c', 'd', 'e', 'f']))).toBe(false);
    expect(ok(withPath(m, 'data.joinUrl', 'http://meet.example.com'))).toBe(false);
    expect(ok(withPath(m, 'data.joinUrl', 'https://meet.example.com/x'))).toBe(true);
  });
  it('needs-reply: count and itemIds', () => {
    const n = valid('needs-reply');
    expect(ok(withPath(n, 'data.count', -1))).toBe(false);
    expect(ok(withPath(n, 'data.itemIds', ['card_a', 'card_b']))).toBe(true);
    expect(ok(withPath(n, 'data.itemIds', [''] ))).toBe(false);
  });
  it('triage-item: at most 4 intents, valid email, required fields', () => {
    const t = valid('triage-item');
    expect(ok(withPath(t, 'data.intents', ['a', 'b', 'c', 'd']))).toBe(true);
    expect(ok(withPath(t, 'data.intents', ['a', 'b', 'c', 'd', 'e']))).toBe(false);
    expect(ok(withPath(t, 'data.from.address', 'not-an-email'))).toBe(false);
    for (const k of ['subject', 'gist', 'why', 'intents', 'messageRef', 'from'])
      expect(ok(withPath(t, `data.${k}`, undefined)), k).toBe(false);
  });
  it('monitor: series at most 60 finite numbers', () => {
    const m = valid('monitor');
    expect(ok(withPath(m, 'data.series', Array<number>(60).fill(1)))).toBe(true);
    expect(ok(withPath(m, 'data.series', Array<number>(61).fill(1)))).toBe(false);
    expect(ok(withPath(m, 'data.series', [1, Number.POSITIVE_INFINITY]))).toBe(false);
    expect(ok(withPath(m, 'data.series', [1, Number.NaN]))).toBe(false);
  });
  it('task: owner and status enums', () => {
    const t = valid('task');
    expect(ok(withPath(t, 'data.owner', 'nobody'))).toBe(false);
    expect(ok(withPath(t, 'data.status', 'blocked'))).toBe(false);
    for (const s of ['next', 'doing', 'waiting', 'done']) expect(ok(withPath(t, 'data.status', s))).toBe(true);
  });
  it('review: proposal enum, spaceId required', () => {
    const r = valid('review');
    expect(ok(withPath(r, 'data.proposal', 'delete'))).toBe(false);
    for (const p of ['keep', 'pause', 'archive', 'nudge']) expect(ok(withPath(r, 'data.proposal', p))).toBe(true);
    expect(ok(withPath(r, 'data.spaceId', undefined))).toBe(false);
  });
  it('filed: filedInto and fromCapture required', () => {
    const f = valid('filed');
    expect(ok(withPath(f, 'data.filedInto', undefined))).toBe(false);
    expect(ok(withPath(f, 'data.fromCapture', undefined))).toBe(false);
  });
});

describe('status', () => {
  const s = valid('status');
  it('asOf is required and must be a timestamp', () => {
    expect(ok(withPath(s, 'data.asOf', undefined))).toBe(false);
    expect(ok(withPath(s, 'data.asOf', 'now'))).toBe(false);
  });
  it('health enum', () => {
    for (const h of ['on-track', 'needs-you', 'waiting', 'stalled', 'quiet'])
      expect(ok(withPath(s, 'data.health', h))).toBe(true);
    expect(ok(withPath(s, 'data.health', 'fine'))).toBe(false);
  });
  it('progress.done must not exceed total', () => {
    expect(ok(withPath(s, 'data.progress', { done: 5, total: 5 }))).toBe(true);
    expect(ok(withPath(s, 'data.progress', { done: 6, total: 5 }))).toBe(false);
    expect(ok(withPath(s, 'data.progress', { done: -1, total: 5 }))).toBe(false);
  });
});

describe('approval (A9)', () => {
  const a = valid('approval');
  const hash = 'a'.repeat(64);
  it('argsHash must be lowercase hex sha-256', () => {
    expect(ok(withPath(a, 'data.argsHash', hash))).toBe(true);
    expect(ok(withPath(a, 'data.argsHash', 'A'.repeat(64)))).toBe(false);
    expect(ok(withPath(a, 'data.argsHash', 'abc'))).toBe(false);
  });
  it('tool name must match the pattern', () => {
    expect(ok(withPath(a, 'data.tool', 'MailSend'))).toBe(false);
  });
  it('tier read is allowed only with risk exfiltration', () => {
    expect(ok(withPaths(a, { 'data.tier': 'read', 'data.risk': 'exfiltration' }))).toBe(true);
    expect(ok(withPaths(a, { 'data.tier': 'read', 'data.risk': 'irreversible' }))).toBe(false);
    expect(ok(withPaths(a, { 'data.tier': 'read', 'data.risk': 'reversible-write' }))).toBe(false);
  });
  it('irreversible tier cannot carry reversible-write risk', () => {
    expect(ok(withPaths(a, { 'data.tier': 'irreversible', 'data.risk': 'reversible-write' }))).toBe(false);
    expect(ok(withPaths(a, { 'data.tier': 'irreversible', 'data.risk': 'exfiltration' }))).toBe(true);
  });
  it('reversible-write tier with reversible-write risk is fine', () => {
    expect(ok(withPaths(a, { 'data.tier': 'reversible-write', 'data.risk': 'reversible-write' }))).toBe(true);
  });
  it('risk is required and must be known', () => {
    expect(ok(withPath(a, 'data.risk', undefined))).toBe(false);
    expect(ok(withPath(a, 'data.risk', 'read'))).toBe(false);
  });
  it('expiresAt and reason are required', () => {
    expect(ok(withPath(a, 'data.expiresAt', undefined))).toBe(false);
    expect(ok(withPath(a, 'data.reason', ''))).toBe(false);
  });
});

describe('fyi undo', () => {
  it('undo needs tool, argsHash and until', () => {
    for (const k of ['tool', 'argsHash', 'until'])
      expect(ok(withPath(valid('fyi'), `data.undo.${k}`, undefined)), k).toBe(false);
  });
  it('summary must be non-empty', () => {
    expect(ok(withPath(valid('fyi'), 'data.summary', ''))).toBe(false);
  });
});

describe('draft recipients (A10)', () => {
  const to = (origin: string, address = 'x@example.com'): unknown[] => [{ address, origin }];
  const untrusted = { 'provenance.untrusted': true };
  const trusted = { 'provenance.untrusted': false };

  it('origin must be thread, known or new', () => {
    for (const o of ['thread', 'known'])
      expect(ok(draftCard({ 'data.to': to(o), ...trusted })), o).toBe(true);
    expect(ok(draftCard({ 'data.to': to('new'), ...trusted }))).toBe(true);
    expect(ok(draftCard({ 'data.to': to('stranger') }))).toBe(false);
  });
  it('origin is required on every recipient, to and cc', () => {
    expect(ok(draftCard({ 'data.to': [{ address: 'x@example.com' }] }))).toBe(false);
    expect(ok(draftCard({ 'data.cc': [{ address: 'x@example.com' }] }))).toBe(false);
    expect(ok(draftCard({ 'data.cc': to('known') }))).toBe(true);
  });
  it('untrusted draft with a new recipient in to must set needsRecipientCheck', () => {
    expect(ok(draftCard({ 'data.to': to('new'), ...untrusted }))).toBe(false);
    expect(ok(draftCard({ 'data.to': to('new'), ...untrusted, 'data.needsRecipientCheck': false }))).toBe(false);
    expect(ok(draftCard({ 'data.to': to('new'), ...untrusted, 'data.needsRecipientCheck': true }))).toBe(true);
  });
  it('the same holds for a new recipient in cc', () => {
    const over = { 'data.cc': to('new'), ...untrusted };
    expect(ok(draftCard(over))).toBe(false);
    expect(ok(draftCard({ ...over, 'data.needsRecipientCheck': true }))).toBe(true);
  });
  it('untrusted draft without any new recipient needs no check', () => {
    expect(ok(draftCard({ 'data.to': [...to('thread'), ...to('known', 'b@example.com')], ...untrusted }))).toBe(true);
  });
  it('trusted draft with a new recipient needs no check', () => {
    expect(ok(draftCard({ 'data.to': to('new'), ...trusted }))).toBe(true);
  });
  it('needs at least one recipient and at most 100', () => {
    expect(ok(draftCard({ 'data.to': [] }))).toBe(false);
  });
  it('recipientConfirmed is accepted as a boolean', () => {
    expect(
      ok(draftCard({ 'data.to': to('new'), ...untrusted, 'data.needsRecipientCheck': true, 'data.recipientConfirmed': true })),
    ).toBe(true);
    expect(ok(draftCard({ 'data.recipientConfirmed': 'yes' }))).toBe(false);
  });
  it('rejects an invalid address', () => {
    expect(ok(draftCard({ 'data.to': to('thread', 'nope') }))).toBe(false);
  });
});
