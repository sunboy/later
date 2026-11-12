import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  LATER0, NEXT0, NOW0, PAYMENTS, RETURNS, STORIES,
  type LaterItem, type NextItem, type NowItem, type StoryCard,
} from './data';

export type Screen = 'spaces' | 'story' | 'today' | 'capture' | 'templates' | 'approve';

interface State {
  screen: Screen;
  storySpace: string | null;
  approval: { id: string; back: Screen } | null;
  now: NowItem[];
  next: NextItem[];
  later: LaterItem[];
  stories: Record<string, StoryCard[]>;
  running: boolean; // agents running (mock). Off pauses every working effect.
  paid: string[];
  flash: { id: string; at: number } | null; // the "done / returned" pop
}

interface Api extends State {
  go: (s: Screen) => void;
  openStory: (spaceId: string) => void;
  openApproval: (id: string, back: Screen) => void;
  setRunning: (on: boolean) => void;
  actNow: (id: string) => void;
  toLater: (id: string, returnIndex: number) => void;
  bringBack: (id: string, onTime: boolean) => void;
  approve: (id: string) => void;
  decideStory: (spaceId: string, cardId: string, how: 'done' | 'seen') => void;
  pop: (id: string) => void;
}

const Ctx = createContext<Api | null>(null);
export const useApp = () => useContext(Ctx)!;

export function AppProvider({ children }: { children: ReactNode }) {
  const [s, set] = useState<State>(() => ({
    screen: 'spaces', storySpace: null, approval: null,
    now: NOW0, next: NEXT0, later: LATER0, stories: structuredClone(STORIES),
    running: true, paid: [], flash: null,
  }));
  const ref = useRef(s); ref.current = s;

  const pop = useCallback((id: string) => set(p => ({ ...p, flash: { id, at: Date.now() } })), []);

  // Mock agent engine: Ledger reconciles, finishes, and hands a card back.
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
        if (a + 1 < b - 17) {
          set(p => ({ ...p, next: p.next.map(n => n.id === 'x-tax' ? { ...n, progress: [a + 1, b] } : n) }));
        } else {
          set(p => ({
            ...p,
            next: p.next.map(n => n.id === 'x-tax'
              ? { ...n, orb: null, status: 'Done. 17 need your eye', progress: undefined, eta: 'Now', day: 'in its ring' } : n),
            stories: { ...p.stories, tax: [{
              id: 'x1', kind: 'Quick sort', big: '17', title: 'October payments that did not match',
              rows: [['Matched', '41 of 58'], ['Largest', 'Screwfix, £38.40'], ['Oldest', '2 October']],
              source: 'From your bank feed and 44 receipts', act: 'Start sorting the 17', done: 'Ledger will show them one at a time.', state: 'new',
            }] },
            flash: { id: 'x-tax', at: Date.now() },
          }));
        }
      }
    }, 500);
    return () => clearInterval(t);
  }, []);

  const api = useMemo<Api>(() => ({
    ...s, pop,
    go: screen => set(p => ({ ...p, screen })),
    openStory: id => set(p => ({ ...p, screen: 'story', storySpace: id })),
    openApproval: (id, back) => set(p => ({ ...p, screen: 'approve', approval: { id, back } })),
    setRunning: running => set(p => ({ ...p, running })),
    actNow: id => set(p => {
      const item = p.now.find(n => n.id === id); if (!item) return p;
      const next: NextItem = id === 'n-loft'
        ? { id: 'x-loft', spaceId: 'house', agent: 'scout', status: 'Yes queued to Dave Ellis. You can still stop it', orb: null, eta: '09:00', day: 'Today' }
        : { id: 'x-ana', spaceId: 'job', agent: 'juno', status: 'Reply to Ana queued for Thursday 14:30', orb: null, eta: 'Thu', day: '14:30' };
      return { ...p, now: p.now.filter(n => n.id !== id), next: [next, ...p.next], flash: { id: next.id, at: Date.now() } };
    }),
    toLater: (id, ri) => set(p => {
      const r = RETURNS[ri];
      const fromNow = p.now.find(n => n.id === id);
      const fromNext = p.next.find(n => n.id === id);
      if (!fromNow && !fromNext) return p;
      const item: LaterItem = {
        id, spaceId: (fromNow ?? fromNext)!.spaceId,
        wake: r.demo ? 'Back in 15 seconds' : r.wake,
        backAt: r.demo ? Date.now() + 15000 : undefined,
        from: fromNow,
      };
      return { ...p, now: p.now.filter(n => n.id !== id), next: p.next.filter(n => n.id !== id), later: [item, ...p.later] };
    }),
    bringBack: (id, onTime) => set(p => bringBackState(p, id, onTime)),
    approve: id => set(p => {
      const pay = PAYMENTS[id];
      const stories = { ...p.stories };
      for (const k of Object.keys(stories)) stories[k] = stories[k].map(c => c.payment === id ? { ...c, state: 'done' } : c);
      const nowItem = p.now.find(n => n.payment === id);
      const follow: NextItem | null = id === 'deposit'
        ? { id: 'x-mill', spaceId: pay.spaceId, agent: 'wren', status: 'Confirming 14 March with The Old Mill', orb: 'composing', eta: '14:00', day: 'Today' }
        : null;
      return {
        ...p, stories, paid: [...p.paid, id],
        now: nowItem ? p.now.filter(n => n !== nowItem) : p.now,
        next: follow && !p.next.some(n => n.id === follow.id) ? [follow, ...p.next] : p.next,
        flash: follow ? { id: follow.id, at: Date.now() } : p.flash,
      };
    }),
    decideStory: (spaceId, cardId, how) => set(p => ({
      ...p,
      stories: { ...p.stories, [spaceId]: (p.stories[spaceId] ?? []).map(c => c.id === cardId && c.state !== 'done' ? { ...c, state: how } : c) },
    })),
  }), [s, pop]);


  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

function bringBackState(p: State, id: string, onTime: boolean): State {
  const l = p.later.find(x => x.id === id); if (!l) return p;
  const back: NowItem = l.from
    ? { ...l.from, backNote: onTime ? 'Back, as promised' : 'Back from Later', at: 'now' }
    : { id: l.id, spaceId: l.spaceId, ask: l.wake.replace(/^Wakes /, 'Woken early: '), act: 'Open it', done: 'Opened.', depth: 1, at: 'now', backNote: 'Back from Later' };
  return { ...p, later: p.later.filter(x => x.id !== id), now: [...p.now, back], flash: { id, at: Date.now() } };
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
    if (flash?.id !== id) return;
    setOn(true);
    const t = setTimeout(() => setOn(false), 1400);
    return () => clearTimeout(t);
  }, [flash, id]);
  return on;
}
