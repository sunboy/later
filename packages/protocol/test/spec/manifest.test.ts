import { describe, expect, it } from 'vitest';
import {
  BUILTIN_TOOLS,
  parseTemplateManifest,
  summarizePermissions,
  validateTemplateManifest,
  type TemplateManifest,
  type ToolDescriptor,
} from '../../src/index.js';
import { fixture, withPath, withPaths, type Obj } from './helpers.js';

const valid = (): Obj => fixture('manifests/valid.json');
const issues = (m: unknown, reg?: readonly ToolDescriptor[]): string[] =>
  validateTemplateManifest(m, reg).map((i) => i.code);
const parsed = (m: Obj): TemplateManifest => {
  const r = parseTemplateManifest(m);
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
};

describe('valid fixture', () => {
  it('has no issues and parses', () => {
    expect(validateTemplateManifest(valid())).toEqual([]);
    expect(parseTemplateManifest(valid()).ok).toBe(true);
  });
  it('the invalid fixture produces several issues', () => {
    const codes = issues(fixture('manifests/invalid.json'));
    for (const c of [
      'starts-paused-not-true',
      'model-not-tier',
      'per-run-exceeds-monthly',
      'duplicate-agent-id',
      'unknown-agent',
      'unknown-tool',
      'connector-not-declared',
      'unsafe-skill-path',
      'unrecognized_keys',
    ])
      expect(codes, c).toContain(c);
    expect(parseTemplateManifest(fixture('manifests/invalid.json')).ok).toBe(false);
  });
  it('never throws on garbage', () => {
    for (const g of [null, 1, 'x', [], {}]) {
      expect(() => validateTemplateManifest(g)).not.toThrow();
      expect(validateTemplateManifest(g).length).toBeGreaterThan(0);
      expect(parseTemplateManifest(g).ok).toBe(false);
    }
  });
});

describe('each validation rule produces an issue', () => {
  it('startsPaused must be literally true', () => {
    for (const v of [false, 'true', 1, undefined]) {
      const m = withPath(valid(), 'routines.0.startsPaused', v);
      expect(issues(m), String(v)).toContain('starts-paused-not-true');
      expect(parseTemplateManifest(m).ok).toBe(false);
    }
  });
  it('routine agentId must exist', () => {
    const m = withPath(valid(), 'routines.0.agentId', 'ghost');
    expect(issues(m)).toContain('unknown-agent');
    expect(parseTemplateManifest(m).ok).toBe(false);
  });
  it('agent ids must be unique', () => {
    const m = withPath(valid(), 'agents.1.id', 'inbox-watcher');
    expect(issues(m)).toContain('duplicate-agent-id');
  });
  it('routine ids must be unique', () => {
    const m = withPath(valid(), 'routines.1.id', 'morning-sort');
    expect(issues(m)).toContain('duplicate-routine-id');
  });
  it('connector ids must be unique', () => {
    const m = withPath(valid(), 'connectors.1.id', 'mail');
    expect(issues(m)).toContain('duplicate-connector-id');
  });
  it('every tool must exist in the registry passed to the validator', () => {
    const m = withPath(valid(), 'agents.0.tools', ['mail.read', 'shell.exec']);
    expect(issues(m)).toContain('unknown-tool');
    const small = BUILTIN_TOOLS.filter((t) => t.name !== 'memory.read');
    expect(issues(valid(), small)).toContain('unknown-tool');
    expect(issues(valid(), BUILTIN_TOOLS)).not.toContain('unknown-tool');
  });
  it('accepts a custom registry as map or record', () => {
    const rec = Object.fromEntries(BUILTIN_TOOLS.map((t) => [t.name, t]));
    expect(validateTemplateManifest(valid(), rec)).toEqual([]);
    expect(validateTemplateManifest(valid(), new Map(Object.entries(rec)))).toEqual([]);
  });
  it('a tool whose connector is not declared is reported', () => {
    const m = withPath(valid(), 'connectors', [valid()['connectors'] as unknown[]][0]?.slice(1));
    expect(issues(m)).toContain('connector-not-declared');
  });
  it('perRunMicroUsd must not exceed monthlyMicroUsd', () => {
    const m = withPaths(valid(), { 'budget.monthlyMicroUsd': 1000, 'budget.perRunMicroUsd': 1001 });
    expect(issues(m)).toContain('per-run-exceeds-monthly');
    expect(issues(withPaths(valid(), { 'budget.monthlyMicroUsd': 1000, 'budget.perRunMicroUsd': 1000 }))).not.toContain(
      'per-run-exceeds-monthly',
    );
  });
  it.each([
    ['monthlyMicroUsd', 0],
    ['monthlyMicroUsd', -5],
    ['monthlyMicroUsd', 1.5],
    ['perRunMicroUsd', 0],
    ['perRunMicroUsd', -1],
    ['perRunMicroUsd', 0.5],
  ])('budget.%s = %s is rejected', (k, v) => {
    const m = withPath(valid(), `budget.${k}`, v);
    expect(validateTemplateManifest(m).length).toBeGreaterThan(0);
    expect(parseTemplateManifest(m).ok).toBe(false);
  });
  it('budget as a string or missing is rejected', () => {
    expect(parseTemplateManifest(withPath(valid(), 'budget.monthlyMicroUsd', '5000000')).ok).toBe(false);
    expect(parseTemplateManifest(withPath(valid(), 'budget', undefined)).ok).toBe(false);
  });
  it('model must be a tier name, never a model id', () => {
    for (const model of ['claude-haiku-5-5', 'gpt-4', 'Haiku', '']) {
      const m = withPath(valid(), 'agents.0.model', model);
      expect(issues(m), model).toContain('model-not-tier');
      expect(parseTemplateManifest(m).ok).toBe(false);
    }
    for (const model of ['haiku', 'sonnet', 'opus'])
      expect(validateTemplateManifest(withPath(valid(), 'agents.0.model', model))).toEqual([]);
  });
  it('rejects unknown keys at every level', () => {
    for (const p of [
      'extra',
      'author.extra',
      'space.extra',
      'agents.0.extra',
      'routines.0.extra',
      'routines.0.trigger.extra',
      'connectors.0.extra',
      'budget.extra',
      'skills.0.extra',
      'mcpServers.0.extra',
    ]) {
      const m = withPath(valid(), p, 1);
      expect(parseTemplateManifest(m).ok, p).toBe(false);
      expect(issues(m), p).toContain('unrecognized_keys');
    }
  });
  it('skill paths must be relative without traversal', () => {
    for (const path of ['../x', 'a/../../x', '/etc/passwd', 'skills/../..', '..', 'a\\b', 'C:\\x']) {
      const m = withPath(valid(), 'skills', [{ path }]);
      expect(validateTemplateManifest(m).length, path).toBeGreaterThan(0);
      expect(parseTemplateManifest(m).ok, path).toBe(false);
    }
    expect(validateTemplateManifest(withPath(valid(), 'skills', [{ path: 'skills/a-b_c.d' }]))).toEqual([]);
  });
  it('skills and mcpServers are optional', () => {
    const m = withPaths(valid(), { skills: undefined, mcpServers: undefined });
    expect(validateTemplateManifest(m)).toEqual([]);
  });
  it('mcp server urls must be https', () => {
    for (const url of ['http://mcp.example.com', 'ftp://x.example.com', 'mcp.example.com', 'javascript:alert(1)']) {
      const m = withPath(valid(), 'mcpServers', [{ name: 'notes', url }]);
      expect(parseTemplateManifest(m).ok, url).toBe(false);
    }
  });
  it('manifestVersion must be 1', () => {
    expect(parseTemplateManifest(withPath(valid(), 'manifestVersion', 2)).ok).toBe(false);
  });
  it('trigger must be a schedule or an event', () => {
    expect(parseTemplateManifest(withPath(valid(), 'routines.0.trigger', { kind: 'webhook', url: 'x' })).ok).toBe(false);
    expect(parseTemplateManifest(withPath(valid(), 'routines.0.trigger', { kind: 'schedule' })).ok).toBe(false);
  });
  it('emits must be known card types and non-empty', () => {
    expect(parseTemplateManifest(withPath(valid(), 'routines.0.emits', ['banner'])).ok).toBe(false);
  });
  it('space kind enum', () => {
    expect(parseTemplateManifest(withPath(valid(), 'space.kind', 'folder')).ok).toBe(false);
  });
  it('plain text rules apply to persona and name', () => {
    expect(parseTemplateManifest(withPath(valid(), 'agents.0.persona', 'a\u0000b')).ok).toBe(false);
    expect(parseTemplateManifest(withPath(valid(), 'name', 'x'.repeat(121))).ok).toBe(false);
    expect(parseTemplateManifest(withPath(valid(), 'description', 'x'.repeat(4001))).ok).toBe(false);
  });
  it('a tool name that is not well formed is rejected', () => {
    expect(parseTemplateManifest(withPath(valid(), 'agents.0.tools', ['MailSend'])).ok).toBe(false);
  });
  it('multiple violations are all reported together', () => {
    const m = withPaths(valid(), {
      'routines.0.startsPaused': false,
      'routines.1.agentId': 'ghost',
      'agents.0.model': 'claude-x',
    });
    const codes = issues(m);
    expect(codes).toEqual(expect.arrayContaining(['starts-paused-not-true', 'unknown-agent', 'model-not-tier']));
  });
});

describe('summarizePermissions', () => {
  const s = summarizePermissions(parsed(valid()));
  it('lists connectors with scopes and reasons', () => {
    expect(s.connectors.map((c) => c.id).sort()).toEqual(['mail', 'memory']);
    const mail = s.connectors.find((c) => c.id === 'mail');
    expect(mail?.scopes).toEqual(['https://www.googleapis.com/auth/gmail.modify']);
    expect(mail?.reason).toBe('Read, label and draft mail');
  });
  it('groups tools by risk tier', () => {
    expect(s.toolsByTier.read.map((t) => t.name).sort()).toEqual(['mail.read', 'mail.search', 'memory.read']);
    expect(s.toolsByTier['reversible-write'].map((t) => t.name).sort()).toEqual([
      'mail.create_draft',
      'mail.label',
      'memory.write',
    ]);
    expect(s.toolsByTier.irreversible.map((t) => t.name)).toEqual(['mail.send']);
  });
  it('lists every irreversible tool explicitly', () => {
    expect(s.irreversibleTools).toEqual(['mail.send']);
    const m = withPath(valid(), 'agents.1.tools', ['mail.delete', 'browser.submit']);
    const s2 = summarizePermissions(parsed(m));
    expect([...s2.irreversibleTools].sort()).toEqual(['browser.submit', 'mail.delete', 'mail.send']);
  });
  it('separates open and fixed egress', () => {
    const m = withPath(valid(), 'agents.1.tools', ['web.search', 'weather.get', 'web.fetch', 'mail.read']);
    const s2 = summarizePermissions(parsed(m));
    expect([...s2.fixedEgressTools].sort()).toEqual(['weather.get', 'web.search']);
    expect([...s2.openEgressTools].sort()).toEqual(['mail.send', 'web.fetch']);
    for (const n of s2.fixedEgressTools) expect(s2.openEgressTools).not.toContain(n);
  });
  it('has no egress tools when none are used', () => {
    const m = withPath(valid(), 'agents.0.tools', ['mail.read']);
    const s2 = summarizePermissions(parsed(m));
    expect(s2.openEgressTools).toEqual([]);
    expect(s2.fixedEgressTools).toEqual([]);
    expect(s2.irreversibleTools).toEqual([]);
  });
  it('lists routines with trigger and emitted cards, models, budget', () => {
    expect(s.routines).toHaveLength(2);
    expect(s.routines[0]).toMatchObject({
      id: 'morning-sort',
      agentId: 'inbox-watcher',
      trigger: { kind: 'schedule', cron: '30 6 * * 1-5' },
      emits: ['triage-item', 'needs-reply'],
    });
    expect(s.models).toEqual(['haiku', 'sonnet']);
    expect(s.budget).toEqual({ monthlyMicroUsd: 5000000, perRunMicroUsd: 50000 });
  });
  it('reports which agents use each tool', () => {
    const read = s.toolsByTier.read.find((t) => t.name === 'mail.read');
    expect([...(read?.agentIds ?? [])].sort()).toEqual(['drafter', 'inbox-watcher']);
  });
  it('lists skills and MCP servers', () => {
    expect(s.skills).toEqual(['skills/voice-match']);
    expect(s.mcpServers).toEqual([{ name: 'notes', url: 'https://mcp.example.com/notes' }]);
  });
  it('flags unknown tools instead of dropping them silently', () => {
    const m = parsed(valid());
    const s2 = summarizePermissions(m, BUILTIN_TOOLS.filter((t) => t.name !== 'mail.send'));
    expect(s2.unknownTools).toContain('mail.send');
  });
});
