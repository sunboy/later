/* Example compositions. In the product an agent writes these specs from the Space's memory, mail and calendar;
   here they are written by hand so the same client can be shown composing five different situations through time. */
import type { AgentId, ViewSpec } from '../spec/types';
import type { Glyph } from '../icons';
import { blk, consent, gbpm, src, view } from './util';

export type StepId = 'before' | 'today' | 'eve' | 'after';
export const STEP_LABEL: Record<StepId, string> = { before: 'A week earlier', today: 'Today', eve: 'Day before the deadline', after: 'After it’s done' };
export interface Step { id: StepId; date: string; spec: ViewSpec }
export interface SpaceDef { id: string; name: string; glyph: Glyph; crew: Exclude<AgentId, 'keep'>; deadline: string; steps: Step[] }

/* ---------------- Japan in April (Juno) ---------------- */
const FARES = [
  ['24 Sep', 94100], ['1 Oct', 91800], ['8 Oct', 88400], ['15 Oct', 90200], ['22 Oct', 86100], ['29 Oct', 83800], ['5 Nov', 81200],
  ['12 Nov', 74200], ['19 Nov', 74800],
] as const;
const fares = (from: number) => FARES.slice(from, from + 7).map(([x, y]) => ({ x, y }));
const fareSrc = src('Skyscanner, BA and JAL', 'web', 'checked daily at 07:00');
const flights = (form: 'columns' | 'table', only?: string[]) => ({
  question: 'Three ways to Tokyo, return for two',
  form,
  options: [
    { id: 'ba', name: 'BA direct', price: gbpm(1484), facts: [{ k: 'Flight time', v: '14 h 05' }, { k: 'Stops', v: 'Direct' }, { k: 'Bags', v: '1 each' }, { k: 'Out', v: '6 Apr, 13:10' }], note: 'Heathrow T5 to Haneda' },
    { id: 'jal', name: 'JAL direct', price: gbpm(1596), facts: [{ k: 'Flight time', v: '13 h 50' }, { k: 'Stops', v: 'Direct' }, { k: 'Bags', v: '2 each' }, { k: 'Out', v: '6 Apr, 19:20' }] },
    { id: 'ay', name: 'Finnair', price: gbpm(1222), facts: [{ k: 'Flight time', v: '17 h 40' }, { k: 'Stops', v: 'Helsinki' }, { k: 'Bags', v: '1 each' }, { k: 'Out', v: '6 Apr, 07:25' }] },
  ].filter(o => !only || only.includes(o.id)),
  recommended: 'ba',
  reason: 'Direct both ways, back by 20 April, and the lowest BA fare since Juno started watching. Finnair saves £262 but adds about 7 hours.',
  source: fareSrc,
});
const itinerary = (state: 'plan' | 'booked') => ({
  steps: [
    { id: 'out', date: '6 Apr', label: 'Fly to Tokyo', detail: 'BA 005, Heathrow T5 13:10, lands Haneda 09:15 next day', state: state === 'booked' ? 'now' as const : 'next' as const },
    { id: 'tokyo', date: '7 Apr', label: 'Tokyo, 4 nights', detail: 'Hotel near Shinjuku, booked by you in October', state: 'next' as const },
    { id: 'kyoto', date: '11 Apr', label: 'Kyoto, 4 nights', detail: 'Juno is comparing two ryokan near Gion', state: 'next' as const },
    { id: 'osaka', date: '15 Apr', label: 'Osaka, 2 nights', state: 'next' as const },
    { id: 'hakone', date: '17 Apr', label: 'Hakone, 3 nights', detail: 'Ellie’s pick, from your notes', state: 'next' as const },
    { id: 'home', date: '20 Apr', label: 'Fly home', detail: 'BA 008, Haneda 11:05, lands Heathrow 15:40', state: 'next' as const },
  ],
});
const fortnight = (selected?: string) => ({
  question: 'Which fortnight?',
  options: [
    { id: 'early', label: '6 to 20 April', detail: 'Late blossom in Kyoto, if it holds' },
    { id: 'late', label: '13 to 27 April', detail: 'About £90 cheaper each, after the blossom' },
  ],
  ...(selected ? { selected } : {}),
});

const japan: SpaceDef = {
  id: 'japan', name: 'Japan in April', glyph: 'plane', crew: 'juno', deadline: 'BA holds the fare until Fri 20 Nov, 18:00',
  steps: [
    { id: 'before', date: 'Thu 5 Nov', spec: view('japan', '2026-11-05T08:00:00Z', 'juno', [
      blk('headline', 'head', { title: 'Watching fares for April', line: 'Juno checks Heathrow to Tokyo for two, every morning.', crew: 'juno' }),
      blk('choice', 'when', fortnight(), { emphasis: 'loud' }),
      blk('series', 'fares', { kind: 'line', format: 'money', label: 'Cheapest direct return, each', points: fares(0), source: fareSrc }),
      blk('prose', 'note', { text: 'BA and JAL have both opened April seats. Juno checks three sites every morning and will tell you when a direct fare drops under £750.', sources: [src('BA', 'web', '4 Nov'), src('your notes', 'memory')] }, { size: 'small' }),
      blk('timeline', 'plan', itinerary('plan'), { size: 'small' }),
    ]) },
    { id: 'today', date: 'Thu 12 Nov', spec: view('japan', '2026-11-12T08:00:00Z', 'juno', [
      blk('headline', 'head', { title: 'The direct fare dropped', line: 'Down £70 overnight. Juno has three options ready.', crew: 'juno' }),
      blk('stat', 'low', { value: 74200, format: 'money', label: 'BA direct, return each', trend: { delta: -7000, basis: 'since last Thursday' } }, { size: 'small' }),
      blk('series', 'fares', { kind: 'line', format: 'money', label: 'Cheapest direct, 7 weeks', points: fares(1), source: fareSrc }, { size: 'small' }),
      blk('comparison', 'flights', flights('columns'), { size: 'large', emphasis: 'loud' }),
      blk('timeline', 'plan', itinerary('plan')),
      blk('choice', 'when', fortnight('early'), { emphasis: 'quiet' }),
    ]) },
    { id: 'eve', date: 'Thu 19 Nov', spec: view('japan', '2026-11-19T08:00:00Z', 'juno', [
      blk('headline', 'head', { title: 'The held fare ends tomorrow', line: 'BA holds £1,484 for two until Friday at 18:00. After that it goes back to the open price.', crew: 'juno' }),
      blk('stat', 'left', { value: 1, format: 'days', label: 'Left on the held fare, until Fri 18:00' }, { size: 'small', emphasis: 'loud' }),
      blk('series', 'fares', { kind: 'line', format: 'money', label: 'Cheapest direct, 7 weeks', points: fares(2), source: fareSrc }, { size: 'small' }),
      blk('pay', 'book', { payee: 'British Airways', amount: gbpm(1484), reference: 'Hold 7HKQ2M', account: 'Card on your BA account', due: 'Hold ends Fri 18:00', opens: 'BA’s booking page' }),
      blk('comparison', 'flights', flights('columns', ['ba']), { size: 'small', emphasis: 'quiet' }),
      blk('timeline', 'plan', itinerary('plan'), { size: 'small' }),
    ]) },
    { id: 'after', date: 'Sat 21 Nov', spec: view('japan', '2026-11-21T08:00:00Z', 'juno', [
      blk('headline', 'head', { title: 'Booked. Tokyo, 6 to 20 April', line: 'Juno filed the e-tickets and is looking at ryokan in Kyoto.', crew: 'juno' }),
      blk('timeline', 'plan', itinerary('booked'), { size: 'large', emphasis: 'loud' }),
      blk('checklist', 'todo', { items: [
        { id: 'pass', text: 'Check both passports are in date', owner: 'me', done: false, due: 'by January' },
        { id: 'cal', text: 'Flights added to your calendar', owner: 'crew', crew: 'juno', done: true },
        { id: 'jr', text: 'Compare a rail pass with single tickets', owner: 'crew', crew: 'juno', done: false },
        { id: 'ryo', text: 'Shortlist two ryokan near Gion', owner: 'crew', crew: 'juno', done: false },
      ] }),
      blk('media', 'ryokan', { items: [
        { id: 'r1', title: 'Gion Hatanaka', caption: 'Dinner included, 6 min to Yasaka' },
        { id: 'r2', title: 'Ryokan Motonago', caption: 'Smaller, garden rooms, £40 less a night' },
      ].map(i => ({ ...i, thumb: 'ryokan' as const })) }, { size: 'small' }),
      blk('quote', 'conf', { text: 'Your booking is confirmed. Booking reference 7HKQ2M. Two passengers, London Heathrow to Tokyo Haneda.', by: 'British Airways', source: src('booking email', 'email', '20 Nov, 17:42') }, { emphasis: 'quiet' }),
    ]) },
  ],
};

/* ---------------- House move (Scout) ---------------- */
const houseSteps = (stage: 0 | 1 | 2 | 3) => ({
  steps: [
    { id: 'offer', date: '2 Oct', label: 'Offer accepted', state: 'done' as const },
    { id: 'survey', date: '17 Nov', label: 'Survey at 14 Ashby Road', detail: 'Dave Ellis, Ellis Surveying, 10:00', state: stage >= 2 ? 'done' as const : stage === 1 ? 'now' as const : 'next' as const },
    { id: 'mortgage', date: '20 Nov', label: 'Mortgage offer', detail: 'Nationwide, after the valuation', state: stage >= 2 ? 'done' as const : 'next' as const },
    { id: 'exchange', date: '27 Nov', label: 'Exchange contracts', detail: 'Deposit of £38,500 goes to Shah & Co the day before', state: stage === 3 ? 'done' as const : stage === 2 ? 'now' as const : 'next' as const },
    { id: 'complete', date: '11 Dec', label: 'Completion and keys', detail: 'Two Vans booked from 08:00', state: stage === 3 ? 'done' as const : 'next' as const },
  ].map((s, i) => (stage === 0 && i === 1 ? { ...s, label: 'Book the survey', state: 'now' as const } : s)),
});
const priya = { id: 'priya', name: 'Priya Shah', role: 'Solicitor, Shah & Co', note: 'Prefers a call before 10. Ask for Priya, not the main line.', initials: 'PS' };
const dave = { id: 'dave', name: 'Dave Ellis', role: 'Surveyor, Ellis Surveying', note: 'Needs the loft hatch clear. Last time he asked for a ladder.', initials: 'DE' };
const daveMail = consent('reply', { name: 'Dave Ellis, Ellis Surveying', address: 'dave@ellissurveying.co.uk' }, 'Re: Loft access on Tuesday',
  'Hi Dave, Tuesday at 10 works. The hatch is in the back bedroom and I’ll leave the ladder out. Thanks, Sam');

const house: SpaceDef = {
  id: 'house', name: 'House move', glyph: 'house', crew: 'scout', deadline: 'Exchange of contracts, Fri 27 Nov',
  steps: [
    { id: 'before', date: 'Thu 5 Nov', spec: view('house', '2026-11-05T08:00:00Z', 'scout', [
      blk('headline', 'head', { title: 'Survey first, then exchange', line: 'Scout is chasing a survey date and two more removal quotes.', crew: 'scout' }),
      blk('timeline', 'steps', houseSteps(0)),
      blk('checklist', 'todo', { items: [
        { id: 'id', text: 'Send Priya your ID and proof of address', owner: 'me', done: false, due: 'this week' },
        { id: 'q', text: 'Get three removal quotes', owner: 'crew', crew: 'scout', done: false },
        { id: 'sv', text: 'Find a surveyor free next week', owner: 'crew', crew: 'scout', done: false },
      ] }),
      blk('people', 'who', { people: [priya] }, { size: 'small' }),
    ]) },
    { id: 'today', date: 'Thu 12 Nov', spec: view('house', '2026-11-12T08:00:00Z', 'scout', [
      blk('headline', 'head', { title: 'Survey on Tuesday', line: 'Dave needs to get into the loft. Scout drafted your reply.', crew: 'scout' }),
      daveMail,
      blk('checklist', 'todo', { items: [
        { id: 'id', text: 'Send Priya your ID and proof of address', owner: 'me', done: true },
        { id: 'loft', text: 'Clear the loft hatch for Dave', owner: 'me', done: false, due: 'by Tue' },
        { id: 'piano', text: 'Tell the movers about the piano', owner: 'me', done: false, due: 'by Fri' },
        { id: 'q', text: 'Three removal quotes in', owner: 'crew', crew: 'scout', done: true },
        { id: 'sv', text: 'Survey booked, Tue 17 Nov 10:00', owner: 'crew', crew: 'scout', done: true },
        { id: 'srch', text: 'Chase Priya for the local searches', owner: 'crew', crew: 'scout', done: false },
      ] }, { size: 'large' }),
      blk('people', 'who', { people: [dave, priya] }),
      blk('timeline', 'steps', houseSteps(1)),
    ]) },
    { id: 'eve', date: 'Thu 26 Nov', spec: view('house', '2026-11-26T08:00:00Z', 'scout', [
      blk('headline', 'head', { title: 'Exchange is tomorrow', line: 'Priya needs the deposit in Shah & Co’s client account today.', crew: 'scout' }, { emphasis: 'loud' }),
      blk('stat', 'dep', { value: 3850000, format: 'money', label: 'Deposit, 10% of the price' }, { size: 'small' }),
      blk('stat', 'docs', { value: 1, format: 'count', label: 'Document Priya still needs' }, { size: 'small' }),
      blk('pay', 'deposit', { payee: 'Shah & Co Solicitors client account', amount: gbpm(38500), reference: 'REID-ASHBY-14', account: '30-94-12, ending 5520', due: 'Today, before 15:00', opens: 'your bank' }),
      blk('people', 'who', { people: [priya] }, { size: 'large' }),
      blk('checklist', 'todo', { items: [
        { id: 'sign', text: 'Sign the contract Priya posted', owner: 'me', done: false, due: 'today' },
        { id: 'piano', text: 'Movers told about the piano', owner: 'me', done: true },
        { id: 'srch', text: 'Local searches back, all clear', owner: 'crew', crew: 'scout', done: true },
      ] }, { size: 'small' }),
      blk('timeline', 'steps', houseSteps(2), { size: 'small' }),
    ]) },
    { id: 'after', date: 'Sat 12 Dec', spec: view('house', '2026-12-12T09:00:00Z', 'scout', [
      blk('headline', 'head', { title: 'Moved in', line: 'Completion went through on 11 December. Scout is tidying up the loose ends.', crew: 'scout' }),
      blk('quote', 'done', { text: 'Completion took place at 12:40 today and the agents have released the keys. Congratulations on your new home.', by: 'Priya Shah', source: src('Shah & Co email', 'email', '11 Dec, 12:52') }),
      blk('checklist', 'todo', { items: [
        { id: 'meters', text: 'Photograph the meter readings', owner: 'me', done: false, due: 'this weekend' },
        { id: 'gym', text: 'Cancel the gym on Kentish Town Road', owner: 'me', done: false, due: 'before 19 Dec' },
        { id: 'post', text: 'Redirect post for 12 months', owner: 'crew', crew: 'scout', done: true },
        { id: 'tax', text: 'Tell Camden and Islington about council tax', owner: 'crew', crew: 'scout', done: false },
      ] }),
      blk('timeline', 'steps', houseSteps(3), { size: 'small', emphasis: 'quiet' }),
    ]) },
  ],
};

/* ---------------- Taxes 2026 (Ledger) ---------------- */
const EXP = [['Apr', 21400], ['May', 18800], ['Jun', 26300], ['Jul', 19900], ['Aug', 12200], ['Sep', 31800], ['Oct', 24100], ['Nov', 20500], ['Dec', 15600], ['Jan', 22900], ['Feb', 17300], ['Mar', 28700]] as const;
const expenses = { kind: 'bars' as const, format: 'money' as const, label: 'Work expenses, April 2025 to March 2026', points: EXP.map(([x, y]) => ({ x, y })), mark: { x: 'Sep', label: 'New laptop' }, source: src('Monzo and 212 receipts', 'bank') };
const docs = (left: number) => ({ items: [
  { id: 'p60', text: 'P60 from Harlow & Lane', owner: 'me' as const, done: left < 3, due: 'ask HR' },
  { id: 'nest', text: 'Pension statement from Nest', owner: 'me' as const, done: left < 2 },
  { id: 'gift', text: 'Gift Aid donations total', owner: 'me' as const, done: left < 1 },
  { id: 'rcpt', text: 'Match 14 Screwfix receipts to payments', owner: 'crew' as const, crew: 'ledger' as const, done: left < 4 },
  { id: 'int', text: 'Savings interest from Monzo and Chip', owner: 'crew' as const, crew: 'ledger' as const, done: true },
] });

const tax: SpaceDef = {
  id: 'tax', name: 'Taxes 2026', glyph: 'receipt', crew: 'ledger', deadline: 'Self Assessment due Sun 31 Jan',
  steps: [
    { id: 'before', date: 'Thu 5 Nov', spec: view('tax', '2026-11-05T08:00:00Z', 'ledger', [
      blk('headline', 'head', { title: 'Your 2025 to 26 return', line: 'Due on 31 January. Ledger has matched most of the year.', crew: 'ledger' }),
      blk('stat', 'owe', { value: 418000, format: 'money', label: 'Estimated tax still to pay' }),
      blk('checklist', 'docs', docs(4)),
      blk('series', 'exp', expenses, { size: 'small' }),
      blk('prose', 'why', { text: 'The estimate uses your salary, two freelance invoices and the expenses Ledger has matched so far.', sources: [src('Harlow & Lane payslips', 'document'), src('your invoices', 'document')] }, { size: 'small', emphasis: 'quiet' }),
    ]) },
    { id: 'today', date: 'Thu 12 Nov', spec: view('tax', '2026-11-12T08:00:00Z', 'ledger', [
      blk('headline', 'head', { title: 'One question from Ledger', line: 'October is matched. Answer this and the estimate settles.', crew: 'ledger' }),
      blk('input', 'wfh', { label: 'When did you start working from home?', kind: 'date', placeholder: 'Pick a date', help: 'Ledger uses this for the working-from-home allowance. You can change it before you file.' }, { emphasis: 'loud' }),
      blk('stat', 'owe', { value: 421200, format: 'money', label: 'Estimated tax to pay', trend: { delta: 3200, basis: 'since last week, after October' } }, { size: 'small' }),
      blk('stat', 'missing', { value: 3, format: 'count', label: 'Documents still missing' }, { size: 'small' }),
      blk('series', 'exp', expenses, { size: 'large' }),
      blk('checklist', 'docs', docs(3)),
    ]) },
    { id: 'eve', date: 'Sat 30 Jan', spec: view('tax', '2027-01-30T08:00:00Z', 'ledger', [
      blk('headline', 'head', { title: 'Due tomorrow', line: 'The return is ready to file. Ledger checked every figure against your bank.', crew: 'ledger' }),
      blk('stat', 'left', { value: 1, format: 'days', label: 'Left to file and pay, by Sunday 31 January' }, { size: 'large', emphasis: 'loud' }),
      blk('pay', 'hmrc', { payee: 'HMRC Self Assessment', amount: gbpm(4212), reference: '4417302918K', account: '08-32-10, ending 1153', due: 'By Sun 31 Jan', opens: 'your bank' }),
      blk('checklist', 'docs', docs(0), { size: 'small' }),
      blk('series', 'exp', expenses, { size: 'small' }),
    ]) },
    { id: 'after', date: 'Mon 1 Feb', spec: view('tax', '2027-02-01T08:00:00Z', 'ledger', [
      blk('headline', 'head', { title: 'Filed and paid', line: 'Filed on 30 January. Ledger saw the payment leave your account on the 31st.', crew: 'ledger' }, { emphasis: 'quiet' }),
      blk('quote', 'hmrc', { text: 'We have received your Self Assessment tax return for the year 6 April 2025 to 5 April 2026.', by: 'HMRC', source: src('confirmation email', 'email', '30 Jan, 21:14') }, { emphasis: 'quiet' }),
      blk('stat', 'next', { value: 180, format: 'days', label: 'Until the next payment on account, 31 July' }, { size: 'small', emphasis: 'quiet' }),
    ]) },
  ],
};

/* ---------------- Mum's 70th (Wren) ---------------- */
const venues = (only?: string[]) => ({
  question: 'Three venues holding Saturday 5 December',
  form: 'columns' as const,
  options: [
    { id: 'mill', name: 'The Old Mill', price: gbpm(1180), facts: [{ k: 'Seats', v: '40, lunch' }, { k: 'Access', v: 'Step-free' }, { k: 'From Mum’s', v: '12 min' }], thumb: 'mill' as const },
    { id: 'boat', name: 'The Boathouse', price: gbpm(1420), facts: [{ k: 'Seats', v: '50, buffet' }, { k: 'Access', v: 'Steps to terrace' }, { k: 'From Mum’s', v: '25 min' }], thumb: 'boathouse' as const },
    { id: 'rose', name: 'Rose Garden Room', price: gbpm(960), facts: [{ k: 'Seats', v: '36, tea' }, { k: 'Access', v: 'Step-free' }, { k: 'From Mum’s', v: '30 min' }], thumb: 'garden' as const },
  ].filter(o => !only || only.includes(o.id)),
  recommended: 'mill',
  reason: 'Step-free for Auntie Pat, close to Mum, and she loved it at Tom’s wedding. Rose Garden is cheaper but seats 36.',
  source: src('three venue emails', 'email', 'and Wren’s calls'),
});
const family = [
  { id: 'mum', name: 'Margaret Reid', role: 'Mum, turning 70', note: 'Says no fuss, but loved the speeches at Tom’s wedding.', initials: 'MR' },
  { id: 'pat', name: 'Auntie Pat', role: 'Coming from Leeds', note: 'Needs step-free access and a seat near the door.', initials: 'PR' },
  { id: 'tom', name: 'Tom Reid', role: 'Your brother', note: 'Splitting the cost with you, half each.', initials: 'TR' },
];

const mum: SpaceDef = {
  id: 'mum', name: 'Mum’s 70th', glyph: 'cake', crew: 'wren', deadline: 'The Old Mill holds the date until Fri 20 Nov, 17:00',
  steps: [
    { id: 'before', date: 'Thu 5 Nov', spec: view('mum', '2026-11-05T08:00:00Z', 'wren', [
      blk('headline', 'head', { title: 'Three venues, one Saturday', line: 'Saturday 5 December. All three are holding the date.', crew: 'wren' }),
      blk('comparison', 'venues', { ...venues(), recommended: undefined, reason: undefined }, { size: 'large' }),
      blk('choice', 'style', { question: 'Lunch or afternoon tea?', options: [{ id: 'lunch', label: 'Lunch', detail: 'Sit-down, 13:00' }, { id: 'tea', label: 'Afternoon tea', detail: 'Lighter, 15:00' }] }, { emphasis: 'loud' }),
      blk('people', 'family', { people: family }),
      blk('stat', 'budget', { value: 150000, format: 'money', label: 'Budget, split with Tom' }, { size: 'small', emphasis: 'quiet' }),
    ]) },
    { id: 'today', date: 'Thu 12 Nov', spec: view('mum', '2026-11-12T08:00:00Z', 'wren', [
      blk('headline', 'head', { title: 'The Old Mill, for lunch', line: 'Wren recommends it. The hold ends on Friday 20th.', crew: 'wren' }),
      blk('comparison', 'venues', venues(), { size: 'large', emphasis: 'loud' }),
      blk('stat', 'budget', { value: 118000, format: 'money', label: 'At The Old Mill', of: 150000 }, { size: 'small' }),
      blk('choice', 'style', { question: 'Lunch or afternoon tea?', options: [{ id: 'lunch', label: 'Lunch', detail: 'Sit-down, 13:00' }, { id: 'tea', label: 'Afternoon tea', detail: 'Lighter, 15:00' }], selected: 'lunch' }, { size: 'small', emphasis: 'quiet' }),
      blk('people', 'family', { people: family }),
    ]) },
    { id: 'eve', date: 'Thu 19 Nov', spec: view('mum', '2026-11-19T08:00:00Z', 'wren', [
      blk('headline', 'head', { title: 'The Old Mill holds the date until tomorrow', line: 'Pay the deposit by Friday at 17:00 or the date goes back on sale.', crew: 'wren' }),
      blk('pay', 'deposit', { payee: 'The Old Mill Ltd', amount: gbpm(250), reference: 'MUM70-DEP', account: '20-45-77, ending 3391', due: 'Hold ends Fri 17:00', opens: 'your bank' }),
      blk('comparison', 'venues', venues(['mill']), { size: 'small', emphasis: 'quiet' }),
      blk('checklist', 'todo', { items: [
        { id: 'speech', text: 'Ask Mum if she wants speeches', owner: 'me', done: false, due: 'Sunday' },
        { id: 'inv', text: 'Invitations to 38 people', owner: 'crew', crew: 'wren', done: true },
        { id: 'cake', text: 'Cake from Dunn’s, collect Sat 09:00', owner: 'crew', crew: 'wren', done: false },
      ] }),
      blk('stat', 'budget', { value: 118000, format: 'money', label: 'At The Old Mill', of: 150000 }, { size: 'small' }),
      blk('people', 'family', { people: family }, { size: 'small' }),
    ]) },
    { id: 'after', date: 'Mon 7 Dec', spec: view('mum', '2026-12-07T08:00:00Z', 'wren', [
      blk('headline', 'head', { title: 'That was the 70th', line: '38 came. Tom shared the photos and Wren filed them here.', crew: 'wren' }),
      blk('quote', 'mum', { text: 'Best birthday in years. Thank you both, and thank Pat for the cake stand. Mum x', by: 'Mum', source: src('text message', 'email', 'Sun 6 Dec, 10:02') }, { emphasis: 'loud' }),
      blk('media', 'photos', { items: [
        { id: 'p1', title: 'The long table', caption: 'Before the speeches', thumb: 'mill' },
        { id: 'p2', title: 'Outside, 15:40', caption: 'Pat, Mum and the cake', thumb: 'garden' },
      ] }, { size: 'large' }),
      blk('stat', 'budget', { value: 141000, format: 'money', label: 'Spent, Tom paid half', of: 150000 }, { size: 'small' }),
      blk('checklist', 'todo', { items: [
        { id: 'thanks', text: 'Thank-you note to The Old Mill', owner: 'crew', crew: 'wren', done: false },
        { id: 'tom', text: 'Settle up with Tom, £705', owner: 'me', done: false },
      ] }, { size: 'small' }),
    ]) },
  ],
};

/* ---------------- Car (quiet) ---------------- */
const car: SpaceDef = {
  id: 'car', name: 'Car', glyph: 'car', crew: 'scout', deadline: 'MOT due Sun 14 Mar',
  steps: [
    { id: 'before', date: 'Thu 5 Nov', spec: view('car', '2026-11-05T08:00:00Z', 'scout', [
      blk('headline', 'head', { title: 'Nothing needs you', line: 'The MOT is due on 14 March. Scout will raise it two weeks before.', crew: 'scout' }, { size: 'small', emphasis: 'quiet' }),
    ]) },
    { id: 'today', date: 'Thu 12 Nov', spec: view('car', '2026-11-12T08:00:00Z', 'scout', [
      blk('headline', 'head', { title: 'Nothing needs you', line: 'The MOT is due on 14 March. Scout will raise it two weeks before.', crew: 'scout' }, { size: 'small', emphasis: 'quiet' }),
      blk('prose', 'ins', { text: 'Insurance renews on 2 April. Scout will compare quotes in March.', sources: [src('Admiral renewal letter', 'document')] }, { size: 'small', emphasis: 'quiet' }),
    ]) },
    { id: 'eve', date: 'Sat 13 Mar', spec: view('car', '2027-03-13T08:00:00Z', 'scout', [
      blk('headline', 'head', { title: 'MOT tomorrow', line: 'Holloway Road Garage, 09:00. One thing to do tonight.', crew: 'scout' }),
      blk('checklist', 'todo', { items: [
        { id: 'v5', text: 'Leave the V5C in the glovebox', owner: 'me', done: false, due: 'tonight' },
        { id: 'book', text: 'Booked Holloway Road Garage, Sun 09:00', owner: 'crew', crew: 'scout', done: true },
      ] }),
    ]) },
    { id: 'after', date: 'Mon 15 Mar', spec: view('car', '2027-03-15T08:00:00Z', 'scout', [
      blk('headline', 'head', { title: 'MOT passed', line: 'No advisories. The next one is due by 14 March 2028.', crew: 'scout' }, { size: 'small', emphasis: 'quiet' }),
    ]) },
  ],
};

export const SPACES: SpaceDef[] = [japan, house, tax, mum, car];
export const spaceById = (id: string) => SPACES.find(s => s.id === id)!;
