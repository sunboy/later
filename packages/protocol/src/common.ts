import { z } from 'zod';

/** Version of the wire protocol defined by this package. */
export const PROTOCOL_VERSION = 1;

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): { ok: true; value: T } => ({ ok: true, value });
export const err = <E>(error: E): { ok: false; error: E } => ({ ok: false, error });

// ---------------------------------------------------------------------------
// Validation issues
// ---------------------------------------------------------------------------

/** A single validation failure, with a stable machine-readable code. */
export interface ValidationIssue {
  code: string;
  path: (string | number)[];
  message: string;
}

/** Converts zod issues to protocol issues. Zod issue codes are kept as-is. */
export function issuesFromZod(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    code: issue.code,
    path: issue.path.map((p) => (typeof p === 'symbol' ? String(p) : p)),
    message: issue.message,
  }));
}

// ---------------------------------------------------------------------------
// Text rules
// ---------------------------------------------------------------------------

/** Length limits, in UTF-16 code units (JavaScript `string.length`). */
export const TEXT_LIMITS = {
  title: 120,
  short: 280,
  body: 4000,
  long: 20000,
} as const;

/**
 * True when the string contains a C0 control character (U+0000 to U+001F)
 * other than line feed (U+000A) and tab (U+0009).
 */
export function hasForbiddenControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c <= 0x1f && c !== 0x0a && c !== 0x09) return true;
  }
  return false;
}

const plainText = (max: number, min: number) =>
  z
    .string()
    .min(min)
    .max(max)
    .refine((s) => !hasForbiddenControlChar(s), {
      message: 'Control characters other than \\n and \\t are not allowed',
    });

/** Non-empty plain text, at most 120 code units. */
export const TitleText = plainText(TEXT_LIMITS.title, 1);
/** Plain text, at most 280 code units. */
export const ShortText = plainText(TEXT_LIMITS.short, 0);
/** Plain text, at most 4000 code units. */
export const BodyText = plainText(TEXT_LIMITS.body, 0);
/** Plain text, at most 20000 code units (draft bodies, transcripts). */
export const LongText = plainText(TEXT_LIMITS.long, 0);

// ---------------------------------------------------------------------------
// Ids and timestamps
// ---------------------------------------------------------------------------

/** Opaque identifier: 1 to 128 characters of `[A-Za-z0-9_.:-]`, starting alphanumeric. */
export const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;

const idString = () => z.string().regex(ID_PATTERN, 'Invalid id');

export const SpaceIdSchema = idString().brand<'SpaceId'>();
export const CardIdSchema = idString().brand<'CardId'>();
export const AgentIdSchema = idString().brand<'AgentId'>();
export const RunIdSchema = idString().brand<'RunId'>();
export const ApprovalIdSchema = idString().brand<'ApprovalId'>();
export const TemplateIdSchema = idString().brand<'TemplateId'>();

export type SpaceId = z.infer<typeof SpaceIdSchema>;
export type CardId = z.infer<typeof CardIdSchema>;
export type AgentId = z.infer<typeof AgentIdSchema>;
export type RunId = z.infer<typeof RunIdSchema>;
export type ApprovalId = z.infer<typeof ApprovalIdSchema>;
export type TemplateId = z.infer<typeof TemplateIdSchema>;

/** ISO 8601 UTC timestamp with a `Z` suffix, for example `2026-11-11T09:00:00Z`. */
export const TimestampSchema = z.iso.datetime();
export type Timestamp = z.infer<typeof TimestampSchema>;

/** An absolute `https:` URL. */
export const HttpsUrlSchema = z.url({ protocol: /^https$/ }).max(2048);

/** Opaque reference to a message in a mail connector. */
export const MessageRefSchema = z.string().min(1).max(TEXT_LIMITS.short);

/** Lowercase hex SHA-256 digest (64 characters). */
export const ArgsHashSchema = z.string().regex(/^[0-9a-f]{64}$/, 'Expected lowercase hex SHA-256');

// ---------------------------------------------------------------------------
// Source and provenance
// ---------------------------------------------------------------------------

export const SOURCE_KINDS = ['email', 'web', 'calendar', 'memory', 'capture', 'tool'] as const;
export const SourceKindSchema = z.enum(SOURCE_KINDS);
export type SourceKind = z.infer<typeof SourceKindSchema>;

export const SOURCE_TRUST = ['user', 'external'] as const;
export const SourceTrustSchema = z.enum(SOURCE_TRUST);
export type SourceTrust = z.infer<typeof SourceTrustSchema>;

/** Trust each source kind must carry, where it is fixed. `memory` and `tool` may be either. */
export const FIXED_SOURCE_TRUST: Readonly<Partial<Record<SourceKind, SourceTrust>>> = Object.freeze(
  {
    email: 'external',
    web: 'external',
    calendar: 'external',
    capture: 'user',
  },
);

const sourceFields = {
  kind: SourceKindSchema,
  ref: z.string().min(1).max(TEXT_LIMITS.short),
  trust: SourceTrustSchema,
  title: TitleText.optional(),
  url: HttpsUrlSchema.optional(),
};

const trustMatchesKind = (s: { kind: SourceKind; trust: SourceTrust }): boolean => {
  const fixed = FIXED_SOURCE_TRUST[s.kind];
  return fixed === undefined || fixed === s.trust;
};
const trustIssue = {
  message: 'email, web and calendar sources must be external; capture sources must be user',
  path: ['trust'],
};

export const SourceSchema = z.strictObject(sourceFields).refine(trustMatchesKind, trustIssue);
export type Source = z.infer<typeof SourceSchema>;

/** A source whose `url` is required. Used by digest tiles. */
export const LinkedSourceSchema = z
  .strictObject({ ...sourceFields, url: HttpsUrlSchema })
  .refine(trustMatchesKind, trustIssue);
export type LinkedSource = z.infer<typeof LinkedSourceSchema>;

export const ProvenanceSchema = z.strictObject({
  agentId: AgentIdSchema,
  runId: RunIdSchema,
  createdAt: TimestampSchema,
  sources: z.array(SourceSchema).max(50),
  untrusted: z.boolean(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;
