import type { AgentId } from '../data';

/* The front door's only "intelligence", before Later has a home: simple keyword rules on the phone.
   Pure functions. The clock is injected. No model is called and nothing leaves the device.
   They can pick a kind of job, a crew member, and a date, person or amount written in the user's words.
   They cannot understand anything else, and Keep says so. */

export type Kind = 'money' | 'message' | 'booking' | 'health' | 'home' | 'travel' | 'school' | 'general';

export interface Found { date?: string; person?: string; amount?: string }
export interface Reading { kind: Kind; who: AgentId | null; plan: string[]; found: Found; label: string }

/** Words that point at a kind of job. Doing verbs weigh 2, nouns 1. */
const WORDS: Record<Exclude<Kind, 'general'>, [string, number][]> = {
  money: [['renew', 2], ['pay', 2], ['cancel', 2], ['claim', 2], ['refund', 2], ['insurance', 2], ['bill', 1], ['invoice', 1], ['tax', 2], ['council', 1], ['bank', 1], ['mortgage', 2], ['rent', 1], ['pension', 2], ['subscription', 2], ['direct debit', 2], ['receipt', 1], ['receipts', 1], ['paperwork', 2], ['form', 1], ['licence', 1], ['energy', 1], ['broadband', 1], ['phone contract', 2]],
  message: [['reply', 3], ['email', 2], ['write to', 2], ['text', 2], ['call', 2], ['ring', 2], ['message', 2], ['tell', 2], ['ask', 2], ['thank', 2], ['invite', 2], ['get back to', 3], ['answer', 2], ['respond', 3]],
  booking: [['book', 3], ['appointment', 2], ['schedule', 2], ['arrange', 2], ['reserve', 2], ['reservation', 2], ['haircut', 2], ['table', 1], ['mot', 2], ['service', 1], ['meeting', 1], ['vet', 2]],
  health: [['dentist', 2], ['doctor', 2], ['gp', 2], ['prescription', 2], ['optician', 2], ['eye test', 2], ['vaccine', 2], ['jab', 2], ['physio', 2], ['blood test', 2], ['repeat', 1]],
  home: [['fix', 2], ['repair', 2], ['boiler', 2], ['plumber', 2], ['leak', 2], ['clean', 1], ['garden', 1], ['fence', 1], ['gutter', 2], ['paint', 1], ['landlord', 1], ['move', 1], ['moving', 1], ['removal', 2], ['tap', 1], ['shelf', 1], ['shelves', 1], ['declutter', 2], ['tip', 1]],
  travel: [['flight', 2], ['flights', 2], ['train', 2], ['holiday', 2], ['hotel', 2], ['passport', 2], ['visa', 2], ['ferry', 2], ['airbnb', 2], ['trip', 1], ['travel', 2]],
  school: [['school', 2], ['nursery', 2], ['teacher', 2], ['homework', 2], ['club', 1], ['term', 1], ['uniform', 2], ["parents' evening", 2], ['pta', 2], ['trip form', 2]],
};

const WHO: Record<Kind, AgentId | null> = { money: 'ledger', message: 'wren', booking: 'scout', health: 'scout', home: 'juno', travel: 'juno', school: 'juno', general: null };
const LABEL: Record<Kind, string> = { money: 'money and paperwork', message: 'people and messages', booking: 'dates and bookings', health: 'health', home: 'home', travel: 'travel', school: 'school', general: 'something I can’t place yet' };

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const FAMILY = ['mum', 'dad', 'nan', 'nana', 'gran', 'grandma', 'grandad', 'grandpa', 'mother', 'father', 'sister', 'brother', 'wife', 'husband', 'partner', 'auntie', 'uncle'];
const NOT_NAMES = new Set(['I', 'The', 'A', 'An', 'My', 'Our', 'To', 'And', 'Or', 'On', 'At', 'By', 'For', 'Before', 'After', 'Next', 'This', 'MOT', 'GP', 'PTA', 'TV', 'UK']);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Pick out a date, a person and an amount, exactly as the user wrote them (tidied). */
export function findIn(text: string): Found {
  const found: Found = {};
  const t = text.toLowerCase();
  const amount = text.match(/[£$€]\s?\d[\d,]*(?:\.\d{1,2})?/);
  if (amount) found.amount = amount[0].replace(/\s/g, '');
  const dayRe = new RegExp(`\\b(today|tonight|tomorrow|this weekend|next week|end of the month|(?:by |on |next |this )?(?:${DAYS.join('|')}))\\b`);
  const monthRe = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?(?: of)? (${MONTHS.map(m => m.slice(0, 3)).join('|')})[a-z]*\\b|\\b(${MONTHS.map(m => m.slice(0, 3)).join('|')})[a-z]* (\\d{1,2})(?:st|nd|rd|th)?\\b`);
  const monthOnly = new RegExp(`\\b(${MONTHS.join('|')})\\b`);
  const m = t.match(monthRe) ?? t.match(dayRe) ?? t.match(monthOnly);
  if (m && m.index != null) found.date = cap(text.slice(m.index, m.index + m[0].length).replace(/^(by|on) /i, '').toLowerCase().replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/g, w => cap(w)));
  const fam = t.match(new RegExp(`\\b(${FAMILY.join('|')})\\b`));
  if (fam) found.person = cap(fam[1]);
  else {
    // a capitalised word that is not the first word, a day, a month or a stop word
    const words = text.split(/\s+/);
    for (let i = 1; i < words.length; i++) {
      const w = words[i].replace(/[^A-Za-z’'-]/g, '').replace(/[’']s$/, '');
      if (w.length > 1 && /^[A-Z][a-z]/.test(w) && !NOT_NAMES.has(w) && !DAYS.includes(w.toLowerCase()) && !MONTHS.includes(w.toLowerCase())) { found.person = w; break; }
    }
  }
  return found;
}

/** Score each kind by the words present; ties go to the earlier kind in the table. */
export function kindOf(text: string): Kind {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9£$€' ]/g, ' ')} `;
  let best: Kind = 'general', score = 0;
  (Object.keys(WORDS) as Exclude<Kind, 'general'>[]).forEach(k => {
    const s = WORDS[k].reduce((n, [w, v]) => n + (t.includes(` ${w} `) || t.includes(` ${w}s `) ? v : 0), 0);
    if (s > score) { best = k; score = s; }
  });
  return best;
}

/** Three short legwork steps from a small template set, with anything found written back in. */
export function planFor(kind: Kind, f: Found): string[] {
  switch (kind) {
    case 'money': return ['Find the latest letter or bill about it', f.amount ? `Check ${f.amount} against last time` : 'Check the price against last time', 'Get the renewal or the cancellation ready for your yes'];
    case 'message': return [f.person ? `Find your last messages with ${f.person}` : 'Find the thread it belongs to', 'Draft the message in your words', 'Hold it until you say yes'];
    case 'booking':
    case 'health': return [f.date ? `Check your calendar around ${f.date}` : 'Find free times in your calendar', f.person ? `Find how ${f.person} takes bookings` : 'Find how they take bookings', 'Draft the booking for your yes'];
    case 'home': return ['Find three local people who do it', 'Compare prices and reviews', 'Bring back the best two, with a pick'];
    case 'travel': return [`Search fares and times${f.person ? ` to ${f.person}` : ''}${f.date ? ` for ${f.date}` : ''}`, 'Compare the best three', 'Hold a pick for your yes. Nothing is booked'];
    case 'school': return ['Find the latest from the school', 'Pull out the dates, forms and costs', 'Draft anything that needs a reply'];
    default: return ['Ask you one question to pin it down', 'Look for anything related in your mail', 'Bring it back at the time you choose'];
  }
}

export function read(text: string): Reading {
  const kind = kindOf(text);
  const found = findIn(text);
  return { kind, who: WHO[kind], plan: planFor(kind, found), found, label: LABEL[kind] };
}

/** Return times the user can pick, worked out from the clock. Times are local. */
export function returnTimes(now: Date): { id: string; label: string; at: number }[] {
  const at = (days: number, h: number, m = 0) => { const d = new Date(now); d.setDate(d.getDate() + days); d.setHours(h, m, 0, 0); return d.getTime(); };
  const tonight = now.getHours() < 18 ? { id: 'tonight', label: 'Tonight, 19:00', at: at(0, 19) } : { id: 'tonight', label: 'Tomorrow, 19:00', at: at(1, 19) };
  const toSat = ((6 - now.getDay()) + 7) % 7 || 7;
  return [tonight, { id: 'morning', label: 'Tomorrow, 08:30', at: at(1, 8, 30) }, { id: 'sat', label: 'Saturday, 10:00', at: at(toSat, 10) }];
}

/** "Sat 10:00", "Tomorrow 08:30", "Today 19:00" */
export function whenLabel(at: number, now: Date): string {
  const d = new Date(at), day0 = new Date(now); day0.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - day0.getTime()) / 86_400_000);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const day = diff <= 0 ? 'Today' : diff === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short' });
  return `${day} ${hm}`;
}
