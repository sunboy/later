import { z } from 'zod';
import type { CardType } from './card-types.js';

/**
 * What an action does when the user takes it.
 * - `none`: nothing changes (for example, opening a chat).
 * - `local`: changes only card state (dismiss, ignore, snooze, undo, file, move).
 * - `reversible`: runs a reversible-write tool call.
 * - `irreversible`: runs an irreversible tool call. Always gated by the policy gate.
 */
export const ACTION_EFFECTS = ['none', 'local', 'reversible', 'irreversible'] as const;
export const ActionEffectSchema = z.enum(ACTION_EFFECTS);
export type ActionEffect = z.infer<typeof ActionEffectSchema>;

export const CardActionSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]{0,39}$/),
  effect: ActionEffectSchema,
});
export type CardAction = Readonly<z.infer<typeof CardActionSchema>>;

const a = (id: string, effect: ActionEffect): CardAction => Object.freeze({ id, effect });
const list = (...actions: CardAction[]): readonly CardAction[] => Object.freeze(actions);

const discuss = a('discuss', 'none');
const dismiss = a('dismiss', 'local');
const snooze = a('snooze', 'local');
const undo = a('undo', 'local');
const file = a('file', 'local');
const move = a('move', 'local');

/**
 * The closed list of actions a client may offer, per card type.
 *
 * `approval.approve` is listed with its worst-case effect, `irreversible`.
 * `actionsFor` narrows it to `reversible` for approvals whose tier is
 * `reversible-write`. `fyi.revert` runs the card's undo tool call and is only
 * offered by `actionsFor` when the card carries `data.undo`.
 */
export const CARD_ACTIONS: Readonly<Record<CardType, readonly CardAction[]>> = Object.freeze({
  brief: list(discuss, dismiss, snooze, undo),
  digest: list(discuss, dismiss, snooze, file, undo),
  meeting: list(discuss, dismiss, snooze, undo),
  'needs-reply': list(discuss, dismiss, snooze, undo),
  'triage-item': list(
    discuss,
    a('reply', 'local'),
    a('ignore', 'local'),
    snooze,
    a('mute', 'local'),
    undo,
  ),
  draft: list(discuss, a('edit', 'local'), a('send', 'irreversible'), a('discard', 'local'), snooze, undo),
  monitor: list(discuss, dismiss, snooze, a('mute', 'local'), file, undo),
  approval: list(discuss, a('approve', 'irreversible'), a('deny', 'local')),
  fyi: list(discuss, dismiss, a('revert', 'reversible'), undo),
  task: list(
    discuss,
    a('start', 'local'),
    a('wait', 'local'),
    a('complete', 'local'),
    a('reopen', 'local'),
    snooze,
    move,
    undo,
  ),
  status: list(discuss, dismiss),
  review: list(
    discuss,
    a('keep', 'local'),
    a('pause', 'local'),
    a('archive', 'local'),
    a('nudge', 'local'),
    snooze,
    undo,
  ),
  filed: list(discuss, dismiss, move, undo),
});
