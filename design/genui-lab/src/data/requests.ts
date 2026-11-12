/* Views on demand. Each request stands in for what Keep would compose for it; each refinement for a transform of the
   view on screen. All pre-written: there is no model in this prototype. */
import type { ViewSpec } from '../spec/types';
import { blk, consent, gbpm, src, view } from './util';

export interface Refinement { id: string; label: string; match: string[]; spec: ViewSpec }
export interface Request { id: string; label: string; match: string[]; reading: string; pinTo?: string; pinLabel: string; spec: ViewSpec; refine: Refinement[] }

const A = (space: string, blocks: ViewSpec['blocks'], groups?: ViewSpec['groups']) => view(space, '2026-11-12T09:12:00Z', 'keep', blocks, groups, 'answer');

/* removal quotes */
const quoteSrc = src('three quote emails', 'email', 'read by Scout');
const quotes = (form: 'columns' | 'table', only?: string[]) => ({
  question: 'Removals for 11 December, flat to house',
  form,
  options: [
    { id: 'bishops', name: 'Bishop’s Move', price: gbpm(1840), facts: [{ k: 'Piano', v: 'Included' }, { k: 'Cover', v: '£50,000' }, { k: 'Crew', v: '4 and a Luton' }], thumb: 'van' as const },
    { id: 'hatch', name: 'Hatch & Co', price: gbpm(1520), facts: [{ k: 'Piano', v: 'Included' }, { k: 'Cover', v: '£40,000' }, { k: 'Crew', v: '3 and a Luton' }], thumb: 'van' as const },
    { id: 'twovans', name: 'Two Vans', price: gbpm(1290), facts: [{ k: 'Piano', v: '£180 extra' }, { k: 'Cover', v: '£25,000' }, { k: 'Crew', v: '2 and two vans' }], thumb: 'van' as const },
  ].filter(o => !only || only.includes(o.id)),
  ...(only ? {} : { recommended: 'hatch', reason: 'Piano handled in-house and good cover. Two Vans is £230 cheaper, or £50 once the piano is added.' }),
  source: quoteSrc,
});

/* week */
const week = (onlyMe: boolean) => ({
  steps: [
    { id: 'tue', date: 'Tue 17', label: 'Survey at 14 Ashby Road', detail: 'Dave Ellis, 10:00. Leave the ladder out.', state: 'next' as const },
    { id: 'wed', date: 'Wed 18', label: 'Call Tom about the venue split', detail: '19:30, Wren set a reminder', state: 'next' as const },
    { id: 'thu', date: 'Thu 19', label: 'Juno files fare options', detail: 'Crew only, nothing for you', state: 'next' as const },
    { id: 'fri', date: 'Fri 20', label: 'Venue hold and BA fare both end', detail: 'Old Mill at 17:00, BA at 18:00', state: 'next' as const },
    { id: 'sat', date: 'Sat 21', label: 'Ellie’s birthday dinner', detail: '19:30, Brawn, table for six', state: 'next' as const },
  ].filter(s => !onlyMe || s.id !== 'thu'),
});
const busy = { kind: 'bars' as const, format: 'count' as const, label: 'Hours booked, Mon 16 to Sun 22', points: [['Mon', 7], ['Tue', 9], ['Wed', 6], ['Thu', 8], ['Fri', 5], ['Sat', 4], ['Sun', 0]].map(([x, y]) => ({ x: x as string, y: y as number })), mark: { x: 'Tue', label: 'Survey' }, source: src('your calendar', 'calendar', 'and work rota') };

/* crew yesterday */
const crewDid = (only?: string) => ({ items: [
  { id: 's1', text: 'Scout chased Priya for the local searches', owner: 'crew' as const, crew: 'scout' as const, done: true },
  { id: 's2', text: 'Scout booked the survey for Tue 10:00', owner: 'crew' as const, crew: 'scout' as const, done: true },
  { id: 'j1', text: 'Juno checked fares on three sites', owner: 'crew' as const, crew: 'juno' as const, done: true },
  { id: 'l1', text: 'Ledger matched 14 Screwfix receipts', owner: 'crew' as const, crew: 'ledger' as const, done: true },
  { id: 'w1', text: 'Wren drafted the invitations to 38', owner: 'crew' as const, crew: 'wren' as const, done: true },
  { id: 'm1', text: 'Reply to Dave about the loft', owner: 'me' as const, done: false, due: 'Scout drafted it' },
  { id: 'm2', text: 'Approve the invitation wording', owner: 'me' as const, done: false, due: 'Wren drafted it' },
].filter(i => !only || (only === 'me' ? i.owner === 'me' : i.crew === only)) });

/* money */
const NOV = [['1–7', 64200], ['8–14', 71800], ['15–21', 48300], ['22–28', 34100]] as const;
const OCT = [['1–7', 58800], ['8–14', 52400], ['15–21', 45500], ['22–28', 35700]] as const;
const EAT = [['1–7', 6400], ['8–14', 11200], ['15–21', 4800], ['22–28', 2100]] as const;
const pts = (a: readonly (readonly [string, number])[]) => a.map(([x, y]) => ({ x, y }));
const bank = src('Monzo and Amex', 'bank', 'to 12 Nov, with what is booked');

/* Saturday */
const satStops = (lunch: boolean) => [
  { id: 'home', name: 'Home', time: '10:10', kind: 'home' as const },
  { id: 'mill', name: 'The Old Mill', time: '11:00', kind: 'stop' as const },
  ...(lunch ? [{ id: 'lunch', name: 'Dishoom', time: '12:45', kind: 'stop' as const }] : []),
  { id: 'mums', name: 'Mum’s', time: lunch ? '14:30' : '13:00', kind: 'stop' as const },
  { id: 'back', name: 'Home', time: lunch ? '18:00' : '17:30', kind: 'end' as const },
];
const satLegs = (lunch: boolean) => lunch
  ? [{ mode: 'train' as const, minutes: 38 }, { mode: 'walk' as const, minutes: 12 }, { mode: 'bus' as const, minutes: 26 }, { mode: 'train' as const, minutes: 41 }]
  : [{ mode: 'train' as const, minutes: 38 }, { mode: 'car' as const, minutes: 14 }, { mode: 'train' as const, minutes: 41 }];
const satDay = (travel: boolean, lunch: boolean) => ({ steps: [
  ...(travel ? [{ id: 't1', date: '10:10', label: 'Overground to Hackney Wick', detail: '38 min, leave by 10:10', state: 'next' as const }] : []),
  { id: 'view', date: '11:00', label: 'Viewing at The Old Mill', detail: 'With Mum. Ask about the step-free door for Pat.', state: 'next' as const },
  ...(lunch ? [
    ...(travel ? [{ id: 't2', date: '12:30', label: 'Walk to Dishoom', detail: '12 min', state: 'next' as const }] : []),
    { id: 'eat', date: '12:45', label: 'Lunch with Mum', detail: 'Table for two, booked', state: 'next' as const },
  ] : []),
  ...(travel ? [{ id: 't3', date: lunch ? '14:00' : '12:45', label: lunch ? 'Bus 388 to Mum’s' : 'Mum drives you back', detail: lunch ? '26 min' : '14 min', state: 'next' as const }] : []),
  { id: 'mums', date: lunch ? '14:30' : '13:00', label: 'Fix Mum’s shelves', detail: 'Bring the drill bits', state: 'next' as const },
  ...(travel ? [{ id: 't4', date: lunch ? '17:15' : '16:45', label: 'Overground home', detail: '41 min', state: 'next' as const }] : []),
] });
const lunchChoice = { question: 'Lunch after the viewing?', options: [{ id: 'dishoom', label: 'Dishoom, 12:45', detail: '12 min walk, Mum likes it' }, { id: 'none', label: 'Skip lunch out', detail: 'Straight to Mum’s, home by 17:30' }], selected: 'dishoom' };

/* fares */
const DAILY = [['6 Nov', 80600], ['7 Nov', 79900], ['8 Nov', 81200], ['9 Nov', 78800], ['10 Nov', 77400], ['11 Nov', 76100], ['12 Nov', 74200]] as const;
const WEEKLY = [['1 Oct', 91800], ['8 Oct', 88400], ['15 Oct', 90200], ['22 Oct', 86100], ['29 Oct', 83800], ['5 Nov', 81200], ['12 Nov', 74200]] as const;
const fareSrc = src('Skyscanner, BA and JAL', 'web', 'checked daily at 07:00');

/* left before the move */
const left = (filter: 'all' | 'me' | 'week') => ({ items: [
  { id: 'loft', text: 'Clear the loft hatch for Dave', owner: 'me' as const, done: false, due: 'Tue 17' },
  { id: 'piano', text: 'Tell the movers about the piano', owner: 'me' as const, done: false, due: 'Fri 20' },
  { id: 'sign', text: 'Sign the contract', owner: 'me' as const, done: false, due: 'Thu 26' },
  { id: 'meter', text: 'Book the final meter readings', owner: 'me' as const, done: false, due: 'Dec 10' },
  { id: 'srch', text: 'Chase the local searches', owner: 'crew' as const, crew: 'scout' as const, done: false, due: 'Mon 16' },
  { id: 'post', text: 'Set up post redirection from 11 Dec', owner: 'crew' as const, crew: 'scout' as const, done: false, due: 'Dec 1' },
  { id: 'rem', text: 'Book the removals', owner: 'crew' as const, crew: 'scout' as const, done: false, due: 'Fri 20' },
].filter(i => filter === 'all' || (filter === 'me' ? i.owner === 'me' : ['Mon 16', 'Tue 17', 'Fri 20'].includes(i.due!))) });

export const REQUESTS: Request[] = [
  {
    id: 'quotes', label: 'Compare the three removal quotes', match: ['removal', 'quote', 'movers', 'removals'], reading: 'Reading 3 quote emails', pinTo: 'house', pinLabel: 'Removal quotes',
    spec: A('house', [
      blk('headline', 'q-head', { title: 'Three removal quotes', line: 'Scout read them from your email. All three can do 11 December.', crew: 'scout' }),
      blk('comparison', 'q-cmp', quotes('columns'), { size: 'large' }),
      blk('stat', 'q-gap', { value: 55000, format: 'money', label: 'Between the cheapest and the dearest' }, { size: 'small' }),
      blk('prose', 'q-note', { text: 'Bishop’s Move is the only one that offers to pack the kitchen, for £240 more.', sources: [src('Bishop’s Move quote', 'email', '9 Nov')] }, { size: 'small' }),
    ]),
    refine: [
      { id: 'table', label: 'Make it a table', match: ['table'], spec: A('house', [
        blk('headline', 'q-head', { title: 'Three removal quotes', line: 'Same quotes, side by side.', crew: 'scout' }, { size: 'small' }),
        blk('comparison', 'q-cmp', quotes('table'), { size: 'large' }),
        blk('stat', 'q-gap', { value: 55000, format: 'money', label: 'Between the cheapest and the dearest' }, { size: 'small' }),
        blk('prose', 'q-note', { text: 'Bishop’s Move is the only one that offers to pack the kitchen, for £240 more.', sources: [src('Bishop’s Move quote', 'email', '9 Nov')] }, { size: 'small' }),
      ]) },
      { id: 'cheapest', label: 'Just the cheapest', match: ['cheapest', 'cheaper', 'cheap'], spec: A('house', [
        blk('headline', 'q-head', { title: 'Two Vans, £1,290', line: 'Add £180 for the piano. Scout drafted the acceptance.', crew: 'scout' }),
        blk('comparison', 'q-cmp', quotes('columns', ['twovans']), { size: 'small' }),
        blk('stat', 'q-gap', { value: 147000, format: 'money', label: 'With the piano' }, { size: 'small', emphasis: 'loud' }),
        consent('q-send', { name: 'Two Vans Removals', address: 'bookings@twovans.co.uk' }, 'Booking 11 December, Kentish Town to Ashby Road',
          'Hi, I’d like to accept your quote of £1,290 for 11 December, plus £180 for the upright piano. Start at 08:00 please. Sam Reid'),
      ]) },
    ],
  },
  {
    id: 'week', label: 'What’s my week look like', match: ['week', 'schedule', 'calendar'], reading: 'Reading your calendar and 4 Spaces', pinLabel: 'Next week',
    spec: A('keep', [
      blk('headline', 'w-head', { title: 'Next week, 16 to 22 November', line: 'Busy Tuesday. Friday has two deadlines an hour apart.', crew: 'keep' }),
      blk('timeline', 'w-tl', week(false), { size: 'large' }),
      blk('series', 'w-busy', busy),
      blk('stat', 'w-free', { value: 3, format: 'count', label: 'Evenings with nothing booked' }, { size: 'small' }),
      blk('stat', 'w-dl', { value: 2, format: 'count', label: 'Deadlines, both on Friday' }, { size: 'small', emphasis: 'loud' }),
    ]),
    refine: [
      { id: 'mine', label: 'Only what needs me', match: ['needs me', 'only me', 'mine', 'just me'], spec: A('keep', [
        blk('headline', 'w-head', { title: 'What needs you next week', line: 'Four things. Juno’s fare check is crew only, so it’s gone.', crew: 'keep' }),
        blk('timeline', 'w-tl', week(true), { size: 'large', emphasis: 'loud' }),
        blk('stat', 'w-dl', { value: 2, format: 'count', label: 'Deadlines, both on Friday' }, { size: 'small' }),
        blk('stat', 'w-free', { value: 3, format: 'count', label: 'Evenings with nothing booked' }, { size: 'small' }),
      ]) },
    ],
  },
  {
    id: 'crew', label: 'Show me what the crew did yesterday', match: ['crew', 'yesterday', 'did'], reading: 'Reading yesterday’s run log', pinLabel: 'Yesterday',
    spec: A('keep', [
      blk('headline', 'c-head', { title: 'Yesterday, Wednesday 11 November', line: 'Five things done. Two handed back to you.', crew: 'keep' }),
      blk('checklist', 'c-list', crewDid(), { size: 'large' }),
      blk('quote', 'c-q', { text: 'The local searches came back this morning and they’re all clear. I’ll send the report over with the contract.', by: 'Priya Shah', source: src('reply to Scout', 'email', '11 Nov, 16:20') }),
    ]),
    refine: [
      { id: 'scout', label: 'Only Scout', match: ['scout'], spec: A('keep', [
        blk('headline', 'c-head', { title: 'Scout, yesterday', line: 'Two runs on the house move. One reply came back.', crew: 'scout' }),
        blk('checklist', 'c-list', crewDid('scout'), { size: 'medium' }),
        blk('quote', 'c-q', { text: 'The local searches came back this morning and they’re all clear. I’ll send the report over with the contract.', by: 'Priya Shah', source: src('reply to Scout', 'email', '11 Nov, 16:20') }, { size: 'large' }),
      ]) },
      { id: 'handed', label: 'Just what they handed to me', match: ['handed', 'needs me', 'for me'], spec: A('keep', [
        blk('headline', 'c-head', { title: 'Two things handed back', line: 'Both drafted, both waiting for you.', crew: 'keep' }),
        blk('checklist', 'c-list', crewDid('me'), { size: 'medium', emphasis: 'loud' }),
        consent('c-dave', { name: 'Dave Ellis, Ellis Surveying', address: 'dave@ellissurveying.co.uk' }, 'Re: Loft access on Tuesday',
          'Hi Dave, Tuesday at 10 works. The hatch is in the back bedroom and I’ll leave the ladder out. Thanks, Sam'),
      ]) },
    ],
  },
  {
    id: 'money', label: 'Where is my money going this month', match: ['money', 'spend', 'spending', 'going'], reading: 'Reading 2 bank accounts', pinLabel: 'November spending',
    spec: A('keep', [
      blk('headline', 'm-head', { title: 'November so far', line: 'On track, with the venue deposit still to come.', crew: 'ledger' }),
      blk('stat', 'm-total', { value: 218400, format: 'money', label: 'Spent and booked in November', of: 260000 }, { size: 'large' }),
      blk('series', 'm-weeks', { kind: 'bars', format: 'money', label: 'By week, November', points: pts(NOV), source: bank }),
      blk('prose', 'm-note', { text: 'Eating out is £140 up on October, mostly three late Deliveroo orders. The £250 venue deposit lands next week.', sources: [bank] }, { size: 'small' }),
      blk('stat', 'm-big', { value: 24100, format: 'money', label: 'Biggest single cost: Screwfix, 3 Nov' }, { size: 'small', emphasis: 'quiet' }),
    ]),
    refine: [
      { id: 'october', label: 'Compare with October', match: ['october', 'compare', 'last month'], spec: A('keep', [
        blk('headline', 'm-head', { title: 'November against October', line: '£260 more so far, nearly all in the second week.', crew: 'ledger' }),
        blk('stat', 'm-total', { value: 218400, format: 'money', label: 'Spent and booked in November', trend: { delta: 26000, basis: 'against the same days of October' } }, { size: 'small' }),
        blk('stat', 'm-big', { value: 24100, format: 'money', label: 'Biggest single cost: Screwfix, 3 Nov' }, { size: 'small', emphasis: 'quiet' }),
        blk('series', 'm-weeks', { kind: 'bars', format: 'money', label: 'By week, November and October', points: pts(NOV), compare: { label: 'October', points: pts(OCT) }, source: bank }, { size: 'large' }),
      ]) },
      { id: 'eating', label: 'Just eating out', match: ['eating', 'food', 'restaurant', 'takeaway'], spec: A('keep', [
        blk('headline', 'm-head', { title: 'Eating out, November', line: 'Three late Deliveroo orders are most of the rise.', crew: 'ledger' }),
        blk('stat', 'm-total', { value: 24500, format: 'money', label: 'Eating out in November', trend: { delta: 14000, basis: 'against the same days of October' } }),
        blk('series', 'm-weeks', { kind: 'bars', format: 'money', label: 'Eating out, by week', points: pts(EAT), mark: { x: '8–14', label: '3 late orders' }, source: bank }, { size: 'large' }),
      ]) },
    ],
  },
  {
    id: 'sat', label: 'Plan Saturday around the viewing', match: ['saturday', 'viewing', 'plan'], reading: 'Reading your calendar and Mum’s 70th', pinTo: 'mum', pinLabel: 'This Saturday',
    spec: A('mum', [
      blk('headline', 'p-head', { title: 'Saturday 14 November', line: 'Built around the 11:00 viewing at The Old Mill.', crew: 'wren' }),
      blk('route', 'p-route', { stops: satStops(true), legs: satLegs(true), showTimes: false }, { size: 'large' }),
      blk('timeline', 'p-day', satDay(false, true)),
      blk('choice', 'p-lunch', lunchChoice),
    ]),
    refine: [
      { id: 'travel', label: 'Add travel time', match: ['travel', 'journey', 'how long'], spec: A('mum', [
        blk('headline', 'p-head', { title: 'Saturday 14 November', line: 'Leave by 10:10. About two hours on trains and buses.', crew: 'wren' }),
        blk('route', 'p-route', { stops: satStops(true), legs: satLegs(true), showTimes: true }, { size: 'large' }),
        blk('stat', 'p-mins', { value: 117, format: 'count', label: 'Minutes travelling' }, { size: 'small' }),
        blk('stat', 'p-leave', { value: 4, format: 'count', label: 'Legs, the longest 41 min' }, { size: 'small', emphasis: 'quiet' }),
        blk('timeline', 'p-day', satDay(true, true), { size: 'large' }),
        blk('choice', 'p-lunch', lunchChoice, { emphasis: 'quiet' }),
      ]) },
      { id: 'nolunch', label: 'Skip lunch out', match: ['skip lunch', 'no lunch', 'without lunch'], spec: A('mum', [
        blk('headline', 'p-head', { title: 'Saturday 14 November', line: 'No lunch out. Mum drives you back and you’re home by 17:30.', crew: 'wren' }),
        blk('route', 'p-route', { stops: satStops(false), legs: satLegs(false), showTimes: true }),
        blk('timeline', 'p-day', satDay(true, false), { size: 'large' }),
      ]) },
    ],
  },
  {
    id: 'reply', label: 'Who’s waiting on me', match: ['waiting', 'reply', 'owe', 'who'], reading: 'Reading 6 threads', pinTo: 'house', pinLabel: 'Waiting on you',
    spec: A('keep', [
      blk('headline', 'r-head', { title: 'Three people are waiting on you', line: 'The longest wait is Dave, since Tuesday.', crew: 'keep' }),
      blk('people', 'r-ppl', { people: [
        { id: 'dave', name: 'Dave Ellis', role: 'Loft access for the survey, 2 days', note: 'Scout drafted a reply. It’s below.', initials: 'DE' },
        { id: 'priya', name: 'Priya Shah', role: 'Wants a call about the searches', note: 'Prefers a call before 10.', initials: 'PS' },
        { id: 'tom', name: 'Tom Reid', role: 'Asked about splitting the venue', note: 'Half each, as you agreed in October.', initials: 'TR' },
      ] }, { size: 'large' }),
      consent('r-dave', { name: 'Dave Ellis, Ellis Surveying', address: 'dave@ellissurveying.co.uk' }, 'Re: Loft access on Tuesday',
        'Hi Dave, Tuesday at 10 works. The hatch is in the back bedroom and I’ll leave the ladder out. Thanks, Sam'),
    ]),
    refine: [
      { id: 'dave', label: 'Just Dave', match: ['dave'], spec: A('keep', [
        blk('headline', 'r-head', { title: 'Dave Ellis', line: 'Waiting since Tuesday. One reply and he’s sorted.', crew: 'scout' }),
        blk('people', 'r-ppl', { people: [{ id: 'dave', name: 'Dave Ellis', role: 'Surveyor, Ellis Surveying', note: 'Needs the loft hatch clear. Last time he asked for a ladder.', initials: 'DE' }] }),
        consent('r-dave', { name: 'Dave Ellis, Ellis Surveying', address: 'dave@ellissurveying.co.uk' }, 'Re: Loft access on Tuesday',
          'Hi Dave, Tuesday at 10 works. The hatch is in the back bedroom and I’ll leave the ladder out. Thanks, Sam'),
      ]) },
    ],
  },
  {
    id: 'fares', label: 'How are the Japan fares moving', match: ['fare', 'fares', 'flight', 'flights', 'japan', 'tokyo'], reading: 'Reading 7 weeks of fare checks', pinTo: 'japan', pinLabel: 'Fare watch',
    spec: A('japan', [
      blk('headline', 'f-head', { title: 'Down £70 in a week', line: 'The cheapest direct return is the lowest since Juno started watching.', crew: 'juno' }),
      blk('series', 'f-ser', { kind: 'line', format: 'money', label: 'Cheapest direct return, each, by week', points: pts(WEEKLY), mark: { x: '29 Oct', label: 'JAL sale' }, source: fareSrc }, { size: 'large' }),
      blk('stat', 'f-stat', { value: 74200, format: 'money', label: 'BA direct today', trend: { delta: -17600, basis: 'since 1 October' } }, { size: 'small' }),
      blk('prose', 'f-note', { text: 'Juno will hold off until Friday unless it rises. BA can hold this fare for 72 hours for £20.', sources: [src('BA', 'web', '12 Nov')] }, { size: 'small' }),
    ]),
    refine: [
      { id: 'thisweek', label: 'Only this week', match: ['this week', 'daily', 'days'], spec: A('japan', [
        blk('headline', 'f-head', { title: 'Down five days out of six', line: 'One small rise on Sunday, then steady drops.', crew: 'juno' }),
        blk('series', 'f-ser', { kind: 'line', format: 'money', label: 'Cheapest direct return, each, by day', points: pts(DAILY), mark: { x: '8 Nov', label: 'Sunday rise' }, source: fareSrc }, { size: 'large' }),
        blk('stat', 'f-stat', { value: 74200, format: 'money', label: 'BA direct today', trend: { delta: -6400, basis: 'since Friday 6 Nov' } }, { size: 'small' }),
        blk('prose', 'f-note', { text: 'Juno will hold off until Friday unless it rises. BA can hold this fare for 72 hours for £20.', sources: [src('BA', 'web', '12 Nov')] }, { size: 'small' }),
      ]) },
      { id: 'addcheap', label: 'Add the cheapest option', match: ['cheapest option', 'add the cheapest', 'cheapest', 'cheaper'], spec: A('japan', [
        blk('headline', 'f-head', { title: 'Down £70 in a week', line: 'Finnair is cheaper again, with a stop in Helsinki.', crew: 'juno' }),
        blk('series', 'f-ser', { kind: 'line', format: 'money', label: 'Cheapest direct return, each, by week', points: pts(WEEKLY), mark: { x: '29 Oct', label: 'JAL sale' }, source: fareSrc }, { size: 'small' }),
        blk('stat', 'f-stat', { value: 74200, format: 'money', label: 'BA direct today', trend: { delta: -17600, basis: 'since 1 October' } }, { size: 'small' }),
        blk('comparison', 'f-cmp', { question: 'Direct or cheapest, return for two', form: 'columns', options: [
          { id: 'ba', name: 'BA direct', price: gbpm(1484), facts: [{ k: 'Flight time', v: '14 h 05' }, { k: 'Stops', v: 'Direct' }] },
          { id: 'ay', name: 'Finnair', price: gbpm(1222), facts: [{ k: 'Flight time', v: '17 h 40' }, { k: 'Stops', v: 'Helsinki' }] },
        ], recommended: 'ba', reason: '£262 more for two, and about 7 hours less travelling each way.', source: fareSrc }, { size: 'large', emphasis: 'loud' }),
      ]) },
    ],
  },
  {
    id: 'left', label: 'What’s left before the move', match: ['left', 'before the move', 'to do', 'todo', 'move'], reading: 'Reading House move', pinTo: 'house', pinLabel: 'Left before the move',
    spec: A('house', [
      blk('headline', 'l-head', { title: 'Seven things before 11 December', line: 'Four are yours. Scout has the rest.', crew: 'scout' }),
      blk('stat', 'l-days', { value: 29, format: 'days', label: 'Until completion' }, { size: 'small' }),
      blk('stat', 'l-mine', { value: 4, format: 'count', label: 'For you' }, { size: 'small' }),
      blk('checklist', 'l-list', left('all'), { size: 'large' }),
    ]),
    refine: [
      { id: 'mine', label: 'Only mine', match: ['mine', 'only me', 'my tasks', 'just me'], spec: A('house', [
        blk('headline', 'l-head', { title: 'Your four', line: 'The contract on the 26th is the one with a hard date.', crew: 'scout' }),
        blk('checklist', 'l-list', left('me'), { size: 'large', emphasis: 'loud' }),
        blk('stat', 'l-days', { value: 29, format: 'days', label: 'Until completion' }, { size: 'small' }),
        blk('stat', 'l-mine', { value: 4, format: 'count', label: 'For you' }, { size: 'small' }),
      ]) },
      { id: 'week', label: 'Only this week', match: ['this week', 'week'], spec: A('house', [
        blk('headline', 'l-head', { title: 'This week', line: 'Four things due by Friday, two of them yours.', crew: 'scout' }),
        blk('checklist', 'l-list', left('week')),
        blk('timeline', 'l-tl', { steps: [
          { id: 'mon', date: 'Mon 16', label: 'Scout chases the searches', state: 'next' },
          { id: 'tue', date: 'Tue 17', label: 'Survey, loft hatch clear', state: 'next' },
          { id: 'fri', date: 'Fri 20', label: 'Removals booked, movers told about the piano', state: 'next' },
        ] }),
      ]) },
    ],
  },
];

/** The one place free text meets the examples: plain keyword matching, said plainly in the UI. */
export function matchRequest(text: string, current?: Request): { req: Request; ref?: Refinement } | null {
  const t = ` ${text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]/g, ' ')} `;
  const hit = (words: string[]) => words.some(w => t.includes(` ${w.replace(/[’']/g, '')}`));
  if (current) for (const r of current.refine) if (hit(r.match)) return { req: current, ref: r };
  const exact = REQUESTS.find(r => r.label.toLowerCase().replace(/[’']/g, '') === text.toLowerCase().replace(/[’']/g, '').trim());
  if (exact) return { req: exact };
  for (const r of REQUESTS) if (hit(r.match)) return { req: r };
  return null;
}
