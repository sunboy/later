import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import '../brand';
import { AGENTS, type AgentId } from '../data';
import { Icon } from '../icons';
import { Chief, Crew, type MState } from '../Mascot';
import { reducedMotion, spring, setT, usePrefersReducedMotion } from '../motion';
import { hum, onSoundChange, play, setSound, soundOn, unlock } from '../sound';
import { STORY, useOb, type Step } from './flow';

/* The front door as scenes. One world throughout: a sky, the horizon (the brand's own line) and the ground.
   Above the line is now; below it is later. Keep stands on the horizon, large, and acts every beat out:
   anticipation, action, reaction. Every scene's last frame tells its story on its own, so reduced motion
   gets composed stills, and every gesture also has a plain button. Sounds are played on the frame a thing lands. */

/* ------------------------------------------------------------------ helpers */

type Sky = 'night' | 'clay' | 'navy' | 'deep' | 'dawn' | 'glow';
type G = Parameters<typeof Icon>[0]['name'];
const CREW: AgentId[] = ['wren', 'scout', 'juno', 'ledger'];

/** Timers that die with the scene, and that collapse to "now" under reduced motion. */
function useTimers() {
  const ids = useRef<number[]>([]);
  useEffect(() => () => { ids.current.forEach(clearTimeout); ids.current = []; }, []);
  return (ms: number, fn: () => void) => { ids.current.push(window.setTimeout(fn, reducedMotion() ? Math.min(ms, 30) : ms)); };
}

/** Fly an element in from another (dealing): it leaves small and spun, lands with one overshoot. */
function fly(el: Element | null | undefined, from: Element | null | undefined, o: { delay?: number; dur?: number; spin?: number } = {}) {
  if (!el || !from || reducedMotion()) return Promise.resolve();
  const a = from.getBoundingClientRect(), b = el.getBoundingClientRect();
  const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
  const spin = o.spin ?? -18;
  return (el as HTMLElement).animate([
    { transform: `translate(${dx}px, ${dy}px) scale(.3) rotate(${spin}deg)`, opacity: 0 },
    { transform: `translate(${dx * 0.1}px, ${dy * 0.1 - 18}px) scale(1.04) rotate(${-spin * 0.1}deg)`, opacity: 1, offset: 0.7 },
    { transform: 'none', opacity: 1 },
  ], { duration: o.dur ?? 620, delay: o.delay ?? 0, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' }).finished.catch(() => {});
}
const keepSvg = () => document.querySelector('.ld .ld-k svg');

/** The visible sound switch. It remembers its setting on this device. */
export function SoundToggle({ cls = '' }: { cls?: string }) {
  const [on, setOn] = useState(soundOn());
  useEffect(() => onSoundChange(setOn), []);
  return (
    <button className={`snd ${cls}`} aria-pressed={on} onClick={e => { e.stopPropagation(); setSound(!on); }} aria-label={on ? 'Sound on. Turn it off' : 'Sound off. Turn it on'}>
      <Icon name={on ? 'soundon' : 'soundoff'} size={18} /><span>{on ? 'Sound on' : 'Sound off'}</span>
    </button>
  );
}

/** Keep, standing on the horizon. x is the offset from the centre; s the drawn size. */
const K = ({ x = 0, s = 230, st = 'idle', out, cls = '', lift = 0 }: { x?: number; s?: number; st?: MState; out?: boolean; cls?: string; lift?: number }) => (
  <span className={`ld-on ld-k ${cls}`} style={{ ['--x' as string]: `${x}px`, ['--lift' as string]: `${lift}px` } as CSSProperties}>
    <Chief state={st} size={s} out={out} />
  </span>
);
/** A crew member, each with its own cut and its own colour. */
const C = ({ who, x = 0, s = 100, st = 'idle', cls = '', lift = 0, style }: { who: AgentId; x?: number; s?: number; st?: MState; cls?: string; lift?: number; style?: CSSProperties }) => (
  <span className={`ld-on ld-c ${cls}`} data-who={who} style={{ ['--x' as string]: `${x}px`, ['--lift' as string]: `${lift}px`, ...style } as CSSProperties}>
    <Crew who={who} state={st} size={s} />
  </span>
);
/** A card with one glyph on it. y is the height of its centre above the horizon. */
const Card = ({ g, x = 0, y = 0, r = 0, w = 58, cls = '', style, children }: { g?: G; x?: number; y?: number; r?: number; w?: number; cls?: string; style?: CSSProperties; children?: ReactNode }) => (
  <span className={`ld-card ${cls}`} style={{ ['--x' as string]: `${x}px`, ['--y' as string]: `${y}px`, ['--r' as string]: `${r}deg`, ['--w' as string]: `${w}px`, ...style } as CSSProperties}>
    {g && <Icon name={g} size={Math.round(w * 0.44)} stroke={1.8} />}{children}
  </span>
);

/** The headline, its words rising in one after another. */
function Say({ text, id = 'ld-say' }: { text: string; id?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (!document.activeElement || document.activeElement === document.body || document.activeElement.closest('.phone')) ref.current?.focus({ preventScroll: true }); }, []);
  return (
    <h1 className="ld-say" id={id} ref={ref} tabIndex={-1} aria-live="polite" key={text}>
      {text.split(' ').map((w, i) => <span key={i} style={{ ['--i' as string]: i } as CSSProperties}>{w} </span>)}
    </h1>
  );
}

/** Progress: five small cards through the story; through set-up, the crew Keep has dealt so far. */
function Progress() {
  const ob = useOb();
  const at = STORY.indexOf(ob.step);
  if (at >= 0) return (
    <span className="ld-pips" role="img" aria-label={`Scene ${at + 1} of ${STORY.length}`}>
      {STORY.map((s, i) => <i key={s} className={i < at ? 'past' : i === at ? 'now' : ''} />)}
    </span>
  );
  if (['title', 'doors'].includes(ob.step)) return <span />;
  return (
    <span className="ld-team" role="img" aria-label={ob.placed.length ? `Dealt so far: ${ob.placed.map(w => AGENTS[w].name).join(', ')}` : 'No crew dealt yet'}>
      {CREW.map(w => ob.placed.includes(w)
        ? <span key={w} className="ld-tc" data-who={w}><Crew who={w} size={30} /></span>
        : <i key={w} />)}
    </span>
  );
}

function Scene({ sky, cls = '', say, sub, children, foot, hz = 64, onTap, skip, label }: {
  sky: Sky; cls?: string; say?: string; sub?: ReactNode; children?: ReactNode; foot?: ReactNode; hz?: number; onTap?: () => void; skip?: boolean; label?: string;
}) {
  const ob = useOb();
  return (
    <section className={`ld ${cls}`} data-sky={sky} style={{ ['--hz' as string]: `${hz}%` } as CSSProperties} aria-labelledby={say ? 'ld-say' : undefined} aria-label={say ? undefined : label} onClick={onTap}>
      <div className="ld-sky" aria-hidden="true"><i className="ld-stars" /><i className="ld-night" /></div>
      <div className="ld-glow" aria-hidden="true" />
      <div className="ld-ground" aria-hidden="true" />
      <div className="ld-stage">{children}</div>
      <header className="ld-top" onClick={e => e.stopPropagation()}>
        <Progress />
        <span className="ld-tools">
          {skip && <button className="ld-skip" onClick={() => ob.go('doors')}>Skip</button>}
          <SoundToggle cls="ld-snd" />
        </span>
      </header>
      {say && <div className="ld-words"><Say text={say} />{sub && <p className="ld-sub" key={String(sub)}>{sub}</p>}</div>}
      {foot && <footer className="ld-foot" onClick={e => e.stopPropagation()}>{foot}</footer>}
    </section>
  );
}

const Proto = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <button className="ld-proto" onClick={onClick}><span>Simulate</span>{children}</button>
);
function How({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ld-how">
      <button aria-expanded={open} onClick={() => setOpen(v => !v)}>How this works</button>
      {open && <p>{children}</p>}
    </div>
  );
}
const Hint = ({ children, show = true }: { children: ReactNode; show?: boolean }) => <p className={`ld-hint ${show ? 'on' : ''}`} aria-hidden={!show}>{children}</p>;

/* ------------------------------------------------------------------ 1. Title: Keep climbs out of the horizon */

function Title() {
  const ob = useOb();
  const rm = usePrefersReducedMotion();
  const after = useTimers();
  const [ph, setPh] = useState(rm ? 3 : 0); // 0 the line draws, 1 Keep climbs out, 2 the mark, 3 waiting for the tap
  const [k, setK] = useState<MState>('idle');
  const went = useRef(false);
  useEffect(() => { after(450, () => setPh(1)); after(1500, () => setPh(2)); after(2200, () => setPh(3)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const begin = () => {
    if (went.current) return; went.current = true;
    if (soundOn()) unlock();
    setPh(3); setK('done'); play('rise');
    after(520, () => ob.go('pile'));
  };
  return (
    <Scene sky="night" cls={`ld-title ph-${ph}`} hz={66} onTap={begin} label="Later">
      <div className="ld-above"><K s={250} st={k} cls="ld-tkeep" /></div>
      <span className="t-mark" aria-hidden="true"><wm-horizon variant="lower" state="idle" /></span>
      <button className="t-go" onClick={e => { e.stopPropagation(); begin(); }}>
        <span className="sr">Later. </span>Tap to start
        <small><Icon name="soundon" size={16} /> Sound on</small>
      </button>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 2 and 3. A lot, then the crew sort it */

/** The pile: where each card lands on and around Keep (x from the centre, y above the horizon), front or behind. */
const PILE: { g: G; x: number; y: number; r: number; front: boolean; to: number }[] = [
  { g: 'mail', x: -58, y: 40, r: -14, front: true, to: 0 },
  { g: 'bill', x: 8, y: 26, r: 6, front: true, to: 3 },
  { g: 'cake', x: 66, y: 44, r: 16, front: true, to: 0 },
  { g: 'cap', x: -118, y: 32, r: -24, front: true, to: 2 },
  { g: 'plane', x: 122, y: 30, r: 22, front: true, to: 1 },
  { g: 'receipt', x: -40, y: 200, r: -20, front: false, to: 3 },
  { g: 'house', x: 32, y: 210, r: 12, front: false, to: 1 },
  { g: 'today', x: -2, y: 240, r: -4, front: false, to: 1 },
  { g: 'gift', x: 86, y: 170, r: 28, front: false, to: 0 },
  { g: 'paw', x: -94, y: 162, r: -30, front: false, to: 2 },
  { g: 'car', x: -160, y: 66, r: -36, front: true, to: 3 },
  { g: 'book', x: 166, y: 72, r: 34, front: true, to: 2 },
];
/** Where the crew stand once dealt, and where each one's stack sits above its head. */
const SPOT: Record<AgentId, number> = { wren: -158, scout: -102, juno: 102, ledger: 158 };
const SORTED = (i: number) => {
  const p = PILE[i], who = CREW[p.to], n = PILE.slice(0, i).filter(q => q.to === p.to).length;
  return { x: SPOT[who] + (n - 1) * 3, y: 112 + n * 7, r: (n - 1) * 5 };
};

function Heap({ landed, sorted, sink }: { landed: number; sorted: number; sink?: boolean }) {
  return <>
    {PILE.map((p, i) => {
      const s = i < sorted ? SORTED(i) : null;
      return (
        <Card key={i} g={p.g} x={s ? s.x : p.x} y={sink ? -120 : s ? s.y : p.y} r={s ? s.r : p.r} w={s ? 40 : 58}
          cls={`h ${i < landed ? 'in' : ''} ${p.front && !s ? 'front' : ''} ${s ? 'sorted' : ''}`}
          style={{ ['--d' as string]: `${(s ? i : 0) * 70}ms` } as CSSProperties} />
      );
    })}
  </>;
}

function Pile() {
  const ob = useOb();
  const after = useTimers();
  const still = ob.jumped || reducedMotion();
  const [landed, setLanded] = useState(still ? PILE.length : 0);
  const [k, setK] = useState<MState>(still ? 'thinking' : 'listening');
  const [ready, setReady] = useState(still);
  useEffect(() => {
    if (still) return;
    PILE.forEach((_, i) => { after(380 + i * 125, () => setLanded(i + 1)); after(380 + i * 125 + 330, () => play('deal', { vol: 0.5, step: (i % 6) * 2 })); });
    after(380 + 5 * 125 + 200, () => { setK('error'); play('thup'); });
    after(380 + PILE.length * 125 + 700, () => { setK('thinking'); setReady(true); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Scene sky="clay" cls="ld-pile" say="Life sends you a lot." skip onTap={() => ready && ob.go('sort')}
      foot={<Hint show={ready}>Tap to carry on</Hint>}>
      <div className="ld-above">
        <Heap landed={landed} sorted={0} />
        <K st={k} cls={k === 'error' ? 'squash' : ''} />
      </div>
    </Scene>
  );
}

function Sort() {
  const ob = useOb();
  const after = useTimers();
  const [ph, setPh] = useState<'wait' | 'deal' | 'sort' | 'done'>('wait');
  const [dealt, setDealt] = useState(0);
  const [sorted, setSorted] = useState(0);
  const go = () => {
    if (ph !== 'wait') return;
    setPh('deal'); play('rise', { step: -2 });
    CREW.forEach((_, i) => after(260 + i * 240, () => { setDealt(i + 1); play('deal', { step: i * 2 }); }));
    const t0 = 260 + 4 * 240 + 260;
    after(t0, () => setPh('sort'));
    PILE.forEach((_, i) => after(t0 + i * 70, () => setSorted(i + 1)));
    PILE.forEach((_, i) => after(t0 + i * 70 + 360, () => play('tick', { step: i })));
    after(t0 + PILE.length * 70 + 600, () => { setPh('done'); play('done'); });
    after(t0 + PILE.length * 70 + 2400, () => ob.go('needs'));
  };
  const k: MState = ph === 'wait' ? 'thinking' : ph === 'done' ? 'done' : 'working';
  return (
    <Scene sky="navy" cls={`ld-sort ph-${ph}`} say="Keep and the crew sort it." skip onTap={() => ph === 'done' && ob.go('needs')}
      foot={<Hint show={ph === 'wait'}>Tap Keep</Hint>}>
      <div className="ld-above">
        <Heap landed={PILE.length} sorted={sorted} />
        {CREW.map((w, i) => <C key={w} who={w} s={104} x={i < dealt ? SPOT[w] : 0} lift={i < dealt ? 0 : 40} st={ph === 'done' ? 'done' : i < dealt ? 'idle' : 'idle'} cls={`deal ${i < dealt ? 'in' : ''}`} />)}
        <K st={k} out={ph === 'deal'} cls={ph === 'wait' ? '' : 'small'} />
        <button className="ld-keep-hit" disabled={ph !== 'wait'} onClick={e => { e.stopPropagation(); go(); }} aria-label="Tap Keep to deal the crew" />
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 4. Only what needs you */

function Needs() {
  const ob = useOb();
  const after = useTimers();
  const still = ob.jumped || reducedMotion();
  const [ph, setPh] = useState<'sink' | 'rise' | 'done'>(still ? 'rise' : 'sink');
  const [moved, setMoved] = useState(still);
  useEffect(() => {
    if (still) return;
    after(500, () => { setMoved(true); play('later', { vol: 0.45 }); });
    after(1300, () => { setPh('rise'); play('rise'); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const tap = () => {
    if (ph !== 'rise') return;
    setPh('done'); after(260, () => play('done'));
    after(1900, () => ob.go('later'));
  };
  return (
    <Scene sky="navy" cls={`ld-needs ph-${ph}`} say="Only what needs you." skip
      foot={<Hint show={ph === 'rise'}>Tap the card</Hint>}>
      <div className="ld-above">
        <Heap landed={PILE.length} sorted={PILE.length} sink={moved} />
        {CREW.map(w => <C key={w} who={w} s={104} x={SPOT[w]} lift={moved ? -130 : 0} st="working" cls="deal in sinks" />)}
        <K x={moved ? -96 : 0} st={ph === 'done' ? 'done' : moved ? 'waiting' : 'working'} cls={moved ? 'smaller' : 'small'} />
        <button className={`ld-big flip ${ph !== 'sink' ? 'up' : ''} ${ph === 'done' ? 'turned' : ''}`} onClick={e => { e.stopPropagation(); tap(); }} disabled={ph !== 'rise'} aria-label="The one card that needs you. Tap it.">
          <span className="face a"><Icon name="bill" size={58} stroke={1.7} /></span>
          <span className="face b"><Icon name="check" size={64} stroke={2.4} /></span>
        </button>
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 5. Later: flick it under the line; it comes back */

function Later() {
  const ob = useOb();
  const after = useTimers();
  const [ph, setPh] = useState<'wait' | 'gone' | 'back'>('wait');
  const card = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ y: number; id: number; on: boolean; dy: number } | null>(null);
  const send = () => {
    if (ph !== 'wait') return;
    setPh('gone'); play('later');
    after(2500, () => { setPh('back'); play('back'); });
    after(4300, () => ob.go('yes'));
  };
  const down = (e: React.PointerEvent) => { if (ph === 'wait') drag.current = { y: e.clientY, id: e.pointerId, on: false, dy: 0 }; };
  const move = (e: React.PointerEvent) => {
    const d = drag.current, el = card.current; if (!d || d.id !== e.pointerId || !el) return;
    d.dy = Math.max(-20, e.clientY - d.y);
    if (!d.on && Math.abs(d.dy) < 6) return;
    if (!d.on) { d.on = true; el.setPointerCapture(e.pointerId); }
    setT(el, { y: d.dy, r: d.dy / 18 });
  };
  const up = () => {
    const d = drag.current, el = card.current; drag.current = null; if (!d || !d.on || !el) return;
    if (d.dy > 56) { el.style.transform = ''; send(); return; }
    spring({ y: d.dy, r: d.dy / 18 }, { y: 0, r: 0 }, {}, { k: 520, c: 26 }, v => setT(el, v), () => { el.style.transform = ''; });
  };
  return (
    <Scene sky="navy" cls={`ld-later ph-${ph}`} say={ph === 'wait' ? 'Not now? Flick it down.' : 'It comes back.'} skip
      foot={<>
        <Hint show={ph === 'wait'}><Icon name="sink" size={18} /> Flick the card down</Hint>
        {ph === 'wait' && <button className="ld-btn quiet" onClick={send}>Send it to later</button>}
      </>}>
      <div className="ld-above">
        <K x={-96} st={ph === 'gone' ? 'rest' : ph === 'back' ? 'done' : 'waiting'} cls="smaller" />
        <button ref={card} className="ld-big drag" disabled={ph !== 'wait'} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'ArrowDown') send(); }} aria-label="The card. Flick it down, or press the down arrow, to send it to later.">
          <span className="face a"><Icon name="bill" size={58} stroke={1.7} /></span>
        </button>
      </div>
      <span className="ld-when" aria-hidden="true"><Icon name="clock" size={16} /> 6 pm</span>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 6. Nothing leaves without your yes */

const HOLD_MS = 1100;

function Yes() {
  const ob = useOb();
  const after = useTimers();
  const [ph, setPh] = useState<'wait' | 'hold' | 'sent'>('wait');
  const h = useRef<{ done: () => void; cancel: () => void } | null>(null);
  const t = useRef(0);
  const start = () => {
    if (ph === 'sent') return;
    setPh('hold'); h.current = hum(HOLD_MS);
    t.current = window.setTimeout(() => {
      h.current?.done(); h.current = null; setPh('sent');
      after(2600, () => ob.go('doors'));
    }, HOLD_MS);
  };
  const stop = () => {
    if (!h.current) return;
    clearTimeout(t.current); h.current.cancel(); h.current = null; setPh('wait');
  };
  useEffect(() => () => { clearTimeout(t.current); h.current?.cancel(); }, []);
  return (
    <Scene sky="glow" cls={`ld-yes ph-${ph}`} say={ph === 'sent' ? 'That was your yes.' : 'Nothing leaves without your yes.'} sub={ph === 'sent' ? 'Only practice. Nothing was sent.' : undefined} skip={ph !== 'sent'}
      foot={ph === 'sent'
        ? <button className="ld-btn" onClick={() => ob.go('doors')}>Carry on</button>
        : <button className={`ld-hold ${ph === 'hold' ? 'on' : ''}`} style={{ ['--hold' as string]: `${HOLD_MS}ms` } as CSSProperties}
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); start(); }} onPointerUp={stop} onPointerCancel={stop} onPointerLeave={stop}
            onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } }}
            onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') stop(); }}>
            <i className="fill" /><span>Hold to say yes</span>
          </button>}>
      <div className="ld-above">
        <K x={-96} st={ph === 'sent' ? 'done' : 'listening'} cls="smaller" />
        <span className="ld-big send"><span className="face a"><Icon name="send" size={54} stroke={1.9} /></span><i className="tab" /></span>
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 7. Two doors: it runs in your own account */

function Doors() {
  const ob = useOb();
  return (
    <Scene sky="dawn" cls="ld-doors" say="Yours. In your own account." sub="Your Cloudflare. Your Anthropic key. Not ours."
      foot={<>
        <button className="ld-btn primary" onClick={() => { play('rise'); ob.setPath('new'); ob.go('computer'); }}>Set up mine</button>
        <button className="ld-btn" onClick={() => { play('rise'); ob.setPath('returning'); ob.go('computer'); }}>I already have Later</button>
        <button className="ld-btn quiet sm" onClick={() => ob.toApp('skip')}>Look around first</button>
      </>}>
      <div className="ld-above">
        {CREW.map((w, i) => <C key={w} who={w} s={96} x={SPOT[w] * 1.02} cls="hop" style={{ ['--i' as string]: i } as CSSProperties} />)}
        <K s={220} cls="wave" />
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 8. On your computer, then pair */

function qr(seed = 7): boolean[][] {
  const n = 25, m: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  let x = seed;
  const rnd = () => ((x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) m[r][c] = rnd() > 0.52;
  const finder = (r0: number, c0: number) => {
    for (let r = -1; r < 8; r++) for (let c = -1; c < 8; c++) {
      const rr = r0 + r, cc = c0 + c; if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
      const edge = r === 0 || r === 6 || c === 0 || c === 6, core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      m[rr][cc] = r >= 0 && c >= 0 && r <= 6 && c <= 6 && (edge || core);
    }
  };
  finder(0, 0); finder(0, n - 7); finder(n - 7, 0);
  return m;
}
const QR = qr();
const QrCode = () => (
  <svg className="qr" viewBox="-2 -2 29 29" aria-hidden="true">
    <rect x="-2" y="-2" width="29" height="29" rx="2" fill="#fff" />
    {QR.map((row, r) => row.map((on, c) => on ? <rect key={r * 25 + c} x={c} y={r} width="1.02" height="1.02" fill="#0d1324" /> : null))}
  </svg>
);

const CAP = 60_000_000; // integer micro-USD, example data
const usd = (micro: number) => '$' + (micro / 1_000_000).toFixed(2).replace(/\.00$/, '');
const usd2 = (micro: number) => '$' + (micro / 1_000_000).toFixed(2);
const DOTS = 9;

function Computer() {
  const ob = useOb();
  const after = useTimers();
  const back = ob.path === 'returning';
  const [phase, setPhase] = useState<'wait' | 'quiet' | 'code' | 'scan' | 'expired' | 'paired'>(back ? 'code' : 'wait');
  useEffect(() => {
    if (ob.take('computer-done')) setPhase('code');
    if (ob.take('computer-quiet')) setPhase('quiet');
  }, [ob.sim?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (phase === 'code') play('rise', { step: -3 }); }, [phase]);
  const scan = () => {
    setPhase('scan');
    after(1500, () => {
      if (ob.take('code-expired')) { setPhase('expired'); play('thup'); return; }
      setPhase('paired');
      for (let i = 0; i < DOTS; i++) after(i * 60, () => play('tick', { step: i, vol: 0.6 }));
      after(DOTS * 60 + 200, () => { play('deal'); if (!back) ob.place('ledger'); else CREW.forEach(w => ob.place(w)); });
      after(DOTS * 60 + 820, () => play('done'));
    });
  };
  const k: MState = phase === 'quiet' || phase === 'expired' ? 'error' : phase === 'paired' ? 'done' : phase === 'scan' ? 'listening' : phase === 'code' ? 'waiting' : 'thinking';
  const say = {
    wait: 'Set it up on a computer.', quiet: 'Your computer went quiet.', code: back ? 'Scan the code from your Later.' : 'Your home is ready.',
    scan: 'Reading the code.', expired: 'That code has expired.', paired: 'Paired.',
  }[phase];
  const sub = {
    wait: 'Open the address there and type the code.', quiet: 'Run the installer again. It picks up where it stopped.',
    code: back ? 'On a paired device: Settings, then Add a phone.' : 'Scan the code it is showing.', scan: '',
    expired: 'Show a new code, then scan again.', paired: back ? 'Your crew is already at work.' : `Spending is capped at ${usd(CAP)}, set on your computer.`,
  }[phase];
  return (
    <Scene sky="navy" cls={`ld-computer ph-${phase}`} say={say} sub={sub || undefined} hz={60}
      foot={<>
        {phase === 'wait' && <><Proto onClick={() => setPhase('code')}>Home created</Proto>
          <How>The installer puts Later in your own Cloudflare account and locks your Anthropic key and your spending cap there. When your home exists it shows a code, and this phone pairs. Nothing on a Later server.</How></>}
        {phase === 'quiet' && <button className="ld-btn primary" onClick={() => setPhase('wait')}>I’ve run it again</button>}
        {phase === 'code' && <button className="ld-btn primary" onClick={scan}>Scan the code</button>}
        {phase === 'expired' && <button className="ld-btn primary" onClick={scan}>Scan again</button>}
        {phase === 'scan' && <button className="ld-btn primary" disabled>Reading the code</button>}
        {phase === 'paired' && <button className="ld-btn primary" onClick={() => back ? ob.toApp('pair') : ob.go('mail')}>{back ? 'Open Today' : 'Carry on'}</button>}
      </>}>
      <div className="ld-above">
        <K x={64} s={160} st={k} cls="peek" lift={150} />
        {phase === 'paired' && !back && <C who="ledger" x={-150} s={100} st="done" cls="pop-in" />}
      </div>
      <div className={`ld-laptop ${phase}`} role="img" aria-label={phase === 'wait' || phase === 'quiet' ? 'Your computer, showing later.sh/go and the code K4Q 72R' : phase === 'paired' ? 'Your computer, paired' : 'Your computer, showing a code to scan'}>
        <div className="lap-screen">
          {(phase === 'wait' || phase === 'quiet') && <span className="lap-go"><b>later.sh/go</b><span className="code">K4Q 72R</span></span>}
          {(phase === 'code' || phase === 'scan' || phase === 'expired') && <span className="lap-qr"><QrCode />{phase === 'expired' && <span className="x"><Icon name="close" size={40} stroke={2.6} /></span>}</span>}
          {phase === 'scan' && <><i className="vf tl" /><i className="vf tr" /><i className="vf bl" /><i className="vf br" /><i className="vf-line" /></>}
          {phase === 'paired' && <span className="lap-ok"><Icon name="check" size={46} stroke={2.6} /></span>}
        </div>
        <i className="lap-base" />
      </div>
      <span className={`ld-path ${phase === 'paired' ? 'lit' : ''}`} aria-hidden="true">
        {Array.from({ length: DOTS }, (_, i) => {
          const t = (i + 1) / (DOTS + 1), x = (1 - t) * (1 - t) * 150 + 2 * t * (1 - t) * 170 + t * t * 34, y = 2 * t * (1 - t) * 96 + t * t * 92;
          return <i key={i} style={{ ['--i' as string]: i, left: `calc(50% + ${x.toFixed(1)}px)`, top: `calc(var(--hz) + ${y.toFixed(1)}px)` } as CSSProperties} />;
        })}
        <b className="ld-phone" />
      </span>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 9 to 11. Mail, calendar, school: a crew member holds each ask */

const GOOD_PW = 'abcd efgh ijkl mnop';

function useDealIn(who: AgentId) {
  useLayoutEffect(() => {
    const el = document.querySelector(`.ld .ld-hero`);
    void fly(el, keepSvg(), { delay: 260, dur: 680 });
    const t = setTimeout(() => play('deal'), reducedMotion() ? 0 : 260);
    return () => clearTimeout(t);
  }, [who]);
}

function Connect({ who, g, sky = 'navy', cls, say, sub, children, foot, st }: {
  who: AgentId; g: G; sky?: Sky; cls: string; say: string; sub: ReactNode; children?: ReactNode; foot: ReactNode; st: 'idle' | 'checking' | 'ok' | 'bad';
}) {
  useDealIn(who);
  const cst: MState = st === 'bad' ? 'error' : st === 'checking' ? 'thinking' : st === 'ok' ? 'done' : 'idle';
  return (
    <Scene sky={sky} cls={`ld-connect ${cls} st-${st}`} say={say} sub={sub} hz={52} foot={foot}>
      <div className="ld-above">
        <K x={-112} s={150} st={st === 'ok' ? 'done' : 'idle'} cls="ld-k-side" />
        <span className="ld-hero-wrap"><C who={who} x={44} s={190} st={cst} cls="ld-hero" /></span>
        <Card g={g} x={st === 'ok' ? 44 : 118} y={st === 'ok' ? 90 : 52} r={st === 'ok' ? 0 : 12} w={72} cls={`held ${st === 'ok' ? 'taken' : ''}`} />
      </div>
      {children}
    </Scene>
  );
}

function Field({ id, label, value, set, placeholder, paste, bad, onEnter }: { id: string; label: string; value: string; set: (v: string) => void; placeholder: string; paste: string; bad?: boolean; onEnter: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label className={`ld-field ${bad ? 'bad' : ''}`}>
      <span className="sr">{label}</span>
      <input ref={ref} id={id} className="code" value={value} onChange={e => set(e.target.value)} placeholder={placeholder} autoComplete="off" spellCheck={false} aria-invalid={bad || undefined}
        onKeyDown={e => { if (e.key === 'Enter') onEnter(); }} />
      <button type="button" onClick={() => { set(paste); play('tick'); ref.current?.focus(); }}>Paste</button>
    </label>
  );
}

function Mail() {
  const ob = useOb();
  const after = useTimers();
  const [st, setSt] = useState<'idle' | 'checking' | 'ok' | 'bad'>(ob.mail ? 'ok' : 'idle');
  const [pw, setPw] = useState('');
  const go = () => {
    if (!pw || st === 'checking') return;
    setSt('checking');
    after(1200, () => {
      if (ob.take('wrong-password') || pw.replace(/\s/g, '').length !== 16) { setSt('bad'); play('thup'); return; }
      setSt('ok'); ob.setConn('mail', true); ob.place('wren');
      after(420, () => play('done'));
      after(2000, () => ob.go('calendar'));
    });
  };
  return (
    <Connect who="wren" g="mail" cls="ld-mail" st={st}
      say={st === 'bad' ? 'Google said no to that.' : st === 'ok' ? 'Mail connected.' : 'Connect your mail.'}
      sub={st === 'bad' ? 'Paste the 16 letters again.' : st === 'ok' ? 'Wren reads it. Nothing is sent without your yes.' : 'Wren reads it. Nothing is sent without your yes.'}
      foot={st === 'ok' ? null : <>
        <Field id="ob-pw" label="Gmail app password" value={pw} set={v => { setPw(v); if (st === 'bad') setSt('idle'); }} placeholder="App password" paste={GOOD_PW} bad={st === 'bad'} onEnter={go} />
        <button className="ld-btn primary" disabled={!pw || st === 'checking'} onClick={go}>{st === 'checking' ? 'Connecting' : 'Connect'}</button>
        <div className="ld-row"><How>Google makes a separate password just for Later: turn on 2-Step Verification, make an app password, paste it here. It is stored in your own account, and you can delete it in Google at any time.</How>
          <button className="ld-btn quiet sm" onClick={() => ob.go('calendar')}>Skip</button></div>
      </>} />
  );
}

function Calendar() {
  const ob = useOb();
  const after = useTimers();
  const [st, setSt] = useState<'idle' | 'checking' | 'ok' | 'bad'>(ob.cal ? 'ok' : 'idle');
  const [link, setLink] = useState('');
  const go = () => {
    if (!link || st === 'checking') return;
    setSt('checking');
    after(1000, () => {
      setSt('ok'); ob.setConn('cal', true); ob.place('scout');
      after(420, () => play('done'));
      after(2000, () => ob.go('school'));
    });
  };
  return (
    <Connect who="scout" g="today" cls="ld-cal" st={st}
      say={st === 'ok' ? 'Calendar added.' : 'Add your calendar.'} sub={st === 'ok' ? 'Scout reads it. It never changes it.' : 'Scout reads it from its private link.'}
      foot={st === 'ok' ? null : <>
        <Field id="ob-ical" label="Private calendar link" value={link} set={setLink} placeholder="Private link" paste="https://calendar.google.com/calendar/ical/example/basic.ics" onEnter={go} />
        <button className="ld-btn primary" disabled={!link || st === 'checking'} onClick={go}>{st === 'checking' ? 'Adding' : 'Add calendar'}</button>
        <div className="ld-row"><How>In Google Calendar, open Settings, choose your calendar, and copy the secret address in iCal format.</How>
          <button className="ld-btn quiet sm" onClick={() => ob.go('school')}>Skip</button></div>
      </>} />
  );
}

function School() {
  const ob = useOb();
  const after = useTimers();
  const [st, setSt] = useState<'idle' | 'ok'>(ob.school ? 'ok' : 'idle');
  const yes = () => {
    setSt('ok'); ob.setConn('school', true); ob.place('juno');
    after(420, () => play('done'));
    after(1800, () => ob.go('reading'));
  };
  return (
    <Connect who="juno" g="cap" sky="dawn" cls="ld-school" st={st === 'ok' ? 'ok' : 'idle'}
      say={st === 'ok' ? 'Juno is watching for them.' : 'School apps too?'}
      sub={!ob.mail ? 'They come in by email, so this needs your mail.' : st === 'ok' ? 'By the emails they send you.' : 'Juno reads the emails they send you.'}
      foot={st === 'ok' ? null : <>
        <button className="ld-btn primary" disabled={!ob.mail} onClick={yes}>Yes, watch for them</button>
        <button className="ld-btn quiet sm" onClick={() => ob.go('reading')}>Not now</button>
      </>} />
  );
}

/* ------------------------------------------------------------------ 12. Keep reads: the crew in orbit, the spend ring */

const PASS_CAP = 1_000_000, PASS_USED = 420_000; // integer micro-USD, example data
const PASS_MS = 9000;
const BITS: G[] = ['mail', 'today', 'bill', 'cap', 'receipt', 'house', 'cake', 'plane'];
const LINES = ['Newest first.', 'Nothing is sent or deleted.', 'About a minute.'];
const R = 120, CIRC = 2 * Math.PI * R;

function Reading() {
  const ob = useOb();
  const after = useTimers();
  const [t, setT0] = useState(0);
  const [bits, setBits] = useState<{ id: number; g: G; x: number }[]>([]);
  const start = useRef(performance.now());
  const n = useRef(0);
  const done = t >= 1;
  const doneRef = useRef(done); doneRef.current = done;
  useEffect(() => {
    if (done) return;
    const i = setInterval(() => setT0(Math.min(1, (performance.now() - start.current) / PASS_MS)), 100);
    const b = setInterval(() => {
      if (reducedMotion()) return;
      const id = n.current++;
      setBits(v => [...v.slice(-7), { id, g: BITS[id % BITS.length], x: ((id * 73) % 260) - 130 }]);
      if (id % 2 === 0) after(760, () => { if (!doneRef.current) play('tick', { step: (id / 2) % 7, vol: 0.4 }); });
    }, 420);
    return () => { clearInterval(i); clearInterval(b); };
  }, [done]);
  useEffect(() => { if (ob.take('learn-finish')) setT0(1); }, [ob.sim?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!done) return;
    play('done');
    after(1700, () => ob.go('found'));
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  const line = LINES[Math.min(LINES.length - 1, Math.floor(t * 3.2))];
  const used = Math.round((PASS_USED * t) / 10_000) * 10_000;
  const who = ob.placed.length ? CREW.filter(w => ob.placed.includes(w)) : CREW;
  return (
    <Scene sky="deep" cls={`ld-reading ${done ? 'done' : ''}`} say={done ? 'Done. Keep found things.' : 'Keep is reading.'} hz={70}
      foot={<>
        <p className="ld-cap" aria-live="polite" key={line}>{done ? 'Nothing was sent or deleted.' : line}</p>
        <p className="ld-spend"><b className="num">{usd2(used)}</b> of a {usd2(PASS_CAP)} cap</p>
        {!done && <Proto onClick={() => setT0(1)}>Finish reading</Proto>}
      </>}>
      <div className="ld-orbit-wrap">
        <svg className="ld-ring" viewBox="-140 -140 280 280" aria-hidden="true">
          <circle r={R} className="track" />
          <circle r={R} className="used" style={{ strokeDasharray: `${CIRC * (done ? 1 : (used / PASS_CAP))} ${CIRC}` }} />
        </svg>
        <div className="ld-orbit" aria-hidden="true">
          {who.map((w, i) => (
            <span key={w} className="ld-orb" style={{ ['--a' as string]: `${(360 / who.length) * i + 30}deg` } as CSSProperties}>
              <span className="ld-c" data-who={w}><Crew who={w} size={58} state={done ? 'done' : 'working'} /></span>
            </span>
          ))}
        </div>
        <span className="ld-k ld-k-center"><Chief state={done ? 'done' : 'working'} size={170} /></span>
        {bits.map(b => <span key={b.id} className="ld-bit" style={{ ['--bx' as string]: `${b.x}px` } as CSSProperties}><Icon name={b.g} size={14} stroke={2} /></span>)}
      </div>
      <span className="sr" role="progressbar" aria-label="First reading, spend against its cap" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((used / PASS_CAP) * 100)} />
    </Scene>
  );
}

/* ------------------------------------------------------------------ 13. What Keep found: dealt face down, turned one by one */

const PROPOSED: { id: string; name: string; g: G; who: AgentId }[] = [
  { id: 'house', name: 'House move', g: 'house', who: 'scout' },
  { id: 'school', name: 'School', g: 'cap', who: 'juno' },
  { id: 'party', name: 'A birthday', g: 'cake', who: 'wren' },
  { id: 'tax', name: 'Taxes', g: 'receipt', who: 'ledger' },
];
const FAN = [{ x: -134, r: -12, y: 210 }, { x: -45, r: -4, y: 226 }, { x: 45, r: 4, y: 226 }, { x: 134, r: 12, y: 210 }];

function Found() {
  const ob = useOb();
  const after = useTimers();
  const still = reducedMotion();
  const [dealt, setDealt] = useState(still ? 4 : 0);
  const [turned, setTurned] = useState(still ? 4 : 0);
  const [gone, setGone] = useState<string[]>([]);
  const [ph, setPh] = useState<'show' | 'check' | 'keep'>(still ? 'check' : 'show');
  useEffect(() => {
    if (still) return;
    PROPOSED.forEach((_, i) => after(300 + i * 200, () => { setDealt(i + 1); play('deal', { step: i * 2 }); }));
    PROPOSED.forEach((_, i) => after(1500 + i * 520, () => { setTurned(i + 1); play('tick', { step: i * 3 }); }));
    after(1500 + 4 * 520 + 200, () => { setPh('check'); play('done', { vol: 0.7 }); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const kept = PROPOSED.filter(p => !gone.includes(p.id));
  const flick = (id: string) => { setGone(g => [...g, id]); play('later', { vol: 0.6 }); };
  const keep = () => {
    setPh('keep'); play('deal');
    kept.forEach(p => ob.place(p.who));
    after(900, () => play('done'));
    after(1600, () => ob.go('deck'));
  };
  /* flick a card away: drag it up or to the side */
  const drag = useRef<{ id: string; x: number; y: number; p: number; on: boolean } | null>(null);
  const down = (id: string) => (e: React.PointerEvent) => { if (ph !== 'check' || (e.target as HTMLElement).closest('.ld-x')) return; drag.current = { id, x: e.clientX, y: e.clientY, p: e.pointerId, on: false }; };
  const move = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || d.p !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y; if (!d.on && Math.hypot(dx, dy) < 6) return;
    const el = e.currentTarget as HTMLElement;
    if (!d.on) { d.on = true; el.setPointerCapture(e.pointerId); }
    el.style.translate = `${dx}px ${Math.min(dy, 30)}px`;
  };
  const up = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null; if (!d || !d.on) return;
    const el = e.currentTarget as HTMLElement, dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) > 70 || dy < -70) { el.style.translate = ''; flick(d.id); return; }
    el.animate([{ translate: el.style.translate }, { translate: '0 0' }], { duration: 380, easing: 'cubic-bezier(.34,1.45,.64,1)' });
    el.style.translate = '';
  };
  return (
    <Scene sky="dawn" cls={`ld-found ph-${ph}`} hz={68}
      say={ph === 'keep' ? 'The crew are on them.' : `Keep found ${kept.length} Space${kept.length === 1 ? '' : 's'}.`}
      sub={ph === 'check' ? 'Flick away any you don’t want.' : undefined}
      foot={ph === 'check' ? <button className="ld-btn primary" disabled={!kept.length} onClick={keep}>Keep {kept.length === PROPOSED.length ? 'all four' : kept.length === 1 ? 'this one' : 'these'}</button> : null}>
      <div className="ld-above">
        <K s={150} st={ph === 'keep' ? 'done' : turned < 4 ? 'working' : 'waiting'} out={dealt > 0 && ph !== 'keep'} />
      </div>
      <div className="ld-fan">
        {PROPOSED.map((p, i) => {
          const f = FAN[i], off = gone.includes(p.id);
          return (
            <div key={p.id} className={`ld-sp ${i < dealt ? 'in' : ''} ${i < turned ? 'turned' : ''} ${off ? 'off' : ''}`}
              style={{ ['--x' as string]: `${ph === 'keep' ? 0 : f.x}px`, ['--y' as string]: `${ph === 'keep' ? 120 : f.y}px`, ['--r' as string]: `${ph === 'keep' ? (i - 1.5) * 2 : f.r}deg`, ['--i' as string]: i } as CSSProperties}
              onPointerDown={down(p.id)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
              <span className="face back" aria-hidden="true"><i /></span>
              <span className="face front">
                <span className="glyph"><Icon name={p.g} size={34} stroke={1.8} /></span>
                <b>{p.name}</b>
                <span className="ld-c" data-who={p.who}><Crew who={p.who} size={34} state={ph === 'keep' ? 'working' : 'idle'} /></span>
                {ph === 'check' && <button className="ld-x" aria-label={`Not a Space: ${p.name}`} onClick={() => flick(p.id)}><Icon name="close" size={14} stroke={2.2} /></button>}
              </span>
            </div>
          );
        })}
        {ph === 'check' && gone.length > 0 && <button className="ld-undo" onClick={() => setGone(g => g.slice(0, -1))}><Icon name="undo" size={15} /> Undo</button>}
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 14. Your first deck */

function Deck() {
  const ob = useOb();
  const after = useTimers();
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState<MState>('working');
  useLayoutEffect(() => {
    const els = box.current?.querySelectorAll<HTMLElement>('.ld-dc');
    els && [...els].reverse().forEach((el, j) => { void fly(el, keepSvg(), { delay: 300 + j * 300, dur: 640, spin: -20 }); after(300 + j * 300, () => play('deal', { step: j * 2 })); });
    after(1500, () => { setK('done'); play('done'); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Scene sky="dawn" cls="ld-deck" say="Your first deck." sub="One thing at a time. Routines start paused."
      foot={<button className="ld-btn primary" onClick={() => ob.toApp('handover')}>Open Today</button>}>
      <div className="ld-above"><K x={-104} s={160} st={k} /></div>
      <div className="ld-stack" ref={box} aria-hidden="true">
        {(['today', 'bill', 'mail'] as const).map((g, j) => (
          <span key={g} className="ld-dc" style={{ ['--j' as string]: j } as CSSProperties}>{j === 2 && <><Icon name={g} size={52} stroke={1.7} /><i className="dot" /></>}</span>
        ))}
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ Welcome back (the app, later in the day) */

export function WelcomeBack() {
  const ob = useOb();
  const [k, setK] = useState<MState>('done');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const t = setTimeout(() => setK('idle'), 1500); return () => clearTimeout(t); }, [ob.welcome]);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    play('back', { vol: 0.5 });
    if (reducedMotion()) return;
    setT(el, { y: -140 }); spring({ y: -140 }, { y: 0 }, {}, { k: 300, c: 21 }, v => setT(el, v), () => { el.style.transform = ''; });
    el.querySelector('button')?.focus({ preventScroll: true });
  }, [ob.welcome]);
  if (!ob.welcome) return null;
  return (
    <div className="wb" onClick={ob.closeWelcome}>
      <div ref={ref} className="wb-card" role="dialog" aria-modal="true" aria-labelledby="wb-h" onClick={e => e.stopPropagation()} onKeyDown={e => e.key === 'Escape' && ob.closeWelcome()}>
        <span className="wb-keep"><Chief state={k} size={64} /></span>
        <div>
          <h2 id="wb-h">Afternoon, Sam.</h2>
          <p>While you were out, Scout got Dave’s reply and Ledger filed two receipts. One thing needs you.</p>
        </div>
        <button className="btn primary block" onClick={ob.closeWelcome}>Show me</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ the front door */

const VIEWS: Record<Step, () => JSX.Element> = {
  title: Title, pile: Pile, sort: Sort, needs: Needs, later: Later, yes: Yes,
  doors: Doors, computer: Computer, mail: Mail, calendar: Calendar, school: School, reading: Reading, found: Found, deck: Deck,
};

export function Onboard() {
  const ob = useOb();
  const View = VIEWS[ob.step];
  return (
    <div className={`onboard ld-door st-${ob.step}`}>
      <View key={`${ob.run}-${ob.step}`} />
    </div>
  );
}
