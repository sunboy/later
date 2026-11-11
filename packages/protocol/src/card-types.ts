import { z } from 'zod';

export const CARD_TYPES = [
  'brief',
  'digest',
  'meeting',
  'needs-reply',
  'triage-item',
  'draft',
  'monitor',
  'approval',
  'fyi',
  'task',
  'status',
  'review',
  'filed',
] as const;
export const CardTypeSchema = z.enum(CARD_TYPES);
export type CardType = z.infer<typeof CardTypeSchema>;
