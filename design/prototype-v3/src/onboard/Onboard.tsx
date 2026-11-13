import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import '../brand';
import { AGENTS, DECK0, space, type AgentId, type Glyph } from '../data';
import { Icon } from '../icons';
import { Chief, Crew, type MState } from '../Mascot';
import { HoldButton } from '../Hold';
import { reducedMotion, spring, setT, usePrefersReducedMotion } from '../motion';
import { useOb, type Step } from './flow';

/* ------------------------------------------------------------------ helpers */

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
function useAlive() {
  const r = useRef(true);
  useEffect(() => { r.current = true; return () => { r.current = false; }; }, []);
  return r;
}
const keepEl = () => document.querySelector('.ob-scene .ob-keep svg, .ob-title .t-keep svg') as HTMLElement | null;

/** Dealing means assigning: the element flies in from Keep, turning as a dealt card does, and lands with one overshoot. */
function dealFrom(el: HTMLElement | null | undefined, opts: { delay?: number; dur?: number; from?: Element | null; spin?: number } = {}) {
  const src = (opts.from ?? keepEl())?.getBoundingClientRect();
  if (!el || !src || reducedMotion()) return Promise.resolve();
  const r = el.getBoundingClientRect();
  const dx = src.left + src.width / 2 - (r.left + r.width / 2), dy = src.top + src.height / 2 - (r.top + r.height / 2);
  const sc = Math.max(0.12, Math.min(0.6, src.width / Math.max(1, r.width)));
  const spin = opts.spin ?? -16;
  return el.animate([
    { transform: `translate(${dx}px, ${dy}px) scale(${sc}) rotate(${spin}deg)`, opacity: 0.4 },
    { transform: `translate(0, -8px) scale(1.03) rotate(${-spin * 0.06}deg)`, opacity: 1, offset: 0.74 },
    { transform: 'none', opacity: 1 },
  ], { duration: opts.dur ?? 640, delay: opts.delay ?? 0, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' }).finished.catch(() => {});
}
/** Rising means it needs you: from behind and below, on the app's spring. */
function rise(el: HTMLElement | null | undefined) {
  if (!el) return;
  setT(el, { y: 26, s: 0.94 });
  spring({ y: 26, s: 0.94 }, { y: 0, s: 1 }, {}, { k: 430, c: 18 }, v => setT(el, v), () => { el.style.transform = ''; });
}
/** The citrus flash: done. */
const flashDone = (el: HTMLElement | null | undefined) => {
  if (!el || reducedMotion()) return;
  el.animate([{ boxShadow: '0 0 0 0 var(--pop)' }, { boxShadow: '0 0 0 5px var(--pop)', offset: 0.2 }, { boxShadow: '0 0 0 0 transparent' }], { duration: 1200, easing: 'ease-out' });
};
const usd = (micro: number) => '$' + (micro / 1_000_000).toFixed(micro % 10_000 === 0 ? 2 : 3);

/* ------------------------------------------------------------------ Keep's hand: the progress of set-up */

/** Keep, with the crew it has dealt so far fanned out beside it. The hand grows as set-up goes on;
    there is no row of dots. Each crew card is labelled with what it was dealt to. */
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
    <div className="ob-hand" role="img" aria-label={n ? `Keep, with ${ob.placed.map(p => `${AGENTS[p.who].name} on ${p.on}`).join(', ')}` : 'Keep'}>
      <span className="ob-keep"><Chief state={k} size={56} out={out} /></span>
      {n > 0 && (
        <span className="ob-fan" ref={box} aria-hidden="true">
          {ob.placed.map((p, i) => (
            <span key={p.who} className="ob-pc" data-who={p.who} style={{ ['--i' as string]: i } as CSSProperties}>
              <Crew who={p.who} size={34} state={crew} />
              <small><b>{AGENTS[p.who].name}</b>{p.on}</small>
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

function Scene({ k, say, sub, children, foot, cls = '', crew, out, aside }: {
  k: MState; say: ReactNode; sub?: ReactNode; children?: ReactNode; foot?: ReactNode; cls?: string; crew?: MState; out?: boolean; aside?: ReactNode;
}) {
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (document.activeElement && document.activeElement !== document.body && !document.activeElement.closest('.phone')) return; h.current?.focus({ preventScroll: true }); }, []);
  return (
    <section className={`ob-scene ${cls}`} aria-labelledby="ob-say">
      <div className="ob-scroll">
        <header className="ob-head">
          <div className="ob-headrow"><Hand k={k} crew={crew} out={out} />{aside}</div>
          <h1 className="ob-say" id="ob-say" ref={h} tabIndex={-1} aria-live="polite">{say}</h1>
          {sub && <p className="ob-sub">{sub}</p>}
        </header>
        <div className="ob-body">{children}</div>
      </div>
      {foot && <footer className="ob-foot">{foot}</footer>}
    </section>
  );
}

/** Prototype-only control, drawn so it cannot be mistaken for the product. */
const Proto = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <button className="ob-proto" onClick={onClick}><span>Simulate</span>{children}</button>
);

/* ------------------------------------------------------------------ 1. Title */

function Title() {
  const ob = useOb();
  const rm = usePrefersReducedMotion();
  const [ph, setPh] = useState(rm ? 3 : 0); // 0 the ball turns, 1 it settles into the mark, 2 Keep is dealt, 3 the line
  const next = () => ob.go('demo');
  useEffect(() => {
    const ts = rm ? [setTimeout(next, 3400)]
      : [setTimeout(() => setPh(1), 1350), setTimeout(() => setPh(2), 1800), setTimeout(() => setPh(3), 2500), setTimeout(next, 3700)];
    return () => ts.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <button className={`ob-title ph-${ph}`} onClick={next} aria-label="Later. It keeps what can wait and deals you what can’t. Tap to start.">
      <span className="t-stage" aria-hidden="true">
        {!rm && <span className="t-ball"><span className="t-shadow" /><wm-ball variant="upper" state="working" /></span>}
        <span className="t-mark"><wm-horizon variant="lower" state="idle" /></span>
        <span className="t-keep"><Chief state="idle" size={92} /></span>
        <span className="t-line">Later keeps what can wait,<br />and deals you what can’t.</span>
      </span>
      <span className="t-hint" aria-hidden="true">Tap to start</span>
    </button>
  );
}

/* ------------------------------------------------------------------ 2. The instant sell: four cards, sample data */

type Beat = 'hold' | 'crew' | 'working' | 'back' | 'later' | 'sunk' | 'returned' | 'lot';
const DAYS = ['Fri 14:02', 'Sat', 'Sun', 'Mon 09:00'];

function Demo() {
  const ob = useOb();
  const alive = useAlive();
  const [beat, setBeat] = useState<Beat>('hold');
  const [card, setCard] = useState(0); // which sample card is on top
  const [held, setHeld] = useState(false);
  const [day, setDay] = useState(0);
  const [home, setHome] = useState(true); // Juno is back in Keep's hand
  const cardRef = useRef<HTMLDivElement>(null);
  const junoRef = useRef<HTMLSpanElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  // each new card is dealt from Keep (the first) or rises from the stack (the rest)
  useLayoutEffect(() => {
    const el = cardRef.current; if (!el) return;
    if (card === 0) {
      el.parentElement?.querySelectorAll<HTMLElement>('.deck-edge').forEach((e, j, all) => dealFrom(e, { delay: 120 + (all.length - 1 - j) * 140, dur: 620 }));
      dealFrom(el, { delay: 420, dur: 720 });
    } else rise(el);
  }, [card]);

  const leaveUp = async () => {
    const el = cardRef.current; if (!el) return;
    flashDone(el.querySelector('.well') as HTMLElement);
    await sleep(reducedMotion() ? 250 : 520);
    if (!reducedMotion()) await el.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-80px) scale(.95)', opacity: 0 }], { duration: 300, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }).finished.catch(() => {});
  };

  const onHeld = async () => {
    if (busy.current) return; busy.current = true;
    setHeld(true);
    await leaveUp(); if (!alive.current) return;
    setHeld(false); setCard(1); setBeat('crew'); busy.current = false;
  };
  const toJuno = async () => {
    if (busy.current) return; busy.current = true;
    setBeat('working'); setHome(false);
    await sleep(30); if (!alive.current) return;
    await dealFrom(junoRef.current, { dur: 620, spin: -24 });
    await sleep(2300); if (!alive.current) return;
    setBeat('back');
    flashDone(cardRef.current?.querySelector('.well') as HTMLElement);
    await sleep(1100); if (!alive.current) return;
    // the crew card goes back into Keep's hand
    const j = junoRef.current, kk = keepEl();
    if (j && kk && !reducedMotion()) {
      const a = j.getBoundingClientRect(), c = kk.getBoundingClientRect();
      await j.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${(c.left + c.width / 2 - a.left - a.width / 2) * 0.5}px, ${(c.top - a.top) * 0.5 - 40}px) rotate(-18deg) scale(.9)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${c.left + c.width / 2 - a.left - a.width / 2}px, ${c.top + c.height / 2 - a.top - a.height / 2}px) rotate(-8deg) scale(.4)`, opacity: 0 }],
        { duration: 720, easing: 'cubic-bezier(.5,0,.4,1)', fill: 'forwards' }).finished.catch(() => {});
    }
    if (!alive.current) return;
    setHome(true);
    await sleep(900); if (!alive.current) return;
    await leaveUp(); if (!alive.current) return;
    setCard(2); setBeat('later'); busy.current = false;
  };
  const sink = async (from?: { x: number; y: number; r: number }) => {
    if (busy.current) return; busy.current = true;
    const el = cardRef.current, strip = stripRef.current;
    if (el && strip && !reducedMotion()) {
      const a = el.getBoundingClientRect(), b = strip.getBoundingClientRect();
      const f = from ?? { x: 0, y: 0, r: 0 };
      await el.animate([
        { transform: `translate(${f.x}px, ${f.y}px) rotate(${f.r}deg)`, opacity: 1 },
        { transform: `translate(0px, ${b.top - a.top + 4}px) scale(.62)`, opacity: 0 },
      ], { duration: 520, easing: 'cubic-bezier(.5,0,.4,1)', fill: 'forwards' }).finished.catch(() => {});
    }
    if (!alive.current) return;
    setBeat('sunk'); setDay(0);
    for (let i = 1; i < DAYS.length; i++) { await sleep(700); if (!alive.current) return; setDay(i); }
    await sleep(650); if (!alive.current) return;
    setBeat('returned');
    busy.current = false;
  };
  useLayoutEffect(() => {
    if (beat !== 'returned') return;
    const el = cardRef.current, strip = stripRef.current;
    if (!el) return;
    el.style.opacity = '';
    if (strip && !reducedMotion()) {
      const a = el.getBoundingClientRect(), b = strip.getBoundingClientRect();
      el.animate([{ transform: `translate(0, ${b.top - a.top}px) scale(.62)`, opacity: 0 }, { transform: 'translateY(-10px) scale(1.02)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }],
        { duration: 680, easing: 'cubic-bezier(.2,.9,.3,1)' });
    }
    flashDone(el.querySelector('.well') as HTMLElement);
  }, [beat]);
  const renewed = async () => {
    if (busy.current) return; busy.current = true;
    await leaveUp(); if (!alive.current) return;
    setBeat('lot');
    await sleep(reducedMotion() ? 300 : 900); if (!alive.current) return;
    ob.go('doors');
  };

  /* flick: sideways or down sinks the third card to Later */
  const drag = useRef<{ x: number; y: number; id: number; on: boolean } | null>(null);
  const onDown = (e: React.PointerEvent) => { if (beat !== 'later' || (e.target as HTMLElement).closest('button')) return; drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, on: false }; };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current, el = cardRef.current; if (!d || !el || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.on && Math.hypot(dx, dy) < 6) return;
    if (!d.on) { d.on = true; el.setPointerCapture(e.pointerId); }
    setT(el, { x: dx, y: Math.max(dy, -10), r: dx / 26 });
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current, el = cardRef.current; drag.current = null;
    if (!d || !el || !d.on) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) > 90 || dy > 60) sink({ x: dx, y: Math.max(dy, -10), r: dx / 26 });
    else spring({ x: dx, y: dy, r: dx / 26 }, { x: 0, y: 0, r: 0 }, {}, { k: 520, c: 24 }, v => setT(el, v), () => { el.style.transform = ''; });
  };

  const say: Record<Beat, string> = {
    hold: 'One thing needs you.', crew: 'This one is a job for the crew.', working: 'Juno is on it.', back: 'Juno’s back with an answer.',
    later: 'This one can wait.', sunk: 'Resting until Monday.', returned: 'Monday, 09:00. Back, as promised.', lot: 'That’s the lot.',
  };
  const k: MState = (beat === 'back' && home) || beat === 'lot' ? 'done' : beat === 'sunk' ? 'rest' : beat === 'working' || beat === 'back' ? 'idle' : 'waiting';
  const showCard = beat !== 'sunk' && beat !== 'lot';

  return (
    <section className="ob-scene ob-demo" aria-labelledby="ob-say">
      <div className="ob-scroll">
        <header className="ob-head">
          <div className="ob-headrow">
            <div className="ob-hand"><span className="ob-keep"><Chief state={k} size={66} out={!home} /></span></div>
            <button className="btn quiet sm ob-skip" onClick={() => ob.go('doors')}>Skip</button>
          </div>
          <h1 className="ob-say" id="ob-say" aria-live="polite">{say[beat]}</h1>
          {beat === 'hold' && <p className="ob-sub">I’m Keep. I read your mail and deal you only what needs you.</p>}
        </header>
        <div className="demo-table">
          <div className="deck demo-deck" style={{ ['--n' as string]: showCard ? 2 - card : 0 } as CSSProperties}>
          {showCard && Array.from({ length: 2 - card }, (_, i) => <div key={'e' + i} className="deck-edge" style={{ ['--i' as string]: i + 1 } as CSSProperties} aria-hidden="true" />)}
          {showCard && card === 0 && (
            <div ref={cardRef} className="dcard bezel demo-card" key="c0">
              <article className="well">
                <div className="dc-src"><span className="glyph"><Icon name="house" size={17} /></span><div className="who"><b>House move</b><small>Needs a reply, from Scout</small></div></div>
                <h2 className="dc-title">Solicitor needs the exchange date</h2>
                <p className="quote">Friday 21 November works for us. Thanks, Sam</p>
                <dl className="kv"><dt>To</dt><dd>Priya Shah, Hallam &amp; Co</dd></dl>
                <HoldButton label="Hold to send" ms={900} done={held} onDone={onHeld} />
              </article>
            </div>
          )}
          {showCard && card === 1 && (
            <div ref={cardRef} className={`dcard bezel demo-card ${beat === 'back' ? 'landed' : ''}`} key="c1">
              <article className="well">
                <div className="dc-src"><span className="glyph"><Icon name="house" size={17} /></span><div className="who"><b>House move</b><small>{beat === 'back' ? 'From Juno, just now' : 'A job for the crew'}</small></div></div>
                {beat === 'back'
                  ? <><h2 className="dc-title">Three quotes back. Cheapest £640, free on the 21st.</h2><dl className="kv"><dt>Firm</dt><dd>Ashby Removals</dd><dt>Van</dt><dd>Luton, two people</dd></dl></>
                  : <><h2 className="dc-title">Book a removal van for the 21st</h2><p className="dc-note">Three firms to ask, then compare.</p></>}
                <div className="demo-crewrow">
                  {beat === 'crew'
                    ? <button className="btn primary block" onClick={toJuno}>Give it to Juno</button>
                    : <span className="demo-juno"><span ref={junoRef} className="demo-juno-card"><Crew who="juno" size={54} state={beat === 'back' ? 'done' : 'working'} /></span>
                        <span>{beat === 'back' ? <><b>Juno</b> compared three firms</> : <><b>Juno</b> is asking three firms</>}{beat === 'working' && <i className="drain" aria-hidden="true" />}</span></span>}
                </div>
              </article>
            </div>
          )}
          {showCard && card === 2 && (
            <div ref={cardRef} className={`dcard bezel demo-card ${beat === 'later' ? 'flickable' : ''}`} key="c2"
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
              <article className="well">
                <div className="dc-src"><span className="glyph"><Icon name="car" size={17} /></span>
                  <div className="who"><b>Car</b>{beat === 'returned' ? <small className="back">Back, as promised</small> : <small>Due in three weeks, from Ledger</small>}</div>
                  {beat === 'later' && <button className="sink" onClick={() => sink()} aria-label="Move this card to Later"><Icon name="sink" size={15} /><span>Later</span></button>}
                </div>
                <h2 className="dc-title">Renew the car insurance</h2>
                <dl className="kv"><dt>Due</dt><dd className="num">4 December</dd><dt>Last year</dt><dd className="num">£412.80</dd></dl>
                {beat === 'returned'
                  ? <div className="dc-acts"><button className="btn primary" onClick={renewed}>Renewed</button></div>
                  : <p className="demo-hint">Flick it down to Later</p>}
              </article>
            </div>
          )}
          </div>
          {beat === 'lot' && <div className="demo-lot"><Chief state="rest" size={44} /><div><b>That’s the lot.</b><span>Three cards, about twenty seconds.</span></div></div>}
        </div>
        <div className="demo-horizon" aria-hidden={beat !== 'sunk'}>
          <span className="h-later">Later</span>
          <div ref={stripRef} className={`demo-strip ${beat === 'sunk' ? 'on' : ''}`}>
            {beat === 'sunk' && <><span className="glyph"><Icon name="car" size={14} /></span><span>Renew the car insurance</span><b className="num" key={day}>{DAYS[day]}</b></>}
          </div>
        </div>
      </div>
      <footer className="ob-foot demo-foot"><p>Sample data. Nothing here is sent.</p></footer>
    </section>
  );
}

/* ------------------------------------------------------------------ 3. Two doors */

function Doors() {
  const ob = useOb();
  return (
    <Scene k="idle" cls="ob-doors" say="That’s the lot." sub={<>That was sample data. Yours would live in your own Cloudflare account, on your own Anthropic key. We never see it.</>}
      foot={<>
        <button className="btn primary block" onClick={() => { ob.setPath('new'); ob.go('handoff'); }}>Set up mine</button>
        <button className="btn block" onClick={() => { ob.setPath('returning'); ob.go('pair'); }}>I already have Later</button>
        <button className="btn quiet block sm" onClick={() => ob.toApp('skip')}>Look around with sample data first</button>
      </>}>
      <div className="doors-art" aria-hidden="true">
        <span className="door-card d1"><Crew who="wren" size={62} /></span>
        <span className="door-card d2"><Crew who="scout" size={62} /></span>
        <span className="door-card d3"><Crew who="juno" size={62} /></span>
        <span className="door-card d4"><Crew who="ledger" size={62} /></span>
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 4. The computer hand-off */

const INSTALL = ['Waiting for the installer', 'Signing in to Cloudflare', 'Creating your home in Cloudflare', 'Locking your key away', 'Setting your monthly cap', 'Checking the connection'];

function Handoff() {
  const ob = useOb();
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<'wait' | 'quiet' | 'done'>('wait');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (phase !== 'wait') return;
    const t = setTimeout(() => {
      if (i < INSTALL.length - 1) setI(i + 1);
      else setPhase('done');
    }, i === 0 ? 3200 : i === INSTALL.length - 1 ? 5200 : 2700);
    return () => clearTimeout(t);
  }, [i, phase]);
  useEffect(() => {
    if (ob.take('computer-done')) { setI(INSTALL.length - 1); setPhase('done'); }
    if (ob.take('computer-quiet')) setPhase('quiet');
  }, [ob.sim?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  const doneRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (phase === 'done') flashDone(doneRef.current); }, [phase]);

  const k: MState = phase === 'quiet' ? 'error' : phase === 'done' ? 'done' : 'thinking';
  const say = phase === 'quiet' ? 'Your computer has gone quiet.' : phase === 'done' ? 'Your computer is done.' : 'This part needs a computer.';
  const sub = phase === 'quiet' ? 'If the installer stopped, run it again. It picks up where it left off.'
    : phase === 'done' ? 'It’s showing a code. Scan it with this phone.'
      : 'Later lives in your own Cloudflare account, and only a computer can put it there. About five minutes.';
  return (
    <Scene k={k} cls="ob-handoff" say={say} sub={sub}
      foot={phase === 'quiet'
        ? <button className="btn primary block" onClick={() => setPhase('wait')}>I’ve run it again</button>
        : phase === 'done'
          ? <button className="btn primary block" onClick={() => ob.go('pair')}>Scan the code</button>
          : <Proto onClick={() => ob.simulate('computer-done')}>Computer finished</Proto>}>
      <div className="laptop" aria-label="On your computer">
        <div className="lap-screen">
          <span className="lap-bar"><i /><i /><i /><b>later.sh/go</b></span>
          <div className="lap-body">
            <p>On your computer, open</p>
            <strong className="lap-url">later.sh/go</strong>
            <p>When it asks, type</p>
            <strong className="lap-code code" aria-label="K 4 Q, 7 2 R">K4Q 72R</strong>
          </div>
        </div>
        <span className="lap-base" aria-hidden="true" />
      </div>
      <button className="btn quiet sm ob-copy" onClick={() => setCopied(true)}>{copied ? <><Icon name="check" size={15} />Link copied</> : 'Copy the link to send yourself'}</button>
      <ol className="steps-live" ref={doneRef as unknown as React.Ref<HTMLOListElement>} aria-label="What your computer is doing">
        {INSTALL.map((s, j) => {
          const st = phase === 'done' || j < i ? 'done' : j === i ? (phase === 'quiet' ? 'stuck' : 'now') : 'todo';
          return (
            <li key={s} className={st}>
              <span className="tick" aria-hidden="true">{st === 'done' ? <Icon name="check" size={14} stroke={2.2} /> : st === 'now' ? <i /> : null}</span>
              <span>{s}</span>
              <small>{st === 'done' ? 'done' : st === 'now' ? 'now' : st === 'stuck' ? 'no word' : ''}</small>
            </li>
          );
        })}
      </ol>
      {phase === 'wait' && <p className="ob-fine">Your key and your cap are set there, not typed on this phone.</p>}
    </Scene>
  );
}

/* ------------------------------------------------------------------ 5. Pair by QR */

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
function QrCode() {
  return (
    <svg className="qr" viewBox="-2 -2 29 29" aria-hidden="true">
      <rect x="-2" y="-2" width="29" height="29" rx="2" fill="#fff" />
      {QR.map((row, r) => row.map((on, c) => on ? <rect key={r * 25 + c} x={c} y={r} width="1.02" height="1.02" fill="#0d1324" /> : null))}
    </svg>
  );
}

function Pair() {
  const ob = useOb();
  const alive = useAlive();
  const back = ob.path === 'returning';
  const [phase, setPhase] = useState<'aim' | 'scan' | 'ok' | 'expired'>('aim');
  const phoneRef = useRef<HTMLDivElement>(null);
  const run = async () => {
    setPhase('aim');
    await sleep(1100); if (!alive.current) return;
    setPhase('scan');
    await sleep(1500); if (!alive.current) return;
    if (ob.take('code-expired')) { setPhase('expired'); return; }
    setPhase('ok');
  };
  useEffect(() => { run(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (phase !== 'ok') return;
    const cards = phoneRef.current?.querySelectorAll<HTMLElement>('.ph-card');
    cards?.forEach((c, j) => dealFrom(c, { delay: 260 + j * 160, dur: 620 }));
    if (!back) ob.place('ledger', 'Spend');
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const k: MState = phase === 'expired' ? 'error' : phase === 'ok' ? 'done' : 'listening';
  const say = phase === 'expired' ? 'That code has expired.' : phase === 'ok' ? 'This phone is paired.' : back ? 'Scan the code from your Later.' : 'Scan the code on your computer.';
  const sub = phase === 'expired' ? 'Codes last ten minutes. Show a new one on your computer, then scan again.'
    : phase === 'ok' ? (back ? 'Wren, Scout, Juno and Ledger are already at work.' : 'It can reach your home now. Nothing else can.')
      : back ? 'On your computer or another paired phone: Settings, then Add a phone.' : 'Hold this phone up to it.';
  const who: AgentId[] = back ? ['wren', 'scout', 'juno', 'ledger'] : ['ledger'];
  return (
    <Scene k={k} cls="ob-pair" say={say} sub={sub}
      foot={phase === 'expired'
        ? <button className="btn primary block" onClick={run}>Scan again</button>
        : phase === 'ok'
          ? <button className="btn primary block" onClick={() => back ? ob.toApp('pair') : ob.go('ready')}>{back ? 'Open Today' : 'Carry on'}</button>
          : <button className="btn block" onClick={() => setPhase('scan')} disabled={phase === 'scan'}>{phase === 'scan' ? 'Reading the code' : 'Scan now'}</button>}>
      {phase !== 'ok' ? (
        <div className={`viewfinder ${phase}`} role="img" aria-label={phase === 'expired' ? 'The scanner found an expired code' : 'Camera view of the code on your computer'}>
          <span className="vf-screen"><QrCode />{phase === 'expired' && <span className="vf-x"><Icon name="close" size={40} stroke={2.4} /></span>}</span>
          <i className="c tl" /><i className="c tr" /><i className="c bl" /><i className="c br" />
          {phase === 'scan' && <span className="vf-line" />}
          <span className="vf-peek"><Chief state={phase === 'expired' ? 'error' : 'listening'} size={104} /></span>
        </div>
      ) : (
        <div className="paired" ref={phoneRef}>
          <div className="ph-outline" aria-hidden="true">
            <span className="ph-island" />
            <div className="ph-cards">{who.map(w => <span key={w} className="ph-card"><Crew who={w} size={back ? 40 : 58} state="done" /><small>{AGENTS[w].name}</small></span>)}</div>
          </div>
          <p className="paired-name">Sam’s iPhone</p>
        </div>
      )}
    </Scene>
  );
}

/* ------------------------------------------------------------------ 6. Your home: the result of the computer step */

const CREDIT = 100_000_000, CAP = 60_000_000; // integer micro-USD

function Ready() {
  const ob = useOb();
  const lines = ['Your home, in your own Cloudflare account', 'Your Anthropic key, locked away there', 'Claude answers', 'Notifications: I’ll ask at your first approval'];
  return (
    <Scene k="idle" cls="ob-ready" say="Your home is ready." sub="Everything below lives in your account. Later has no servers."
      foot={<button className="btn primary block" onClick={() => ob.go('connect')}>Carry on</button>}>
      <ul className="selftest">
        {lines.map((l, j) => <li key={l} className={j === 3 ? 'later' : ''} style={{ ['--j' as string]: j } as CSSProperties}><span className="tick">{j === 3 ? <Icon name="clock" size={14} /> : <Icon name="check" size={14} stroke={2.2} />}</span>{l}</li>)}
      </ul>
      <div className="spend">
        <div className="spend-top">
          <span className="spend-crew"><Crew who="ledger" size={40} /></span>
          <div><b className="num">{usd(CREDIT).replace('.00', '')} of credit this cycle</b><span>Capped at <b className="num">{usd(CAP).replace('.00', '')}</b> a month. 19 days left.</span></div>
        </div>
        <div className="meter" role="img" aria-label="Nothing spent yet; the cap is 60 of 100 dollars">
          <i className="m-used" style={{ width: '0.5%' }} /><i className="m-cap" style={{ left: `${(CAP / CREDIT) * 100}%` }} />
        </div>
        <p className="spend-note">Ledger keeps this meter. Change the cap any time; nothing runs past it.</p>
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 7. Connect mail and calendar */

type Conn = 'idle' | 'open' | 'checking' | 'ok' | 'bad';
const GOOD_PW = 'qmzv rtkw hbxe pnla';
const ICAL = 'https://calendar.google.com/calendar/ical/sam.reid%40gmail.com/private-3f9c…/basic.ics';

function Connect() {
  const ob = useOb();
  const alive = useAlive();
  const [mail, setMail] = useState<Conn>(ob.mail ? 'ok' : 'idle');
  const [cal, setCal] = useState<Conn>(ob.cal ? 'ok' : 'idle');
  const [done1, setDone1] = useState(false);
  const [done2, setDone2] = useState(false);
  const [pw, setPw] = useState('');
  const [link, setLink] = useState('');
  const [other, setOther] = useState<null | 'own' | 'broker'>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const mailCard = useRef<HTMLDivElement>(null), calCard = useRef<HTMLDivElement>(null);
  const mailCrew = useRef<HTMLSpanElement>(null), calCrew = useRef<HTMLSpanElement>(null);

  const tryMail = async () => {
    setMail('checking');
    await sleep(1400); if (!alive.current) return;
    const bad = ob.take('wrong-password') || pw.replace(/\s/g, '').length !== 16;
    if (bad) { setMail('bad'); return; }
    setMail('ok'); ob.setConn('mail', true);
  };
  const tryCal = async () => {
    setCal('checking');
    await sleep(1100); if (!alive.current) return;
    setCal('ok'); ob.setConn('cal', true);
  };
  useLayoutEffect(() => { if (mail === 'ok' && !ob.placed.some(p => p.who === 'wren')) { dealFrom(mailCrew.current, { dur: 640 }).then(() => flashDone(mailCard.current)); ob.place('wren', 'Mail'); } }, [mail]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { if (cal === 'ok' && !ob.placed.some(p => p.who === 'scout')) { dealFrom(calCrew.current, { dur: 640 }).then(() => flashDone(calCard.current)); ob.place('scout', 'Calendar'); } }, [cal]); // eslint-disable-line react-hooks/exhaustive-deps

  const k: MState = mail === 'bad' ? 'error' : mail === 'checking' || cal === 'checking' ? 'thinking' : mail === 'ok' && cal === 'ok' ? 'done' : 'waiting';
  const say = mail === 'bad' ? 'Google turned that password down.'
    : mail === 'ok' && cal === 'ok' ? 'Mail and calendar, connected.'
      : mail === 'open' || mail === 'checking' ? 'Mail first. Three short steps.'
        : cal === 'open' || cal === 'checking' ? 'Calendar: one link.' : 'Mail and calendar first.';
  const sub = mail === 'bad' ? 'Copy the 16 letters from step 2 again, then paste them.'
    : mail === 'ok' && cal === 'ok' ? 'Wren reads your mail. Scout reads your calendar. Neither can send anything.'
      : 'Each one is stored in your own account. Later has no servers.';
  const any = mail === 'ok' || cal === 'ok';

  return (
    <Scene k={k} cls="ob-connect" say={say} sub={sub}
      foot={<button className={`btn ${any ? 'primary' : ''} block`} onClick={() => ob.go('extras')}>{any ? 'Carry on' : 'Skip for now'}</button>}>
      <div ref={mailCard} className={`conn ${mail}`}>
        <div className="conn-top">
          <span className="glyph"><Icon name="tray" size={18} /></span>
          <div className="conn-name"><b>Gmail</b><span>{mail === 'ok' ? 'sam.reid@gmail.com' : 'Three steps, about two minutes'}</span></div>
          {mail === 'ok' ? <span ref={mailCrew} className="conn-crew"><Crew who="wren" size={40} state="idle" /></span>
            : mail === 'idle' ? <button className="btn primary sm" onClick={() => { setMail('open'); setCal(c => c === 'open' ? 'idle' : c); }}>Connect</button> : null}
        </div>
        <p className="conn-who">{mail === 'ok' ? 'Wren reads it. Nothing leaves without your hold.' : 'An app password, stored in your own Cloudflare account. Later has no servers.'}</p>
        {(mail === 'open' || mail === 'checking' || mail === 'bad') && (
          <div className="conn-steps">
            <ol>
              <li className={done1 ? 'done' : ''}><span className="n">{done1 ? <Icon name="check" size={13} stroke={2.4} /> : 1}</span>
                <div><b>Turn on 2-Step Verification</b><span>Google needs it before it makes app passwords.</span></div>
                <button className="btn sm" onClick={() => setDone1(true)}>{done1 ? 'Done' : 'Open Google'}</button></li>
              <li className={done2 ? 'done' : ''}><span className="n">{done2 ? <Icon name="check" size={13} stroke={2.4} /> : 2}</span>
                <div><b>Make an app password called Later</b><span>Google shows 16 letters. Copy them.</span></div>
                <button className="btn sm" onClick={() => { setDone1(true); setDone2(true); }}>{done2 ? 'Done' : 'Open Google'}</button></li>
              <li className={mail === 'bad' ? 'bad' : ''}><span className="n">3</span>
                <div className="paste"><b>Paste them here</b>
                  <label className="fld"><span>Gmail address</span><input defaultValue="sam.reid@gmail.com" inputMode="email" autoComplete="off" /></label>
                  <label className="fld"><span>App password</span>
                    <span className="fld-row"><input ref={pwRef} className="code" value={pw} onChange={e => { setPw(e.target.value); if (mail === 'bad') setMail('open'); }} placeholder="16 letters" autoComplete="off" spellCheck={false} aria-invalid={mail === 'bad'} />
                      <button className="btn sm" onClick={() => { setPw(GOOD_PW); if (mail === 'bad') setMail('open'); }}>Paste</button></span></label>
                </div></li>
            </ol>
            {mail === 'bad'
              ? <button className="btn primary block" onClick={() => { setPw(''); setMail('open'); setTimeout(() => pwRef.current?.focus(), 0); }}>Paste again</button>
              : <button className="btn primary block" disabled={!pw || mail === 'checking'} onClick={tryMail}>{mail === 'checking' ? 'Signing in to Gmail' : 'Connect Gmail'}</button>}
            <div className="others">
              <span>Other ways in</span>
              <button aria-expanded={other === 'own'} onClick={() => setOther(o => o === 'own' ? null : 'own')}><b>Your own Google connection</b><small>Advanced. About ten minutes, on your computer.</small></button>
              <button aria-expanded={other === 'broker'} onClick={() => setOther(o => o === 'broker' ? null : 'broker')}><b>A connection service</b><small>Coming later. Your mail would pass through that company.</small></button>
              {other && <p className="ob-fine">{other === 'own' ? 'The guided set-up for this runs on your computer. It still keeps everything in your account.' : 'Not offered yet. When it is, it will say plainly which company sees your mail.'}</p>}
            </div>
          </div>
        )}
      </div>

      <div ref={calCard} className={`conn ${cal}`}>
        <div className="conn-top">
          <span className="glyph"><Icon name="today" size={18} /></span>
          <div className="conn-name"><b>Google Calendar</b><span>{cal === 'ok' ? 'Read by its private link' : 'Two steps, about a minute'}</span></div>
          {cal === 'ok' ? <span ref={calCrew} className="conn-crew"><Crew who="scout" size={40} state="idle" /></span>
            : cal === 'idle' ? <button className={`btn ${mail === 'ok' ? 'primary' : ''} sm`} onClick={() => { setCal('open'); setMail(m => m === 'open' ? 'idle' : m); }}>Connect</button> : null}
        </div>
        <p className="conn-who">{cal === 'ok' ? 'Scout reads it for meeting briefs. Read only.' : 'A private link, stored in your own account. Read only.'}</p>
        {(cal === 'open' || cal === 'checking') && (
          <div className="conn-steps">
            <ol>
              <li><span className="n">1</span><div><b>In Google Calendar, open Settings</b><span>Then choose your calendar.</span></div></li>
              <li><span className="n">2</span><div className="paste"><b>Copy “Secret address in iCal format”</b>
                <label className="fld"><span>Paste it here</span><span className="fld-row"><input className="code" value={link} onChange={e => setLink(e.target.value)} placeholder="https://calendar.google.com/…" autoComplete="off" spellCheck={false} />
                  <button className="btn sm" onClick={() => setLink(ICAL)}>Paste</button></span></label></div></li>
            </ol>
            <button className="btn primary block" disabled={!link || cal === 'checking'} onClick={tryCal}>{cal === 'checking' ? 'Reading your calendar' : 'Connect calendar'}</button>
          </div>
        )}
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 8. Anything else: by email, and the optional ones */

const SCHOOL = ['Procare', 'Brightwheel', 'ClassDojo', 'Seesaw', 'ParentSquare'];

function Extras() {
  const ob = useOb();
  const [picked, setPicked] = useState<string[]>(ob.byEmail ? [ob.byEmail] : []);
  const crewRef = useRef<HTMLSpanElement>(null), cardRef = useRef<HTMLDivElement>(null);
  const had = useRef(picked.length > 0);
  useLayoutEffect(() => {
    if (picked.length && !had.current) { had.current = true; dealFrom(crewRef.current).then(() => flashDone(cardRef.current)); }
    if (picked.length) { ob.place('juno', picked[0]); ob.setByEmail(picked[0]); }
  }, [picked]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = picked.length > 1 ? `${picked.slice(0, -1).join(', ')} and ${picked[picked.length - 1]}` : picked[0];
  return (
    <Scene k={picked.length ? 'done' : 'idle'} cls="ob-extras" say="Anything else?" sub="All optional. Skipping is fine."
      foot={<button className="btn primary block" onClick={() => ob.go('learn')}>{picked.length ? 'Carry on' : 'Nothing else for now'}</button>}>
      <div ref={cardRef} className={`conn by-email ${picked.length ? 'ok' : ''}`}>
        <div className="conn-top">
          <span className="glyph"><Icon name="cap" size={18} /></span>
          <div className="conn-name"><b>School, daycare and the rest</b><span>By the emails they send you</span></div>
          {picked.length > 0 && <span ref={crewRef} className="conn-crew"><Crew who="juno" size={40} /></span>}
        </div>
        <p className="conn-who">Procare, Brightwheel, ClassDojo: most don’t let apps in. Later reads the emails they send you instead.</p>
        <div className="picks" role="group" aria-label="Which ones send you email">
          {SCHOOL.map(s => <button key={s} aria-pressed={picked.includes(s)} disabled={!ob.mail} onClick={() => setPicked(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}>{picked.includes(s) && <Icon name="check" size={14} stroke={2.2} />}{s}</button>)}
        </div>
        <p className="conn-foot">{!ob.mail ? 'This works through your mail, so connect mail first.' : picked.length ? `Juno watches for ${list} and files it under Ellie’s school.` : 'Pick any that email you.'}</p>
      </div>
      <h2 className="ob-h2">Later on</h2>
      <div className="spread">
        {[['Slack', 'chat'], ['Notion', 'book'], ['Microsoft 365', 'laptop']].map(([n, g], j) => (
          <div key={n} className="spread-card" style={{ ['--r' as string]: `${(j - 1) * 4}deg` } as CSSProperties}>
            <span className="glyph"><Icon name={g as Glyph} size={16} /></span><b>{n}</b><small>Not ready yet</small>
          </div>
        ))}
      </div>
      <p className="ob-fine">Each will say who can see what before you add it. Nothing is added without you.</p>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 9. The first learning pass */

const PASS = [
  { t: 'Reading the last 30 days', n: (p: number) => `${Math.round(212 * p)} threads` },
  { t: 'Finding who you talk to', n: (p: number) => `${Math.round(14 * p)} people` },
  { t: 'Spotting what repeats', n: (p: number) => `${Math.round(5 * p)} patterns` },
  { t: 'Reading your calendar', n: (p: number) => `${Math.round(9 * p)} events` },
  { t: 'Sorting into Spaces', n: (p: number) => `${Math.round(4 * p)} Spaces` },
];
const PILES = [
  { id: 'house', name: 'House move', n: 6, glyph: 'house' }, { id: 'school', name: 'Ellie’s school', n: 5, glyph: 'cap' },
  { id: 'mum', name: 'Mum’s 70th', n: 4, glyph: 'cake' }, { id: 'tax', name: 'Taxes 2026', n: 4, glyph: 'receipt' },
] as const;
const PASS_CAP = 1_000_000, PASS_USED = 420_000; // micro-USD
const PASS_MS = 13000;

function Learn() {
  const ob = useOb();
  const [t, setT0] = useState(0); // 0..1 through the pass
  const start = useRef(performance.now());
  const done = t >= 1;
  useEffect(() => {
    if (done) return;
    const i = setInterval(() => setT0(Math.min(1, (performance.now() - start.current) / PASS_MS)), 120);
    return () => clearInterval(i);
  }, [done]);
  useEffect(() => { if (ob.take('learn-finish')) setT0(1); }, [ob.sim?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  const step = Math.min(PASS.length, Math.floor(t * PASS.length));
  const dealt = Math.round(t * 19);
  // which card of which pile has been dealt: round robin, so the piles grow together
  const order: number[] = [];
  for (let r = 0; order.length < 19; r++) PILES.forEach((p, j) => { if (r < p.n && order.length < 19) order.push(j); });
  const counts = PILES.map((_, j) => order.slice(0, dealt).filter(x => x === j).length);
  const used = Math.round((PASS_USED * Math.min(1, t * 1.02)) / 10_000) * 10_000;
  const pileRef = useRef<HTMLDivElement>(null);
  const last = useRef(0);
  useLayoutEffect(() => {
    if (dealt <= last.current) return;
    for (let d = last.current; d < dealt; d++) {
      const j = order[d], el = pileRef.current?.querySelectorAll<HTMLElement>('.pile')[j]?.querySelector<HTMLElement>('.pile-top');
      dealFrom(el, { dur: 480, spin: -30 });
    }
    last.current = dealt;
  }, [dealt]); // eslint-disable-line react-hooks/exhaustive-deps
  const doneRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (done) flashDone(doneRef.current); }, [done]);

  return (
    <Scene k={done ? 'done' : 'working'} crew={done ? 'done' : 'working'} cls="ob-learn"
      say={done ? 'Done. Here’s what I found.' : 'Reading. Newest first.'}
      sub={done ? 'Four piles that look like Spaces, and a few things about you to check.' : 'About a minute. It stops at the cap, and carries on later if there’s more.'}
      foot={done ? <button className="btn primary block" onClick={() => ob.go('readback')}>See what I found</button> : <Proto onClick={() => setT0(1)}>Finish reading</Proto>}>
      <ol className="pass" aria-label="What Keep is doing">
        {PASS.map((p, j) => {
          const st = done || j < step ? 'done' : j === step ? 'now' : 'todo';
          const local = st === 'done' ? 1 : st === 'now' ? (t * PASS.length - j) : 0;
          return (
            <li key={p.t} className={st}>
              <span className="tick" aria-hidden="true">{st === 'done' ? <Icon name="check" size={14} stroke={2.2} /> : st === 'now' ? <i /> : null}</span>
              <span>{p.t}</span><small className="num">{st === 'todo' ? '' : p.n(Math.max(0.05, local))}</small>
            </li>
          );
        })}
      </ol>
      <div className="piles" ref={pileRef} aria-label="Piles forming">
        {PILES.map((p, j) => (
          <div key={p.id} className={`pile ${counts[j] ? 'has' : ''} ${counts[j] >= 2 ? 'named' : ''}`} style={{ ['--n' as string]: Math.min(4, Math.max(0, counts[j] - 1)) } as CSSProperties}>
            <span className="pile-edges" aria-hidden="true"><i /><i /><i /></span>
            <span className="pile-top"><span className="glyph"><Icon name={p.glyph} size={14} /></span><b>{counts[j] >= 2 ? p.name : ''}</b><small className="num">{counts[j] || ''}</small></span>
          </div>
        ))}
      </div>
      <div className="meter-row" ref={doneRef}>
        <div><b className="num">Used {usd(used)}</b> of {usd(PASS_CAP)}</div>
        <div className="meter" role="progressbar" aria-label="First pass budget" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((used / PASS_CAP) * 100)}>
          <i className="m-used" style={{ width: `${(used / PASS_CAP) * 100}%` }} /><i className="m-cap" style={{ left: 'calc(100% - 2px)' }} />
        </div>
        <small>A capped first pass, from your monthly cap. Nothing is sent, filed or deleted.</small>
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 10. Read-back */

interface Row { id: string; label: string; value: string; src: string; gone?: boolean }
const ROWS: Row[] = [
  { id: 'you', label: 'You', value: 'Sam Reid', src: 'your signature' },
  { id: 'home', label: 'At home', value: 'Alex, and Ellie (8)', src: 'from 31 emails' },
  { id: 'school', label: 'Ellie’s school', value: 'Ashby Primary, Year 4', src: 'from Brightwheel' },
  { id: 'move', label: 'Moving', value: 'Exchange due 21 November, Hallam & Co', src: 'from 9 emails' },
  { id: 'mum', label: 'Mum', value: '70 on 14 March, party at The Old Mill', src: 'from 6 emails' },
  { id: 'work', label: 'Work', value: 'Tally, launching 2 December', src: 'from your calendar' },
];
const PROPOSED: { id: string; name: string; glyph: Glyph; n: number; who: AgentId; why: string }[] = [
  { id: 'house', name: 'House move', glyph: 'house', n: 6, who: 'scout', why: 'Scout chases the solicitor' },
  { id: 'school', name: 'Ellie’s school', glyph: 'cap', n: 5, who: 'juno', why: 'Juno reads Brightwheel' },
  { id: 'mum', name: 'Mum’s 70th', glyph: 'cake', n: 4, who: 'wren', why: 'Wren plans and invites' },
  { id: 'tax', name: 'Taxes 2026', glyph: 'receipt', n: 4, who: 'ledger', why: 'Ledger tracks every fee' },
];

function Readback() {
  const ob = useOb();
  const alive = useAlive();
  const [rows, setRows] = useState(ROWS);
  const [edit, setEdit] = useState<string | null>(null);
  const [gone, setGone] = useState<string[]>([]);
  const [phase, setPhase] = useState<'check' | 'dealing' | 'dealt'>('check');
  const [dealt, setDealt] = useState<string[]>([]);
  const deskRef = useRef<HTMLDivElement>(null);

  const kept = PROPOSED.filter(p => !gone.includes(p.id));
  const deal = async () => {
    setPhase('dealing');
    for (const p of kept) {
      await sleep(reducedMotion() ? 120 : 380); if (!alive.current) return;
      setDealt(d => [...d, p.id]);
    }
    await sleep(600); if (!alive.current) return;
    setPhase('dealt');
  };
  useLayoutEffect(() => {
    const id = dealt[dealt.length - 1]; if (!id) return;
    const el = deskRef.current?.querySelector<HTMLElement>(`[data-sp="${id}"] .sp-crew`);
    dealFrom(el, { dur: 600, spin: -28 }).then(() => flashDone(el?.closest('.sp-stack') as HTMLElement));
  }, [dealt]);

  /* flick a proposed stack away to dismiss it */
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
    if (Math.abs(dx) > 80) { el.style.transform = ''; el.style.opacity = ''; setGone(g => [...g, d.id]); return; }
    spring({ x: dx, r: dx / 30 }, { x: 0, r: 0 }, {}, { k: 520, c: 24 }, v => setT(el, v), () => { el.style.transform = ''; el.style.opacity = ''; });
  };

  const live = rows.filter(r => !r.gone);
  const crewLine = kept.map(p => `${AGENTS[p.who].name} on ${p.name}`).join(', ');
  return (
    <Scene k={phase === 'dealt' ? 'done' : phase === 'dealing' ? 'idle' : 'waiting'} out={phase === 'dealing'} cls="ob-readback"
      say={phase === 'dealt' ? 'The crew are on it.' : 'Here’s what I gathered.'}
      sub={phase === 'dealt' ? `${crewLine}.` : 'Fix anything that’s wrong. Nothing is made until you say.'}
      foot={phase === 'dealt'
        ? <button className="btn primary block" onClick={() => ob.go('routines')}>Carry on</button>
        : <button className="btn primary block" disabled={phase === 'dealing'} onClick={deal}>{phase === 'dealing' ? 'Dealing the crew' : 'Looks right'}</button>}>
      <dl className="ob-facts">
        {live.map(r => (
          <div key={r.id} className={`fact ${edit === r.id ? 'editing' : ''}`}>
            <dt>{r.label}</dt>
            <dd>
              {edit === r.id
                ? <input autoFocus defaultValue={r.value} aria-label={`Correct ${r.label}`} onBlur={e => { const v = e.target.value.trim(); setRows(rs => rs.map(x => x.id === r.id ? { ...x, value: v || x.value, src: v && v !== x.value ? 'you corrected this' : x.src } : x)); setEdit(null); }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur(); }} />
                : <button className="fact-v" onClick={() => phase === 'check' && setEdit(r.id)} aria-label={`${r.label}: ${r.value}. Correct it`}>{r.value}</button>}
              <small>{r.src}</small>
            </dd>
            {phase === 'check' && <button className="fact-x" aria-label={`Remove ${r.label}`} onClick={() => setRows(rs => rs.map(x => x.id === r.id ? { ...x, gone: true } : x))}><Icon name="close" size={14} /></button>}
          </div>
        ))}
        {rows.some(r => r.gone) && <button className="fact-undo" onClick={() => setRows(rs => rs.map(x => ({ ...x, gone: false })))}>Put back what I removed</button>}
      </dl>
      <h2 className="ob-h2">Spaces I’d make</h2>
      <div className="sp-desk" ref={deskRef}>
        {PROPOSED.map(p => {
          const off = gone.includes(p.id), on = dealt.includes(p.id);
          return off ? (
            <div key={p.id} className="sp-gone"><span>{p.name}: not a Space</span><button onClick={() => setGone(g => g.filter(x => x !== p.id))}>Undo</button></div>
          ) : (
            <div key={p.id} data-sp={p.id} className={`sp-stack ${on ? 'staffed' : ''}`} style={{ ['--n' as string]: Math.min(3, p.n - 1) } as CSSProperties}
              onPointerDown={down(p.id)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
              <span className="sp-edges" aria-hidden="true"><i /><i /><i /></span>
              <div className="sp-face">
                <span className="glyph"><Icon name={p.glyph} size={15} /></span>
                <b>{p.name}</b>
                <small className="num">{p.n} cards</small>
                {on ? <span className="sp-crew"><Crew who={p.who} size={34} state={phase === 'dealt' ? 'working' : 'idle'} /><em>{AGENTS[p.who].name}</em></span>
                  : phase === 'check' ? <button className="sp-x" aria-label={`Not a Space: ${p.name}`} onClick={() => setGone(g => [...g, p.id])}><Icon name="close" size={14} /></button> : null}
              </div>
            </div>
          );
        })}
      </div>
      {phase === 'check' && <p className="ob-fine">Flick a pile away if it isn’t one.</p>}
    </Scene>
  );
}

/* ------------------------------------------------------------------ 11. Routines, paused */

const ROUTINES: { id: string; name: string; when: string; does: string; may: string; cost: string; who: AgentId }[] = [
  { id: 'morning', name: 'Morning deck', when: 'Weekdays at 07:00', does: 'Reads overnight mail and today’s calendar, and deals you what needs you.', may: 'Reads only', cost: 'est. 4¢ a day', who: 'wren' },
  { id: 'inbox', name: 'Inbox sort and draft', when: 'Every 15 minutes', does: 'Files mail into Spaces and drafts replies in your voice.', may: 'Drafts wait for your hold', cost: 'est. 10¢ a day', who: 'scout' },
  { id: 'brief', name: 'Meeting briefs', when: 'An hour before a meeting', does: 'Who you’re meeting, what you last said, what’s open.', may: 'Reads only', cost: 'est. 3¢ a meeting', who: 'juno' },
];

function Routines() {
  const ob = useOb();
  const [on, setOn] = useState<string[]>([]);
  const [push, setPush] = useState<'ask' | 'yes' | 'no' | null>(null);
  const cards = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { cards.current?.querySelectorAll<HTMLElement>('.rt').forEach((el, j) => dealFrom(el, { delay: 200 + j * 170, dur: 620, spin: -10 })); }, []);
  const toggle = (id: string) => {
    const next = on.includes(id) ? on.filter(x => x !== id) : [...on, id];
    setOn(next);
    if (!on.includes(id)) flashDone(cards.current?.querySelector(`[data-rt="${id}"]`) as HTMLElement);
    if (id === 'inbox' && next.includes('inbox') && push === null) setPush('ask');
  };
  return (
    <Scene k={on.length ? 'idle' : 'rest'} cls="ob-routines" say="Three routines. All paused." sub="Switch on the ones you want. Each says what it may do."
      foot={<button className={`btn ${on.length ? 'primary' : ''} block`} onClick={() => ob.go('promises')}>{on.length ? 'Carry on' : 'Leave them paused'}</button>}>
      <div className="rts" ref={cards}>
        {ROUTINES.map(r => {
          const live = on.includes(r.id);
          return (
            <div key={r.id} data-rt={r.id} className={`rt ${live ? 'on' : ''}`}>
              <span className="rt-crew"><Crew who={r.who} size={38} state={live ? 'idle' : 'rest'} /></span>
              <div className="rt-txt">
                <b>{r.name}</b><span className="rt-when">{r.when}</span>
                <p>{r.does}</p>
                <span className="rt-meta"><span>{r.may}</span><span className="num">{r.cost}</span></span>
              </div>
              <button className="switch" role="switch" aria-checked={live} aria-label={`${r.name}: ${live ? 'on' : 'paused'}`} onClick={() => toggle(r.id)} />
              {r.id === 'inbox' && push && (
                <div className="push">
                  {push === 'ask' ? <>
                    <p><b>Drafts wait for your hold.</b> Want this phone to tell you when one is ready?</p>
                    <div className="push-acts"><button className="btn primary sm" onClick={() => setPush('yes')}>Allow notifications</button><button className="btn quiet sm" onClick={() => setPush('no')}>Not now</button></div>
                  </> : <p className="push-done">{push === 'yes' ? <><Icon name="check" size={15} />You’ll hear when a draft is ready, and nothing else.</> : 'No notifications. Drafts wait in Now until you look.'}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="ob-fine">One switch in Settings pauses everything, any time.</p>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 12. The promises, each tried once */

function Promises() {
  const ob = useOb();
  const alive = useAlive();
  const [filed, setFiled] = useState(false);
  const [spent, setSpent] = useState(420_000);
  const [asked, setAsked] = useState(0);
  const [aside, setAside] = useState<'card' | 'gone' | 'back'>('card');
  const [left, setLeft] = useState(5);
  const [cheer, setCheer] = useState(0);
  const asideRef = useRef<HTMLDivElement>(null), lineRef = useRef<HTMLDivElement>(null);
  const setAsideNow = async () => {
    const el = asideRef.current;
    if (el && !reducedMotion()) await el.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(46px) scale(.8)', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.5,0,.4,1)', fill: 'forwards' }).finished.catch(() => {});
    if (!alive.current) return;
    setAside('gone');
    for (let s = 5; s > 0; s--) { setLeft(s); await sleep(1000); if (!alive.current) return; }
    setAside('back'); setCheer(Date.now());
  };
  useLayoutEffect(() => {
    if (aside !== 'back') return;
    const el = asideRef.current; if (!el) return;
    if (!reducedMotion()) el.animate([{ transform: 'translateY(46px) scale(.8)', opacity: 0 }, { transform: 'translateY(-6px)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.2,.9,.3,1)' });
    flashDone(el);
  }, [aside]);
  const [k, setK] = useState<MState>('idle');
  useEffect(() => { if (!cheer) return; setK('done'); const t = setTimeout(() => setK('idle'), 1600); return () => clearTimeout(t); }, [cheer]);
  const ask = () => { setSpent(s => s + 3000); setAsked(a => a + 1); setCheer(Date.now()); };
  return (
    <Scene k={k} cls="ob-promises" say="Three promises." sub="Try each one. None of it is real."
      foot={<button className="btn primary block" onClick={() => ob.go('handover')}>Deal my first deck</button>}>
      <section className="pr">
        <h2>Nothing that can’t be undone happens without your hold.</h2>
        <p>Sends and payments, the same way, with 30 seconds to stop them after.</p>
        <div className="pr-demo">
          <div className="pr-card"><span className="glyph"><Icon name="receipt" size={15} /></span><span>File the Screwfix receipt</span></div>
          <HoldButton label="Hold to file it" ms={1100} done={filed} onDone={() => { setFiled(true); setCheer(Date.now()); }} />
        </div>
      </section>
      <section className="pr">
        <h2>Every cent of spend is on the meter.</h2>
        <p>Each question, each run. Nothing passes your cap.</p>
        <div className="pr-demo">
          <div className="meter-row tight" ref={lineRef}>
            <div><b className="num">{usd(spent)}</b> of {usd(CAP)} this month</div>
            <div className="meter"><i className="m-used" style={{ width: `${Math.max(1, (spent / CAP) * 100)}%` }} /></div>
          </div>
          <button className="btn sm" onClick={ask}>Ask Keep something</button>
          {asked > 0 && <p className="pr-out" aria-live="polite">That question cost <b className="num">$0.003</b>.</p>}
        </div>
      </section>
      <section className="pr">
        <h2>Set anything aside. It comes back.</h2>
        <p>On time, or when what it waits for happens.</p>
        <div className="pr-demo aside">
          {aside === 'gone'
            ? <div className="pr-line" aria-live="polite"><Icon name="clock" size={15} />Back in <b className="num">{left}</b> second{left === 1 ? '' : 's'}</div>
            : <div ref={asideRef} className="pr-card"><span className="glyph"><Icon name="heart" size={15} /></span><span>Call the dentist</span>
                {aside === 'back' ? <small className="back">Back, as promised</small> : <button className="sink" onClick={setAsideNow}><Icon name="sink" size={15} /><span>5 seconds</span></button>}</div>}
        </div>
      </section>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 13. Handover: the first real deck */

function Handover() {
  const ob = useOb();
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState<MState>('idle');
  useLayoutEffect(() => {
    const els = box.current?.querySelectorAll<HTMLElement>('.ho-card');
    els && [...els].reverse().forEach((el, j) => dealFrom(el, { delay: 300 + j * 260, dur: 680, spin: -18 }));
    const t = setTimeout(() => setK('done'), reducedMotion() ? 0 : 1300);
    return () => clearTimeout(t);
  }, []);
  const three = DECK0.slice(0, 3);
  return (
    <Scene k={k} cls="ob-handover" say="Your first deck." sub="Three things from the last two days. Everything else can wait."
      foot={<button className="btn primary block" onClick={() => ob.toApp('handover')}>Open Today</button>}>
      <div className="ho-deck" ref={box}>
        {three.map((c, j) => (
          <div key={c.id} className="ho-card bezel" style={{ ['--j' as string]: j } as CSSProperties}>
            <div className="dc-src"><span className="glyph"><Icon name={space(c.spaceId).glyph} size={15} /></span><div className="who"><b>{space(c.spaceId).name}</b><small>{c.kind}</small></div></div>
            <p className="ho-title">{c.title}</p>
          </div>
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
    const el = ref.current; if (!el || reducedMotion()) return;
    setT(el, { y: -140 }); spring({ y: -140 }, { y: 0 }, {}, { k: 300, c: 21 }, v => setT(el, v), () => { el.style.transform = ''; });
    el.querySelector('button')?.focus({ preventScroll: true });
  }, [ob.welcome]);
  if (!ob.welcome) return null;
  return (
    <div className="wb" onClick={ob.closeWelcome}>
      <div ref={ref} className="wb-card" role="dialog" aria-modal="true" aria-labelledby="wb-h" onClick={e => e.stopPropagation()}
        onKeyDown={e => e.key === 'Escape' && ob.closeWelcome()}>
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
  title: Title, demo: Demo, doors: Doors, handoff: Handoff, pair: Pair, ready: Ready, connect: Connect, extras: Extras,
  learn: Learn, readback: Readback, routines: Routines, promises: Promises, handover: Handover,
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
