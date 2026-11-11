import { BUILTIN_TOOLS, type ToolDescriptor } from '@later/protocol';
import {
  buildRequest,
  grant,
  requestApproval,
  type Approval,
  type PolicyContext,
  type RunContext,
  type ToolRequest,
} from '../../src/index.js';

export const tool = (name: string): ToolDescriptor => {
  const found = BUILTIN_TOOLS.find((t) => t.name === name);
  if (found === undefined) throw new Error(`no builtin tool ${name}`);
  return found;
};

/** A reversible-write tool that is not contained (visible to others). */
export const crmUpdate: ToolDescriptor = {
  ...tool('mail.label'),
  name: 'crm.update',
  connector: 'crm',
  contained: false,
  description: 'Update a CRM record',
};

export const NOW = new Date('2026-11-11T09:00:00Z');
export const SPACE = 'space_home';

export const run = (over: Partial<RunContext> = {}): RunContext => ({
  initiatedBy: 'routine',
  ingestedUntrusted: false,
  touchedPrivate: false,
  ...over,
});

export const ALL_CONNECTORS = new Set(['mail', 'web', 'weather', 'calendar', 'memory', 'browser', 'crm']);

export const ctx = (over: Partial<PolicyContext> = {}): PolicyContext => ({
  spaceId: SPACE,
  grantedConnectors: ALL_CONNECTORS,
  alwaysAllow: new Set<string>(),
  run: run(),
  budgetStatus: 'ok',
  now: NOW,
  ...over,
});

export const req = (t: ToolDescriptor | string, args: unknown = { id: 1 }): Promise<ToolRequest> =>
  buildRequest(typeof t === 'string' ? tool(t) : t, args);

export function grantedApproval(
  r: ToolRequest,
  over: { spaceId?: string; id?: string; ttlMs?: number; risk?: 'exfiltration' | 'irreversible' | 'reversible-write' } = {},
): Approval {
  const input = {
    spaceId: over.spaceId ?? SPACE,
    tool: r.tool.name,
    argsHash: r.argsHash,
    tier: r.tool.tier,
    ...(over.ttlMs === undefined ? {} : { ttlMs: over.ttlMs }),
    ...(over.risk === undefined && r.tool.tier !== 'read' ? {} : { risk: over.risk ?? 'exfiltration' }),
  };
  return grant(requestApproval(input, NOW, over.id ?? 'appr_1'), NOW);
}

export const addMs = (d: Date, ms: number): Date => new Date(d.getTime() + ms);
export const iso = (d: Date): string => d.toISOString();
