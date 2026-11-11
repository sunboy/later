/** Every reason the policy gate or approval redemption can give. */
export const REASON_CODES = [
  // decide: deny
  'request-tampered',
  'connector-not-granted',
  'budget-paused',
  // decide: allow
  'read-only',
  'approved',
  'user-confirmed',
  'always-allowed',
  // decide: require-approval
  'exfiltration-risk',
  'not-always-allowed',
  'untrusted-content',
  'irreversible',
  // redeem failures
  'approval-not-granted',
  'approval-already-redeemed',
  'approval-expired',
  'approval-tool-mismatch',
  'approval-args-mismatch',
] as const;

export type ReasonCode = (typeof REASON_CODES)[number];
