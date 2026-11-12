// Mock content for the prototype. Everything here is example data.
import type { OrbState } from 'thinking-orbs';

export type Glyph =
  | 'house' | 'cake' | 'receipt' | 'plane' | 'case' | 'rocket' | 'heart' | 'book' | 'tray' | 'laptop' | 'coins'
  | 'car' | 'leaf' | 'paw' | 'cap' | 'gift' | 'wrench' | 'music' | 'run' | 'camera' | 'pot';

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

/** A bill Later found. Later never pays: it shows the exact details and opens your bank or the payee's page. */
export interface Bill {
  id: string;
  spaceId: string;
  agent: AgentId;
  title: string;
  payee: string;
  amount: number; // pence
  reference: string;
  account: string;
  due: string;
  opens: string; // what the open button opens
  source: string;
  paidLine: string;
}
export const BILLS: Record<string, Bill> = {
  deposit: {
    id: 'deposit', spaceId: 'mum', agent: 'wren', title: 'Pay the venue deposit',
    payee: 'The Old Mill Ltd', amount: 25000, reference: 'MUM70-DEP', account: '20-45-77, ending 3391',
    due: 'Hold ends Friday 17:00', opens: 'your bank', source: 'from the venue’s email at 07:31',
    paidLine: 'Marked as paid. Wren will ask The Old Mill to confirm 14 March.',
  },
  survey: {
    id: 'survey', spaceId: 'house', agent: 'scout', title: 'Pay the survey fee',
    payee: 'Hallam Surveyors Ltd', amount: 124000, reference: 'HSL-22ASHBY', account: '40-11-62, ending 0918',
    due: 'Due Friday 14 November', opens: 'Hallam’s payment page', source: 'from the quote PDF and 2 emails',
    paidLine: 'Marked as paid. Scout will file the receipt when it arrives.',
  },
};

/** Something that sends. Always a press and hold on the fixed approval form, then a 30-second window to stop it. */
export interface Send {
  id: string;
  spaceId: string;
  agent: AgentId;
  title: string;
  to: string;
  address: string;
  from: string;
  subject?: string;
  body: string;
  source: string;
  hash: string; // argument hash the approval binds to
  hold: string;
  short: string; // who it goes to, for the window row
  sentLine: string;
}
export const SENDS: Record<string, Send> = {
  dave: {
    id: 'dave', spaceId: 'house', agent: 'scout', title: 'Reply to Dave about the loft',
    to: 'Dave Ellis, Ellis Surveying', address: 'dave@ellissurveying.co.uk', from: 'sam.reid@gmail.com',
    subject: 'Re: Loft access on Tuesday',
    body: 'Hi Dave, Tuesday at 10 works. The hatch is in the back bedroom and I’ll leave the ladder out. Thanks, Sam',
    source: 'drafted by Scout from Dave’s email at 07:40', hash: '4e1b 77c2 d093',
    hold: 'Hold to send to Dave Ellis', short: 'Dave Ellis', sentLine: 'Sent to Dave Ellis',
  },
  ellie: {
    id: 'ellie', spaceId: 'inbox', agent: 'wren', title: 'Ask Ellie to collect Maya',
    to: 'Ellie Reid', address: '+44 7700 900461 (text)', from: 'Your phone number',
    body: 'Ellie, the heating has failed at school and they close at 12:30. Could you get Maya? I’m in the survey until 1. Sam',
    source: 'drafted by Wren from the school’s email at 09:38', hash: '91aa 3c0e 6f52',
    hold: 'Hold to text Ellie Reid', short: 'Ellie Reid', sentLine: 'Texted Ellie Reid',
  },
  launch: {
    id: 'launch', spaceId: 'tally', agent: 'scout', title: 'Send the launch email',
    to: '318 subscribers on the Tally list', address: 'list: tally-launch (318)', from: 'hello@tally.page',
    subject: 'Tally is out today',
    body: 'Tally is out today. It turns any form into a tally you can share. The first 100 of you get a year free with the code EARLY.',
    source: 'the draft you wrote with Scout on Tuesday', hash: '2be8 f6d1 9a03',
    hold: 'Hold to send to 318 people', short: '318 subscribers', sentLine: 'Sent to 318 subscribers',
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
  { id: 'car', name: 'The car', glyph: 'car', agent: 'ledger' },
  { id: 'garden', name: 'Garden fence', glyph: 'leaf', agent: 'scout' },
];
/** Eighteen more, for the 30-Space demo: the desk must still scan when a life has a lot going on. */
export const MORE_SPACES: Space[] = [
  { id: 'x-dog', name: 'Biscuit the dog', glyph: 'paw', agent: 'wren' },
  { id: 'x-school', name: 'Maya’s school', glyph: 'cap', agent: 'wren' },
  { id: 'x-xmas', name: 'Christmas', glyph: 'gift', agent: 'juno' },
  { id: 'x-kitchen', name: 'Kitchen tap', glyph: 'wrench', agent: 'scout' },
  { id: 'x-pension', name: 'Pension', glyph: 'coins', agent: 'ledger' },
  { id: 'x-choir', name: 'Choir', glyph: 'music', agent: 'wren' },
  { id: 'x-run', name: 'Half marathon', glyph: 'run', agent: 'juno' },
  { id: 'x-photos', name: 'Photo books', glyph: 'camera', agent: 'juno' },
  { id: 'x-recipes', name: 'Recipes', glyph: 'pot', agent: 'juno' },
  { id: 'x-bills', name: 'Household bills', glyph: 'receipt', agent: 'ledger' },
  { id: 'x-dad', name: 'Dad’s appointments', glyph: 'heart', agent: 'wren' },
  { id: 'x-wedding', name: 'Jo’s wedding', glyph: 'cake', agent: 'wren' },
  { id: 'x-side', name: 'Side project', glyph: 'laptop', agent: 'scout' },
  { id: 'x-club', name: 'Book club', glyph: 'book', agent: 'juno' },
  { id: 'x-bike', name: 'Bike repair', glyph: 'wrench', agent: 'scout' },
  { id: 'x-council', name: 'Council tax', glyph: 'house', agent: 'ledger' },
  { id: 'x-trip', name: 'Lakes weekend', glyph: 'plane', agent: 'juno' },
  { id: 'x-subs', name: 'Subscriptions', glyph: 'coins', agent: 'ledger' },
];
export const ALL_SPACES = [...SPACES, ...MORE_SPACES];
export const space = (id: string) => ALL_SPACES.find(s => s.id === id)!;

/* ---------- Story cards (rings) ---------- */
export interface StoryCard {
  id: string;
  kind: string;
  big: string;
  title: string;
  rows: [string, string, boolean?][]; // label, value, is-quote
  source: string;
  act: string;
  /** the action, short enough for a small stack on the Spaces desk */
  short?: string;
  done: string;
  /** reversible actions may use swipe-up; a bill opens the fixed pay slip, a send opens the fixed approval */
  bill?: string;
  send?: string;
  live?: { state: OrbState; text: string };
  state: 'new' | 'seen' | 'done';
}
const sc = (c: Omit<StoryCard, 'state'>): StoryCard => ({ ...c, state: 'new' });

export const STORIES: Record<string, StoryCard[]> = {
  house: [
    sc({ id: 'h1', short: 'Queue reply', kind: 'Needs a reply', big: 'Monday', title: 'Hamptons want the signed TA6 form',
      rows: [['From', 'Leah Grant, Hamptons'], ['Draft', 'Attached, signed by both of us. Could you confirm it arrived?', true]],
      source: 'From Leah’s email at 08:12', act: 'Queue reply to Leah', done: 'Queued in Drafts. Nothing sends until you press send.',
      live: { state: 'searching', text: 'Scout is reading 2 more emails from Hamptons' } }),
    sc({ id: 'h2', short: 'How to pay', kind: 'Ready to pay', big: '£1,240.00', title: 'Pay the survey fee',
      rows: [['To', 'Hallam Surveyors Ltd'], ['Reference', 'HSL-22ASHBY'], ['Due', 'Friday 14 November']],
      source: 'From the quote PDF and 2 emails', act: 'See how to pay', done: 'Marked as paid.', bill: 'survey' }),
    sc({ id: 'h3', short: 'Bishop’s Move', kind: 'Decision', big: '£890', title: 'Pick a removals quote',
      rows: [['Cheapest', 'Bishop’s Move, £890'], ['Best rated', 'Kent Removals, £1,040'], ['19 Dec', 'Both are free']],
      source: 'From 3 quotes Scout collected', act: 'Choose Bishop’s Move', done: 'Scout will ask Bishop’s Move to hold 19 December.' }),
  ],
  mum: [
    sc({ id: 'm1', short: 'How to pay', kind: 'Ready to pay', big: '£250.00', title: 'Pay the venue deposit',
      rows: [['To', 'The Old Mill Ltd'], ['Reference', 'MUM70-DEP'], ['Hold ends', 'Friday 17:00']],
      source: 'From the venue’s email at 07:31', act: 'See how to pay', done: 'Marked as paid.', bill: 'deposit' }),
    sc({ id: 'm2', short: 'Ask Wren', kind: 'To do', big: '3 missing', title: 'Invitations are ready to go',
      rows: [['Ready', '19 of 22 addresses'], ['Reply by', 'Monday 30 November']],
      source: 'From your contacts and Mum’s list', act: 'Ask Wren to find the 3', done: 'Wren will ask Ellie for the missing addresses.',
      live: { state: 'composing', text: 'Wren is drafting the invitation text' } }),
  ],
  job: [
    sc({ id: 'j1', short: 'Queue reply', kind: 'Needs a reply', big: 'Thu or Fri?', title: 'Ana at Lattice wants a first call',
      rows: [['From', 'Ana Ruiz, Lattice'], ['You are free', 'Thu 14:00 to 16:00, Fri 10:00 to 12:00'], ['Draft', 'Thursday at 14:30 works for me. Speak then.', true]],
      source: 'From Ana’s email at 07:55', act: 'Queue reply to Ana', done: 'Queued in Drafts with Thursday 14:30 pencilled in.' }),
    sc({ id: 'j2', short: 'Keep it', kind: 'Draft', big: 'Draft 2', title: 'Cover letter for Monzo, Product Lead',
      rows: [['Length', '280 words'], ['Changed', 'Now opens with the payments launch'], ['Due', 'Sunday 15 November']],
      source: 'Built from your CV and the job advert', act: 'Keep this version', done: 'Kept. Juno will attach it to the application.' }),
  ],
  japan: [
    sc({ id: 'p1', short: 'Hold the fare', kind: 'Price watch', big: '£612', title: 'Flights to Tokyo dropped £132',
      rows: [['Route', 'Heathrow to Haneda, return'], ['Dates', '3 to 17 April'], ['Last week', '£744']],
      source: 'From 3 airline sites, checked 09:00', act: 'Hold the fare for 48 hours', done: 'Held until Saturday 09:00. Nothing is paid.',
      live: { state: 'searching', text: 'Juno is checking two more airlines' } }),
  ],
  tally: [
    sc({ id: 't1', short: 'Review', kind: 'Approval', big: '318', title: 'Send the launch email to 318 subscribers',
      rows: [['Subject', 'Tally is out today'], ['From', 'hello@tally.page'], ['Goes', '30 seconds after you hold']],
      source: 'Draft written with you on Tuesday', act: 'Review before sending', done: 'Sent.', send: 'launch' }),
  ],
};
/** Cards for the 30-Space demo and for the Garden fence when Scout hears back. */
export const MORE_STORIES: Record<string, StoryCard[]> = {
  'x-school': [sc({ id: 'xs1', kind: 'Needs a reply', big: 'Friday', title: 'Can Maya go on the museum trip?', short: 'Say yes',
    rows: [['Cost', 'Nothing, it is funded'], ['Form', 'Signed for you to check']], source: 'From the school office at 08:05', act: 'Say yes for Maya', done: 'Wren filled in the form. It waits in Drafts.' })],
  'x-xmas': [sc({ id: 'xx1', kind: 'Decision', big: '3 ideas', title: 'Present for Dad, under £60', short: 'See the three',
    rows: [['Best', 'A walking guide to the Peaks'], ['Order by', '16 December']], source: 'From Dad’s wish list and 4 shops', act: 'See the three', done: 'Juno will keep watching prices.' }),
    sc({ id: 'xx2', kind: 'To do', big: '14', title: 'Cards to write this year', short: 'Start the list',
      rows: [['Last year', '16'], ['Moved', '2 addresses changed']], source: 'From last year’s list', act: 'Start the list', done: 'Juno drafted the list.' })],
  'x-kitchen': [sc({ id: 'xk1', kind: 'Decision', big: 'Tue', title: 'Plumber can fix the tap Tuesday 8:00', short: 'Book Tuesday',
    rows: [['Quote', '£85 including the part'], ['You are', 'Free until 9:30']], source: 'From Rhys’s text at 07:12', act: 'Book Tuesday 8:00', done: 'Scout will confirm with Rhys.' })],
  garden: [],
};
export const GARDEN_CARDS: StoryCard[] = [
  sc({ id: 'g1', kind: 'Decision', big: 'Sat', title: 'The fencer can come Saturday 9:00 or Monday 8:00', short: 'Saturday 9:00',
    rows: [['Saturday', 'You are free'], ['Monday', 'Clashes with the school run']], source: 'From Owen’s reply at 10:02', act: 'Choose Saturday 9:00', done: 'Scout will tell Owen Saturday 9:00.' }),
  sc({ id: 'g2', kind: 'Decision', big: '12', title: 'Reuse the old concrete posts?', short: 'Reuse them',
    rows: [['Saves', '£140 on the quote'], ['Owen says', 'Nine of twelve are sound']], source: 'From Owen’s reply at 10:02', act: 'Reuse the sound ones', done: 'Scout passed it on.' }),
];

/* ---------- Spaces screen bands ---------- */
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
  bill?: string;
  send?: string;
  /** cards of one group merge into one counted stack */
  group?: string;
  /** layout hints from the agent: the client decides what they look like */
  emphasis?: 'urgent';
  deadline?: string;
  near?: boolean;
  backNote?: string;
}
export const DECK0: DeckCard[] = [
  { id: 'd1', spaceId: 'house', agent: 'scout', kind: 'Needs a reply', title: 'Can Dave see the loft on Tuesday at 10?',
    quote: 'Hi Dave, Tuesday at 10 works. The hatch is in the back bedroom and I’ll leave the ladder out. Thanks, Sam',
    kv: [['To', 'Dave Ellis, Ellis Surveying']], act: 'Review and send', done: 'Sent to Dave.', send: 'dave' },
  { id: 'd-dep', spaceId: 'mum', agent: 'wren', kind: 'Ready to pay', title: 'Pay the venue deposit',
    kv: [], note: 'For 14 March, 22 guests. Later never pays: pay it from your bank, then mark it paid.', deadline: 'Hold ends Friday 17:00',
    act: 'Open your bank', done: 'Marked as paid.', bill: 'deposit' },
  { id: 'd3', spaceId: 'japan', agent: 'juno', kind: 'Digest', title: 'Fares to Tokyo dipped overnight',
    kv: [['Best', '£612 return, 3 to 17 April'], ['Was', '£744 last week'], ['Sources', '3 airline sites, checked 09:00']], act: 'Hold it for 48 hours', done: 'Held until Saturday 09:00. Nothing is paid.' },
  { id: 'd4', spaceId: 'tax', agent: 'ledger', kind: 'Quick sort', title: 'Is the £38.40 Screwfix receipt a work expense?',
    kv: [['Date', '2 November'], ['Items', 'Wall plugs, 2 shelf brackets']], note: '22 more like this are waiting in Taxes 2026.', act: 'Yes, it is', done: 'Marked as a work expense.', group: 'receipts' },
];
export const URGENT: DeckCard = { id: 'u-school', spaceId: 'inbox', agent: 'wren', kind: 'From the school, 09:38', emphasis: 'urgent',
  title: 'School shuts at 12:30 today. Who collects Maya?',
  quote: 'Ellie, the heating has failed at school and they close at 12:30. Could you get Maya? I’m in the survey until 1. Sam',
  kv: [['To', 'Ellie Reid, by text'], ['You are', 'Busy 11:30 to 13:00']], act: 'Review and text Ellie', done: 'Texted Ellie.', send: 'ellie' };
/** Ledger finds more receipts like d4: they arrive one by one, then merge into one counted stack. */
export const RECEIPTS = [
  { id: 'r1', what: 'Wickes', amount: '£12.99', date: '4 Nov' },
  { id: 'r2', what: 'B&Q', amount: '£54.00', date: '6 Nov' },
  { id: 'r3', what: 'Robert Dyas', amount: '£7.20', date: '9 Nov' },
];
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

/* ---------- Voice, inside Keep ---------- */
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
/** status: what the crew is doing, in a line. back: when a resting Space next wakes. doing: background work that does not reach you today. */
export const SPACE_META: Record<string, { status: string; asOf: string; back?: string; doing?: { status: string; eta: string } }> = {
  house: { status: 'Survey booked. Hamptons want the TA6 by Monday.', asOf: '09:12', doing: { status: 'Watching for the survey report', eta: 'Mon' } },
  mum: { status: 'Venue held for 14 March. Deposit waiting on you.', asOf: '07:31', doing: { status: 'Collecting the last 3 addresses', eta: 'Sat' } },
  job: { status: 'Ana at Lattice wants a first call this week.', asOf: '07:55', doing: { status: 'Watching for Ana to confirm Thursday', eta: 'Thu' } },
  japan: { status: 'Watching fares. Best is £612 return.', asOf: '09:00' },
  tally: { status: 'Launch email ready. 2 press replies outstanding.', asOf: '08:40', doing: { status: 'Waiting on 2 press replies', eta: 'Sat' } },
  tax: { status: 'Reconciling October against 44 receipts.', asOf: '09:20' },
  health: { status: 'Quiet until the dentist on 6 January.', asOf: 'Mon', back: '6 Jan' },
  read: { status: '9 saved pieces. No one is on it.', asOf: 'Sun', back: 'No one on it' },
  work: { status: 'You are off. Back Monday 08:30.', asOf: 'Wed', back: 'Mon 08:30' },
  inbox: { status: 'Wakes if Mum, the bank or the school writes.', asOf: '09:30', back: 'On a message' },
  car: { status: 'Comparing 4 insurance renewals.', asOf: '09:10', doing: { status: 'Comparing 4 insurance renewals', eta: 'Fri' } },
  garden: { status: 'Chasing the fencer for a date.', asOf: '08:30', doing: { status: 'Chasing Owen the fencer for a date', eta: '15:00' } },
  'x-dog': { status: 'Jabs booked for 2 December.', asOf: 'Tue', back: '2 Dec' },
  'x-school': { status: 'The museum trip form came in.', asOf: '08:05', doing: { status: 'Watching the school inbox', eta: 'Fri' } },
  'x-xmas': { status: 'Three ideas for Dad.', asOf: '09:00', doing: { status: 'Watching prices on three presents', eta: 'Mon' } },
  'x-kitchen': { status: 'Rhys can come Tuesday.', asOf: '07:12', doing: { status: 'Waiting for Rhys to confirm', eta: 'Tue' } },
  'x-pension': { status: 'Checking last year’s statement.', asOf: '09:15', doing: { status: 'Checking last year’s statement', eta: 'Mon' } },
  'x-choir': { status: 'Rehearsals start in January.', asOf: 'Sun', back: '8 Jan' },
  'x-run': { status: 'Building the 12-week plan.', asOf: '08:50', doing: { status: 'Building a 12-week plan', eta: 'Sat' } },
  'x-photos': { status: 'Picking 40 from the summer.', asOf: '08:00', doing: { status: 'Picking 40 photos from the summer', eta: 'Sun' } },
  'x-recipes': { status: 'Nothing new.', asOf: 'Fri', back: 'On a save' },
  'x-bills': { status: 'Watching the energy tariff.', asOf: '09:05', doing: { status: 'Watching the energy tariff', eta: '1 Dec' } },
  'x-dad': { status: 'Next is the eye clinic.', asOf: 'Mon', back: '19 Nov' },
  'x-wedding': { status: 'Waiting for the invitation.', asOf: 'Oct', back: 'On a reply' },
  'x-side': { status: 'Paused by you.', asOf: 'Oct', back: 'When you say' },
  'x-club': { status: 'Finding next month’s book.', asOf: '07:40', doing: { status: 'Shortlisting next month’s book', eta: 'Thu' } },
  'x-bike': { status: 'Done in October.', asOf: 'Oct', back: 'In spring' },
  'x-council': { status: 'Direct debit set for the move.', asOf: 'Wed', back: '1 Dec' },
  'x-trip': { status: 'Comparing three cottages.', asOf: '09:25', doing: { status: 'Comparing three cottages', eta: 'Sat' } },
  'x-subs': { status: 'Nothing renews this month.', asOf: 'Mon', back: '1 Dec' },
};

/* ---------- Threads: one with Keep, one per Space ---------- */
export interface Msg {
  who: 'you' | 'crew' | 'log';
  text: string;
  at?: string;
  card?: { kind: string; title: string; state: string; spaceId?: string };
  /** a voice note you left: the cleaned note, with what you said kept beside it */
  voice?: { secs: number; raw: string };
  /** Keep's proposal for where captured cards go; filed stays in the thread */
  proposal?: { id: string; filed: boolean };
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
    { who: 'crew', text: 'The Old Mill can do 14 March for 22. They hold it until Friday 17:00 for a £250.00 deposit.', card: { kind: 'Ready to pay', title: 'Pay the venue deposit', state: 'In Now, ready for you to pay from your bank' } },
  ],
  job: [
    { who: 'log', text: 'Juno read Ana’s email from Lattice', at: '07:55' },
    { who: 'crew', text: 'Ana wants a first call. You are free Thursday afternoon; I have pencilled 14:30.' },
  ],
  japan: [
    { who: 'log', text: 'Juno checked 3 airline sites', at: '09:00' },
    { who: 'crew', text: 'Heathrow to Haneda is £612 return for 3 to 17 April, down £132. I am checking two more.' },
  ],
  tally: [
    { who: 'log', text: 'Scout sent the press list 12 emails', at: 'Wed' },
    { who: 'crew', text: 'Two replies are still out. The launch email is ready for you to send.', card: { kind: 'Approval', title: 'Send the launch email to 318 subscribers', state: 'Needs a press and hold' } },
  ],
  health: [{ who: 'log', text: 'Wren booked the dentist for 6 January', at: 'Mon' }],
  work: [{ who: 'log', text: 'Ledger paused Work while you are off', at: 'Wed' }],
  inbox: [{ who: 'log', text: 'Wren is watching for Mum, the bank and the school', at: '09:30' }],
  tax: [
    { who: 'log', text: 'Ledger started reconciling October', at: '09:02' },
    { who: 'crew', text: 'I will bring you only the ones I cannot match.' },
  ],
};
