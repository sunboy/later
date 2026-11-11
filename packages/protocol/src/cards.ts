import { z } from 'zod';
import {
  ApprovalIdSchema,
  ArgsHashSchema,
  BodyText,
  CardIdSchema,
  LinkedSourceSchema,
  LongText,
  MessageRefSchema,
  ProvenanceSchema,
  ShortText,
  SourceSchema,
  SpaceIdSchema,
  TimestampSchema,
  TitleText,
  HttpsUrlSchema,
  issuesFromZod,
  type Result,
  type ValidationIssue,
} from './common.js';
import { RiskTierSchema, ToolNameSchema, type RiskTier } from './tools.js';
import { CARD_TYPES, CardTypeSchema, type CardType } from './card-types.js';
import { CARD_ACTIONS } from './action-table.js';

export { CARD_TYPES, CardTypeSchema, type CardType };

/** Card types whose `spaceId` may be null because they can span Spaces. */
export const CROSS_SPACE_CARD_TYPES = ['brief', 'needs-reply', 'review'] as const;

export const CARD_STATES = ['new', 'decided', 'snoozed', 'filed'] as const;
export const CardStateSchema = z.enum(CARD_STATES);
export type CardState = z.infer<typeof CardStateSchema>;

const nonNegativeInt = () => z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

const EmailAddressSchema = z.email().max(320);

const timeRange = <T extends z.ZodObject>(schema: T) =>
  schema.refine(
    (v: Record<string, unknown>) =>
      typeof v.start !== 'string' || typeof v.end !== 'string' || v.end >= v.start,
    { message: '`end` must not be before `start`', path: ['end'] },
  );

// ---------------------------------------------------------------------------
// Data per card type
// ---------------------------------------------------------------------------

export const DayBlockSchema = timeRange(
  z.strictObject({
    start: TimestampSchema,
    end: TimestampSchema,
    label: TitleText,
    spaceId: SpaceIdSchema.optional(),
  }),
);

export const BriefDataSchema = z.strictObject({
  headline: TitleText,
  dayShape: z.array(DayBlockSchema).max(24),
  top: z
    .array(
      z.strictObject({
        text: ShortText.min(1),
        detail: BodyText.optional(),
        cardId: CardIdSchema.optional(),
      }),
    )
    .max(3),
  stats: z
    .array(z.strictObject({ value: ShortText.min(1).max(40), label: TitleText }))
    .max(3)
    .optional(),
});

export const DigestTileSchema = z.strictObject({
  headline: TitleText,
  summary: BodyText,
  source: LinkedSourceSchema,
});

export const DigestDataSchema = z.strictObject({
  tiles: z.array(DigestTileSchema).min(1).max(6),
  foldedCount: nonNegativeInt(),
});

export const MeetingDataSchema = timeRange(
  z.strictObject({
    start: TimestampSchema,
    end: TimestampSchema,
    title: TitleText,
    attendees: z
      .array(z.strictObject({ name: ShortText.min(1), note: ShortText.optional() }))
      .max(100),
    prep: z.array(ShortText.min(1)).max(5),
    joinUrl: HttpsUrlSchema.optional(),
  }),
);

export const NeedsReplyDataSchema = z.strictObject({
  count: nonNegativeInt(),
  itemIds: z.array(CardIdSchema).max(500),
});

export const TriageItemDataSchema = z.strictObject({
  from: z.strictObject({ name: ShortText, address: EmailAddressSchema }),
  subject: ShortText,
  gist: ShortText,
  why: ShortText,
  personNote: ShortText.optional(),
  intents: z.array(ShortText.min(1)).max(4),
  messageRef: MessageRefSchema,
});

const RecipientSchema = z.strictObject({
  name: ShortText.optional(),
  address: EmailAddressSchema,
});

export const DraftDataSchema = z.strictObject({
  to: z.array(RecipientSchema).min(1).max(100),
  cc: z.array(RecipientSchema).max(100).optional(),
  subject: ShortText,
  body: LongText,
  inReplyTo: MessageRefSchema.optional(),
  tone: ShortText.max(40).optional(),
});

export const MonitorDataSchema = z.strictObject({
  subject: ShortText.min(1),
  change: ShortText.min(1),
  before: ShortText.optional(),
  after: ShortText.optional(),
  series: z.array(z.number()).max(60).optional(),
  source: SourceSchema,
});

/** What an approval covers. `exfiltration`: a read tool with open egress in a risky run. */
export const APPROVAL_RISKS = ['reversible-write', 'irreversible', 'exfiltration'] as const;
export const ApprovalRiskSchema = z.enum(APPROVAL_RISKS);
export type ApprovalRisk = z.infer<typeof ApprovalRiskSchema>;

/**
 * True when an approval's tool tier and risk agree: `read` only with
 * `exfiltration`; `irreversible` with `irreversible` or `exfiltration`;
 * `reversible-write` with any risk.
 */
export function isRiskConsistent(tier: RiskTier, risk: ApprovalRisk): boolean {
  if (tier === 'read') return risk === 'exfiltration';
  if (tier === 'irreversible') return risk !== 'reversible-write';
  return true;
}

export const ApprovalDataSchema = z
  .strictObject({
    approvalId: ApprovalIdSchema,
    tool: ToolNameSchema,
    argsHash: ArgsHashSchema,
    argsPreview: z.array(z.strictObject({ label: TitleText, value: BodyText })).max(50),
    recipient: ShortText.optional(),
    tier: RiskTierSchema,
    risk: ApprovalRiskSchema,
    reason: ShortText.min(1),
    expiresAt: TimestampSchema,
  })
  .refine((a) => isRiskConsistent(a.tier, a.risk), {
    message:
      '`tier` may be `read` only when `risk` is `exfiltration`, and an irreversible tool cannot be approved as a reversible write',
    path: ['risk'],
  });

export const FyiDataSchema = z.strictObject({
  summary: BodyText.min(1),
  undo: z
    .strictObject({ tool: ToolNameSchema, argsHash: ArgsHashSchema, until: TimestampSchema })
    .optional(),
});

export const TaskDataSchema = z.strictObject({
  due: TimestampSchema.optional(),
  owner: z.enum(['me', 'agent']),
  status: z.enum(['next', 'doing', 'waiting', 'done']),
  waitingOn: ShortText.optional(),
  chaseAt: TimestampSchema.optional(),
});

export const SPACE_HEALTH = ['on-track', 'needs-you', 'waiting', 'stalled', 'quiet'] as const;

export const StatusDataSchema = z.strictObject({
  line: ShortText.min(1),
  asOf: TimestampSchema,
  health: z.enum(SPACE_HEALTH),
  progress: z
    .strictObject({ done: nonNegativeInt(), total: nonNegativeInt() })
    .refine((p) => p.done <= p.total, { message: '`done` must not exceed `total`', path: ['done'] })
    .optional(),
  nextDate: TimestampSchema.optional(),
});

export const ReviewDataSchema = z.strictObject({
  spaceId: SpaceIdSchema,
  moved: z.array(ShortText.min(1)).max(20),
  stalled: z.array(ShortText.min(1)).max(20),
  proposal: z.enum(['keep', 'pause', 'archive', 'nudge']),
  nudgeWho: ShortText.optional(),
});

export const FiledDataSchema = z.strictObject({
  summary: ShortText.min(1),
  filedInto: SpaceIdSchema,
  fromCapture: LongText,
});

/** Data schema per card type. */
export const CARD_DATA_SCHEMAS = {
  brief: BriefDataSchema,
  digest: DigestDataSchema,
  meeting: MeetingDataSchema,
  'needs-reply': NeedsReplyDataSchema,
  'triage-item': TriageItemDataSchema,
  draft: DraftDataSchema,
  monitor: MonitorDataSchema,
  approval: ApprovalDataSchema,
  fyi: FyiDataSchema,
  task: TaskDataSchema,
  status: StatusDataSchema,
  review: ReviewDataSchema,
  filed: FiledDataSchema,
} as const;

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

/** Action ids: lowercase slug. */
export const ActionIdSchema = z.string().regex(/^[a-z][a-z0-9-]{0,39}$/, 'Invalid action id');

const baseFields = {
  id: CardIdSchema,
  v: z.literal(1),
  title: TitleText,
  provenance: ProvenanceSchema,
  state: CardStateSchema,
  priority: z.number().int().min(0).max(100),
  createdAt: TimestampSchema,
  expiresAt: TimestampSchema.optional(),
  snoozedUntil: TimestampSchema.optional(),
  decidedAction: ActionIdSchema.optional(),
};

function card<T extends CardType, D extends z.ZodType>(type: T, data: D, crossSpace: boolean) {
  return z.strictObject({
    ...baseFields,
    type: z.literal(type),
    spaceId: crossSpace ? SpaceIdSchema.nullable() : SpaceIdSchema,
    data,
  });
}

export const BriefCardSchema = card('brief', BriefDataSchema, true);
export const DigestCardSchema = card('digest', DigestDataSchema, false);
export const MeetingCardSchema = card('meeting', MeetingDataSchema, false);
export const NeedsReplyCardSchema = card('needs-reply', NeedsReplyDataSchema, true);
export const TriageItemCardSchema = card('triage-item', TriageItemDataSchema, false);
export const DraftCardSchema = card('draft', DraftDataSchema, false);
export const MonitorCardSchema = card('monitor', MonitorDataSchema, false);
export const ApprovalCardSchema = card('approval', ApprovalDataSchema, false);
export const FyiCardSchema = card('fyi', FyiDataSchema, false);
export const TaskCardSchema = card('task', TaskDataSchema, false);
export const StatusCardSchema = card('status', StatusDataSchema, false);
export const ReviewCardSchema = card('review', ReviewDataSchema, true);
export const FiledCardSchema = card('filed', FiledDataSchema, false);

const knownActionIds = new Map<CardType, ReadonlySet<string>>(
  CARD_TYPES.map((t) => [t, new Set(CARD_ACTIONS[t].map((x) => x.id))]),
);

export const CardSchema = z
  .discriminatedUnion('type', [
    BriefCardSchema,
    DigestCardSchema,
    MeetingCardSchema,
    NeedsReplyCardSchema,
    TriageItemCardSchema,
    DraftCardSchema,
    MonitorCardSchema,
    ApprovalCardSchema,
    FyiCardSchema,
    TaskCardSchema,
    StatusCardSchema,
    ReviewCardSchema,
    FiledCardSchema,
  ])
  .superRefine((c, ctx) => {
    const snoozed = c.state === 'snoozed';
    if (snoozed && c.snoozedUntil === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['snoozedUntil'],
        message: '`snoozedUntil` is required when state is `snoozed`',
      });
    }
    if (!snoozed && c.snoozedUntil !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['snoozedUntil'],
        message: '`snoozedUntil` is only allowed when state is `snoozed`',
      });
    }
    const ids = knownActionIds.get(c.type);
    if (c.decidedAction !== undefined && ids?.has(c.decidedAction) !== true) {
      ctx.addIssue({
        code: 'custom',
        path: ['decidedAction'],
        message: `\`${c.decidedAction}\` is not an action of ${c.type} cards`,
      });
    }
  });

export type Card = z.infer<typeof CardSchema>;
export type BriefCard = z.infer<typeof BriefCardSchema>;
export type DigestCard = z.infer<typeof DigestCardSchema>;
export type MeetingCard = z.infer<typeof MeetingCardSchema>;
export type NeedsReplyCard = z.infer<typeof NeedsReplyCardSchema>;
export type TriageItemCard = z.infer<typeof TriageItemCardSchema>;
export type DraftCard = z.infer<typeof DraftCardSchema>;
export type MonitorCard = z.infer<typeof MonitorCardSchema>;
export type ApprovalCard = z.infer<typeof ApprovalCardSchema>;
export type FyiCard = z.infer<typeof FyiCardSchema>;
export type TaskCard = z.infer<typeof TaskCardSchema>;
export type StatusCard = z.infer<typeof StatusCardSchema>;
export type ReviewCard = z.infer<typeof ReviewCardSchema>;
export type FiledCard = z.infer<typeof FiledCardSchema>;
export type CardOfType<T extends CardType> = Extract<Card, { type: T }>;

/** Parses untrusted input into a `Card`. Never throws. */
export function parseCard(input: unknown): Result<Card, ValidationIssue[]> {
  const parsed = CardSchema.safeParse(input);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, error: issuesFromZod(parsed.error) };
}
