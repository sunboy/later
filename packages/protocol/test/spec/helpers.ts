import { readFileSync } from 'node:fs';

export type Obj = Record<string, unknown>;

export const fixture = (path: string): Obj =>
  JSON.parse(readFileSync(new URL(`../../fixtures/${path}`, import.meta.url), 'utf8')) as Obj;

export const cardFixture = (type: string): Obj => fixture(`cards/${type}.json`);

/** Deep clone, then set (or delete when value is undefined) a dotted path. */
export function withPath(base: Obj, path: string, value: unknown): Obj {
  const copy = structuredClone(base);
  const keys = path.split('.');
  let cur: Obj = copy;
  for (const k of keys.slice(0, -1)) {
    const next = (Array.isArray(cur) ? (cur as unknown as Obj)[k] : cur[k]) as Obj;
    cur = next;
  }
  const last = keys[keys.length - 1] as string;
  if (value === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete cur[last];
  } else {
    cur[last] = value;
  }
  return copy;
}

export const withPaths = (base: Obj, edits: Record<string, unknown>): Obj =>
  Object.entries(edits).reduce((acc, [p, v]) => withPath(acc, p, v), base);

export const U = '2026-11-11T09:00:00Z';

/** A draft card with A10 recipient origins. */
export function draftCard(over: Record<string, unknown> = {}): Obj {
  const base = cardFixture('draft');
  const data = base['data'] as Obj;
  data['to'] = [{ name: 'Sam', address: 'sam@example.com', origin: 'thread' }];
  return withPaths(base, over);
}
