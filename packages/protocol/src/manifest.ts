import { z } from 'zod';
import {
  AgentIdSchema,
  BodyText,
  HttpsUrlSchema,
  ShortText,
  TemplateIdSchema,
  TitleText,
  issuesFromZod,
  type Result,
  type ValidationIssue,
} from './common.js';
import { CardTypeSchema, type CardType } from './card-types.js';
import {
  BUILTIN_TOOLS,
  ConnectorIdSchema,
  RISK_TIERS,
  ToolNameSchema,
  findTool,
  type Egress,
  type RiskTier,
  type ToolDescriptor,
  type ToolRegistry,
} from './tools.js';

export const MODEL_TIERS = ['haiku', 'sonnet', 'opus'] as const;
export const ModelTierSchema = z.enum(MODEL_TIERS);
export type ModelTier = z.infer<typeof ModelTierSchema>;

/** Five whitespace-separated cron fields (minute hour day-of-month month day-of-week). */
export const CRON_PATTERN = /^[0-9A-Za-z*,/?#LW-]+( [0-9A-Za-z*,/?#LW-]+){4}$/;
/** Dotted lowercase event name, for example `mail.received`. */
export const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/;

const SLUG = /^[a-z][a-z0-9-]{0,39}$/;
const SKILL_SEGMENT = /^[A-Za-z0-9._-]+$/;

/** A relative path with no `.` or `..` segments, no leading slash and no backslashes. */
export function isSafeRelativePath(path: string): boolean {
  if (path.length === 0 || path.length > 256) return false;
  return path.split('/').every((seg) => SKILL_SEGMENT.test(seg) && seg !== '.' && seg !== '..');
}

const positiveMicroUsd = () => z.number().int().positive().max(Number.MAX_SAFE_INTEGER);

export const RoutineTriggerSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('schedule'),
    cron: z.string().regex(CRON_PATTERN, 'Invalid cron'),
  }),
  z.strictObject({
    kind: z.literal('event'),
    event: z.string().max(64).regex(EVENT_NAME_PATTERN, 'Invalid event name'),
  }),
]);
export type RoutineTrigger = z.infer<typeof RoutineTriggerSchema>;

export const TemplateAgentSchema = z.strictObject({
  id: AgentIdSchema,
  name: TitleText,
  persona: BodyText.min(1),
  model: ModelTierSchema,
  tools: z.array(ToolNameSchema).max(64),
});

export const TemplateRoutineSchema = z.strictObject({
  id: z.string().regex(SLUG, 'Invalid routine id'),
  name: TitleText,
  agentId: AgentIdSchema,
  trigger: RoutineTriggerSchema,
  emits: z.array(CardTypeSchema).min(1),
  startsPaused: z.literal(true),
});

export const TemplateConnectorSchema = z.strictObject({
  id: ConnectorIdSchema,
  scopes: z.array(z.string().min(1).max(256)).max(32),
  reason: ShortText.min(1),
});

export const TemplateManifestSchema = z.strictObject({
  manifestVersion: z.literal(1),
  id: TemplateIdSchema,
  name: TitleText,
  description: BodyText,
  author: z.strictObject({ name: TitleText, url: HttpsUrlSchema.optional() }),
  category: z.string().regex(SLUG, 'Invalid category'),
  space: z.strictObject({
    kind: z.enum(['project', 'area', 'list']),
    emblem: ShortText.min(1).max(32),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected #rrggbb'),
  }),
  agents: z.array(TemplateAgentSchema).min(1).max(16),
  routines: z.array(TemplateRoutineSchema).max(32),
  connectors: z.array(TemplateConnectorSchema).max(16),
  budget: z.strictObject({
    monthlyMicroUsd: positiveMicroUsd(),
    perRunMicroUsd: positiveMicroUsd(),
  }),
  skills: z
    .array(
      z.strictObject({
        path: z.string().refine(isSafeRelativePath, 'Must be a relative path without `..`'),
      }),
    )
    .max(32)
    .optional(),
  mcpServers: z
    .array(
      z.strictObject({ name: z.string().regex(SLUG, 'Invalid server name'), url: HttpsUrlSchema }),
    )
    .max(16)
    .optional(),
});
export type TemplateManifest = z.infer<typeof TemplateManifestSchema>;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Issue codes produced beyond plain zod codes. */
export const MANIFEST_ISSUE_CODES = [
  'starts-paused-not-true',
  'model-not-tier',
  'budget-invalid',
  'per-run-exceeds-monthly',
  'duplicate-agent-id',
  'duplicate-routine-id',
  'duplicate-connector-id',
  'unknown-agent',
  'unknown-tool',
  'connector-not-declared',
  'unsafe-skill-path',
] as const;
export type ManifestIssueCode = (typeof MANIFEST_ISSUE_CODES)[number];

function shapeIssues(error: z.ZodError): ValidationIssue[] {
  return issuesFromZod(error).map((issue) => {
    const [first, , third] = issue.path;
    const last = issue.path[issue.path.length - 1];
    if (first === 'routines' && last === 'startsPaused') {
      return { ...issue, code: 'starts-paused-not-true', message: '`startsPaused` must be `true`' };
    }
    if (first === 'agents' && third === 'model' && issue.path.length === 3) {
      return {
        ...issue,
        code: 'model-not-tier',
        message: '`model` must be one of haiku, sonnet, opus (a tier, never a model id)',
      };
    }
    if (first === 'skills' && last === 'path' && issue.code === 'custom') {
      return { ...issue, code: 'unsafe-skill-path' };
    }
    if (first === 'budget' && issue.path.length === 2) {
      return {
        ...issue,
        code: 'budget-invalid',
        message: 'Budget amounts must be positive integers',
      };
    }
    return issue;
  });
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const arrayAt = (v: Record<string, unknown>, key: string): unknown[] => {
  const x = v[key];
  return Array.isArray(x) ? x : [];
};

function duplicates(
  items: unknown[],
  key: string,
  section: string,
  code: ManifestIssueCode,
  out: ValidationIssue[],
): Set<string> {
  const seen = new Set<string>();
  items.forEach((item, i) => {
    if (!isRecord(item) || typeof item[key] !== 'string') return;
    const id = item[key];
    if (seen.has(id)) {
      out.push({ code, path: [section, i, key], message: `Duplicate ${section} id \`${id}\`` });
    }
    seen.add(id);
  });
  return seen;
}

/** Checks that need no tool registry. Runs on raw input so it reports alongside shape issues. */
function structuralIssues(input: unknown): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (!isRecord(input)) return out;
  const agentIds = duplicates(arrayAt(input, 'agents'), 'id', 'agents', 'duplicate-agent-id', out);
  duplicates(arrayAt(input, 'routines'), 'id', 'routines', 'duplicate-routine-id', out);
  duplicates(arrayAt(input, 'connectors'), 'id', 'connectors', 'duplicate-connector-id', out);
  arrayAt(input, 'routines').forEach((r, i) => {
    if (isRecord(r) && typeof r.agentId === 'string' && !agentIds.has(r.agentId)) {
      out.push({
        code: 'unknown-agent',
        path: ['routines', i, 'agentId'],
        message: `Routine refers to unknown agent \`${r.agentId}\``,
      });
    }
  });
  const budget = input.budget;
  if (
    isRecord(budget) &&
    typeof budget.perRunMicroUsd === 'number' &&
    typeof budget.monthlyMicroUsd === 'number' &&
    budget.perRunMicroUsd > budget.monthlyMicroUsd
  ) {
    out.push({
      code: 'per-run-exceeds-monthly',
      path: ['budget', 'perRunMicroUsd'],
      message: '`perRunMicroUsd` must not exceed `monthlyMicroUsd`',
    });
  }
  return out;
}

function registryIssues(input: unknown, registry: ToolRegistry): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (!isRecord(input)) return out;
  const declared = new Set(
    arrayAt(input, 'connectors')
      .filter(isRecord)
      .map((c) => c.id)
      .filter((id): id is string => typeof id === 'string'),
  );
  arrayAt(input, 'agents').forEach((agent, i) => {
    if (!isRecord(agent)) return;
    arrayAt(agent, 'tools').forEach((name, j) => {
      if (typeof name !== 'string') return;
      const tool = findTool(registry, name);
      const path = ['agents', i, 'tools', j];
      if (tool === undefined) {
        out.push({ code: 'unknown-tool', path, message: `Unknown tool \`${name}\`` });
      } else if (!declared.has(tool.connector)) {
        out.push({
          code: 'connector-not-declared',
          path,
          message: `Tool \`${name}\` needs connector \`${tool.connector}\`, which is not declared`,
        });
      }
    });
  });
  return out;
}

/**
 * Parses a manifest: shape, plus the checks that need no tool registry
 * (unique ids, routine agents exist, per-run budget within monthly).
 * Use `validateTemplateManifest` to check tools against a registry.
 */
export function parseTemplateManifest(input: unknown): Result<TemplateManifest, ValidationIssue[]> {
  const parsed = TemplateManifestSchema.safeParse(input);
  const issues = [...(parsed.success ? [] : shapeIssues(parsed.error)), ...structuralIssues(input)];
  if (parsed.success && issues.length === 0) return { ok: true, value: parsed.data };
  return { ok: false, error: issues };
}

/**
 * Validates a manifest completely and returns every issue found; an empty
 * list means the manifest is valid. Never throws.
 */
export function validateTemplateManifest(
  input: unknown,
  registry: ToolRegistry = BUILTIN_TOOLS,
): ValidationIssue[] {
  const parsed = TemplateManifestSchema.safeParse(input);
  return [
    ...(parsed.success ? [] : shapeIssues(parsed.error)),
    ...structuralIssues(input),
    ...registryIssues(input, registry),
  ];
}

// ---------------------------------------------------------------------------
// Permission summary
// ---------------------------------------------------------------------------

export interface ToolPermission {
  name: string;
  connector: string;
  tier: RiskTier;
  description: string;
  egress: Egress;
  readsPrivate: boolean;
  /** Agents in the template that may call this tool. */
  agentIds: string[];
}

export interface PermissionSummary {
  connectors: { id: string; scopes: string[]; reason: string }[];
  toolsByTier: Record<RiskTier, ToolPermission[]>;
  /** Every irreversible tool, by name. The install screen must show each one. */
  irreversibleTools: string[];
  /** Tools that disclose data to a fixed service (the query reaches that provider), by name. */
  fixedEgressTools: string[];
  /** Tools that can send data to a destination the model chooses, by name. */
  openEgressTools: string[];
  /** Tool names not found in the registry. A manifest with any should not be installed. */
  unknownTools: string[];
  routines: {
    id: string;
    name: string;
    agentId: string;
    trigger: RoutineTrigger;
    emits: CardType[];
    startsPaused: true;
  }[];
  models: ModelTier[];
  budget: { monthlyMicroUsd: number; perRunMicroUsd: number };
  skills: string[];
  mcpServers: { name: string; url: string }[];
}

const egressNamed = (byTier: Record<RiskTier, ToolPermission[]>, level: Egress): string[] =>
  RISK_TIERS.flatMap((t) => byTier[t])
    .filter((t) => t.egress === level)
    .map((t) => t.name)
    .sort();

/** What the install screen must show. Tools are sorted by name within each tier. */
export function summarizePermissions(
  manifest: TemplateManifest,
  registry: ToolRegistry = BUILTIN_TOOLS,
): PermissionSummary {
  const byName = new Map<string, { tool: ToolDescriptor; agentIds: string[] }>();
  const unknown = new Set<string>();
  for (const agent of manifest.agents) {
    for (const name of agent.tools) {
      const tool = findTool(registry, name);
      if (tool === undefined) {
        unknown.add(name);
        continue;
      }
      const entry = byName.get(name) ?? { tool, agentIds: [] };
      if (!entry.agentIds.includes(agent.id)) entry.agentIds.push(agent.id);
      byName.set(name, entry);
    }
  }
  const toolsByTier = Object.fromEntries(
    RISK_TIERS.map((t) => [t, [] as ToolPermission[]]),
  ) as Record<RiskTier, ToolPermission[]>;
  for (const { tool, agentIds } of [...byName.values()].sort((x, y) =>
    x.tool.name.localeCompare(y.tool.name),
  )) {
    toolsByTier[tool.tier].push({
      name: tool.name,
      connector: tool.connector,
      tier: tool.tier,
      description: tool.description,
      egress: tool.egress,
      readsPrivate: tool.readsPrivate,
      agentIds,
    });
  }
  const usedModels = new Set(manifest.agents.map((a) => a.model));
  return {
    connectors: manifest.connectors.map((c) => ({
      id: c.id,
      scopes: [...c.scopes],
      reason: c.reason,
    })),
    toolsByTier,
    irreversibleTools: toolsByTier.irreversible.map((t) => t.name),
    fixedEgressTools: egressNamed(toolsByTier, 'fixed'),
    openEgressTools: egressNamed(toolsByTier, 'open'),
    unknownTools: [...unknown].sort(),
    routines: manifest.routines.map((r) => ({
      id: r.id,
      name: r.name,
      agentId: r.agentId,
      trigger: r.trigger,
      emits: [...r.emits],
      startsPaused: r.startsPaused,
    })),
    models: MODEL_TIERS.filter((m) => usedModels.has(m)),
    budget: { ...manifest.budget },
    skills: (manifest.skills ?? []).map((s) => s.path),
    mcpServers: (manifest.mcpServers ?? []).map((s) => ({ name: s.name, url: s.url })),
  };
}
