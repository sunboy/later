import { CARD_ACTIONS, type CardAction } from './action-table.js';
import type { Card } from './cards.js';

export {
  ACTION_EFFECTS,
  ActionEffectSchema,
  CARD_ACTIONS,
  CardActionSchema,
} from './action-table.js';
export type { ActionEffect, CardAction } from './action-table.js';

const REVERSIBLE_APPROVE: CardAction = Object.freeze({ id: 'approve', effect: 'reversible' });

/**
 * The actions a client may offer for this card, with effects resolved for its data:
 * - `approval.approve` is `reversible` when the approval's risk is `reversible-write`,
 *   and `irreversible` for `irreversible` and `exfiltration` risks.
 * - `fyi.revert` is offered only when the card has `data.undo`.
 * - A draft with `needsRecipientCheck` offers `confirm-recipient` and withholds
 *   `send` until `recipientConfirmed` is true; other drafts never offer
 *   `confirm-recipient`.
 */
export function actionsFor(card: Card): readonly CardAction[] {
  const base = CARD_ACTIONS[card.type];
  switch (card.type) {
    case 'approval':
      return card.data.risk !== 'reversible-write'
        ? base
        : Object.freeze(base.map((x) => (x.id === 'approve' ? REVERSIBLE_APPROVE : x)));
    case 'fyi':
      return card.data.undo !== undefined
        ? base
        : Object.freeze(base.filter((x) => x.id !== 'revert'));
    case 'draft': {
      const pending =
        card.data.needsRecipientCheck === true && card.data.recipientConfirmed !== true;
      const hidden = pending ? 'send' : 'confirm-recipient';
      return Object.freeze(base.filter((x) => x.id !== hidden));
    }
    default:
      return base;
  }
}

/**
 * True when `actionId` is offered for this card. Accepts the bare id (`send`)
 * or the qualified id (`draft.send`); a qualified id must name the card's type.
 */
export function isActionAllowed(card: Card, actionId: string): boolean {
  let id = actionId;
  const dot = actionId.indexOf('.');
  if (dot !== -1) {
    if (actionId.slice(0, dot) !== card.type) return false;
    id = actionId.slice(dot + 1);
  }
  return actionsFor(card).some((x) => x.id === id);
}
