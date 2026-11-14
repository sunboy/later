import { goneSpaces, loadItems } from './onboard/handed';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  BILLS, DECK0, FINISHED, LATER0, NEXT0, NOTE, RAMBLE, RECEIPTS, RETURNS, SENDS, STORIES, THREADS0, URGENT, SPACES, ALL_SPACES, MORE_STORIES, GARDEN_CARDS, AGENTS, space,
  type AgentId, type DeckCard, type LaterItem, type Msg, type NextItem, type StoryCard,
} from './data';
import type { MState } from './Mascot';

export type Screen = 'today' | 'spaces' | 'story' | 'templates' | 'approve';
export type SimEvent = 'urgent' | 'finish' | 'deadline' | 'merge' | 'read' | 'evening' | 'clear' | 'assign' | 'grow' | 'settle' | 'reset';

/** The 30-second window every send waits in after the hold. Stop is always one tap. */
export const WINDOW_MS = 30_000;
export interface OutRow { id: string; at: number; status: 'pending' | 'sent' | 'stopped'; card?: DeckCard; doneAt?: number }

interface State {
  screen: Screen;
  storySpace: string | null;
  storyFrom: string | null; // the card a story opens at, when opened from a stack
  many: boolean; // the 30-Space demo
  approval: { id: string; back: Screen } | null;
  deck: DeckCard[]; // Now: what needs a decision
  handled: number;
  next: NextItem[]; // what the crew are doing
  finished: string[]; // next rows showing their result before they leave
  leaving: string[]; // rows on their way out
  outbox: OutRow[];
  later: LaterItem[];
  stories: Record<string, StoryCard[]>;
  staff: Record<string, AgentId | null>; // which crew member is on each Space
  threads: Record<string, Msg[]>;
  proposals: Record<string, { spaces: string[]; filed: boolean }>;
  chief: { open: boolean; thread: string | null; busy: boolean };
  rec: null | 'listening' | 'tidying';
  phase: 'day' | 'evening';
  running: boolean; // agents running (mock). Off pauses every working effect.
  paid: string[]; // bills you marked as paid
  stack: null | { phase: 'arriving' | 'merged'; count: number }; // the receipts group
  flash: { ids: string[]; at: number } | null; // the "done / returned" pop
  event: { type: SimEvent | 'send' | 'stop'; at: number; id?: string; note?: string } | null; // last event, for entrance motion
}

interface Api extends State {
  go: (s: Screen) => void;
  openStory: (spaceId: string, from?: string) => void;
  setMany: (on: boolean) => void;
  setAside: (spaceId: string, cardId: string) => void;
  openApproval: (id: string, back: Screen) => void;
  setRunning: (on: boolean) => void;
  actDeck: (id: string) => void;
  restore: (card: DeckCard, how: 'done' | 'later') => void;
  toLater: (id: string, returnIndex: number) => void;
  allToMorning: () => void;
  bringBack: (id: string, onTime: boolean) => void;
  holdSend: (id: string) => void;
  stopSend: (id: string) => void;
  markPaid: (id: string) => void;
  decideStory: (spaceId: string, cardId: string, how: 'done' | 'seen') => void;
  pop: (id: string) => void;
  simulate: (e: SimEvent) => void;
  openStack: () => void;
  openChief: (thread?: string | null) => void;
  closeChief: () => void;
  say: (thread: string, text: string) => void;
  startRec: () => void;
  stopRec: (secs: number) => void;
  moveProposal: (pid: string, i: number) => void;
  fileProposal: (pid: string, on: boolean) => void;
  assign: (spaceId: string, who: AgentId) => void;
  chiefState: MState;
  crewOut: number;
}

const Ctx = createContext<Api | null>(null);
export const useApp = () => useContext(Ctx)!;

/** What the user handed over in the front door: their first card leads the deck; Spaces they flicked away stay gone. */
function fromFrontDoor(): { deck: DeckCard[]; keep: (x: { spaceId: string }) => boolean } {
  const gone = goneSpaces();
  const keep = (x: { spaceId: string }) => !gone.has(x.spaceId);
  const first = loadItems()[0];
  const own: DeckCard[] = first ? [{
    id: 'u-' + first.id, spaceId: 'inbox', agent: first.who ?? 'juno', kind: 'You said later', title: first.text,
    kv: first.plan.map((step, i) => [first.who ? (i < 2 ? 'Done' : 'Next') : ['Asks you', 'Done', 'Then'][i], step] as [string, string]), act: 'Got it', done: 'Kept in Inbox.',
  }] : [];
  return { deck: [...own, ...DECK0.filter(keep)], keep };
}

const initial = (screen: Screen = 'today', many = false): State => ({
  screen, storySpace: null, storyFrom: null, many, approval: null,
  deck: fromFrontDoor().deck, handled: 0, next: NEXT0.filter(fromFrontDoor().keep), finished: [], leaving: [], outbox: [], later: LATER0.filter(fromFrontDoor().keep), stories: structuredClone({ ...MORE_STORIES, ...STORIES }),
  staff: Object.fromEntries(ALL_SPACES.map(s => [s.id, s.id === 'read' ? null : s.agent])),
  threads: structuredClone(THREADS0), proposals: {}, chief: { open: false, thread: null, busy: false }, rec: null,
  phase: 'day', running: true, paid: [], stack: null, flash: null, event: null,
});

const flash = (...ids: string[]) => ({ ids, at: Date.now() });
const log = (p: State, sid: string, text: string): Record<string, Msg[]> => ({ ...p.threads, [sid]: [...(p.threads[sid] ?? []), { who: 'log', text, at: 'now' }] });

/** An agent finishes: its row shows the result, hands a card to Now if it has one, and its ring gains a segment. */
function finish(p: State, id: string): State {
  const f = FINISHED[id]; const row = p.next.find(n => n.id === id);
  if (!f || !row || p.finished.includes(id)) return p;
  const stories = f.card && f.ring ? { ...p.stories, [f.ring]: [...(p.stories[f.ring] ?? []), {
    id: 'f-' + id, kind: f.card.kind, big: f.card.title.match(/^\d+/)?.[0] ?? 'New', title: f.card.title,
    rows: f.card.kv.map(([k, v]) => [k, v] as [string, string]), source: 'From ' + AGENTS[row.agent].name, act: f.card.act, done: f.card.done, state: 'new' as const,
  }] } : p.stories;
  return {
    ...p, stories, finished: [...p.finished, id],
    next: p.next.map(n => n.id === id ? { ...n, orb: null, status: f.status, progress: undefined, eta: 'Now', day: f.card ? 'added to Now' : 'nothing for you' } : n),
    deck: f.card && !p.deck.some(c => c.id === f.card!.id) ? [...p.deck.slice(0, 1), f.card, ...p.deck.slice(1)] : p.deck,
    threads: log(p, row.spaceId, `${AGENTS[row.agent].name} finished: ${f.status.replace(/^Done\. /, '')}`),
    flash: flash(id, 'ring-' + (f.ring ?? ''), 'chief'), event: { type: 'finish', at: Date.now(), id },
  };
}

function bringBackState(p: State, id: string, onTime: boolean): State {
  const l = p.later.find(x => x.id === id); if (!l) return p;
  const s = space(l.spaceId);
  const back: DeckCard = l.from
    ? { ...l.from, backNote: onTime ? 'Back, as promised' : 'Back from Later' }
    : { id: l.id, spaceId: l.spaceId, agent: s.agent, kind: 'Woken early', title: `${s.name}: ${l.wake.replace(/^Wakes /, 'was resting until ').replace(/^You are off\. /, '')}`,
        kv: [], act: 'Open it', done: 'Opened.', backNote: 'Back from Later' };
  return { ...p, later: p.later.filter(x => x.id !== id), deck: [back, ...p.deck], handled: Math.max(0, p.handled - (l.from ? 1 : 0)), flash: flash(id) };
}

/** The window ran out: the send goes. */
function release(p: State, id: string): State {
  const o = p.outbox.find(x => x.id === id && x.status === 'pending'); if (!o) return p;
  const s = SENDS[id];
  const follow: NextItem | null = id === 'ellie'
    ? { id: 'x-school', spaceId: 'inbox', agent: 'wren', status: 'Watching for Ellie’s reply', orb: 'searching', eta: 'Soon', day: 'on reply' }
    : id === 'dave' ? { id: 'x-dave', spaceId: 'house', agent: 'scout', status: 'Watching for Dave to confirm Tuesday', orb: null, eta: 'Tue', day: '10:00' } : null;
  const stories = { ...p.stories };
  for (const k of Object.keys(stories)) stories[k] = stories[k].map(c => c.send === id ? { ...c, state: 'done' } : c);
  return {
    ...p, stories,
    outbox: p.outbox.map(x => x.id === id ? { ...x, status: 'sent', doneAt: Date.now() } : x),
    next: follow && !p.next.some(n => n.id === follow.id) ? [...p.next, follow] : p.next,
    threads: log(p, s.spaceId, `${s.sentLine} after the 30-second window`),
    flash: flash('out-' + id, 'chief'),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [s, set] = useState<State>(() => initial());
  const ref = useRef(s); ref.current = s;
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const pop = useCallback((id: string) => set(p => ({ ...p, flash: flash(id) })), []);

  // Mock engine: Ledger reconciles and finishes; due Later items return on time; sends leave their window.
  useEffect(() => {
    let tick = 0;
    const t = setInterval(() => {
      const cur = ref.current, now = Date.now();
      const due = cur.later.find(l => l.backAt && l.backAt <= now);
      if (due) set(p => bringBackState(p, due.id, true));
      const go = cur.outbox.find(o => o.status === 'pending' && now - o.at >= WINDOW_MS);
      if (go) set(p => release(p, go.id));
      const old = cur.outbox.filter(o => o.status !== 'pending' && o.doneAt && now - o.doneAt > 4600);
      if (old.length) set(p => ({ ...p, outbox: p.outbox.filter(o => !old.some(x => x.id === o.id)) }));
      if (!cur.running || ++tick % 6) return;
      const tax = cur.next.find(n => n.id === 'x-tax');
      if (tax && tax.progress && tax.orb) {
        const [a, b] = tax.progress;
        if (a + 1 < b - 17) set(p => ({ ...p, next: p.next.map(n => n.id === 'x-tax' ? { ...n, progress: [a + 1, b] } : n) }));
        else set(p => finish(p, 'x-tax'));
      }
    }, 250);
    return () => { clearInterval(t); timers.current.forEach(clearTimeout); };
  }, []);

  // a finished row stays long enough to be read, then folds away and leaves Next
  useEffect(() => {
    if (!s.finished.length) return;
    const ids = s.finished;
    const a = setTimeout(() => set(p => ({ ...p, leaving: [...p.leaving, ...ids] })), 3900);
    const b = setTimeout(() => set(p => ({ ...p, next: p.next.filter(n => !ids.includes(n.id)), finished: p.finished.filter(f => !ids.includes(f)), leaving: p.leaving.filter(f => !ids.includes(f)) })), 4400);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [s.finished]);

  const api = useMemo<Api>(() => {
    const hot = s.deck.some(c => c.emphasis === 'urgent' || c.near);
    const crewOut = new Set(s.next.filter(n => n.orb && s.running && !s.finished.includes(n.id)).map(n => n.agent)).size;
    const chiefState: MState = s.rec === 'listening' ? 'listening' : s.rec === 'tidying' || s.chief.busy ? 'thinking' : hot ? 'waiting' : !s.deck.length && !s.stack ? 'rest' : 'idle';
    return {
      ...s, pop, chiefState, crewOut,
      go: screen => set(p => ({ ...p, screen })),
      openStory: (id, from) => set(p => ({ ...p, screen: 'story', storySpace: id, storyFrom: from ?? null })),
      setMany: many => set(p => ({ ...p, many, event: { type: 'reset', at: Date.now(), note: many ? 'Thirty Spaces on the desk. Stacks stay large; quiet Spaces pack three to a row.' : 'Back to twelve Spaces.' } })),
      setAside: (sid, cid) => set(p => ({
        ...p, stories: { ...p.stories, [sid]: (p.stories[sid] ?? []).map(c => c.id === cid && c.state === 'new' ? { ...c, state: 'seen' as const } : c) },
        threads: log(p, sid, 'You set a card aside until tomorrow'),
      })),
      openApproval: (id, back) => set(p => ({ ...p, screen: 'approve', approval: { id, back } })),
      setRunning: running => set(p => ({ ...p, running })),
      actDeck: id => set(p => {
        const card = p.deck.find(c => c.id === id); if (!card) return p;
        return { ...p, deck: p.deck.filter(c => c.id !== id), handled: p.handled + 1, flash: flash('chief') };
      }),
      restore: (card, how) => set(p => ({
        ...p, deck: [card, ...p.deck.filter(c => c.id !== card.id)], handled: Math.max(0, p.handled - 1),
        later: how === 'later' ? p.later.filter(l => l.id !== card.id) : p.later,
        paid: card.bill ? p.paid.filter(b => b !== card.bill) : p.paid,
        stories: card.bill ? Object.fromEntries(Object.entries(p.stories).map(([k, v]) => [k, v.map(c => c.bill === card.bill ? { ...c, state: 'seen' as const } : c)])) : p.stories,
        next: p.next.filter(n => !(card.bill === 'deposit' && n.id === 'x-mill')),
      })),
      toLater: (id, ri) => set(p => {
        const r = RETURNS[ri]; const from = p.deck.find(c => c.id === id); if (!from) return p;
        const item: LaterItem = { id, spaceId: from.spaceId, wake: r.demo ? 'Back in 15 seconds' : r.wake, backAt: r.demo ? Date.now() + 15000 : undefined, from };
        return { ...p, deck: p.deck.filter(c => c.id !== id), handled: p.handled + 1, later: [item, ...p.later] };
      }),
      allToMorning: () => set(p => ({
        ...p, handled: p.handled + p.deck.length, deck: [],
        later: [...p.deck.map(c => ({ id: c.id, spaceId: c.spaceId, wake: RETURNS[1].wake, from: c })), ...p.later],
      })),
      bringBack: (id, onTime) => set(p => bringBackState(p, id, onTime)),
      holdSend: id => set(p => {
        if (p.outbox.some(o => o.id === id && o.status === 'pending')) return p;
        const card = p.deck.find(c => c.send === id);
        return {
          ...p, deck: p.deck.filter(c => c.send !== id), handled: p.handled + (card ? 1 : 0),
          outbox: [{ id, at: Date.now(), status: 'pending', card }, ...p.outbox.filter(o => o.id !== id)],
          event: { type: 'send', at: Date.now(), id }, flash: flash('out-' + id),
        };
      }),
      stopSend: id => set(p => {
        const o = p.outbox.find(x => x.id === id && x.status === 'pending'); if (!o) return p;
        return {
          ...p, outbox: p.outbox.map(x => x.id === id ? { ...x, status: 'stopped', doneAt: Date.now() } : x),
          deck: o.card && !p.deck.some(c => c.id === o.card!.id) ? [{ ...o.card, backNote: 'Stopped. Nothing was sent' }, ...p.deck] : p.deck,
          handled: Math.max(0, p.handled - (o.card ? 1 : 0)),
          threads: log(p, SENDS[id].spaceId, `You stopped the send to ${SENDS[id].short}. Nothing went`),
          event: { type: 'stop', at: Date.now(), id },
        };
      }),
      markPaid: id => set(p => {
        const b = BILLS[id];
        const stories = { ...p.stories };
        for (const k of Object.keys(stories)) stories[k] = stories[k].map(c => c.bill === id ? { ...c, state: 'done' } : c);
        const had = p.deck.some(c => c.bill === id);
        const follow: NextItem | null = id === 'deposit'
          ? { id: 'x-mill', spaceId: b.spaceId, agent: 'wren', status: 'Asking The Old Mill to confirm 14 March', orb: 'composing', eta: '14:00', day: 'Today' }
          : null;
        return {
          ...p, stories, paid: [...p.paid.filter(x => x !== id), id],
          deck: p.deck.filter(c => c.bill !== id), handled: p.handled + (had ? 1 : 0),
          next: follow && !p.next.some(n => n.id === follow.id) ? [follow, ...p.next] : p.next,
          threads: log(p, b.spaceId, `You marked ${b.title.toLowerCase().replace(/^pay /, 'the ')} as paid`),
          flash: flash(follow?.id ?? '', 'chief'),
        };
      }),
      decideStory: (spaceId, cardId, how) => set(p => ({
        ...p,
        stories: { ...p.stories, [spaceId]: (p.stories[spaceId] ?? []).map(c => c.id === cardId && c.state !== 'done' ? { ...c, state: how } : c) },
      })),
      openStack: () => set(p => {
        if (!p.stack) return p;
        const top: DeckCard = { id: 'd-receipts', spaceId: 'tax', agent: 'ledger', kind: 'Quick sort', group: 'receipts',
          title: `${p.stack.count} receipts to sort, one at a time`, kv: [['Smallest', '£7.20, Robert Dyas'], ['Largest', '£54.00, B&Q']],
          act: 'Start with the Screwfix one', done: 'Ledger will show them one at a time.' };
        return { ...p, stack: null, deck: [top, ...p.deck] };
      }),
      simulate: e => set(p => {
        const at = Date.now();
        if (e === 'reset') { timers.current.forEach(clearTimeout); timers.current = []; return { ...initial(p.screen === 'story' || p.screen === 'approve' ? 'today' : p.screen, p.many), event: { type: 'reset', at } }; }
        const base: State = { ...p, screen: (e === 'assign' || e === 'grow' || e === 'settle' ? 'spaces' : 'today') as Screen, chief: { ...p.chief, open: false }, rec: null };
        if (e === 'urgent') {
          if (p.deck.some(c => c.id === URGENT.id)) return { ...base, flash: flash(URGENT.id), event: { type: e, at, id: URGENT.id, note: 'Already on top. It pulses so you see it.' } };
          return { ...base, deck: [URGENT, ...p.deck], later: p.later.filter(l => l.id !== 'l-inbox'),
            stories: { ...p.stories, inbox: [{ id: 'i1', kind: 'From the school', big: '12:30', title: URGENT.title, rows: [['To', 'Ellie Reid']], source: 'From the school’s email at 09:38', act: 'Review and text Ellie', done: 'Texted.', send: 'ellie', state: 'new' }] },
            flash: flash(URGENT.id, 'ring-inbox', 'deal'), event: { type: e, at, id: URGENT.id, note: 'Dealt from Keep as a hero card. Next folded to a line, the edition to a strip, Inbox woke from Later.' } };
        }
        if (e === 'finish') {
          const open = p.next.filter(n => n.orb && FINISHED[n.id] && !p.finished.includes(n.id));
          const id = (open.find(n => FINISHED[n.id].card) ?? open[0])?.id;
          if (!id) return { ...base, event: { type: e, at, note: 'No one is mid-run. Start again to watch it.' } };
          const q = finish(base, id);
          return { ...q, event: { ...q.event!, note: `${AGENTS[p.next.find(n => n.id === id)!.agent].name}’s row became its result${FINISHED[id].card ? ', handed Now a card and gave its ring a segment' : ''}. It leaves in 4 seconds.` } };
        }
        if (e === 'deadline') {
          let q = base;
          if (!q.deck.some(c => c.id === 'd-dep') && q.later.some(l => l.id === 'd-dep')) q = bringBackState(q, 'd-dep', false);
          const dep = q.deck.find(c => c.id === 'd-dep');
          if (!dep) return { ...q, event: { type: e, at, note: 'The deposit is already marked paid.' } };
          const near: DeckCard = { ...dep, near: true, deadline: 'Hold ends in 2 hours', backNote: undefined };
          const rest = q.deck.filter(c => c.id !== 'd-dep');
          const lead = rest.filter(c => c.emphasis === 'urgent');
          return { ...q, deck: [...lead, near, ...rest.filter(c => c.emphasis !== 'urgent')], flash: flash('d-dep', 'ring-mum'),
            event: { type: e, at, id: 'd-dep', note: 'The deposit rose through the stack and grew. The pay slip inside did not change.' } };
        }
        if (e === 'merge') {
          if (p.stack) return { ...base, flash: flash('stack'), event: { type: e, at, note: 'Already one stack.' } };
          later(() => set(x => x.stack ? { ...x, stack: { ...x.stack, phase: 'merged' } } : x), 1500);
          const had = p.deck.some(c => c.id === 'd4');
          return { ...base, deck: p.deck.filter(c => c.id !== 'd4'), stack: { phase: 'arriving', count: RECEIPTS.length + (had ? 1 : 0) },
            threads: log(p, 'tax', `Ledger found ${RECEIPTS.length} more receipts like the Screwfix one`),
            event: { type: e, at, note: 'Three receipts landed one by one, then merged with the Screwfix card into one counted stack.' } };
        }
        if (e === 'read') return { ...base, event: { type: e, at, id: 'e2', note: 'One read opened in place. The rest of the edition receded.' } };
        if (e === 'evening') {
          const on = p.phase !== 'evening';
          return { ...base, phase: on ? 'evening' : 'day', event: { type: e, at, note: on ? 'The edition moved above the deck on the night surface. Cards shrank to their compact form.' : 'Back to the day order.' } };
        }
        if (e === 'clear') return { ...base, handled: p.handled + p.deck.length + (p.stack ? 1 : 0), deck: [], stack: null, flash: flash('chief'), event: { type: e, at, note: 'The deck closed to one line. The edition took the page, in larger type. Keep rests.' } };
        if (e === 'assign') {
          if (p.staff.read) return { ...base, flash: flash('staff-read'), event: { type: e, at, note: 'Juno is already on Reading list.' } };
          later(() => set(x => assignState(x, 'read', 'juno')), 650);
          return { ...base, event: { type: e, at, note: 'Keep dealt Juno into Reading list. The tile moved from Later to Next.' } };
        }
        if (e === 'grow') {
          if ((p.stories.garden ?? []).some(c => c.state === 'new')) return { ...base, flash: flash('staff-garden'), event: { type: e, at, id: 'garden', note: 'Garden fence is already a stack. Start again to watch it grow.' } };
          later(() => set(x => ({ ...x, stories: { ...x.stories, garden: structuredClone(GARDEN_CARDS) }, flash: flash('staff-garden'),
            threads: log(x, 'garden', 'Owen replied. Scout found two things for you'), event: { type: 'grow', at: Date.now(), id: 'garden' } })), 500);
          return { ...base, event: { type: e, at, note: 'Owen the fencer replied. Garden fence grew from a quiet crew card into a stack of two and moved up the desk.' } };
        }
        if (e === 'settle') {
          const ok = (id: string) => { const q = (p.stories[id] ?? []).filter(c => c.state === 'new'); return q.length > 0 && q.every(c => !c.send && !c.bill) ? q : null; };
          const sid = ['job', 'garden', 'japan', 'x-xmas'].find(ok) ?? SPACES.map(x => x.id).find(ok);
          if (!sid) return { ...base, event: { type: e, at, note: 'No stack can be cleared without a send or a payment. Those always need you.' } };
          ok(sid)!.forEach((c, i) => later(() => set(x => ({
            ...x, flash: flash('stamp-' + c.id),
          })), 500 + i * 1300));
          ok(sid)!.forEach((c, i) => later(() => set(x => ({
            ...x, stories: { ...x.stories, [sid]: (x.stories[sid] ?? []).map(y => y.id === c.id ? { ...y, state: 'done' as const } : y) },
            threads: log(x, sid, c.done),
          })), 1050 + i * 1300));
          return { ...base, event: { type: e, at, id: sid, note: `You cleared ${space(sid).name}: each top card went, the next rose on a spring, and the last left it a quiet crew card.` } };
        }
        return p;
      }),
      openChief: (thread = null) => set(p => ({ ...p, chief: { ...p.chief, open: true, thread } })),
      closeChief: () => set(p => ({ ...p, chief: { ...p.chief, open: false }, rec: null })),
      say: (thread, text) => {
        set(p => ({ ...p, chief: { ...p.chief, busy: true }, threads: { ...p.threads, [thread]: [...(p.threads[thread] ?? []), { who: 'you', text, at: 'now' }] } }));
        later(() => set(p => {
          const who = thread === 'keep' ? null : p.staff[thread];
          const reply: Msg = thread === 'keep'
            ? { who: 'crew', text: 'Filed to House move. Scout has it, and it comes to Now when it needs you.', card: { kind: 'Task', title: text.length > 44 ? text.slice(0, 42) + '…' : text, state: 'Filed just now', spaceId: 'house' } }
            : { who: 'crew', text: who ? `${AGENTS[who].name} here. On it. The answer lands in Now, not here, so you need not watch this thread.` : 'No one is on this Space yet. Ask Keep to put someone on it.' };
          const threads = { ...p.threads, [thread]: [...(p.threads[thread] ?? []), reply] };
          if (thread === 'keep') threads.house = [...(threads.house ?? []), { who: 'log', text: `Keep filed “${text.length > 40 ? text.slice(0, 38) + '…' : text}” here for Scout`, at: 'now' }];
          return { ...p, chief: { ...p.chief, busy: false }, threads, flash: flash('chief') };
        }), 1500);
      },
      startRec: () => set(p => ({ ...p, rec: 'listening', chief: { ...p.chief, open: true, thread: null } })),
      stopRec: secs => {
        set(p => ({ ...p, rec: 'tidying' }));
        later(() => set(p => {
          if (p.rec !== 'tidying') return p; // an event or Close interrupted it
          const pid = 'v' + Date.now();
          const msgs: Msg[] = [
            { who: 'you', text: NOTE.clean, at: 'now', voice: { secs, raw: RAMBLE } },
            { who: 'crew', text: 'Three things in that. Here is where I would put each. Move any that are wrong.', proposal: { id: pid, filed: false } },
          ];
          return { ...p, rec: null, chief: { ...p.chief, open: true, thread: 'keep' }, threads: { ...p.threads, keep: [...p.threads.keep, ...msgs] },
            proposals: { ...p.proposals, [pid]: { spaces: NOTE.cards.map(c => c.spaceId), filed: false } }, flash: flash('chief') };
        }), 1700);
      },
      moveProposal: (pid, i) => set(p => {
        const pr = p.proposals[pid]; if (!pr || pr.filed) return p;
        const order = ['house', 'mum', 'inbox'];
        const spaces = pr.spaces.map((sid, j) => j === i ? order[(order.indexOf(sid) + 1) % order.length] : sid);
        return { ...p, proposals: { ...p.proposals, [pid]: { ...pr, spaces } } };
      }),
      fileProposal: (pid, on) => set(p => {
        const pr = p.proposals[pid]; if (!pr) return p;
        let threads = p.threads;
        if (on) pr.spaces.forEach((sid, i) => { threads = { ...threads, [sid]: [...(threads[sid] ?? []), { who: 'log', text: `Keep filed “${NOTE.cards[i].title}” here${p.staff[sid] ? ` for ${AGENTS[p.staff[sid]!].name}` : ''}`, at: 'now' }] }; });
        return { ...p, threads, proposals: { ...p.proposals, [pid]: { ...pr, filed: on } }, flash: on ? flash('chief') : p.flash };
      }),
      assign: (spaceId, who) => set(p => assignState(p, spaceId, who)),
    };
  }, [s, pop]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

function assignState(p: State, spaceId: string, who: AgentId): State {
  const job: NextItem | null = spaceId === 'read' ? { id: 'x-read', spaceId, agent: who, status: 'Sorting your 9 saved pieces by Space', orb: 'searching', eta: 'Sun', day: 'in the edition' } : null;
  return {
    ...p, staff: { ...p.staff, [spaceId]: who },
    next: job && !p.next.some(n => n.id === job.id) ? [...p.next, job] : p.next,
    threads: log(p, spaceId, `Keep put ${AGENTS[who].name} on ${space(spaceId).name}`),
    flash: flash('staff-' + spaceId, 'dealt'), event: { type: 'assign', at: Date.now(), id: spaceId, note: p.event?.note },
  };
}

/** A local clock, so only the components that show a countdown re-render. */
export function useClock(on: boolean, ms = 500) {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => { if (!on) return; setT(Date.now()); const i = setInterval(() => setT(Date.now()), ms); return () => clearInterval(i); }, [on, ms]);
  return t;
}

/** True for ~1.4 s after the item last popped. */
export function useFlash(id: string) {
  const { flash } = useApp();
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!flash?.ids.includes(id)) return;
    setOn(true);
    const t = setTimeout(() => setOn(false), 1400);
    return () => clearTimeout(t);
  }, [flash, id]);
  return on;
}
