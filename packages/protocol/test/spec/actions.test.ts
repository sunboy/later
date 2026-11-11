import { describe, expect, it } from 'vitest';
import {
  CARD_ACTIONS,
  CARD_TYPES,
  actionsFor,
  isActionAllowed,
  parseCard,
  type Card,
} from '../../src/index.js';
import { cardFixture, draftCard, withPath, withPaths, type Obj } from './helpers.js';

const card = (o: Obj): Card => {
  const r = parseCard(o);
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
};
const valid = (type: string): Obj => (type === 'draft' ? draftCard() : cardFixture(type));
const effectOf = (c: Card, id: string): string | undefined =>
  actionsFor(c).find((a) => a.id === id)?.effect;

describe('CARD_ACTIONS table', () => {
  it('has an entry for every card type and nothing else', () => {
    expect(Object.keys(CARD_ACTIONS).sort()).toEqual([...CARD_TYPES].sort());
  });

  it('every type includes discuss with effect none', () => {
    for (const type of CARD_TYPES)
      expect(CARD_ACTIONS[type].find((a) => a.id === 'discuss'), type).toEqual({ id: 'discuss', effect: 'none' });
  });

  it('action ids are unique within a type and effects are known', () => {
    for (const type of CARD_TYPES) {
      const ids = CARD_ACTIONS[type].map((a) => a.id);
      expect(new Set(ids).size, type).toBe(ids.length);
      for (const a of CARD_ACTIONS[type]) expect(['none', 'local', 'reversible', 'irreversible']).toContain(a.effect);
    }
  });

  it('the only irreversible actions in the whole table are draft.send and approval.approve', () => {
    const irreversible = CARD_TYPES.flatMap((t) =>
      CARD_ACTIONS[t].filter((a) => a.effect === 'irreversible').map((a) => `${t}.${a.id}`),
    ).sort();
    expect(irreversible).toEqual(['approval.approve', 'draft.send']);
  });

  it('triage-item actions are reply, ignore, snooze, mute, undo, discuss; never reversible or irreversible', () => {
    const acts = CARD_ACTIONS['triage-item'];
    for (const id of ['reply', 'ignore', 'snooze', 'mute', 'undo', 'discuss'])
      expect(acts.some((a) => a.id === id), id).toBe(true);
    for (const a of acts) expect(['none', 'local']).toContain(a.effect);
    expect(acts.find((a) => a.id === 'reply')?.effect).toBe('local');
  });

  it('local actions named by the spec are local', () => {
    for (const type of CARD_TYPES)
      for (const a of CARD_ACTIONS[type])
        if (['dismiss', 'ignore', 'snooze', 'undo', 'file', 'move'].includes(a.id))
          expect(a.effect, `${type}.${a.id}`).toBe('local');
  });

  it('draft.send is irreversible and exists', () => {
    expect(CARD_ACTIONS.draft.find((a) => a.id === 'send')?.effect).toBe('irreversible');
  });
});

describe('actionsFor and isActionAllowed', () => {
  it.each(CARD_TYPES)('%s: discuss is always allowed, qualified or bare', (type) => {
    const c = card(valid(type));
    expect(isActionAllowed(c, 'discuss')).toBe(true);
    expect(isActionAllowed(c, `${type}.discuss`)).toBe(true);
  });

  it('unknown action ids are rejected', () => {
    const c = card(valid('fyi'));
    expect(isActionAllowed(c, 'explode')).toBe(false);
    expect(isActionAllowed(c, '')).toBe(false);
  });

  it('a qualified id must name the card type', () => {
    const c = card(valid('fyi'));
    expect(isActionAllowed(c, 'draft.send')).toBe(false);
    expect(isActionAllowed(c, 'fyi.dismiss')).toBe(true);
  });

  it('triage-item cannot send, approve or delete', () => {
    const c = card(valid('triage-item'));
    for (const id of ['send', 'approve', 'delete', 'revert']) expect(isActionAllowed(c, id), id).toBe(false);
    expect(isActionAllowed(c, 'reply')).toBe(true);
  });

  it('send is offered only on drafts', () => {
    for (const type of CARD_TYPES) {
      const c = card(valid(type));
      if (type === 'draft') continue;
      expect(isActionAllowed(c, 'send'), type).toBe(false);
    }
  });

  it('a plain draft offers send as irreversible', () => {
    const c = card(draftCard());
    expect(effectOf(c, 'send')).toBe('irreversible');
    expect(isActionAllowed(c, 'send')).toBe(true);
    expect(isActionAllowed(c, 'draft.send')).toBe(true);
  });

  it('fyi offers revert only when undo is present', () => {
    const withUndo = card(valid('fyi'));
    expect(isActionAllowed(withUndo, 'revert')).toBe(true);
    const without = card(withPath(valid('fyi'), 'data.undo', undefined));
    expect(isActionAllowed(without, 'revert')).toBe(false);
  });

  it('actionsFor never mutates CARD_ACTIONS', () => {
    const before = JSON.stringify(CARD_ACTIONS);
    for (const type of CARD_TYPES) actionsFor(card(valid(type)));
    expect(JSON.stringify(CARD_ACTIONS)).toBe(before);
  });
});

describe('approval actions (A9)', () => {
  const a = valid('approval');
  it('approving an irreversible risk is irreversible', () => {
    expect(effectOf(card(a), 'approve')).toBe('irreversible');
  });
  it('approving an exfiltration risk is irreversible', () => {
    const c = card(withPaths(a, { 'data.tier': 'read', 'data.risk': 'exfiltration' }));
    expect(effectOf(c, 'approve')).toBe('irreversible');
  });
  it('approving a reversible-write risk is not irreversible', () => {
    const c = card(withPaths(a, { 'data.tier': 'reversible-write', 'data.risk': 'reversible-write' }));
    expect(effectOf(c, 'approve')).not.toBe('irreversible');
    expect(isActionAllowed(c, 'approve')).toBe(true);
  });
  it('deny is local and always offered', () => {
    expect(effectOf(card(a), 'deny')).toBe('local');
  });
});

describe('draft recipient check (A10)', () => {
  const needs = {
    'provenance.untrusted': true,
    'data.to': [{ address: 'evil@example.net', origin: 'new' }],
    'data.needsRecipientCheck': true,
  };
  it('exposes confirm-recipient (local) and withholds send until confirmed', () => {
    const c = card(draftCard(needs));
    expect(effectOf(c, 'confirm-recipient')).toBe('local');
    expect(isActionAllowed(c, 'send')).toBe(false);
    expect(isActionAllowed(c, 'draft.send')).toBe(false);
  });
  it('offers send once recipientConfirmed is true', () => {
    const c = card(draftCard({ ...needs, 'data.recipientConfirmed': true }));
    expect(isActionAllowed(c, 'send')).toBe(true);
    expect(effectOf(c, 'send')).toBe('irreversible');
  });
  it('recipientConfirmed false keeps send withheld', () => {
    const c = card(draftCard({ ...needs, 'data.recipientConfirmed': false }));
    expect(isActionAllowed(c, 'send')).toBe(false);
  });
  it('a draft without needsRecipientCheck does not offer confirm-recipient', () => {
    expect(isActionAllowed(card(draftCard()), 'confirm-recipient')).toBe(false);
  });
  it('the table still has no irreversible action other than draft.send and approve after A10', () => {
    for (const c of [card(draftCard(needs)), card(draftCard({ ...needs, 'data.recipientConfirmed': true }))]) {
      const irr = actionsFor(c).filter((x) => x.effect === 'irreversible').map((x) => x.id);
      expect(irr.every((id) => id === 'send')).toBe(true);
    }
  });
});
