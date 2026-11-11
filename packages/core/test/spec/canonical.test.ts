import { describe, expect, it } from 'vitest';
import { canonicalJson, hashArgs } from '../../src/index.js';

describe('canonicalJson', () => {
  it('sorts keys recursively with no whitespace', () => {
    expect(canonicalJson({ b: 1, a: { d: [1, { z: 1, y: 2 }], c: null } })).toBe(
      '{"a":{"c":null,"d":[1,{"y":2,"z":1}]},"b":1}',
    );
  });
  it('is independent of key insertion order', () => {
    expect(canonicalJson({ a: 1, b: 2, c: { x: 1, y: 2 } })).toBe(canonicalJson({ c: { y: 2, x: 1 }, b: 2, a: 1 }));
  });
  it('keeps array order', () => {
    expect(canonicalJson([3, 1, 2])).not.toBe(canonicalJson([1, 2, 3]));
  });
  it('handles primitives', () => {
    expect(canonicalJson(null)).toBe('null');
    expect(canonicalJson(true)).toBe('true');
    expect(canonicalJson('a"b')).toBe('"a\\"b"');
    expect(canonicalJson(1.5)).toBe('1.5');
    expect(canonicalJson([])).toBe('[]');
    expect(canonicalJson({})).toBe('{}');
  });
  it('distinguishes values that differ', () => {
    expect(canonicalJson({ a: '1' })).not.toBe(canonicalJson({ a: 1 }));
    expect(canonicalJson({ a: null })).not.toBe(canonicalJson({}));
  });
  it('is stable across calls', () => {
    const v = { z: [1, 2, { b: 1, a: 2 }], a: 'x' };
    expect(canonicalJson(v)).toBe(canonicalJson(v));
    expect(canonicalJson(JSON.parse(canonicalJson(v)))).toBe(canonicalJson(v));
  });
  it('rejects undefined, functions, symbols, bigint', () => {
    expect(() => canonicalJson(undefined)).toThrow();
    expect(() => canonicalJson({ a: undefined })).toThrow();
    expect(() => canonicalJson([undefined])).toThrow();
    expect(() => canonicalJson({ f: () => 1 })).toThrow();
    expect(() => canonicalJson(() => 1)).toThrow();
    expect(() => canonicalJson(Symbol('x'))).toThrow();
    expect(() => canonicalJson(10n)).toThrow();
  });
  it('rejects non-finite numbers', () => {
    for (const n of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])
      expect(() => canonicalJson({ n })).toThrow();
  });
  it('rejects cycles', () => {
    const a: Record<string, unknown> = {};
    a['self'] = a;
    expect(() => canonicalJson(a)).toThrow();
    const arr: unknown[] = [];
    arr.push(arr);
    expect(() => canonicalJson(arr)).toThrow();
    const x: Record<string, unknown> = {};
    const y = { x };
    x['y'] = y;
    expect(() => canonicalJson(x)).toThrow();
  });
  it('accepts shared (non-cyclic) references', () => {
    const shared = { a: 1 };
    expect(canonicalJson({ p: shared, q: shared })).toBe('{"p":{"a":1},"q":{"a":1}}');
  });
});

describe('hashArgs', () => {
  it('matches a known SHA-256 vector of tool + newline + canonical json', async () => {
    expect(await hashArgs('mail.send', { a: 1 })).toBe('1536fee63860cc0c36f922339903b1bb306db9cb00b85e26c499cd973645a74c');
    expect(await hashArgs('web.fetch', {})).toBe('de7d27a95635aa6d945b89db79ba481acd88089898d7048b38456a20b75529e1');
    expect(await hashArgs('x', null)).toBe('30dbd0a630d4b55b24a69a3875996d3eb56224d14a29ac02fb162a7998d724ac');
  });
  it('is lowercase 64-char hex', async () => {
    expect(await hashArgs('mail.send', { a: 1 })).toMatch(/^[0-9a-f]{64}$/);
  });
  it('is independent of key order', async () => {
    expect(await hashArgs('mail.send', { to: 'a', body: 'b' })).toBe(await hashArgs('mail.send', { body: 'b', to: 'a' }));
  });
  it('depends on the tool name and on every argument value', async () => {
    const base = await hashArgs('mail.send', { to: 'a@example.com' });
    expect(await hashArgs('mail.delete', { to: 'a@example.com' })).not.toBe(base);
    expect(await hashArgs('mail.send', { to: 'b@example.com' })).not.toBe(base);
    expect(await hashArgs('mail.send', { to: 'a@example.com', extra: 1 })).not.toBe(base);
  });
  it('is stable', async () => {
    expect(await hashArgs('t.x', [1, 2])).toBe(await hashArgs('t.x', [1, 2]));
  });
  it('rejects arguments canonicalJson rejects', async () => {
    await expect(hashArgs('t.x', { a: undefined })).rejects.toThrow();
    await expect(hashArgs('t.x', { a: Number.NaN })).rejects.toThrow();
  });
});
