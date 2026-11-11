import { isRiskConsistent, type ApprovalRisk, type Result, type RiskTier } from '@later/protocol';
import type { ReasonCode } from './reasons.js';

/** Default approval lifetime: 24 hours. */
export const DEFAULT_APPROVAL_TTL_MS = 24 * 60 * 60 * 1000;

export type ApprovalStatus = 'pending' | 'granted' | 'denied' | 'redeemed' | 'expired';
export type { ApprovalRisk };

export interface Approval {
  readonly id: string;
  readonly spaceId: string;
  /** Tool name, for example `mail.send`. */
  readonly tool: string;
  readonly argsHash: string;
  readonly tier: RiskTier;
  /** What the approval covers. `read` tier only with `exfiltration`. */
  readonly risk: ApprovalRisk;
  /** ISO 8601 UTC. */
  readonly requestedAt: string;
  /** ISO 8601 UTC. The approval is expired at and after this instant. */
  readonly expiresAt: string;
  readonly status: ApprovalStatus;
}

export interface ApprovalInput {
  spaceId: string;
  tool: string;
  argsHash: string;
  tier: RiskTier;
  /**
   * Defaults to the tier for `reversible-write` and `irreversible` tools.
   * Required, and must be `exfiltration`, for a `read` tool.
   */
  risk?: ApprovalRisk;
  /** Lifetime in milliseconds. Defaults to `DEFAULT_APPROVAL_TTL_MS`. */
  ttlMs?: number;
}

/** The parts of a tool request that redemption checks. A `ToolRequest` satisfies it. */
export interface RedeemableRequest {
  readonly tool: { readonly name: string };
  readonly argsHash: string;
}

const freeze = (a: Approval): Approval => Object.freeze({ ...a });

/** True when `now` is at or after the approval's expiry. */
export function isExpired(approval: Approval, now: Date): boolean {
  return now.getTime() >= Date.parse(approval.expiresAt);
}

/** Creates a pending approval. */
export function requestApproval(input: ApprovalInput, now: Date, id: string): Approval {
  const ttl = input.ttlMs ?? DEFAULT_APPROVAL_TTL_MS;
  if (!Number.isSafeInteger(ttl) || ttl <= 0) {
    throw new RangeError('requestApproval: ttlMs must be a positive integer');
  }
  const risk = input.risk ?? (input.tier === 'read' ? undefined : input.tier);
  if (risk === undefined || !isRiskConsistent(input.tier, risk)) {
    throw new RangeError(
      `requestApproval: risk ${String(risk)} does not fit tier ${input.tier} (a read tool needs risk "exfiltration")`,
    );
  }
  return freeze({
    id,
    spaceId: input.spaceId,
    tool: input.tool,
    argsHash: input.argsHash,
    tier: input.tier,
    risk,
    requestedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttl).toISOString(),
    status: 'pending',
  });
}

/**
 * Grants a pending approval. A pending approval past its expiry becomes
 * `expired` instead. Any other status is returned unchanged.
 */
export function grant(approval: Approval, now: Date): Approval {
  if (approval.status !== 'pending') return approval;
  return freeze({ ...approval, status: isExpired(approval, now) ? 'expired' : 'granted' });
}

/**
 * Denies a pending approval, or revokes a granted one. A pending approval past
 * its expiry becomes `expired`. Redeemed, denied and expired approvals are
 * returned unchanged.
 */
export function deny(approval: Approval, now: Date): Approval {
  if (approval.status !== 'pending' && approval.status !== 'granted') return approval;
  if (approval.status === 'pending' && isExpired(approval, now)) {
    return freeze({ ...approval, status: 'expired' });
  }
  return freeze({ ...approval, status: 'denied' });
}

/** Marks a pending or granted approval `expired` once its expiry has passed. */
export function expire(approval: Approval, now: Date): Approval {
  if (approval.status !== 'pending' && approval.status !== 'granted') return approval;
  return isExpired(approval, now) ? freeze({ ...approval, status: 'expired' }) : approval;
}

/** Why `approval` cannot authorise `request` at `now`, or `null` when it can. */
export function approvalFailure(
  approval: Approval,
  request: RedeemableRequest,
  now: Date,
): ReasonCode | null {
  if (approval.status === 'redeemed') return 'approval-already-redeemed';
  if (approval.status === 'expired') return 'approval-expired';
  if (approval.status !== 'granted') return 'approval-not-granted';
  if (isExpired(approval, now)) return 'approval-expired';
  if (approval.tool !== request.tool.name) return 'approval-tool-mismatch';
  if (approval.argsHash !== request.argsHash) return 'approval-args-mismatch';
  return null;
}

/**
 * Redeems a granted approval for exactly this tool and argument hash. Single use:
 * the returned approval is `redeemed` and can never be redeemed again.
 */
export function redeem(
  approval: Approval,
  request: RedeemableRequest,
  now: Date,
): Result<Approval, ReasonCode> {
  const failure = approvalFailure(approval, request, now);
  if (failure !== null) return { ok: false, error: failure };
  return { ok: true, value: freeze({ ...approval, status: 'redeemed' }) };
}
