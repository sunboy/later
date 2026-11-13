import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AgentId } from '../data';

/** The front door. There is no Later account and no Later server: "sign in" is two doors, new or already set up,
    and setting up happens on a computer. Every step here is example data; nothing is sent, paid or deleted. */
export type Step =
  | 'title' | 'demo' | 'doors' | 'handoff' | 'pair' | 'ready' | 'connect' | 'extras'
  | 'learn' | 'readback' | 'routines' | 'promises' | 'handover';

export const STEPS: { id: Step; label: string; note: string }[] = [
  { id: 'title', label: 'Title', note: 'the ball, then Keep' },
  { id: 'demo', label: 'Try it', note: 'four cards, sample data' },
  { id: 'doors', label: 'Two doors', note: 'new, or already set up' },
  { id: 'handoff', label: 'Computer', note: 'the installer, waited on' },
  { id: 'pair', label: 'Pair', note: 'scan the code' },
  { id: 'ready', label: 'Your home', note: 'key, cap, self-test' },
  { id: 'connect', label: 'Mail, calendar', note: 'app password, private link' },
  { id: 'extras', label: 'Anything else', note: 'by email; Slack later' },
  { id: 'learn', label: 'Reading', note: 'capped at $1.00' },
  { id: 'readback', label: 'Read-back', note: 'correct it; deal the crew' },
  { id: 'routines', label: 'Routines', note: 'arrive paused' },
  { id: 'promises', label: 'Promises', note: 'try each one' },
  { id: 'handover', label: 'First deck', note: 'then Today' },
];

/** A prototype-only event the chrome can fire into the current step (an error, or the computer finishing). */
export type ObSim = 'computer-done' | 'computer-quiet' | 'code-expired' | 'wrong-password' | 'learn-finish';
export const OB_SIM: { id: ObSim; step: Step; label: string; note: string }[] = [
  { id: 'computer-done', step: 'handoff', label: 'Computer finished', note: 'The installer is done and shows a code to scan.' },
  { id: 'computer-quiet', step: 'handoff', label: 'Computer goes quiet', note: 'Nothing has come back for a while. Keep says so.' },
  { id: 'code-expired', step: 'pair', label: 'Code expired', note: 'The next scan finds an old code.' },
  { id: 'wrong-password', step: 'connect', label: 'Wrong app password', note: 'The next mail sign-in is turned down.' },
  { id: 'learn-finish', step: 'learn', label: 'Finish reading', note: 'Skip to the end of the first pass.' },
];

export interface Placed { who: AgentId; on: string }

interface State {
  mode: 'onboard' | 'app';
  step: Step;
  path: 'new' | 'returning';
  placed: Placed[]; // crew Keep has dealt so far: the hand that grows through set-up
  mail: boolean; cal: boolean; byEmail: string | null;
  welcome: number; // when the welcome-back moment was opened (0 = closed)
  sim: { id: ObSim; at: number } | null;
  arrived: number; // when the app was reached from the handover, so Today can deal its first card from Keep
  run: number; // bumps on replay so every step remounts fresh
}

interface Api extends State {
  go: (s: Step) => void;
  /** from the prototype chrome: start the flow fresh at a step, with what it needs already in place */
  jump: (s: Step) => void;
  setPath: (p: State['path']) => void;
  place: (who: AgentId, on: string) => void;
  setConn: (k: 'mail' | 'cal', on: boolean) => void;
  setByEmail: (v: string | null) => void;
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
  mode: 'onboard', step: 'title', path: 'new', placed: [], mail: false, cal: false, byEmail: null, welcome: 0, sim: null, arrived: 0, run,
});

/** What each step needs to have happened already, so a jump from the chrome lands on a coherent screen. */
function seed(p: State, step: Step): State {
  const order = STEPS.map(s => s.id);
  const at = order.indexOf(step);
  const past = (s: Step) => at > order.indexOf(s);
  const placed: Placed[] = [];
  if (past('ready') || step === 'ready') placed.push({ who: 'ledger', on: 'Spend' });
  if (past('connect')) placed.push({ who: 'wren', on: 'Mail' }, { who: 'scout', on: 'Calendar' });
  if (past('extras')) placed.push({ who: 'juno', on: 'Brightwheel' });
  return { ...p, step, path: 'new', placed: step === 'ready' ? [] : placed, mail: past('connect'), cal: past('connect'), byEmail: past('extras') ? 'Brightwheel' : null, sim: null };
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
  // a step change from anywhere scrolls the phone's step back to its top
  useEffect(() => { document.querySelector('.ob-scroll')?.scrollTo({ top: 0 }); }, [s.step]);
  const api = useMemo<Api>(() => ({
    ...s, take,
    go: step => set(p => ({ ...p, step, sim: null })),
    jump: step => set(p => ({ ...seed(fresh(p.run + 1), step) })),
    setPath: path => set(p => ({ ...p, path })),
    place: (who, on) => set(p => ({ ...p, placed: [...p.placed.filter(x => x.who !== who), { who, on }] })),
    setConn: (k, on) => set(p => ({ ...p, [k]: on })),
    setByEmail: v => set(p => ({ ...p, byEmail: v })),
    toApp: from => set(p => ({ ...p, mode: 'app', welcome: 0, arrived: from === 'handover' ? Date.now() : 0 })),
    replay: () => set(p => fresh(p.run + 1)),
    welcomeBack: () => set(p => ({ ...p, mode: 'app', welcome: Date.now() })),
    closeWelcome: () => set(p => ({ ...p, welcome: 0 })),
    simulate: id => set(p => ({ ...p, sim: { id, at: Date.now() } })),
  }), [s, take]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

