import { CARD_ACTIONS, type CardAction } from './action-table.js';
import type { Card } from './cards.js';

export { ACTION_EFFECTS, ActionEffectSchema, CARD_ACTIONS, CardActionSchema } from './action-table.js';
export type { ActionEffect, CardAction } from './action-table.js';

const REVERSIBLE_APPROVE: CardAction = Object.freeze({ id: 'approve', effect: 'reversible' });

/**
 * The actions a client may offer for this card, with effects resolved for its data:
 * - `approval.approve` is `reversible` when the approval's tier is `reversible-write`.
 * - `fyi.revert` is offered only when the card has `data.undo`.
 */
export function actionsFor(card: Card): readonly CardAction[] {
  const base = CARD_ACTIONS[card.type];
  switch (card.type) {
    case 'approval':
      return card.data.tier === 'irreversible'
        ? base
        : Object.freeze(base.map((x) => (x.id === 'approve' ? REVERSIBLE_APPROVE : x)));
    case 'fyi':
      return card.data.undo !== undefined
        ? base
        : Object.freeze(base.filter((x) => x.id !== 'revert'));
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
