// Mock content for the prototype. Everything here is example data.
import type { OrbState } from 'thinking-orbs';

export type Glyph =
  | 'house' | 'cake' | 'receipt' | 'plane' | 'case' | 'rocket' | 'heart' | 'book' | 'tray' | 'laptop' | 'coins';

export type AgentId = 'wren' | 'scout' | 'juno' | 'ledger';
export interface Agent { id: AgentId; name: string; job: string }
export const AGENTS: Record<AgentId, Agent> = {
  wren: { id: 'wren', name: 'Wren', job: 'Plans and invites' },
  scout: { id: 'scout', name: 'Scout', job: 'Chases replies' },
  juno: { id: 'juno', name: 'Juno', job: 'Finds and compares' },
  ledger: { id: 'ledger', name: 'Ledger', job: 'Tracks every fee' },
};

/** Money is integer pence, never floats. */
export const gbp = (pence: number) =>
  '£' + (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface Payment {
  id: string;
  kind: 'pay' | 'send';
  hold: string; // the press-and-hold label, naming recipient and amount
  doneLine: string;
  spaceId: string;
  agent: AgentId;
  title: string;
  to: string;
  account: string;
  amount: number; // pence
  reference: string;
  from: string;
  when: string;
  source: string;
  hash: string; // argument hash the approval binds to
}

export const PAYMENTS: Record<string, Payment> = {
  deposit: {
    id: 'deposit', kind: 'pay', hold: 'Hold to pay £250.00 to The Old Mill',
    doneLine: 'Paid £250.00 to The Old Mill Ltd. Receipt filed to Mum’s 70th.', spaceId: 'mum', agent: 'wren', title: 'Pay the venue deposit',
    to: 'The Old Mill Ltd', account: 'Sort code 20-45-77, account ending 3391', amount: 25000,
    reference: 'MUM70-DEP', from: 'Joint account ending 4471', when: 'Today, as soon as you approve',
    source: 'from the venue’s email at 07:31', hash: '7f3a 91c0 e2b4',
  },
  survey: {
    id: 'survey', kind: 'pay', hold: 'Hold to pay £1,240.00 to Hallam',
    doneLine: 'Paid £1,240.00 to Hallam Surveyors Ltd. Receipt filed to House move.', spaceId: 'house', agent: 'scout', title: 'Pay the survey fee',
    to: 'Hallam Surveyors Ltd', account: 'Sort code 40-11-62, account ending 0918', amount: 124000,
    reference: 'HSL-22ASHBY', from: 'Joint account ending 4471', when: 'Friday 14 November',
    source: 'from the quote PDF and 2 emails', hash: 'c41d 07aa 5e19',
  },
  send: {
    id: 'send', kind: 'send', hold: 'Hold to send to 318 people', spaceId: 'tally', agent: 'scout',
    doneLine: 'Scheduled for 10:00 to 318 subscribers. You can stop it until 09:59.',
    title: 'Send the launch email', to: '318 subscribers on the Tally list', account: 'Subject: Tally is out today',
    amount: 0, reference: 'hello@tally.page', from: 'hello@tally.page', when: 'Today at 10:00',
    source: 'from the draft you wrote with Scout on Tuesday', hash: '2be8 f6d1 9a03',
  },
};

export interface Space {
  id: string;
  name: string;
  glyph: Glyph;
  agent: AgentId;
}
export const SPACES: Space[] = [
  { id: 'house', name: 'House move', glyph: 'house', agent: 'scout' },
  { id: 'mum', name: 'Mum’s 70th', glyph: 'cake', agent: 'wren' },
  { id: 'job', name: 'Job search', glyph: 'case', agent: 'juno' },
  { id: 'japan', name: 'Japan in April', glyph: 'plane', agent: 'juno' },
  { id: 'tally', name: 'Tally launch', glyph: 'rocket', agent: 'scout' },
  { id: 'tax', name: 'Taxes 2026', glyph: 'receipt', agent: 'ledger' },
  { id: 'health', name: 'Health', glyph: 'heart', agent: 'wren' },
  { id: 'read', name: 'Reading list', glyph: 'book', agent: 'juno' },
  { id: 'work', name: 'Work', glyph: 'laptop', agent: 'ledger' },
  { id: 'inbox', name: 'Inbox', glyph: 'tray', agent: 'wren' },
];
export const space = (id: string) => SPACES.find(s => s.id === id)!;

/* ---------- Story cards (rings) ---------- */
export interface StoryCard {
  id: string;
  kind: string;
  big: string;
  title: string;
  rows: [string, string, boolean?][]; // label, value, is-quote
  source: string;
  act: string;
  done: string;
  /** reversible actions may use swipe-up; payments open the hold-to-pay confirm */
  payment?: string;
  live?: { state: OrbState; text: string };
  state: 'new' | 'seen' | 'done';
}
const sc = (c: Omit<StoryCard, 'state'>): StoryCard => ({ ...c, state: 'new' });

export const STORIES: Record<string, StoryCard[]> = {
  house: [
    sc({ id: 'h1', kind: 'Needs a reply', big: 'Monday', title: 'Hamptons want the signed TA6 form',
      rows: [['From', 'Leah Grant, Hamptons'], ['Draft', 'Attached, signed by both of us. Could you confirm it arrived?', true]],
      source: 'From Leah’s email at 08:12', act: 'Queue reply to Leah', done: 'Queued in Drafts. Nothing sends until you press send.',
      live: { state: 'searching', text: 'Scout is reading 2 more emails from Hamptons' } }),
    sc({ id: 'h2', kind: 'Approval', big: '£1,240.00', title: 'Pay the survey fee',
      rows: [['To', 'Hallam Surveyors Ltd'], ['From', 'Joint account ending 4471'], ['When', 'Friday 14 November']],
      source: 'From the quote PDF and 2 emails', act: 'Review the payment', done: 'Paid.', payment: 'survey' }),
    sc({ id: 'h3', kind: 'Decision', big: '£890', title: 'Pick a removals quote',
      rows: [['Cheapest', 'Bishop’s Move, £890'], ['Best rated', 'Kent Removals, £1,040'], ['19 Dec', 'Both are free']],
      source: 'From 3 quotes Scout collected', act: 'Choose Bishop’s Move', done: 'Scout will ask Bishop’s Move to hold 19 December.' }),
  ],
  mum: [
    sc({ id: 'm1', kind: 'Approval', big: '£250.00', title: 'Pay the venue deposit',
      rows: [['To', 'The Old Mill Ltd'], ['Reference', 'MUM70-DEP'], ['Hold expires', 'Friday 17:00']],
      source: 'From the venue’s email at 07:31', act: 'Review the payment', done: 'Paid.', payment: 'deposit' }),
    sc({ id: 'm2', kind: 'To do', big: '3 missing', title: 'Invitations are ready to go',
      rows: [['Ready', '19 of 22 addresses'], ['Reply by', 'Monday 30 November']],
      source: 'From your contacts and Mum’s list', act: 'Ask Wren to find the 3', done: 'Wren will ask Ellie for the missing addresses.',
      live: { state: 'composing', text: 'Wren is drafting the invitation text' } }),
  ],
  job: [
    sc({ id: 'j1', kind: 'Needs a reply', big: 'Thu or Fri?', title: 'Ana at Lattice wants a first call',
      rows: [['From', 'Ana Ruiz, Lattice'], ['You are free', 'Thu 14:00 to 16:00, Fri 10:00 to 12:00'], ['Draft', 'Thursday at 14:30 works for me. Speak then.', true]],
      source: 'From Ana’s email at 07:55', act: 'Queue reply to Ana', done: 'Queued in Drafts with Thursday 14:30 pencilled in.' }),
    sc({ id: 'j2', kind: 'Draft', big: 'Draft 2', title: 'Cover letter for Monzo, Product Lead',
      rows: [['Length', '280 words'], ['Changed', 'Now opens with the payments launch'], ['Due', 'Sunday 15 November']],
      source: 'Built from your CV and the job advert', act: 'Keep this version', done: 'Kept. Juno will attach it to the application.' }),
  ],
  japan: [
    sc({ id: 'p1', kind: 'Price watch', big: '£612', title: 'Flights to Tokyo dropped £132',
      rows: [['Route', 'Heathrow to Haneda, return'], ['Dates', '3 to 17 April'], ['Last week', '£744']],
      source: 'From 3 airline sites, checked 09:00', act: 'Hold the fare for 48 hours', done: 'Held until Saturday 09:00. Nothing is paid.',
      live: { state: 'searching', text: 'Juno is checking two more airlines' } }),
  ],
  tally: [
    sc({ id: 't1', kind: 'Approval', big: '318', title: 'Send the launch email to 318 subscribers',
      rows: [['Subject', 'Tally is out today'], ['From', 'hello@tally.page'], ['When', 'Today at 10:00']],
      source: 'Draft written with you on Tuesday', act: 'Review before sending', done: 'Scheduled.', payment: 'send' }),
  ],
};

/* ---------- Spaces screen bands ---------- */
export interface NowItem {
  id: string;
  spaceId: string;
  ask: string;
  act: string;
  done: string;
  depth: number; // cards in this small stack
  at: string;
  payment?: string;
  backNote?: string;
}
export interface NextItem {
  id: string;
  spaceId: string;
  agent: AgentId;
  status: string;
  orb: OrbState | null; // null = waiting, not working
  eta: string;
  day: string;
  progress?: [number, number];
}
export interface LaterItem {
  id: string;
  spaceId: string;
  wake: string;
  ask?: string;
  act?: string;
  backAt?: number; // ms timestamp for the demo return
  from?: DeckCard;
}

export const NOW0: NowItem[] = [
  { id: 'n-dep', spaceId: 'mum', ask: 'Approve the venue deposit', act: 'Review £250.00', done: 'Paid. Receipt filed.', depth: 2, at: '07:31', payment: 'deposit' },
  { id: 'n-loft', spaceId: 'house', ask: 'Loft access for the surveyor, Tue 10:00?', act: 'Queue a yes', done: 'Yes queued to Dave Ellis.', depth: 3, at: '07:40' },
  { id: 'n-ana', spaceId: 'job', ask: 'Ana at Lattice wants a first call', act: 'Offer Thu 14:30', done: 'Reply queued to Ana.', depth: 2, at: '07:55' },
];
export const NEXT0: NextItem[] = [
  { id: 'x-fare', spaceId: 'japan', agent: 'juno', status: 'Comparing fares on 3 sites', orb: 'searching', eta: '12:00', day: 'Today' },
  { id: 'x-tax', spaceId: 'tax', agent: 'ledger', status: 'Reconciling October', orb: 'solving', eta: '16:00', day: 'Today', progress: [26, 58] },
  { id: 'x-press', spaceId: 'tally', agent: 'scout', status: 'Waiting on 2 replies from the press list', orb: null, eta: 'Sat', day: '10:00' },
];
export const LATER0: LaterItem[] = [
  { id: 'l-health', spaceId: 'health', wake: 'Wakes 6 Jan for the dentist' },
  { id: 'l-read', spaceId: 'read', wake: 'Wakes on your next free Sunday' },
  { id: 'l-work', spaceId: 'work', wake: 'You are off. Wakes Monday 08:30' },
  { id: 'l-inbox', spaceId: 'inbox', wake: 'Wakes if Mum, the bank or the school writes' },
];

export const RETURNS = [
  { label: 'This evening', when: '19:00', wake: 'Back tonight at 19:00' },
  { label: 'Tomorrow morning', when: 'Fri 08:00', wake: 'Back Friday 08:00' },
  { label: 'Saturday, after coffee', when: 'Sat 10:00', wake: 'Back Saturday 10:00' },
  { label: 'When something changes', when: 'a reply lands', wake: 'Wakes when a reply lands' },
  { label: 'In 15 seconds', when: 'try it', wake: '', demo: true },
];

/* ---------- Today deck ---------- */
export interface DeckCard {
  id: string;
  spaceId: string;
  agent: AgentId;
  kind: string;
  title: string;
  quote?: string;
  kv: [string, string][];
  note?: string;
  act: string;
  done: string;
  payment?: string;
  /** layout hints from the agent: the client decides what they look like */
  emphasis?: 'urgent';
  deadline?: string;
  near?: boolean;
  backNote?: string;
}
export const DECK0: DeckCard[] = [
  { id: 'd1', spaceId: 'house', agent: 'scout', kind: 'Needs a reply', title: 'Can Dave see the loft on Tuesday at 10?',
    quote: 'Hi Dave, Tuesday at 10 works. The hatch is in the back bedroom and I’ll leave the ladder out. Thanks, Sam',
    kv: [['To', 'Dave Ellis, Ellis Surveying']], act: 'Queue reply to Dave', done: 'Reply queued. It sends at 09:00 unless you stop it.' },
  { id: 'd-dep', spaceId: 'mum', agent: 'wren', kind: 'Approval', title: 'Pay the venue deposit',
    kv: [['Amount', '£250.00'], ['To', 'The Old Mill Ltd'], ['For', '14 March, 22 guests']], deadline: 'Hold ends Friday 17:00',
    act: 'Review and pay', done: 'Paid. Receipt filed.', payment: 'deposit' },
  { id: 'd3', spaceId: 'japan', agent: 'juno', kind: 'Digest', title: 'Fares to Tokyo dipped overnight',
    kv: [['Best', '£612 return, 3 to 17 April'], ['Was', '£744 last week'], ['Sources', '3 airline sites, checked 09:00']], act: 'Hold it for 48 hours', done: 'Held until Saturday 09:00. Nothing is paid.' },
  { id: 'd4', spaceId: 'tax', agent: 'ledger', kind: 'Quick sort', title: 'Is the £38.40 Screwfix receipt a work expense?',
    kv: [['Date', '2 November'], ['Items', 'Wall plugs, 2 shelf brackets']], note: '22 more like this are waiting in Taxes 2026.', act: 'Yes, it is', done: 'Marked as a work expense.' },
];
export const URGENT: DeckCard = { id: 'u-school', spaceId: 'inbox', agent: 'wren', kind: 'From the school, 09:38', emphasis: 'urgent',
  title: 'School shuts at 12:30 today. Who collects Maya?',
  quote: 'Ellie, the heating has failed at school and they close at 12:30. Could you get Maya? I’m in the survey until 1. Sam',
  kv: [['To', 'Ellie Reid'], ['You are', 'Busy 11:30 to 13:00']], act: 'Queue the ask to Ellie', done: 'Queued to Ellie. It sends in 60 seconds unless you stop it.' };
export const FINISHED: Record<string, { status: string; card?: DeckCard; ring?: string }> = {
  'x-tax': { status: 'Done. 41 of 58 matched, 17 need your eye', ring: 'tax',
    card: { id: 'd-tax17', spaceId: 'tax', agent: 'ledger', kind: 'Quick sort', title: '17 October payments did not match',
      kv: [['Matched', '41 of 58'], ['Largest', 'Screwfix, £38.40'], ['Oldest', '2 October']], act: 'Start sorting the 17', done: 'Ledger will show them one at a time.' } },
  'x-fare': { status: 'Done. £612 is still the best of 5 sites', ring: 'japan' },
};
export const DAYLINE = [
  { t: '09:00', what: 'Your yes reaches Dave', sub: 'House move' },
  { t: '14:00', what: 'The Old Mill confirms 14 March', sub: 'Mum’s 70th' },
  { t: '16:00', what: 'October is reconciled', sub: 'Taxes 2026' },
  { t: 'Fri 07:00', what: 'Tomorrow’s cards and edition', sub: 'About 4 cards so far' },
];

/* ---------- Capture ---------- */
export const RAMBLE =
  'okay so um the removal people, Bishop’s, need to know about the piano by Friday, and I should ask Mum whether Auntie Pat is coming to the party because that changes the numbers, oh and remind me to cancel the gym before the move, it’s the one on Kentish Town Road';
export const NOTE = {
  clean: 'Tell Bishop’s Move about the piano by Friday. Ask Mum whether Auntie Pat is coming, since it changes the numbers for the party. Cancel the gym on Kentish Town Road before the move.',
  cards: [
    { title: 'Tell Bishop’s Move about the piano', when: 'by Fri 14 Nov', spaceId: 'house', agent: 'scout' as AgentId },
    { title: 'Ask Mum if Auntie Pat is coming', when: 'this week', spaceId: 'mum', agent: 'wren' as AgentId },
    { title: 'Cancel the gym membership', when: 'before 19 Dec', spaceId: 'house', agent: 'scout' as AgentId },
  ],
};

/* ---------- Templates ---------- */
export const TEMPLATE = {
  name: 'Moving house',
  by: 'Priya Raman',
  byLine: 'Priya Raman’s setup, used for her move to Leeds',
  strap: 'From offer accepted to the first night in.',
  now: 'One card each Monday with that week’s decisions: quotes, dates, sign-offs.',
  next: 'Chases the conveyancer, surveyor and three removal firms, and tells you when each replies.',
  later: 'Keeps the meter readings and the change-of-address list for moving day.',
  agents: [
    { name: 'Scout', who: 'scout' as AgentId, job: 'Chases replies' },
    { name: 'Ledger', who: 'ledger' as AgentId, job: 'Tracks every fee' },
  ],
  reads: 'Gmail (read and draft), Calendar',
  cap: '$4.00 a month, on your key',
  starts: 'Paused, until you switch each routine on',
};
export const MORE_TEMPLATES = [
  { name: 'A big birthday', by: 'Tom Okafor', now: 'RSVPs and the deposit', next: 'Venue and guest list', later: 'The playlist' },
  { name: 'Job hunt', by: 'Ana Ruiz', now: 'Replies to recruiters', next: 'Tailored CVs', later: 'Roles you parked' },
  { name: 'Self Assessment', by: 'Ledger, built in', now: 'Yes or no on receipts', next: 'Matching payments', later: 'Next year’s folder' },
  { name: 'Trip planning', by: 'Juno, built in', now: 'Fares worth holding', next: 'Watching prices', later: 'Visa dates' },
];

/* ---------- The edition: a finite read, every piece with its source ---------- */
export interface Snippet {
  id: string;
  source: string;
  via: 'newsletter' | 'following';
  topic?: string; // the interest it was followed for
  mins: number; // length of the original
  kind: 'gist' | 'number' | 'quote' | 'trio';
  big?: string;
  head: string;
  gist: string;
  more?: string;
  items?: string[];
  spaceId?: string; // why it is here
}
export const EDITION: Snippet[] = [
  { id: 'e1', source: 'The Long Lease', via: 'newsletter', mins: 6, kind: 'gist', spaceId: 'house',
    head: 'Completion dates are slipping again',
    gist: 'Local searches are taking 19 working days, up from 12 in the spring. If your survey lands this month, ask for a completion window rather than a date.',
    more: 'The delay is worst in councils that still post results. Two of the big conveyancers now quote a fortnight’s range as standard, and removals firms have started to price for it.' },
  { id: 'e2', source: 'Heat Pump Diaries', via: 'following', topic: 'heat pumps', mins: 4, kind: 'number', big: '£7,500',
    head: 'The boiler grant stays until 2028',
    gist: 'The upgrade grant keeps its current level for three more years. Installers expect waiting lists to shorten after January.',
    more: 'You need a valid energy certificate with no outstanding loft insulation recommendation. The installer applies, not you.' },
  { id: 'e3', source: 'Wires Weekly', via: 'newsletter', mins: 9, kind: 'trio', spaceId: 'job',
    head: 'Three from Wires Weekly',
    gist: 'Hiring, an API and a number, each in a line.',
    items: ['Monzo is opening 40 product roles in Cardiff this quarter.', 'Lattice shipped its first public API on Tuesday.', 'Form builders like Tally grew 31% this year.'] },
  { id: 'e4', source: 'Tokyo Table', via: 'following', topic: 'Tokyo food', mins: 5, kind: 'quote', spaceId: 'japan',
    head: '“Book counter seats the day they open: thirty days out, ten in the morning, Tokyo time.”',
    gist: 'For 3 to 17 April, the first tables open on 4 March at 01:00 here.',
    more: 'The piece lists eleven counters that take bookings from abroad without a hotel concierge. Juno can set the reminders.' },
  { id: 'e5', source: 'Field & Fare', via: 'newsletter', mins: 3, kind: 'gist', spaceId: 'mum',
    head: 'A party for seventy needs less food than you think',
    gist: 'Caterers plan six canapés a head for a two-hour afternoon party, and one in five guests will not eat at all.',
    more: 'For 22 guests that is about 130 pieces. The usual mistake is ordering by the hour rather than by the head.' },
  { id: 'e6', source: 'Kiln Notes', via: 'following', topic: 'product leadership', mins: 7, kind: 'gist',
    head: 'A roadmap is a promise about attention',
    gist: 'Teams that publish what they will not look at this quarter ship more of what they said they would.',
    more: 'The author kept a “not now” list beside the roadmap for a year. The list was read more often than the roadmap.' },
];
export const FOLLOWING = ['heat pumps', 'Tokyo food', 'product leadership'];

/* ---------- Spaces, as places ---------- */
export const SPACE_META: Record<string, { status: string; asOf: string }> = {
  house: { status: 'Survey booked. Hamptons want the TA6 by Monday.', asOf: '09:12' },
  mum: { status: 'Venue held for 14 March. Deposit waiting on you.', asOf: '07:31' },
  job: { status: 'Ana at Lattice wants a first call this week.', asOf: '07:55' },
  japan: { status: 'Watching fares. Best is £612 return.', asOf: '09:00' },
  tally: { status: 'Launch email ready. 2 press replies outstanding.', asOf: '08:40' },
  tax: { status: 'Reconciling October against 44 receipts.', asOf: '09:20' },
  health: { status: 'Quiet until the dentist on 6 January.', asOf: 'Mon' },
  read: { status: '9 saved pieces. No one is on it.', asOf: 'Sun' },
  work: { status: 'You are off. Back Monday 08:30.', asOf: 'Wed' },
  inbox: { status: 'Wakes if Mum, the bank or the school writes.', asOf: '09:30' },
};

/* ---------- Threads: one with Keep, one per Space ---------- */
export interface Msg {
  who: 'you' | 'crew' | 'log';
  text: string;
  at?: string;
  card?: { kind: string; title: string; state: string; spaceId?: string };
}
export const THREADS0: Record<string, Msg[]> = {
  keep: [
    { who: 'you', text: 'Remind me to cancel the gym before the move.', at: 'Wed 18:02' },
    { who: 'crew', text: 'Filed to House move. Scout has it.', card: { kind: 'Task', title: 'Cancel the gym membership', state: 'Before 19 Dec', spaceId: 'house' } },
  ],
  house: [
    { who: 'log', text: 'Scout read 2 emails from Hamptons', at: '08:12' },
    { who: 'crew', text: 'Hamptons need the signed TA6 by Monday. I have a reply drafted.', card: { kind: 'Needs a reply', title: 'Hamptons want the signed TA6 form', state: 'Waiting on you' } },
    { who: 'you', text: 'Which removals firm is cheapest for the 19th?', at: '08:40' },
    { who: 'crew', text: 'Bishop’s Move at £890. Kent Removals is £1,040 and better rated. Both are free on 19 December.', card: { kind: 'Decision', title: 'Pick a removals quote', state: 'In the House move ring' } },
    { who: 'log', text: 'Scout collected a third quote', at: '09:05' },
  ],
  mum: [
    { who: 'log', text: 'Wren read the venue’s email', at: '07:31' },
    { who: 'crew', text: 'The Old Mill can do 14 March for 22. They hold it until Friday 17:00 for a £250.00 deposit.', card: { kind: 'Approval', title: 'Pay the venue deposit', state: 'Needs a press and hold' } },
  ],
  tax: [
    { who: 'log', text: 'Ledger started reconciling October', at: '09:02' },
    { who: 'crew', text: 'I will bring you only the ones I cannot match.' },
  ],
};
