import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import '../brand';
import { AGENTS, type AgentId } from '../data';
import { Icon } from '../icons';
import { Chief, Crew, type MState } from '../Mascot';
import { reducedMotion, spring, setT, usePrefersReducedMotion } from '../motion';
import { hum, onSoundChange, play, setSound, soundOn, unlock, type Sfx } from '../sound';
import { useOb, type Step } from './flow';

/* ------------------------------------------------------------------ helpers */

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
function useAlive() {
  const r = useRef(true);
  useEffect(() => { r.current = true; return () => { r.current = false; }; }, []);
  return r;
}
const keepEl = () => document.querySelector('.ob-scene .ob-keep svg') as HTMLElement | null;

/** Dealing means assigning: the element flies in from Keep and lands with one overshoot. The whoosh plays as it leaves. */
function dealFrom(el: HTMLElement | null | undefined, opts: { delay?: number; dur?: number; from?: Element | null; spin?: number; quiet?: boolean } = {}) {
  const src = (opts.from ?? keepEl())?.getBoundingClientRect();
  if (!opts.quiet) setTimeout(() => play('deal'), opts.delay ?? 0);
  if (!el || !src || reducedMotion()) return Promise.resolve();
  const r = el.getBoundingClientRect();
  const dx = src.left + src.width / 2 - (r.left + r.width / 2), dy = src.top + src.height / 2 - (r.top + r.height / 2);
  const sc = Math.max(0.12, Math.min(0.6, src.width / Math.max(1, r.width)));
  const spin = opts.spin ?? -16;
  return el.animate([
    { transform: `translate(${dx}px, ${dy}px) scale(${sc}) rotate(${spin}deg)`, opacity: 0.4 },
    { transform: `translate(0, -8px) scale(1.03) rotate(${-spin * 0.06}deg)`, opacity: 1, offset: 0.74 },
    { transform: 'none', opacity: 1 },
  ], { duration: opts.dur ?? 600, delay: opts.delay ?? 0, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' }).finished.catch(() => {});
}
/** The citrus flash: done. */
const flashDone = (el: HTMLElement | null | undefined) => {
  if (!el || reducedMotion()) return;
  el.animate([{ boxShadow: '0 0 0 0 var(--pop)' }, { boxShadow: '0 0 0 5px var(--pop)', offset: 0.2 }, { boxShadow: '0 0 0 0 transparent' }], { duration: 1200, easing: 'ease-out' });
};
const usd = (micro: number) => '$' + (micro / 1_000_000).toFixed(2);

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

/* ------------------------------------------------------------------ Keep's hand: the progress of set-up */

function Hand({ k, crew = 'idle', out }: { k: MState; crew?: MState; out?: boolean }) {
  const ob = useOb();
  const box = useRef<HTMLSpanElement>(null);
  const seen = useRef<string[]>(ob.placed.map(p => p.who));
  useLayoutEffect(() => {
    const now = ob.placed.map(p => p.who);
    const fresh = now.filter(w => !seen.current.includes(w));
    seen.current = now;
    fresh.forEach(w => {
      const el = box.current?.querySelector<HTMLElement>(`[data-who="${w}"]`);
      if (el && !reducedMotion()) el.animate([{ transform: 'translateY(10px) scale(.6) rotate(-20deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520, delay: 380, easing: 'cubic-bezier(.34,1.45,.64,1)', fill: 'backwards' });
    });
  }, [ob.placed]);
  const n = ob.placed.length;
  return (
    <div className="ob-hand" role="img" aria-label={n ? `Keep, with ${ob.placed.map(p => AGENTS[p.who].name).join(', ')}` : 'Keep'}>
      <span className="ob-keep"><Chief state={k} size={56} out={out} /></span>
      {n > 0 && (
        <span className="ob-fan" ref={box} aria-hidden="true">
          {ob.placed.map((p, i) => (
            <span key={p.who} className="ob-pc" data-who={p.who} style={{ ['--i' as string]: i } as CSSProperties}><Crew who={p.who} size={32} state={crew} /></span>
          ))}
        </span>
      )}
    </div>
  );
}

/** One headline, one short line, one thing to do, and a quiet "How this works" when there is more to say. */
function Scene({ k, say, sub, children, foot, cls = '', crew, out, how }: {
  k: MState; say: ReactNode; sub?: ReactNode; children?: ReactNode; foot?: ReactNode; cls?: string; crew?: MState; out?: boolean; how?: ReactNode;
}) {
  const h = useRef<HTMLHeadingElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (document.activeElement && document.activeElement !== document.body && !document.activeElement.closest('.phone')) return; h.current?.focus({ preventScroll: true }); }, []);
  return (
    <section className={`ob-scene ${cls}`} aria-labelledby="ob-say">
      <div className="ob-scroll">
        <header className="ob-head">
          <div className="ob-headrow"><Hand k={k} crew={crew} out={out} /><SoundToggle cls="quiet" /></div>
          <h1 className="ob-say" id="ob-say" ref={h} tabIndex={-1} aria-live="polite">{say}</h1>
          {sub && <p className="ob-sub">{sub}</p>}
        </header>
        <div className="ob-body">{children}</div>
        {how && <div className="ob-how">
          <button aria-expanded={open} onClick={() => setOpen(v => !v)}>How this works</button>
          {open && <p>{how}</p>}
        </div>}
      </div>
      {foot && <footer className="ob-foot">{foot}</footer>}
    </section>
  );
}

const Proto = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <button className="ob-proto" onClick={onClick}><span>Simulate</span>{children}</button>
);

/* ------------------------------------------------------------------ 1. Title: tap to begin (the tap also wakes the audio) */

function Title() {
  const ob = useOb();
  const rm = usePrefersReducedMotion();
  const [ph, setPh] = useState(rm ? 3 : 0); // 0 the ball turns, 1 it settles into the mark, 2 Keep is dealt, 3 Keep waits for the tap
  useEffect(() => {
    if (rm) return;
    const ts = [setTimeout(() => setPh(1), 1350), setTimeout(() => setPh(2), 1800), setTimeout(() => setPh(3), 2500)];
    return () => ts.forEach(clearTimeout);
  }, [rm]);
  const begin = () => { if (soundOn()) unlock(); play('rise'); ob.go('story'); };
  return (
    <div className={`ob-title ph-${ph}`}>
      <button className="t-hit" onClick={begin} aria-label="Later. Tap to begin.">
        <span className="t-stage" aria-hidden="true">
          {!rm && <span className="t-ball"><span className="t-shadow" /><wm-ball variant="upper" state="working" /></span>}
          <span className="t-mark"><wm-horizon variant="lower" state="idle" /></span>
          <span className="t-keep"><Chief state={ph >= 3 ? 'waiting' : 'idle'} size={92} /></span>
        </span>
        <span className="t-hint" aria-hidden="true">Tap to begin</span>
      </button>
      <SoundToggle cls="on-dark" />
    </div>
  );
}

/* ------------------------------------------------------------------ 2. The story: five scenes, one idea each */

type G = 'mail' | 'today' | 'bill' | 'cap' | 'cake' | 'plane';
interface Pos { x: number; y: number; r: number; s: number; o: number; d: number; z?: number }
interface CardS extends Pos { id: number; g: G; tone?: 'a' | 'pop' }
interface ActorS extends Pos { st: MState }

const LINES = [
  'Life sends you a lot.',
  'Keep and the crew sort it.',
  'You only see what needs you.',
  'Not now? Flick it down. It comes back.',
  'Nothing leaves without your yes.',
];
const HINT = ['', '', 'Tap it', '', 'Press and hold'];
const GLYPHS: G[] = ['cap', 'cake', 'plane', 'bill', 'mail', 'today'];
const CREW: AgentId[] = ['wren', 'scout', 'juno', 'ledger'];
const HOLD_MS = 1100;

function Story() {
  const ob = useOb();
  const alive = useAlive();
  const stage = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(0), [H, setH] = useState(0);
  const [scene, setScene] = useState(0);
  const [ready, setReady] = useState(false); // the scene has finished acting; a tap moves on
  const [want, setWant] = useState<null | 'tap' | 'flick' | 'hold'>(null);
  const [cards, setCards] = useState<CardS[]>([]);
  const [keep, setKeep] = useState<ActorS>({ x: -140, y: 0, r: 0, s: 1, o: 1, d: 0, st: 'idle' });
  const [crew, setCrew] = useState<ActorS[]>([]);
  const [line, setLine] = useState(false), [clock, setClock] = useState(false);
  const [held, setHeld] = useState(0); // 0..1 progress of the hold
  const token = useRef(0);

  useLayoutEffect(() => {
    const el = stage.current; if (!el) return;
    const m = () => { setW(el.clientWidth); setH(el.clientHeight); };
    m(); const ro = new ResizeObserver(m); ro.observe(el); return () => ro.disconnect();
  }, []);

  const card = (id: number, p: Partial<CardS>) => setCards(cs => cs.map(c => c.id === id ? { ...c, ...p } : c));
  const sfx = (n: Sfx, step = 0, vol = 1) => play(n, { step, vol });

  /* each scene is a short timeline; a token cancels it if the viewer moves on */
  const act = async (n: number) => {
    const my = ++token.current;
    const ok = () => alive.current && token.current === my;
    const wait = async (ms: number) => { await sleep(ms); return ok(); };
    const cx = W / 2, cy = H * 0.42;
    setReady(false); setWant(null);
    if (n === 0) {
      setKeep({ x: -140, y: cy, r: 0, s: 1, o: 1, d: 0, st: 'idle' }); setCrew([]); setLine(false); setClock(false);
      const from: [number, number][] = [[-70, H * 0.2], [W + 70, H * 0.36], [W * 0.3, -90], [W + 70, H * 0.06], [-70, H * 0.58], [W * 0.72, -90]];
      setCards(GLYPHS.map((g, i) => ({ id: i, g, x: from[i][0], y: from[i][1], r: (i % 2 ? 1 : -1) * 40, s: 1, o: 1, d: 0, z: i })));
      if (!(await wait(240))) return;
      const land = [[-26, 10, -18], [22, -6, 14], [-8, -22, -6], [30, 18, 24], [-34, -10, -28], [6, 6, 8]];
      for (let i = 0; i < 6; i++) {
        card(i, { x: cx + land[i][0], y: cy + land[i][1], r: land[i][2], d: 560 });
        sfx('deal', i);
        if (!(await wait(330))) return;
      }
      if (!(await wait(500))) return;
      setReady(true);
      if (!(await wait(1300))) return;
      setScene(1);
    }
    if (n === 1) {
      // Keep enters, looks, squares the heap, deals one card to each of the crew, and they carry them off
      setCrew([]);
      setCards(cs => cs.map((c, i) => ({ ...c, x: cx + [-26, 22, -8, 30, -34, 6][i], y: cy + [10, -6, -22, 18, -10, 6][i], r: [-18, 14, -6, 24, -28, 8][i], o: 1, s: 1, d: 0, tone: undefined })));
      setKeep({ x: -140, y: cy + 10, r: 0, s: 1, o: 1, d: 0, st: 'idle' });
      if (!(await wait(60))) return;
      setKeep(k => ({ ...k, x: cx - 112, d: 640, st: 'listening' }));
      sfx('tick', -5);
      if (!(await wait(760))) return;
      setKeep(k => ({ ...k, st: 'working' }));
      setCards(cs => cs.map((c, i) => ({ ...c, x: cx + 8, y: cy - i * 3, r: 0, d: 300 })));
      if (!(await wait(300))) return;
      sfx('thup');
      if (!(await wait(380))) return;
      const spots = CREW.map((_, j) => W * (0.16 + j * 0.227));
      setCrew(CREW.map((_, j) => ({ x: spots[j], y: H + 80, r: 0, s: 1, o: 1, d: 0, st: 'idle' })));
      if (!(await wait(40))) return;
      setCrew(cr => cr.map(c => ({ ...c, y: H * 0.86, d: 520 })));
      sfx('rise', -7, 0.6);
      setKeep(k => ({ ...k, st: 'idle' }));
      if (!(await wait(560))) return;
      for (let j = 0; j < 4; j++) {
        card(j, { x: spots[j], y: H * 0.86 - 46, r: (j - 1.5) * 6, s: 0.62, d: 380, z: 10 + j });
        sfx('deal', j + 2);
        if (!(await wait(300))) return;
      }
      setKeep(k => ({ ...k, st: 'done' }));
      if (!(await wait(250))) return;
      for (let j = 0; j < 4; j++) {
        setCrew(cr => cr.map((c, i) => i === j ? { ...c, y: H + 120, d: 520 } : c));
        card(j, { y: H + 80, d: 520 });
        if (!(await wait(140))) return;
      }
      if (!(await wait(520))) return;
      setKeep(k => ({ ...k, st: 'idle' }));
      setReady(true);
      if (!(await wait(1200))) return;
      setScene(2);
    }
    if (n === 2) {
      // Keep keeps two cards; one rises and comes forward. It needs you: tap it.
      setCrew([]);
      setCards(cs => cs.map(c => c.id < 4 ? { ...c, o: 0, d: 0 } : c));
      setKeep(k => ({ ...k, x: W * 0.2, y: H * 0.84, s: 0.85, d: k.x < 0 ? 0 : 600, st: 'idle' }));
      setCards(cs => cs.map(c => c.id >= 4 ? { ...c, x: W * 0.2 + 34 + (c.id - 4) * 6, y: H * 0.84 - 26, r: 10 + (c.id - 4) * 6, s: 0.55, o: 1, d: 600, tone: undefined } : c));
      if (!(await wait(720))) return;
      setKeep(k => ({ ...k, st: 'waiting' }));
      card(4, { x: cx, y: cy, r: 0, s: 1.9, d: 620, tone: 'a', z: 30 });
      sfx('rise');
      if (!(await wait(640))) return;
      setWant('tap');
    }
    if (n === 3) {
      setLine(true);
      setKeep(k => ({ ...k, x: W * 0.16, y: H * 0.68, s: 0.8, d: 560, st: 'idle' }));
      card(4, { o: 0, d: 0 });
      if (!(await wait(560))) return;
      card(5, { x: cx, y: cy - 20, r: 0, s: 1.9, d: 620, z: 31 });
      sfx('rise', 2);
      if (!(await wait(640))) return;
      setWant('flick');
    }
    if (n === 4) {
      setLine(false); setClock(false);
      card(5, { o: 0, d: 0 });
      setKeep(k => ({ ...k, x: W * 0.2, y: H * 0.84, s: 0.85, d: 520, st: 'idle' }));
      setCards(cs => [...cs.filter(c => c.id !== 6), { id: 6, g: 'mail', x: W * 0.2, y: H * 0.8, r: -20, s: 0.4, o: 1, d: 0, z: 40 }]);
      if (!(await wait(560))) return;
      card(6, { x: cx, y: cy, r: 0, s: 1.9, d: 560 });
      sfx('deal');
      if (!(await wait(800))) return;
      // it tries to leave, and stops at the edge
      card(6, { x: W - 70, r: 9, d: 520 });
      sfx('later', 6, 0.5);
      if (!(await wait(520))) return;
      sfx('thup', 0, 0.7);
      setKeep(k => ({ ...k, st: 'waiting' }));
      setWant('hold');
    }
  };
  useEffect(() => { if (W && H) act(scene); }, [scene, W > 0 && H > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  /* the three gestures */
  const tapped = async () => {
    if (want !== 'tap') return;
    setWant(null);
    card(4, { tone: 'pop', d: 200 });
    play('done'); setKeep(k => ({ ...k, st: 'done' }));
    await sleep(520); if (!alive.current) return;
    card(4, { x: keep.x + 30, y: keep.y - 20, s: 0.4, r: -14, o: 0, d: 520 });
    play('deal', { step: 4, vol: 0.6 });
    await sleep(700); if (!alive.current) return;
    setReady(true); setScene(3);
  };
  const flicked = async () => {
    if (want !== 'flick') return;
    setWant(null);
    const lineY = H * 0.72;
    card(5, { y: lineY + 110, s: 1.2, o: 0, r: 4, d: 520 });
    play('later'); setKeep(k => ({ ...k, st: 'rest' }));
    await sleep(540); if (!alive.current) return;
    setClock(true);
    for (let i = 0; i < 4; i++) { await sleep(300); if (!alive.current) return; play('tick', { step: i * 2, vol: 0.5 }); }
    await sleep(200); if (!alive.current) return;
    setClock(false);
    card(5, { y: H * 0.42 - 20, s: 1.9, o: 1, r: 0, tone: 'pop', d: 620 });
    play('back'); setKeep(k => ({ ...k, st: 'done' }));
    await sleep(1100); if (!alive.current) return;
    card(5, { tone: undefined });
    setReady(true); setScene(4);
  };
  const holdRef = useRef<{ raf: number; h: ReturnType<typeof hum>; t0: number } | null>(null);
  const holdStart = () => {
    if (want !== 'hold' || holdRef.current) return;
    const h = hum(HOLD_MS), t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / HOLD_MS); setHeld(p);
      if (p >= 1) { holdRef.current = null; h.done(); holdDone(); return; }
      if (holdRef.current) holdRef.current.raf = requestAnimationFrame(step);
    };
    holdRef.current = { raf: requestAnimationFrame(step), h, t0 };
  };
  const holdStop = () => {
    const s = holdRef.current; if (!s) return;
    cancelAnimationFrame(s.raf); holdRef.current = null; s.h.cancel(); setHeld(0);
  };
  const holdDone = async () => {
    setWant(null); setHeld(0);
    setKeep(k => ({ ...k, st: 'done' }));
    card(6, { tone: 'pop', d: 160 });
    await sleep(420); if (!alive.current) return;
    card(6, { x: W + 160, r: 16, d: 520 });
    play('deal', { step: 5, vol: 0.7 });
    await sleep(1000); if (!alive.current) return;
    ob.go('doors');
  };
  useEffect(() => () => { const s = holdRef.current; if (s) { cancelAnimationFrame(s.raf); s.h.cancel(); } }, []);

  /* flick down on the card (or press it, or the down arrow) */
  const drag = useRef<{ y: number; id: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    if (want === 'hold') { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); holdStart(); return; }
    if (want === 'flick') { drag.current = { y: e.clientY, id: e.pointerId }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || d.id !== e.pointerId) return;
    const dy = Math.max(0, e.clientY - d.y);
    const el = e.currentTarget as HTMLElement; el.style.translate = `0 ${dy}px`;
    if (dy > 70) { drag.current = null; el.style.translate = ''; flicked(); }
  };
  const onUp = (e: React.PointerEvent) => {
    if (want === 'hold') { holdStop(); return; }
    const d = drag.current; drag.current = null;
    const el = e.currentTarget as HTMLElement;
    if (d) { const dy = e.clientY - d.y; el.style.translate = ''; if (dy < 8) flicked(); }
  };

  const next = () => { if (want) return; if (scene < 2) setScene(scene + 1); };
  const interactive = (id: number) => (want === 'tap' && id === 4) || (want === 'flick' && id === 5) || (want === 'hold' && id === 6);

  return (
    <section className="ob-story" aria-labelledby="st-say">
      <header className="st-top">
        <span className="st-hand" role="img" aria-label={`Scene ${scene + 1} of 5`}>
          {LINES.map((_, i) => <i key={i} className={i <= scene ? 'on' : ''} style={{ ['--i' as string]: i } as CSSProperties} />)}
        </span>
        <span className="st-tools"><SoundToggle cls="quiet" /><button className="btn quiet sm" onClick={() => ob.go('doors')}>Skip</button></span>
      </header>
      <h1 className="st-say" id="st-say" aria-live="polite" key={scene}>{LINES[scene]}</h1>
      <div className={`st-stage ${ready && scene < 2 ? 'tappable' : ''}`} ref={stage} onClick={next}>
        {line && <div className="st-line" style={{ top: H * 0.72 }} aria-hidden="true" />}
        {clock && <div className="st-clock" style={{ left: W / 2, top: H * 0.72 + 44 }} aria-hidden="true"><i /></div>}
        {crew.map((c, j) => (
          <span key={j} className="st-actor" aria-hidden="true" style={{ transform: `translate(${c.x}px, ${c.y}px) scale(${c.s})`, transitionDuration: `${c.d}ms` }}>
            <Crew who={CREW[j]} size={50} state={c.st} />
          </span>
        ))}
        <span className="st-actor st-keep" aria-hidden="true" style={{ transform: `translate(${keep.x}px, ${keep.y}px) scale(${keep.s})`, transitionDuration: `${keep.d}ms` }}>
          <Chief state={keep.st} size={92} />
        </span>
        {cards.map(c => {
          const live = interactive(c.id);
          return (
            <button key={c.id} tabIndex={live ? 0 : -1} aria-hidden={!live}
              aria-label={live ? (want === 'tap' ? 'The card that needs you. Tap it' : want === 'flick' ? 'Flick this card down to later' : 'Press and hold to let this card go') : undefined}
              className={`st-card ${c.tone ?? ''} ${live ? 'live ' + want : ''}`}
              style={{ transform: `translate(${c.x}px, ${c.y}px) rotate(${c.r}deg) scale(${c.s})`, opacity: c.o, transitionDuration: `${c.d}ms`, zIndex: c.z, ['--held' as string]: c.id === 6 ? held : 0 } as CSSProperties}
              onClick={e => { e.stopPropagation(); if (want === 'tap' && c.id === 4) tapped(); }}
              onPointerDown={live ? onDown : undefined} onPointerMove={live ? onMove : undefined} onPointerUp={live ? onUp : undefined} onPointerCancel={live ? onUp : undefined}
              onKeyDown={e => {
                if (!live) return;
                if (want === 'flick' && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); flicked(); }
                if (want === 'hold' && (e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); holdStart(); }
              }}
              onKeyUp={e => { if (want === 'hold' && (e.key === ' ' || e.key === 'Enter')) holdStop(); }}>
              <Icon name={c.tone === 'pop' ? 'check' : c.g} size={22} stroke={1.9} />
              {c.id === 6 && <svg className="st-ring" viewBox="0 0 100 100" aria-hidden="true"><rect x="3" y="3" width="94" height="94" rx="18" pathLength="100" /></svg>}
            </button>
          );
        })}
        {want && HINT[scene] && <p className="st-hint" aria-hidden="true">{HINT[scene]}</p>}
        {want === 'flick' && <p className="st-hint" aria-hidden="true"><Icon name="sink" size={20} /></p>}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 3. Two doors */

function Doors() {
  const ob = useOb();
  const [open, setOpen] = useState(false);
  return (
    <section className="ob-scene ob-doors" aria-labelledby="ob-say">
      <div className="ob-scroll">
        <div className="doors-top"><SoundToggle cls="quiet" /></div>
        <div className="doors-art" aria-hidden="true">
          <span className="door-keep"><Chief state="idle" size={84} /></span>
          {CREW.map((w, j) => <span key={w} className={`door-card d${j + 1}`}><Crew who={w} size={50} /></span>)}
        </div>
        <h1 className="ob-say big" id="ob-say">It runs in your own account, not ours.</h1>
        <div className="ob-how center">
          <button aria-expanded={open} onClick={() => setOpen(v => !v)}>How this works</button>
          {open && <p>Later lives in your Cloudflare account and uses your own Anthropic key. We never see your mail.</p>}
        </div>
      </div>
      <footer className="ob-foot">
        <button className="btn primary block" onClick={() => { ob.setPath('new'); ob.go('computer'); }}>Set up mine</button>
        <button className="btn block" onClick={() => { ob.setPath('returning'); ob.go('computer'); }}>I already have Later</button>
        <button className="btn quiet block sm" onClick={() => ob.toApp('skip')}>Look around first</button>
      </footer>
    </section>
  );
}

/* ------------------------------------------------------------------ 4. On your computer, then pair (one screen) */

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

const CREDIT = 100_000_000, CAP = 60_000_000; // integer micro-USD

function Computer() {
  const ob = useOb();
  const alive = useAlive();
  const back = ob.path === 'returning';
  // new: wait for the installer to make your home, then it shows a code. returning: the code is already on your other device.
  const [phase, setPhase] = useState<'wait' | 'quiet' | 'code' | 'scan' | 'expired' | 'paired'>(back ? 'code' : 'wait');
  const phoneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ob.take('computer-done')) setPhase('code');
    if (ob.take('computer-quiet')) setPhase('quiet');
  }, [ob.sim?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (phase === 'code') play('rise', { step: -3 }); }, [phase]);
  const scan = async () => {
    setPhase('scan');
    await sleep(1500); if (!alive.current) return;
    if (ob.take('code-expired')) { setPhase('expired'); return; }
    setPhase('paired');
  };
  useLayoutEffect(() => {
    if (phase !== 'paired') return;
    const cards = phoneRef.current?.querySelectorAll<HTMLElement>('.ph-card');
    cards?.forEach((c, j) => dealFrom(c, { delay: 240 + j * 180, dur: 600 }));
    setTimeout(() => play('done'), 240 + (cards?.length ?? 1) * 180 + 420);
    if (!back) ob.place('ledger', 'Spend');
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const k: MState = phase === 'quiet' || phase === 'expired' ? 'error' : phase === 'paired' ? 'done' : phase === 'scan' ? 'listening' : phase === 'code' ? 'waiting' : 'thinking';
  const say = {
    wait: 'Set this up on a computer.', quiet: 'Your computer has gone quiet.', code: back ? 'Scan the code from your Later.' : 'Your home is ready. Scan its code.',
    scan: 'Reading the code.', expired: 'That code has expired.', paired: 'This phone is paired.',
  }[phase];
  const sub = {
    wait: 'Open the address there, then type the code.', quiet: 'Run the installer again. It picks up where it left off.',
    code: back ? 'Settings, then Add a phone, on any paired device.' : 'Your computer is showing it now.', scan: '',
    expired: 'Show a new code, then scan again.', paired: back ? 'Your crew is already at work.' : <><b className="num">{usd(CREDIT).replace('.00', '')}</b> of credit, capped at <b className="num">{usd(CAP).replace('.00', '')}</b>.</>,
  }[phase];
  const who: AgentId[] = back ? CREW : ['ledger'];
  return (
    <Scene k={k} cls="ob-computer" say={say} sub={sub || undefined}
      how={phase === 'wait' ? 'The installer puts Later in your own Cloudflare account and locks your Anthropic key there. As soon as your home exists it shows a code, and this phone pairs.' : undefined}
      foot={phase === 'wait' ? <Proto onClick={() => setPhase('code')}>Home created</Proto>
        : phase === 'quiet' ? <button className="btn primary block" onClick={() => setPhase('wait')}>I’ve run it again</button>
          : phase === 'code' ? <button className="btn primary block" onClick={scan}>Scan the code</button>
            : phase === 'expired' ? <button className="btn primary block" onClick={scan}>Scan again</button>
              : phase === 'paired' ? <button className="btn primary block" onClick={() => back ? ob.toApp('pair') : ob.go('mail')}>{back ? 'Open Today' : 'Carry on'}</button>
                : <button className="btn block" disabled>Reading the code</button>}>
      {(phase === 'wait' || phase === 'quiet') && (
        <div className="laptop" role="img" aria-label="On your computer, open later.sh/go and type K4Q 72R">
          <div className="lap-screen">
            <div className="lap-body">
              <strong className="lap-url">later.sh/go</strong>
              <span className="lap-code code">K4Q 72R</span>
            </div>
          </div>
          <span className="lap-base" />
        </div>
      )}
      {(phase === 'code' || phase === 'scan' || phase === 'expired') && (
        <div className={`viewfinder ${phase}`} role="img" aria-label={phase === 'expired' ? 'An expired code' : 'The code on your computer'}>
          <span className="vf-screen"><QrCode />{phase === 'expired' && <span className="vf-x"><Icon name="close" size={40} stroke={2.4} /></span>}</span>
          <i className="c tl" /><i className="c tr" /><i className="c bl" /><i className="c br" />
          {phase === 'scan' && <span className="vf-line" />}
          <span className="vf-peek"><Chief state={phase === 'expired' ? 'error' : 'listening'} size={100} /></span>
        </div>
      )}
      {phase === 'paired' && (
        <div className="paired" ref={phoneRef}>
          <div className="ph-outline" aria-hidden="true">
            <span className="ph-island" />
            <div className="ph-cards">{who.map(w => <span key={w} className="ph-card"><Crew who={w} size={back ? 40 : 58} state="done" /></span>)}</div>
          </div>
        </div>
      )}
    </Scene>
  );
}

/* ------------------------------------------------------------------ 5. Mail: one path, three small lines, one field */

const GOOD_PW = 'abcd efgh ijkl mnop';

function Mail() {
  const ob = useOb();
  const alive = useAlive();
  const [st, setSt] = useState<'idle' | 'checking' | 'ok' | 'bad'>(ob.mail ? 'ok' : 'idle');
  const [pw, setPw] = useState('');
  const pwRef = useRef<HTMLInputElement>(null), crewRef = useRef<HTMLSpanElement>(null), cardRef = useRef<HTMLDivElement>(null);
  const go = async () => {
    setSt('checking');
    await sleep(1200); if (!alive.current) return;
    if (ob.take('wrong-password') || pw.replace(/\s/g, '').length !== 16) { setSt('bad'); return; }
    setSt('ok'); ob.setConn('mail', true);
  };
  useLayoutEffect(() => {
    if (st !== 'ok') return;
    ob.place('wren', 'Mail');
    dealFrom(crewRef.current).then(() => { flashDone(cardRef.current); play('done'); });
    const t = setTimeout(() => alive.current && ob.go('calendar'), 1900);
    return () => clearTimeout(t);
  }, [st]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Scene k={st === 'bad' ? 'error' : st === 'checking' ? 'thinking' : st === 'ok' ? 'done' : 'waiting'} cls="ob-mail"
      say={st === 'bad' ? 'Google said no to that password.' : st === 'ok' ? 'Mail connected.' : 'Connect your mail.'}
      sub={st === 'bad' ? 'Paste the 16 letters again.' : st === 'ok' ? 'Wren reads it. Nothing is sent without you.' : 'Gmail, stored in your own account.'}
      how="Google makes a separate password just for Later. You can delete it in your Google account at any time. Other ways in: your own Google connection (advanced), or later a connection service, which would see your mail."
      foot={st === 'bad'
        ? <button className="btn primary block" onClick={() => { setPw(''); setSt('idle'); setTimeout(() => pwRef.current?.focus(), 0); }}>Paste again</button>
        : st === 'ok' ? null
          : <><button className="btn primary block" disabled={!pw || st === 'checking'} onClick={go}>{st === 'checking' ? 'Connecting' : 'Connect'}</button>
              <button className="btn quiet block sm" onClick={() => ob.go('calendar')}>Skip for now</button></>}>
      <div ref={cardRef} className={`conn ${st}`}>
        {st === 'ok'
          ? <div className="conn-done"><span ref={crewRef}><Crew who="wren" size={52} state="idle" /></span><Icon name="mail" size={22} /></div>
          : <>
            <ol className="mini-steps">
              <li><span className="n">1</span>Turn on 2-Step Verification</li>
              <li><span className="n">2</span>Make an app password</li>
              <li><span className="n">3</span>Paste it here</li>
            </ol>
            <label className="fld"><span className="sr">App password</span>
              <span className="fld-row"><input ref={pwRef} id="ob-pw" className="code" value={pw} onChange={e => { setPw(e.target.value); if (st === 'bad') setSt('idle'); }} placeholder="xxxx xxxx xxxx xxxx" autoComplete="off" spellCheck={false} aria-invalid={st === 'bad'} />
                <button className="btn sm" onClick={() => { setPw(GOOD_PW); if (st === 'bad') setSt('idle'); }}>Paste</button></span>
            </label>
          </>}
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 6. Calendar: one field, skippable */

function Calendar() {
  const ob = useOb();
  const alive = useAlive();
  const [st, setSt] = useState<'idle' | 'checking' | 'ok'>(ob.cal ? 'ok' : 'idle');
  const [link, setLink] = useState('');
  const crewRef = useRef<HTMLSpanElement>(null), cardRef = useRef<HTMLDivElement>(null);
  const go = async () => { setSt('checking'); await sleep(1000); if (!alive.current) return; setSt('ok'); ob.setConn('cal', true); };
  useLayoutEffect(() => {
    if (st !== 'ok') return;
    ob.place('scout', 'Calendar');
    dealFrom(crewRef.current).then(() => { flashDone(cardRef.current); play('done'); });
    const t = setTimeout(() => alive.current && ob.go('extras'), 1900);
    return () => clearTimeout(t);
  }, [st]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Scene k={st === 'checking' ? 'thinking' : st === 'ok' ? 'done' : 'idle'} cls="ob-cal"
      say={st === 'ok' ? 'Calendar added.' : 'Add your calendar.'} sub={st === 'ok' ? 'Scout reads it for meeting briefs.' : 'Paste its private link. Read only.'}
      how="In Google Calendar, open Settings, choose your calendar and copy “Secret address in iCal format”."
      foot={st === 'ok' ? null : <>
        <button className="btn primary block" disabled={!link || st === 'checking'} onClick={go}>{st === 'checking' ? 'Adding' : 'Add calendar'}</button>
        <button className="btn block" onClick={() => ob.go('extras')}>Skip</button></>}>
      <div ref={cardRef} className={`conn ${st}`}>
        {st === 'ok'
          ? <div className="conn-done"><span ref={crewRef}><Crew who="scout" size={52} /></span><Icon name="today" size={22} /></div>
          : <label className="fld"><span className="sr">Calendar link</span><span className="fld-row">
              <input id="ob-ical" className="code" value={link} onChange={e => setLink(e.target.value)} placeholder="https://calendar.google.com/…" autoComplete="off" spellCheck={false} />
              <button className="btn sm" onClick={() => setLink('https://calendar.google.com/calendar/ical/example/basic.ics')}>Paste</button></span></label>}
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 7. Anything else: a plain list to tick */

const SCHOOL = ['Procare', 'Brightwheel', 'ClassDojo', 'Seesaw', 'ParentSquare'];

function Extras() {
  const ob = useOb();
  const [picked, setPicked] = useState<string[]>(ob.byEmail ? [ob.byEmail] : []);
  const had = useRef(picked.length > 0);
  const listRef = useRef<HTMLUListElement>(null);
  useLayoutEffect(() => {
    if (picked.length && !had.current) { had.current = true; ob.place('juno', 'School'); }
    if (picked.length) ob.setByEmail(picked[0]);
  }, [picked]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Scene k={picked.length ? 'done' : 'idle'} cls="ob-extras" say="Anything else?" sub="School and daycare apps come in by the emails they send you."
      foot={<button className={`btn ${picked.length ? 'primary' : ''} block`} onClick={() => ob.go('reading')}>{picked.length ? 'Next' : 'Skip'}</button>}>
      <ul className="ticks" ref={listRef}>
        {SCHOOL.map(s => {
          const on = picked.includes(s);
          return (
            <li key={s}><button aria-pressed={on} disabled={!ob.mail} onClick={() => { setPicked(p => on ? p.filter(x => x !== s) : [...p, s]); if (!on) play('tick', { step: picked.length * 2 }); }}>
              <span className="box">{on && <Icon name="check" size={15} stroke={2.4} />}</span>{s}</button></li>
          );
        })}
      </ul>
      {!ob.mail && <p className="ob-fine">This works through your mail, so connect mail first.</p>}
    </Scene>
  );
}

/* ------------------------------------------------------------------ 8. Keep reads: the crew working, the meter, nothing else */

const PASS_CAP = 1_000_000, PASS_USED = 420_000; // micro-USD
const PASS_MS = 9000;
const PILE_G = ['house', 'cap', 'cake', 'receipt'] as const;

function Reading() {
  const ob = useOb();
  const alive = useAlive();
  const [t, setT0] = useState(0);
  const start = useRef(performance.now());
  const done = t >= 1;
  useEffect(() => {
    if (done) return;
    const i = setInterval(() => setT0(Math.min(1, (performance.now() - start.current) / PASS_MS)), 120);
    return () => clearInterval(i);
  }, [done]);
  useEffect(() => { if (ob.take('learn-finish')) setT0(1); }, [ob.sim?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  const dealt = Math.round(t * 16);
  const counts = PILE_G.map((_, j) => Math.floor((dealt + 3 - j) / 4));
  const used = Math.round((PASS_USED * t) / 10_000) * 10_000;
  const pileRef = useRef<HTMLDivElement>(null);
  const last = useRef(0);
  useLayoutEffect(() => {
    if (dealt <= last.current) return;
    for (let d = last.current; d < dealt; d++) {
      const el = pileRef.current?.querySelectorAll<HTMLElement>('.rpile')[d % 4]?.querySelector<HTMLElement>('.rp-top');
      dealFrom(el, { dur: 440, spin: -30, from: pileRef.current?.querySelector('.r-keep svg'), quiet: d % 2 === 1 });
    }
    last.current = dealt;
  }, [dealt]);
  useEffect(() => {
    if (!done) return;
    play('done');
    const t = setTimeout(() => alive.current && ob.go('found'), 1500);
    return () => clearTimeout(t);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Scene k={done ? 'done' : 'working'} crew={done ? 'done' : 'working'} cls="ob-reading"
      say={done ? 'Done.' : 'Keep is reading.'} sub="Newest first. Nothing is sent or deleted."
      foot={done ? null : <Proto onClick={() => setT0(1)}>Finish reading</Proto>}>
      <div className="r-table" ref={pileRef}>
        <span className="r-keep" aria-hidden="true"><Chief state={done ? 'done' : 'working'} size={88} /></span>
        <div className="r-piles" aria-hidden="true">
          {PILE_G.map((g, j) => (
            <div key={g} className={`rpile ${counts[j] ? 'has' : ''}`} style={{ ['--n' as string]: Math.min(3, Math.max(0, counts[j] - 1)) } as CSSProperties}>
              <span className="rp-edges"><i /><i /><i /></span>
              <span className="rp-top"><Icon name={g} size={18} /></span>
            </div>
          ))}
        </div>
      </div>
      <div className="meter-row">
        <div><b className="num">{usd(used)}</b> of {usd(PASS_CAP)}</div>
        <div className="meter" role="progressbar" aria-label="First reading, spend against its cap" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((used / PASS_CAP) * 100)}>
          <i className="m-used" style={{ width: `${(used / PASS_CAP) * 100}%` }} />
        </div>
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 9. What Keep found: Spaces to keep or flick away */

const PROPOSED: { id: string; name: string; glyph: 'house' | 'cap' | 'cake' | 'receipt'; who: AgentId }[] = [
  { id: 'house', name: 'House move', glyph: 'house', who: 'scout' },
  { id: 'school', name: 'School', glyph: 'cap', who: 'juno' },
  { id: 'party', name: 'A birthday', glyph: 'cake', who: 'wren' },
  { id: 'tax', name: 'Taxes', glyph: 'receipt', who: 'ledger' },
];
const FACTS = [['You', 'Sam'], ['At home', 'Alex, and a child'], ['Moving', 'Exchange in November']];

function Found() {
  const ob = useOb();
  const alive = useAlive();
  const [gone, setGone] = useState<string[]>([]);
  const [phase, setPhase] = useState<'check' | 'dealing' | 'dealt'>('check');
  const [dealt, setDealt] = useState<string[]>([]);
  const [facts, setFacts] = useState(false);
  const deskRef = useRef<HTMLDivElement>(null);
  const kept = PROPOSED.filter(p => !gone.includes(p.id));
  const deal = async () => {
    setPhase('dealing');
    for (const p of kept) { await sleep(reducedMotion() ? 150 : 380); if (!alive.current) return; setDealt(d => [...d, p.id]); }
    await sleep(700); if (!alive.current) return;
    play('done'); setPhase('dealt');
    await sleep(1300); if (!alive.current) return;
    ob.go('deck');
  };
  useLayoutEffect(() => {
    const id = dealt[dealt.length - 1]; if (!id) return;
    const el = deskRef.current?.querySelector<HTMLElement>(`[data-sp="${id}"] .sp-crew`);
    dealFrom(el, { dur: 560, spin: -28, delay: 0 }).then(() => flashDone(el?.closest('.sp-face') as HTMLElement));
  }, [dealt]);
  /* flick a pile away */
  const drag = useRef<{ id: string; x: number; p: number; on: boolean } | null>(null);
  const down = (id: string) => (e: React.PointerEvent) => { if (phase !== 'check' || (e.target as HTMLElement).closest('button')) return; drag.current = { id, x: e.clientX, p: e.pointerId, on: false }; };
  const move = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || d.p !== e.pointerId) return;
    const dx = e.clientX - d.x; if (!d.on && Math.abs(dx) < 6) return;
    const el = e.currentTarget as HTMLElement;
    if (!d.on) { d.on = true; el.setPointerCapture(e.pointerId); }
    setT(el, { x: dx, r: dx / 30 }); el.style.opacity = String(1 - Math.min(0.6, Math.abs(dx) / 300));
  };
  const up = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null; if (!d || !d.on) return;
    const el = e.currentTarget as HTMLElement, dx = e.clientX - d.x;
    if (Math.abs(dx) > 80) { el.style.transform = ''; el.style.opacity = ''; setGone(g => [...g, d.id]); play('later', { vol: 0.6 }); return; }
    spring({ x: dx, r: dx / 30 }, { x: 0, r: 0 }, {}, { k: 520, c: 24 }, v => setT(el, v), () => { el.style.transform = ''; el.style.opacity = ''; });
  };
  return (
    <Scene k={phase === 'dealt' ? 'done' : phase === 'dealing' ? 'idle' : 'waiting'} out={phase === 'dealing'} cls="ob-found"
      say={phase === 'check' ? `Keep found ${kept.length} Space${kept.length === 1 ? '' : 's'}.` : 'The crew are on them.'}
      sub={phase === 'check' ? 'Keep the ones you want. Flick the rest away.' : undefined}
      foot={phase === 'check' ? <>
        <button className="btn primary block" disabled={!kept.length} onClick={deal}>Keep these</button>
        <button className="btn quiet block sm" aria-expanded={facts} onClick={() => setFacts(v => !v)}>See what I gathered</button></> : null}>
      <div className="sp-desk" ref={deskRef}>
        {PROPOSED.map(p => gone.includes(p.id) ? (
          <div key={p.id} className="sp-gone"><span>Not a Space</span><button onClick={() => setGone(g => g.filter(x => x !== p.id))}>Undo</button></div>
        ) : (
          <div key={p.id} data-sp={p.id} className="sp-stack" style={{ ['--n' as string]: 2 } as CSSProperties} onPointerDown={down(p.id)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
            <span className="sp-edges" aria-hidden="true"><i /><i /><i /></span>
            <div className="sp-face">
              <span className="glyph"><Icon name={p.glyph} size={16} /></span>
              <b>{p.name}</b>
              {dealt.includes(p.id) ? <span className="sp-crew"><Crew who={p.who} size={36} state={phase === 'dealt' ? 'working' : 'idle'} /></span>
                : phase === 'check' ? <button className="sp-x" aria-label={`Not a Space: ${p.name}`} onClick={() => { setGone(g => [...g, p.id]); play('later', { vol: 0.6 }); }}><Icon name="close" size={14} /></button> : null}
            </div>
          </div>
        ))}
      </div>
      {facts && phase === 'check' && (
        <dl className="ob-facts">
          {FACTS.map(([k, v]) => <div key={k} className="fact"><dt>{k}</dt><dd><input id={`ob-fact-${k}`} defaultValue={v} aria-label={`Correct ${k}`} /></dd></div>)}
        </dl>
      )}
    </Scene>
  );
}

/* ------------------------------------------------------------------ 10. Your first deck is dealt */

function Deck() {
  const ob = useOb();
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState<MState>('idle');
  useLayoutEffect(() => {
    const els = box.current?.querySelectorAll<HTMLElement>('.ho-card');
    els && [...els].reverse().forEach((el, j) => dealFrom(el, { delay: 300 + j * 280, dur: 640, spin: -18 }));
    const t = setTimeout(() => { setK('done'); play('done'); }, reducedMotion() ? 300 : 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <Scene k={k} cls="ob-deck" say="Your first deck." sub="Three things. The rest can wait."
      foot={<button className="btn primary block" onClick={() => ob.toApp('handover')}>Open Today</button>}>
      <div className="ho-deck" ref={box} aria-hidden="true">
        {(['mail', 'today', 'bill'] as const).map((g, j) => (
          <div key={g} className="ho-card bezel" style={{ ['--j' as string]: j } as CSSProperties}><Icon name={g} size={30} stroke={1.6} /></div>
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
  title: Title, story: Story, doors: Doors, computer: Computer, mail: Mail, calendar: Calendar, extras: Extras, reading: Reading, found: Found, deck: Deck,
};

export function Onboard() {
  const ob = useOb();
  const View = VIEWS[ob.step];
  return (
    <div className={`onboard st-${ob.step}`}>
      <View key={`${ob.run}-${ob.step}`} />
    </div>
  );
}
