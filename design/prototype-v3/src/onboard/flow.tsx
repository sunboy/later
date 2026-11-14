import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AgentId } from '../data';
import { clearHanded, dueItems, loadGone, loadHome, loadItems, loadName, saveGone, saveHome, saveItems, saveName, type Item } from './handed';
import { read } from './rules';

/** The front door. Keep introduces itself, the user hands over something they have been putting off, and it goes
    under the horizon with a real return time. There is no Later account and no Later server: setting up happens on a
    computer, in the user's own account. Before that, the only "smart" part is simple rules on this phone. */
export type Step =
  | 'title' | 'ask' | 'plan' | 'when' | 'more' | 'terms'
  | 'doors' | 'computer' | 'mail' | 'calendar' | 'school' | 'reading' | 'found' | 'deck';

export const STEPS: { id: Step; label: string; note: string }[] = [
  { id: 'title', label: 'Hello', note: 'Keep says who it is, and that it is an AI' },
  { id: 'ask', label: 'Hand it over', note: 'what have you been putting off?' },
  { id: 'plan', label: 'The plan', note: 'simple rules pick a crew member' },
  { id: 'when', label: 'Back when', note: 'a real return time' },
  { id: 'more', label: 'Anything else', note: 'up to four more' },
  { id: 'terms', label: 'Your yes', note: 'the approval, on your own card' },
  { id: 'doors', label: 'Two doors', note: 'a home of your own' },
  { id: 'computer', label: 'Computer', note: 'install, then pair' },
  { id: 'mail', label: 'Mail', note: 'Wren, by app password' },
  { id: 'calendar', label: 'Calendar', note: 'Scout, by private link' },
  { id: 'school', label: 'School apps', note: 'only if a card mentions school' },
  { id: 'reading', label: 'Keep reads', note: 'finds narrated, capped' },
  { id: 'found', label: 'What I found', note: 'Spaces with evidence' },
  { id: 'deck', label: 'First deck', note: 'you said later; here it is' },
];

/** A prototype-only event the chrome can fire into the current step (an error, or the computer finishing). */
export type ObSim = 'computer-done' | 'computer-quiet' | 'code-expired' | 'wrong-password' | 'learn-finish';
export const OB_SIM: { id: ObSim; step: Step; label: string; note: string }[] = [
  { id: 'computer-done', step: 'computer', label: 'Home created', note: 'The installer has made your home and shows a code.' },
  { id: 'computer-quiet', step: 'computer', label: 'Computer goes quiet', note: 'Nothing has come back for a while.' },
  { id: 'code-expired', step: 'computer', label: 'Code expired', note: 'The next scan finds an old code.' },
  { id: 'wrong-password', step: 'mail', label: 'Wrong app password', note: 'The next sign-in is turned down.' },
  { id: 'learn-finish', step: 'reading', label: 'Finish reading', note: 'Skip to the end of the first pass.' },
];

interface State {
  mode: 'onboard' | 'app';
  step: Step;
  path: 'new' | 'returning';
  placed: AgentId[]; // the crew dealt so far in set-up: the progress
  name: string;
  items: Item[]; // what the user handed over, in their words
  gone: string[]; // Space ids flicked away in "What I found"
  mail: boolean; cal: boolean; school: boolean;
  welcome: number; // when the welcome-back moment was opened (0 = closed)
  back: Item[]; // items brought back on this welcome-back
  sim: { id: ObSim; at: number } | null;
  arrived: number;
  run: number;
  jumped: boolean;
}

interface Api extends State {
  go: (s: Step) => void;
  jump: (s: Step) => void;
  setPath: (p: State['path']) => void;
  place: (who: AgentId) => void;
  setName: (n: string) => void;
  addItem: (text: string) => Item;
  updateItem: (id: string, patch: Partial<Item>) => void;
  removeItem: (id: string) => void;
  setGone: (ids: string[]) => void;
  setConn: (k: 'mail' | 'cal' | 'school', on: boolean) => void;
  toApp: (from?: 'handover' | 'skip' | 'pair') => void;
  replay: () => void;
  welcomeBack: () => void;
  closeWelcome: () => void;
  /** chrome: jump ahead to when the cards are due, and let Keep bring them back */
  timePasses: () => void;
  simulate: (id: ObSim) => void;
  take: (id: ObSim) => boolean;
}

const Ctx = createContext<Api | null>(null);
export const useOb = () => useContext(Ctx)!;

const fresh = (run = 0): State => ({
  mode: 'onboard', step: 'title', path: 'new', placed: [], name: '', items: [], gone: [], mail: false, cal: false, school: false,
  welcome: 0, back: [], sim: null, arrived: 0, run, jumped: false,
});

let n = 0;
export const makeItem = (text: string): Item => {
  const r = read(text);
  return { id: `i${Date.now().toString(36)}${n++}`, text: text.trim(), kind: r.kind, who: r.who, plan: r.plan, found: r.found, back: 0 };
};
/** For a jump from the chrome past the ask: one example card, so the later steps have something of "yours". */
const EXAMPLE = () => { const i = makeItem('Renew the car insurance'); i.back = Date.now() + 8 * 3_600_000; return i; };

function seed(p: State, step: Step): State {
  const order = STEPS.map(s => s.id);
  const at = order.indexOf(step);
  const past = (s: Step) => at > order.indexOf(s);
  const placed: AgentId[] = [];
  if (past('computer')) placed.push('ledger');
  if (past('mail')) placed.push('wren');
  if (past('calendar')) placed.push('scout');
  if (past('school')) placed.push('juno');
  const items = past('ask') ? (p.items.length ? p.items : [EXAMPLE()]) : [];
  if (!past('when')) items.forEach(i => { i.back = 0; });
  else items.forEach(i => { if (!i.back) i.back = Date.now() + 8 * 3_600_000; });
  return { ...p, step, path: 'new', placed, items, mail: past('mail'), cal: past('calendar'), school: past('school'), sim: null, jumped: true };
}

export function ObProvider({ children }: { children: ReactNode }) {
  const [s, set] = useState<State>(() => {
    const st = { ...fresh(), name: loadName(), items: loadItems(), gone: loadGone(), mail: loadHome() };
    // coming back after a card's time: Keep brings it up on the welcome-back screen
    const due = dueItems(Date.now());
    return due.length ? { ...st, mode: 'app', welcome: Date.now(), back: due } : st;
  });
  const ref = useRef(s); ref.current = s;
  useEffect(() => { saveItems(s.items); }, [s.items]);
  useEffect(() => { saveName(s.name); }, [s.name]);
  useEffect(() => { saveGone(s.gone); }, [s.gone]);
  const take = useCallback((id: ObSim) => {
    const cur = ref.current.sim;
    if (!cur || cur.id !== id) return false;
    set(p => ({ ...p, sim: null }));
    return true;
  }, []);
  const api = useMemo<Api>(() => ({
    ...s, take,
    go: step => set(p => ({ ...p, step, sim: null, jumped: false })),
    jump: step => set(p => ({ ...seed({ ...fresh(p.run + 1), name: p.name, items: p.items.map(i => ({ ...i })), gone: [] }, step) })),
    setPath: path => set(p => ({ ...p, path })),
    place: who => set(p => ({ ...p, placed: [...p.placed.filter(x => x !== who), who] })),
    setName: name => set(p => ({ ...p, name: name.trim().slice(0, 24) })),
    addItem: text => { const it = makeItem(text); set(p => ({ ...p, items: [...p.items, it].slice(0, 5) })); return it; },
    updateItem: (id, patch) => set(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, ...patch, ...(patch.text != null ? (() => { const r = makeItem(patch.text!); return { kind: r.kind, who: r.who, plan: r.plan, found: r.found }; })() : {}) } : i) })),
    removeItem: id => set(p => ({ ...p, items: p.items.filter(i => i.id !== id) })),
    setGone: gone => set(p => ({ ...p, gone })),
    setConn: (k, on) => { if (k === 'mail') saveHome(on); set(p => ({ ...p, [k]: on })); },
    toApp: from => set(p => ({ ...p, mode: 'app', welcome: 0, arrived: from === 'handover' ? Date.now() : 0 })),
    replay: () => { clearHanded(); set(p => fresh(p.run + 1)); },
    welcomeBack: () => set(p => ({ ...p, mode: 'app', welcome: Date.now(), back: p.items.filter(i => i.back > 0 && i.back <= Date.now() && !i.shown) })),
    closeWelcome: () => set(p => ({ ...p, welcome: 0, items: p.items.map(i => p.back.some(b => b.id === i.id) ? { ...i, shown: true } : i), back: [] })),
    timePasses: () => set(p => {
      const now = Date.now();
      const items = p.items.map(i => i.back > 0 && !i.shown ? { ...i, back: Math.min(i.back, now - 1000) } : i);
      return { ...p, items, mode: 'app', welcome: now, back: items.filter(i => i.back > 0 && i.back <= now && !i.shown) };
    }),
    simulate: id => set(p => ({ ...p, sim: { id, at: Date.now() } })),
  }), [s, take]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
