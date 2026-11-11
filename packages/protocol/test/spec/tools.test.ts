import { describe, expect, it } from 'vitest';
import {
  BUILTIN_TOOLS,
  TOOL_NAME_PATTERN,
  ToolDescriptorSchema,
  findTool,
  type ToolDescriptor,
} from '../../src/index.js';

const byName = (n: string): ToolDescriptor => {
  const t = BUILTIN_TOOLS.find((x) => x.name === n);
  if (t === undefined) throw new Error(`missing tool ${n}`);
  return t;
};

describe('tool name pattern', () => {
  it.each(['mail.send', 'a.b', 'web.fetch', 'memory.read', 'x1_y.z_2'])('accepts %s', (n) => {
    expect(TOOL_NAME_PATTERN.test(n)).toBe(true);
  });
  it.each(['mail', 'Mail.send', 'mail.Send', '1mail.send', 'mail.send.now', 'mail-send.x', '.send', 'mail.', 'mail send.x', ''])(
    'rejects %j',
    (n) => {
      expect(TOOL_NAME_PATTERN.test(n)).toBe(false);
    },
  );
});

type Expect = [name: string, tier: string, egress: string, readsPrivate: boolean, contained: boolean];
const TABLE: Expect[] = [
  ['mail.search', 'read', 'none', true, false],
  ['mail.read', 'read', 'none', true, false],
  ['mail.create_draft', 'reversible-write', 'none', false, true],
  ['mail.label', 'reversible-write', 'none', false, true],
  ['mail.archive', 'reversible-write', 'none', false, true],
  ['mail.send', 'irreversible', 'open', false, false],
  ['mail.delete', 'irreversible', 'none', false, false],
  ['calendar.read', 'read', 'none', true, false],
  ['web.search', 'read', 'fixed', false, false],
  ['web.fetch', 'read', 'open', false, false],
  ['memory.read', 'read', 'none', false, false],
  ['memory.write', 'reversible-write', 'none', false, true],
  ['browser.open', 'read', 'open', false, false],
  ['browser.read', 'read', 'none', true, false],
  ['browser.submit', 'irreversible', 'open', false, false],
  ['weather.get', 'read', 'fixed', false, false],
];

describe('BUILTIN_TOOLS', () => {
  it('contains exactly the specified tools', () => {
    expect(BUILTIN_TOOLS.map((t) => t.name).sort()).toEqual(TABLE.map((r) => r[0]).sort());
  });

  it.each(TABLE)('%s: tier %s, egress %s, readsPrivate %s, contained %s', (name, tier, egress, rp, contained) => {
    const t = byName(name);
    expect(t.tier).toBe(tier);
    expect(t.egress).toBe(egress);
    expect(t.readsPrivate).toBe(rp);
    expect(t.contained).toBe(contained);
  });

  it('weather.get uses the weather connector; others use the name prefix', () => {
    expect(byName('weather.get').connector).toBe('weather');
    for (const t of BUILTIN_TOOLS) expect(t.name.startsWith(`${t.connector}.`), t.name).toBe(true);
  });

  it('contained is false for every read and irreversible tool', () => {
    for (const t of BUILTIN_TOOLS) if (t.tier !== 'reversible-write') expect(t.contained, t.name).toBe(false);
  });

  it('every tool name matches the pattern and passes the descriptor schema', () => {
    for (const t of BUILTIN_TOOLS) {
      expect(TOOL_NAME_PATTERN.test(t.name)).toBe(true);
      expect(ToolDescriptorSchema.safeParse(t).success, t.name).toBe(true);
      expect(t.description.length).toBeGreaterThan(0);
    }
  });

  it('every irreversible tool has a name in the spec list', () => {
    expect(BUILTIN_TOOLS.filter((t) => t.tier === 'irreversible').map((t) => t.name).sort()).toEqual([
      'browser.submit',
      'mail.delete',
      'mail.send',
    ]);
  });

  it('descriptor schema enforces contained=false outside reversible-write', () => {
    const base = { ...byName('mail.archive') };
    expect(ToolDescriptorSchema.safeParse(base).success).toBe(true);
    expect(ToolDescriptorSchema.safeParse({ ...base, tier: 'read' }).success).toBe(false);
    expect(ToolDescriptorSchema.safeParse({ ...base, tier: 'irreversible' }).success).toBe(false);
  });

  it('descriptor schema rejects unknown keys, bad names and bad egress', () => {
    const base = { ...byName('mail.archive') };
    expect(ToolDescriptorSchema.safeParse({ ...base, extra: 1 }).success).toBe(false);
    expect(ToolDescriptorSchema.safeParse({ ...base, name: 'Mail' }).success).toBe(false);
    expect(ToolDescriptorSchema.safeParse({ ...base, egress: true }).success).toBe(false);
    expect(ToolDescriptorSchema.safeParse({ ...base, egress: 'some' }).success).toBe(false);
  });

  it('is immutable', () => {
    expect(Object.isFrozen(BUILTIN_TOOLS)).toBe(true);
  });

  it('findTool works on arrays, maps and records', () => {
    const t = byName('mail.send');
    expect(findTool(BUILTIN_TOOLS, 'mail.send')).toEqual(t);
    expect(findTool(new Map([[t.name, t]]), 'mail.send')).toEqual(t);
    expect(findTool({ [t.name]: t }, 'mail.send')).toEqual(t);
    expect(findTool(BUILTIN_TOOLS, 'nope.nope')).toBeUndefined();
  });
});
