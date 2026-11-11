import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BUILTIN_TOOLS,
  CARD_ACTIONS,
  CARD_TYPES,
  PROTOCOL_VERSION,
  SourceSchema,
  ToolDescriptorSchema,
  actionsFor,
  isActionAllowed,
  parseCard,
  parseTemplateManifest,
  summarizePermissions,
  validateTemplateManifest,
} from '../src/index.js';

const fixture = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../fixtures/${path}`, import.meta.url), 'utf8'));

describe('protocol smoke', () => {
  it('has version 1', () => {
    expect(PROTOCOL_VERSION).toBe(1);
  });

  it.each(CARD_TYPES)('parses the %s fixture', (type) => {
    const result = parseCard(fixture(`cards/${type}.json`));
    expect(result).toMatchObject({ ok: true, value: { type } });
  });

  it('rejects unknown keys and control characters', () => {
    const card = fixture('cards/brief.json') as Record<string, unknown>;
    expect(parseCard({ ...card, extra: 1 }).ok).toBe(false);
    expect(parseCard({ ...card, title: 'bell\u0007' }).ok).toBe(false);
  });

  it('enforces source trust by kind and tool containment by tier', () => {
    expect(SourceSchema.safeParse({ kind: 'email', ref: 'm1', trust: 'user' }).success).toBe(false);
    expect(SourceSchema.safeParse({ kind: 'memory', ref: 'm1', trust: 'user' }).success).toBe(true);
    for (const tool of BUILTIN_TOOLS)
      expect(ToolDescriptorSchema.safeParse(tool).success).toBe(true);
    const send = BUILTIN_TOOLS.find((t) => t.name === 'mail.send');
    expect(ToolDescriptorSchema.safeParse({ ...send, contained: true }).success).toBe(false);
    const approval = fixture('cards/approval.json') as { data: Record<string, unknown> };
    const asRead = { ...approval, data: { ...approval.data, tier: 'read' } };
    expect(parseCard(asRead).ok).toBe(false);
    expect(parseCard({ ...asRead, data: { ...asRead.data, risk: 'exfiltration' } }).ok).toBe(true);
  });

  it('only draft.send and approval.approve are irreversible', () => {
    const irreversible = CARD_TYPES.flatMap((t) =>
      CARD_ACTIONS[t].filter((a) => a.effect === 'irreversible').map((a) => `${t}.${a.id}`),
    );
    expect(irreversible.sort()).toEqual(['approval.approve', 'draft.send']);
  });

  it('resolves card actions', () => {
    const parsed = parseCard(fixture('cards/draft.json'));
    if (!parsed.ok) throw new Error('fixture invalid');
    expect(isActionAllowed(parsed.value, 'draft.send')).toBe(true);
    expect(isActionAllowed(parsed.value, 'approve')).toBe(false);
    expect(actionsFor(parsed.value).some((a) => a.id === 'discuss')).toBe(true);
  });

  it('gates send on a recipient check for untrusted drafts to new recipients', () => {
    const draft = fixture('cards/draft.json') as { data: { to: object[] } };
    const toNew = {
      ...draft,
      data: { ...draft.data, to: [{ address: 'x@evil.example', origin: 'new' }] },
    };
    expect(parseCard(toNew).ok).toBe(false);
    const checked = parseCard({ ...toNew, data: { ...toNew.data, needsRecipientCheck: true } });
    if (!checked.ok) throw new Error('expected valid');
    expect(isActionAllowed(checked.value, 'send')).toBe(false);
    expect(isActionAllowed(checked.value, 'confirm-recipient')).toBe(true);
    const confirmed = parseCard({
      ...toNew,
      data: { ...toNew.data, needsRecipientCheck: true, recipientConfirmed: true },
    });
    if (!confirmed.ok) throw new Error('expected valid');
    expect(isActionAllowed(confirmed.value, 'send')).toBe(true);
  });

  it('accepts the valid manifest and summarises it', () => {
    const input = fixture('manifests/valid.json');
    expect(validateTemplateManifest(input, BUILTIN_TOOLS)).toEqual([]);
    const parsed = parseTemplateManifest(input);
    if (!parsed.ok) throw new Error('fixture invalid');
    const summary = summarizePermissions(parsed.value, BUILTIN_TOOLS);
    expect(summary.irreversibleTools).toEqual(['mail.send']);
    expect(summary.openEgressTools).toEqual(['mail.send']);
    expect(summary.fixedEgressTools).toEqual([]);
    expect(summary.models).toEqual(['haiku', 'sonnet']);
  });

  it('reports several issues for the invalid manifest', () => {
    const codes = new Set(
      validateTemplateManifest(fixture('manifests/invalid.json'), BUILTIN_TOOLS).map((i) => i.code),
    );
    for (const code of [
      'starts-paused-not-true',
      'model-not-tier',
      'per-run-exceeds-monthly',
      'duplicate-agent-id',
      'unknown-agent',
      'unknown-tool',
      'connector-not-declared',
      'unrecognized_keys',
    ]) {
      expect(codes).toContain(code);
    }
  });
});
