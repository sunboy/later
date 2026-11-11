import type { Result, Source, ToolDescriptor } from '@later/protocol';
import { approvalFailure, type Approval } from './approvals.js';
import { canonicalJson, hashArgs } from './canonical.js';
import type { ReasonCode } from './reasons.js';

export interface ToolRequest {
  readonly tool: ToolDescriptor;
  readonly args: unknown;
  /** `hashArgs(tool.name, args)`. */
  readonly argsHash: string;
}

export interface RunContext {
  readonly initiatedBy: 'user' | 'agent' | 'routine';
  readonly ingestedUntrusted: boolean;
}

export type BudgetStatus = 'ok' | 'warned' | 'paused';

export interface PolicyContext {
  spaceId: string;
  grantedConnectors: ReadonlySet<string>;
  /** Tool names the user always allows. Only reversible-write tools are honoured. */
  alwaysAllow: ReadonlySet<string>;
  run: RunContext;
  budgetStatus: BudgetStatus;
  /** The user pressed the explicit action in the client for these exact arguments. */
  userConfirmation?: { argsHash: string };
  /** A previously granted approval being redeemed. */
  approval?: Approval;
  now: Date;
}

export type Outcome = 'allow' | 'require-approval' | 'deny';

export interface Decision {
  outcome: Outcome;
  reason: ReasonCode;
  detail: string;
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const v of Object.values(value)) deepFreeze(v);
    Object.freeze(value);
  }
  return value;
}

/**
 * Builds a tool request whose `argsHash` is computed from the arguments. The
 * arguments are copied through canonical JSON and deep-frozen, so they cannot
 * change after hashing. Throws `CanonicalJsonError` for non-JSON arguments.
 */
export async function buildRequest(tool: ToolDescriptor, args: unknown): Promise<ToolRequest> {
  const copy: unknown = JSON.parse(canonicalJson(args));
  const argsHash = await hashArgs(tool.name, copy);
  return Object.freeze({ tool: Object.freeze({ ...tool }), args: deepFreeze(copy), argsHash });
}

/** True when `request.argsHash` equals `hashArgs(request.tool.name, request.args)`. */
export async function verifyRequest(request: ToolRequest): Promise<boolean> {
  try {
    return (await hashArgs(request.tool.name, request.args)) === request.argsHash;
  } catch {
    return false;
  }
}

const d = (outcome: Outcome, reason: ReasonCode, detail: string): Decision => ({
  outcome,
  reason,
  detail,
});

/**
 * The policy gate. Pure and synchronous. Rules are evaluated in order; the
 * first that applies decides.
 *
 * The request is trusted input: it must come from `buildRequest`, which
 * computes `argsHash`. `decide` does not recompute the hash.
 */
export function decide(request: ToolRequest, context: PolicyContext): Decision {
  const { tool } = request;

  // 1. Connector must be granted to this Space.
  if (!context.grantedConnectors.has(tool.connector)) {
    return d('deny', 'connector-not-granted', `Connector "${tool.connector}" is not granted`);
  }
  // 2. A paused budget blocks everything but reads.
  if (context.budgetStatus === 'paused' && tool.tier !== 'read') {
    return d('deny', 'budget-paused', 'Budget is paused; only read tools may run');
  }
  // 3. Reads are always allowed.
  if (tool.tier === 'read') {
    return d('allow', 'read-only', `"${tool.name}" is a read tool`);
  }
  // 4. A valid approval for this exact tool and argument hash, in this Space.
  const { approval } = context;
  if (
    approval !== undefined &&
    approval.spaceId === context.spaceId &&
    approvalFailure(approval, request, context.now) === null
  ) {
    return d('allow', 'approved', `Approval ${approval.id} matches these exact arguments`);
  }
  // 5. The user confirmed these exact arguments in a run they started.
  if (
    context.userConfirmation !== undefined &&
    context.userConfirmation.argsHash === request.argsHash &&
    context.run.initiatedBy === 'user'
  ) {
    return d('allow', 'user-confirmed', 'The user confirmed these exact arguments');
  }
  // 6. Reversible writes follow the allowlist, unless the run ingested untrusted content.
  if (tool.tier === 'reversible-write') {
    if (!context.alwaysAllow.has(tool.name)) {
      return d('require-approval', 'not-always-allowed', `"${tool.name}" is not always allowed`);
    }
    if (context.run.ingestedUntrusted) {
      return d(
        'require-approval',
        'untrusted-content',
        'This run ingested untrusted content, so the allowlist does not apply',
      );
    }
    return d('allow', 'always-allowed', `"${tool.name}" is always allowed`);
  }
  // 7. Irreversible tools always need approval. The allowlist is ignored.
  return d('require-approval', 'irreversible', `"${tool.name}" is irreversible`);
}

/**
 * Adds a tool to an always-allow set, returning a new set. Only reversible-write
 * tools can be always allowed.
 */
export function addAlwaysAllow(
  set: ReadonlySet<string>,
  tool: ToolDescriptor,
): Result<ReadonlySet<string>, 'not-reversible-write'> {
  if (tool.tier !== 'reversible-write') return { ok: false, error: 'not-reversible-write' };
  return { ok: true, value: new Set([...set, tool.name]) };
}

/** Source kinds whose content is outside the user's control. */
export const UNTRUSTED_SOURCE_KINDS: ReadonlySet<Source['kind']> = new Set(['email', 'web']);

/**
 * Records that a run ingested content from `source`. `ingestedUntrusted`
 * becomes true for email and web sources and never returns to false.
 */
export function markIngested(run: RunContext, source: Pick<Source, 'kind'>): RunContext {
  const ingestedUntrusted = run.ingestedUntrusted || UNTRUSTED_SOURCE_KINDS.has(source.kind);
  return Object.freeze({ ...run, ingestedUntrusted });
}
