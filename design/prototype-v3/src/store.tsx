import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DECK0, FINISHED, LATER0, NEXT0, PAYMENTS, RETURNS, STORIES, THREADS0, URGENT, SPACES, AGENTS, space,
  type AgentId, type DeckCard, type LaterItem, type Msg, type NextItem, type StoryCard,
} from './data';
import type { MState } from './Mascot';

export type Screen = 'today' | 'spaces' | 'story' | 'capture' | 'templates' | 'approve';
export type SimEvent = 'urgent' | 'finish' | 'deadline' | 'evening' | 'clear' | 'reset';

interface State {
  screen: Screen;
  storySpace: string | null;
  approval: { id: string; back: Screen } | null;
  deck: DeckCard[]; // Now: what needs a decision
  handled: number;
  next: NextItem[]; // what the crew are doing
  finished: string[]; // next rows showing their result before they leave
  later: LaterItem[];
  stories: Record<string, StoryCard[]>;
  staff: Record<string, AgentId | null>; // which crew member is on each Space
  threads: Record<string, Msg[]>;
  chief: { open: boolean; thread: string | null; busy: boolean };
  phase: 'day' | 'evening';
  running: boolean; // agents running (mock). Off pauses every working effect.
  paid: string[];
  flash: { ids: string[]; at: number } | null; // the "done / returned" pop
  event: { type: SimEvent | 'assign'; at: number; id?: string } | null; // last simulated event, for entrance motion
}

interface Api extends State {
  go: (s: Screen) => void;
  openStory: (spaceId: string) => void;
  openApproval: (id: string, back: Screen) => void;
  setRunning: (on: boolean) => void;
  actDeck: (id: string) => void;
  restore: (card: DeckCard, how: 'done' | 'later') => void;
  toLater: (id: string, returnIndex: number) => void;
  allToMorning: () => void;
  bringBack: (id: string, onTime: boolean) => void;
  approve: (id: string) => void;
  decideStory: (spaceId: string, cardId: string, how: 'done' | 'seen') => void;
  pop: (id: string) => void;
  simulate: (e: SimEvent) => void;
  openChief: (thread?: string | null) => void;
  closeChief: () => void;
  say: (thread: string, text: string) => void;
  assign: (spaceId: string, who: AgentId) => void;
  chiefState: MState;
}

const Ctx = createContext<Api | null>(null);
export const useApp = () => useContext(Ctx)!;

const initial = (screen: Screen = 'today'): State => ({
  screen, storySpace: null, approval: null,
  deck: DECK0, handled: 0, next: NEXT0, finished: [], later: LATER0, stories: structuredClone(STORIES),
  staff: Object.fromEntries(SPACES.map(s => [s.id, s.id === 'read' ? null : s.agent])),
  threads: structuredClone(THREADS0), chief: { open: false, thread: null, busy: false },
  phase: 'day', running: true, paid: [], flash: null, event: null,
});

const flash = (...ids: string[]) => ({ ids, at: Date.now() });

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
    deck: f.card && !p.deck.some(c => c.id === f.card!.id) ? [...p.deck, f.card] : p.deck,
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [s, set] = useState<State>(() => initial());
  const ref = useRef(s); ref.current = s;

  const pop = useCallback((id: string) => set(p => ({ ...p, flash: flash(id) })), []);

  // Mock agent engine: Ledger reconciles, finishes, and hands a card back. Due Later items return on time.
  useEffect(() => {
    let tick = 0;
    const t = setInterval(() => {
      const cur = ref.current;
      const due = cur.later.find(l => l.backAt && l.backAt <= Date.now());
      if (due) set(p => bringBackState(p, due.id, true));
      if (!cur.running || ++tick % 3) return;
      const tax = cur.next.find(n => n.id === 'x-tax');
      if (tax && tax.progress && tax.orb) {
        const [a, b] = tax.progress;
        if (a + 1 < b - 17) set(p => ({ ...p, next: p.next.map(n => n.id === 'x-tax' ? { ...n, progress: [a + 1, b] } : n) }));
        else set(p => finish(p, 'x-tax'));
      }
    }, 500);
    return () => clearInterval(t);
  }, []);

  // a finished row stays long enough to be read, then leaves Next
  useEffect(() => {
    if (!s.finished.length) return;
    const t = setTimeout(() => set(p => ({ ...p, next: p.next.filter(n => !p.finished.includes(n.id)), finished: [] })), 4200);
    return () => clearTimeout(t);
  }, [s.finished]);

  const api = useMemo<Api>(() => {
    const hot = s.deck.some(c => c.emphasis === 'urgent' || c.near);
    const chiefState: MState = s.chief.busy ? 'thinking' : hot ? 'waiting' : !s.deck.length ? 'rest' : 'idle';
    return {
      ...s, pop, chiefState,
      go: screen => set(p => ({ ...p, screen })),
      openStory: id => set(p => ({ ...p, screen: 'story', storySpace: id })),
      openApproval: (id, back) => set(p => ({ ...p, screen: 'approve', approval: { id, back } })),
      setRunning: running => set(p => ({ ...p, running })),
      actDeck: id => set(p => {
        const card = p.deck.find(c => c.id === id); if (!card) return p;
        const follow: NextItem | null = id === 'd1'
          ? { id: 'x-loft', spaceId: 'house', agent: 'scout', status: 'Yes queued to Dave Ellis. You can still stop it', orb: null, eta: '09:00', day: 'Today' }
          : id === 'u-school' ? { id: 'x-school', spaceId: 'inbox', agent: 'wren', status: 'Ask queued to Ellie. Watching for her reply', orb: 'searching', eta: 'Soon', day: 'on reply' } : null;
        return { ...p, deck: p.deck.filter(c => c.id !== id), handled: p.handled + 1,
          next: follow && !p.next.some(n => n.id === follow.id) ? [follow, ...p.next] : p.next, flash: flash(follow?.id ?? '', 'chief') };
      }),
      restore: (card, how) => set(p => ({
        ...p, deck: [card, ...p.deck.filter(c => c.id !== card.id)], handled: Math.max(0, p.handled - 1),
        later: how === 'later' ? p.later.filter(l => l.id !== card.id) : p.later,
        next: p.next.filter(n => !(card.id === 'd1' && n.id === 'x-loft') && !(card.id === 'u-school' && n.id === 'x-school')),
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
      approve: id => set(p => {
        const pay = PAYMENTS[id];
        const stories = { ...p.stories };
        for (const k of Object.keys(stories)) stories[k] = stories[k].map(c => c.payment === id ? { ...c, state: 'done' } : c);
        const had = p.deck.some(c => c.payment === id);
        const follow: NextItem | null = id === 'deposit'
          ? { id: 'x-mill', spaceId: pay.spaceId, agent: 'wren', status: 'Confirming 14 March with The Old Mill', orb: 'composing', eta: '14:00', day: 'Today' }
          : null;
        return {
          ...p, stories, paid: [...p.paid, id],
          deck: p.deck.filter(c => c.payment !== id), handled: p.handled + (had ? 1 : 0),
          next: follow && !p.next.some(n => n.id === follow.id) ? [follow, ...p.next] : p.next,
          flash: follow ? flash(follow.id, 'chief') : p.flash,
        };
      }),
      decideStory: (spaceId, cardId, how) => set(p => ({
        ...p,
        stories: { ...p.stories, [spaceId]: (p.stories[spaceId] ?? []).map(c => c.id === cardId && c.state !== 'done' ? { ...c, state: how } : c) },
      })),
      simulate: e => set(p => {
        const at = Date.now();
        if (e === 'reset') return { ...initial(p.screen === 'story' || p.screen === 'approve' ? 'today' : p.screen) };
        const base = { ...p, screen: (p.screen === 'spaces' ? 'spaces' : 'today') as Screen, chief: { ...p.chief, open: false } };
        if (e === 'urgent') {
          if (p.deck.some(c => c.id === URGENT.id)) return { ...base, flash: flash(URGENT.id), event: { type: e, at } };
          return { ...base, deck: [URGENT, ...p.deck], later: p.later.filter(l => l.id !== 'l-inbox'),
            stories: { ...p.stories, inbox: [{ id: 'i1', kind: 'From the school', big: '12:30', title: URGENT.title, rows: [['To', 'Ellie Reid']], source: 'From the school’s email at 09:38', act: URGENT.act, done: URGENT.done, state: 'new' }] },
            flash: flash(URGENT.id, 'ring-inbox'), event: { type: e, at, id: URGENT.id } };
        }
        if (e === 'finish') {
          const open = p.next.filter(n => n.orb && FINISHED[n.id] && !p.finished.includes(n.id));
          const id = (open.find(n => FINISHED[n.id].card) ?? open[0])?.id;
          return id ? finish(base, id) : base;
        }
        if (e === 'deadline') {
          let q = base;
          if (!q.deck.some(c => c.id === 'd-dep') && q.later.some(l => l.id === 'd-dep')) q = bringBackState(q, 'd-dep', false);
          const dep = q.deck.find(c => c.id === 'd-dep'); if (!dep) return q;
          const near: DeckCard = { ...dep, near: true, deadline: 'Hold ends in 2 hours', backNote: undefined };
          const rest = q.deck.filter(c => c.id !== 'd-dep');
          const lead = rest.filter(c => c.emphasis === 'urgent');
          return { ...q, deck: [...lead, near, ...rest.filter(c => c.emphasis !== 'urgent')], flash: flash('d-dep', 'ring-mum'), event: { type: e, at, id: 'd-dep' } };
        }
        if (e === 'evening') return { ...base, phase: p.phase === 'evening' ? 'day' : 'evening', event: { type: e, at } };
        if (e === 'clear') return { ...base, handled: p.handled + p.deck.length, deck: [], flash: flash('chief'), event: { type: e, at } };
        return p;
      }),
      openChief: (thread = null) => set(p => ({ ...p, chief: { ...p.chief, open: true, thread } })),
      closeChief: () => set(p => ({ ...p, chief: { ...p.chief, open: false } })),
      say: (thread, text) => {
        set(p => ({ ...p, chief: { ...p.chief, busy: true }, threads: { ...p.threads, [thread]: [...(p.threads[thread] ?? []), { who: 'you', text, at: 'now' }] } }));
        setTimeout(() => set(p => {
          const reply: Msg = thread === 'keep'
            ? { who: 'crew', text: 'Filed to House move. Scout has it, and it will come up in Now when it needs you.', card: { kind: 'Task', title: text.length > 44 ? text.slice(0, 42) + '…' : text, state: 'Filed just now', spaceId: 'house' } }
            : { who: 'crew', text: `On it. The answer will land in Now, not here, so you do not have to watch this thread.` };
          return { ...p, chief: { ...p.chief, busy: false }, threads: { ...p.threads, [thread]: [...(p.threads[thread] ?? []), reply] }, flash: flash('chief') };
        }), 1700);
      },
      assign: (spaceId, who) => set(p => ({
        ...p, staff: { ...p.staff, [spaceId]: who },
        threads: { ...p.threads, [spaceId]: [...(p.threads[spaceId] ?? []), { who: 'log', text: `Keep put ${AGENTS[who].name} on ${space(spaceId).name}`, at: 'now' }] },
        flash: flash('staff-' + spaceId), event: { type: 'assign', at: Date.now(), id: spaceId },
      })),
    };
  }, [s, pop]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/** A local clock, so only the components that show a countdown re-render. */
export function useClock(on: boolean, ms = 500) {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => { if (!on) return; const i = setInterval(() => setT(Date.now()), ms); return () => clearInterval(i); }, [on, ms]);
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
