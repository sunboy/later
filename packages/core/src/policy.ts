import type { Result, SourceTrust, ToolDescriptor } from '@later/protocol';
import { approvalFailure, redeem, type Approval } from './approvals.js';
import { canonicalJson, hashArgs } from './canonical.js';
import type { ReasonCode } from './reasons.js';

export interface ToolRequest {
  readonly tool: ToolDescriptor;
  readonly args: unknown;
  /** `hashArgs(tool.name, args)`. `decide` recomputes and checks it. */
  readonly argsHash: string;
}

/** Per-run state. Both flags are sticky: once true they stay true for the run. */
export interface RunContext {
  readonly initiatedBy: 'user' | 'agent' | 'routine';
  /** The run ingested content from an external source. */
  readonly ingestedUntrusted: boolean;
  /** The run read the user's private data. */
  readonly touchedPrivate: boolean;
}

export type BudgetStatus = 'ok' | 'warned' | 'paused';

/**
 * The user pressed the explicit action on a paired device for these exact arguments.
 *
 * Core checks hash, device, nonce and age only. The runtime boundary MUST verify
 * the device's signature over `{ argsHash, deviceId, nonce, confirmedAt }` before
 * putting a confirmation in a `PolicyContext`; core cannot verify signatures.
 */
export interface DeviceConfirmation {
  readonly argsHash: string;
  readonly deviceId: string;
  /** Single use. The host persists it after `authorize` consumes it. */
  readonly nonce: string;
  /** ISO 8601 UTC. */
  readonly confirmedAt: string;
}

/** Default maximum age of a device confirmation: 2 minutes. */
export const DEFAULT_CONFIRMATION_MAX_AGE_MS = 120_000;

export interface PolicyContext {
  spaceId: string;
  grantedConnectors: ReadonlySet<string>;
  /** Tool names the user always allows. Only reversible-write tools are honoured. */
  alwaysAllow: ReadonlySet<string>;
  run: RunContext;
  budgetStatus: BudgetStatus;
  userConfirmation?: DeviceConfirmation;
  /** Paired devices whose confirmations are accepted. Missing means none. */
  knownDevices?: ReadonlySet<string>;
  /** Nonces already consumed. Missing means none. */
  usedNonces?: ReadonlySet<string>;
  /** Defaults to `DEFAULT_CONFIRMATION_MAX_AGE_MS`. */
  confirmationMaxAgeMs?: number;
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
 * arguments are copied through canonical JSON and deep-frozen. Throws
 * `CanonicalJsonError` for non-JSON arguments.
 */
export async function buildRequest(tool: ToolDescriptor, args: unknown): Promise<ToolRequest> {
  const copy: unknown = JSON.parse(canonicalJson(args));
  const argsHash = await hashArgs(tool.name, copy);
  return Object.freeze({ tool: Object.freeze({ ...tool }), args: deepFreeze(copy), argsHash });
}

/**
 * True when `request.argsHash` equals `hashArgs(request.tool.name, request.args)`.
 * False, never a throw, for arguments that are not JSON values.
 */
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

function approvalApplies(
  request: ToolRequest,
  context: PolicyContext,
): context is PolicyContext & {
  approval: Approval;
} {
  const { approval } = context;
  return (
    approval !== undefined &&
    approval.spaceId === context.spaceId &&
    approvalFailure(approval, request, context.now) === null
  );
}

function confirmationApplies(
  request: ToolRequest,
  context: PolicyContext,
): context is PolicyContext & { userConfirmation: DeviceConfirmation } {
  const c = context.userConfirmation;
  if (c === undefined) return false;
  if (c.argsHash !== request.argsHash || context.run.initiatedBy !== 'user') return false;
  if (context.knownDevices?.has(c.deviceId) !== true) return false;
  if (context.usedNonces?.has(c.nonce) === true) return false;
  const confirmedAt = Date.parse(c.confirmedAt);
  if (Number.isNaN(confirmedAt)) return false;
  const age = context.now.getTime() - confirmedAt;
  const maxAge = context.confirmationMaxAgeMs ?? DEFAULT_CONFIRMATION_MAX_AGE_MS;
  return age >= 0 && age <= maxAge;
}

/**
 * The policy gate. Pure apart from hashing. Rules are evaluated in order; the
 * first that applies decides. Read-only: nothing is consumed. Hosts execute
 * tools only on `authorize`.
 *
 * 0. `argsHash` must match the arguments, else `deny` (`request-tampered`).
 * 1. Connector not granted: `deny`.
 * 2. Budget paused and tier not `read`: `deny`.
 * 3. `read`: `allow`, unless the tool has egress and the run has both ingested
 *    untrusted content and touched private data. Then rules 4 and 5 may still
 *    allow it; otherwise `require-approval` (`exfiltration-risk`).
 * 4. A valid approval in this Space for this exact tool and hash: `allow`.
 * 5. A valid device confirmation for this hash in a user-initiated run: `allow`.
 * 6. `reversible-write`: needs `alwaysAllow`; an untrusted run also needs `contained`.
 * 7. `irreversible`: `require-approval`.
 */
export async function decide(request: ToolRequest, context: PolicyContext): Promise<Decision> {
  if (!(await verifyRequest(request))) {
    return d('deny', 'request-tampered', 'argsHash does not match the arguments');
  }
  const { tool } = request;
  const { run } = context;

  if (!context.grantedConnectors.has(tool.connector)) {
    return d('deny', 'connector-not-granted', `Connector "${tool.connector}" is not granted`);
  }
  if (context.budgetStatus === 'paused' && tool.tier !== 'read') {
    return d('deny', 'budget-paused', 'Budget is paused; only read tools may run');
  }
  const exfiltrationRisk =
    tool.tier === 'read' && tool.egress && run.ingestedUntrusted && run.touchedPrivate;
  if (tool.tier === 'read' && !exfiltrationRisk) {
    return d('allow', 'read-only', `"${tool.name}" is a read tool`);
  }
  if (approvalApplies(request, context)) {
    return d('allow', 'approved', `Approval ${context.approval.id} matches these exact arguments`);
  }
  if (confirmationApplies(request, context)) {
    return d(
      'allow',
      'user-confirmed',
      'The user confirmed these exact arguments on a paired device',
    );
  }
  if (exfiltrationRisk) {
    return d(
      'require-approval',
      'exfiltration-risk',
      `"${tool.name}" can send data out, and this run has read private data and untrusted content`,
    );
  }
  if (tool.tier === 'reversible-write') {
    if (!context.alwaysAllow.has(tool.name)) {
      return d('require-approval', 'not-always-allowed', `"${tool.name}" is not always allowed`);
    }
    if (run.ingestedUntrusted && !tool.contained) {
      return d(
        'require-approval',
        'untrusted-content',
        'This run ingested untrusted content and the tool is not contained',
      );
    }
    return d('allow', 'always-allowed', `"${tool.name}" is always allowed`);
  }
  return d('require-approval', 'irreversible', `"${tool.name}" is irreversible`);
}

export interface Authorization {
  decision: Decision;
  /**
   * What the host must persist before executing the tool, so it cannot be used
   * twice: the approval, now `redeemed`, or the confirmation nonce.
   */
  consumed?: { approval?: Approval; nonce?: string };
}

/** Decides and, when an approval or confirmation allowed the call, consumes it. */
export async function authorize(
  request: ToolRequest,
  context: PolicyContext,
): Promise<Authorization> {
  const decision = await decide(request, context);
  if (decision.outcome !== 'allow') return { decision };
  if (decision.reason === 'approved' && context.approval !== undefined) {
    const redeemed = redeem(context.approval, request, context.now);
    // `decide` already checked the approval, so redemption cannot fail here.
    if (!redeemed.ok) throw new Error(`authorize: approval redemption failed: ${redeemed.error}`);
    return { decision, consumed: { approval: redeemed.value } };
  }
  if (decision.reason === 'user-confirmed' && context.userConfirmation !== undefined) {
    return { decision, consumed: { nonce: context.userConfirmation.nonce } };
  }
  return { decision };
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

/** Records that a run ingested content from `source`. External sources taint the run. */
export function markIngested(run: RunContext, source: { readonly trust: SourceTrust }): RunContext {
  return Object.freeze({
    ...run,
    ingestedUntrusted: run.ingestedUntrusted || source.trust === 'external',
  });
}

/**
 * Records that a run used a tool. `touchedPrivate` becomes true when the tool
 * reads private data, or when the host reports a private result (for example
 * a memory entry marked private).
 */
export function markToolUsed(
  run: RunContext,
  tool: Pick<ToolDescriptor, 'readsPrivate'>,
  opts?: { privateResult?: boolean },
): RunContext {
  return Object.freeze({
    ...run,
    touchedPrivate: run.touchedPrivate || tool.readsPrivate || opts?.privateResult === true,
  });
}

/** The trust a memory entry written by this run must carry. */
export function memoryTaintFor(run: RunContext): SourceTrust {
  return run.ingestedUntrusted ? 'external' : 'user';
}

/**
 * Whether a memory entry written by this run must be marked private, so that a
 * later read passes `privateResult: true` to `markToolUsed`.
 */
export function memoryPrivacyFor(run: RunContext): boolean {
  return run.touchedPrivate;
}
