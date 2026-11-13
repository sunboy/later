import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AgentId } from '../data';

/** The front door. There is no Later account and no Later server: "sign in" is two doors, new or already set up,
    and setting up happens on a computer. Five short scenes teach one idea each, then set-up deals the crew one by one.
    Every step here is example data; nothing is sent, paid or deleted. */
export type Step =
  | 'title' | 'pile' | 'sort' | 'needs' | 'later' | 'yes'
  | 'doors' | 'computer' | 'mail' | 'calendar' | 'school' | 'reading' | 'found' | 'deck';

export const STORY: Step[] = ['pile', 'sort', 'needs', 'later', 'yes'];

export const STEPS: { id: Step; label: string; note: string }[] = [
  { id: 'title', label: 'Title', note: 'Keep climbs out of the horizon; the tap starts the sound' },
  { id: 'pile', label: 'A lot', note: 'life sends you a lot' },
  { id: 'sort', label: 'The crew', note: 'tap Keep: the crew sort it' },
  { id: 'needs', label: 'Needs you', note: 'only what needs you' },
  { id: 'later', label: 'Later', note: 'flick it down; it comes back' },
  { id: 'yes', label: 'Your yes', note: 'hold to say yes' },
  { id: 'doors', label: 'Two doors', note: 'your account, not ours' },
  { id: 'computer', label: 'Computer', note: 'install, then pair' },
  { id: 'mail', label: 'Mail', note: 'app password' },
  { id: 'calendar', label: 'Calendar', note: 'private link' },
  { id: 'school', label: 'School apps', note: 'by the emails they send' },
  { id: 'reading', label: 'Keep reads', note: 'capped at $1.00' },
  { id: 'found', label: 'What Keep found', note: 'turned one by one' },
  { id: 'deck', label: 'First deck', note: 'then Today' },
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
  placed: AgentId[]; // the crew Keep has dealt so far in set-up: the progress
  mail: boolean; cal: boolean; school: boolean;
  welcome: number; // when the welcome-back moment was opened (0 = closed)
  sim: { id: ObSim; at: number } | null;
  arrived: number; // when the app was reached from the handover, so Today can deal its first card from Keep
  run: number; // bumps on replay so every step remounts fresh
  jumped: boolean; // arrived by a jump from the chrome: a scene starts from its composed state, not mid-story
}

interface Api extends State {
  go: (s: Step) => void;
  /** from the prototype chrome: start the flow fresh at a step, with what it needs already in place */
  jump: (s: Step) => void;
  setPath: (p: State['path']) => void;
  place: (who: AgentId) => void;
  setConn: (k: 'mail' | 'cal' | 'school', on: boolean) => void;
  toApp: (from?: 'handover' | 'skip' | 'pair') => void;
  replay: () => void;
  welcomeBack: () => void;
  closeWelcome: () => void;
  simulate: (id: ObSim) => void;
  /** consume a pending sim event once, if it is for this id */
  take: (id: ObSim) => boolean;
}

const Ctx = createContext<Api | null>(null);
export const useOb = () => useContext(Ctx)!;

const fresh = (run = 0): State => ({
  mode: 'onboard', step: 'title', path: 'new', placed: [], mail: false, cal: false, school: false, welcome: 0, sim: null, arrived: 0, run, jumped: false,
});

/** What each step needs to have happened already, so a jump from the chrome lands on a coherent screen. */
function seed(p: State, step: Step): State {
  const order = STEPS.map(s => s.id);
  const at = order.indexOf(step);
  const past = (s: Step) => at > order.indexOf(s);
  const placed: AgentId[] = [];
  if (past('computer')) placed.push('ledger');
  if (past('mail')) placed.push('wren');
  if (past('calendar')) placed.push('scout');
  if (past('school')) placed.push('juno');
  return { ...p, step, path: 'new', placed, mail: past('mail'), cal: past('calendar'), school: past('school'), sim: null, jumped: true };
}

export function ObProvider({ children }: { children: ReactNode }) {
  const [s, set] = useState<State>(() => fresh());
  const ref = useRef(s); ref.current = s;
  const take = useCallback((id: ObSim) => {
    const cur = ref.current.sim;
    if (!cur || cur.id !== id) return false;
    set(p => ({ ...p, sim: null }));
    return true;
  }, []);
  const api = useMemo<Api>(() => ({
    ...s, take,
    go: step => set(p => ({ ...p, step, sim: null, jumped: false })),
    jump: step => set(p => ({ ...seed(fresh(p.run + 1), step) })),
    setPath: path => set(p => ({ ...p, path })),
    place: who => set(p => ({ ...p, placed: [...p.placed.filter(x => x !== who), who] })),
    setConn: (k, on) => set(p => ({ ...p, [k]: on })),
    toApp: from => set(p => ({ ...p, mode: 'app', welcome: 0, arrived: from === 'handover' ? Date.now() : 0 })),
    replay: () => set(p => fresh(p.run + 1)),
    welcomeBack: () => set(p => ({ ...p, mode: 'app', welcome: Date.now() })),
    closeWelcome: () => set(p => ({ ...p, welcome: 0 })),
    simulate: id => set(p => ({ ...p, sim: { id, at: Date.now() } })),
  }), [s, take]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
