import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import '../brand';
import { AGENTS, type AgentId } from '../data';
import { Icon } from '../icons';
import { Chief, Crew, type MState } from '../Mascot';
import { reducedMotion, spring, setT, usePrefersReducedMotion } from '../motion';
import { hum, onSoundChange, play, setSound, soundOn, unlock } from '../sound';
import { useOb, type Step } from './flow';
import type { Item } from './handed';
import { returnTimes, whenLabel, type Kind } from './rules';

/* The front door. Premise: say later, and it comes back ready.
   One world throughout: a sky, the horizon (the brand's own line) and the ground. Above the line is now; below it is later.
   Keep speaks in the first person from the first screen. The user's own words are on a card within twenty seconds, and every
   interaction acts on something of theirs. Before set-up there is no model: the only "smart" part is simple rules on the
   phone (rules.ts), and Keep says so. Every scene's last frame tells its story on its own, so reduced motion gets composed
   stills, and every gesture also has a plain button. Sounds play on the frame a thing lands. */

/* ------------------------------------------------------------------ helpers */

type Sky = 'night' | 'clay' | 'navy' | 'deep' | 'dawn' | 'glow';
type G = Parameters<typeof Icon>[0]['name'];
const CREW: AgentId[] = ['wren', 'scout', 'juno', 'ledger'];
/** One line each, by what they do. The same jobs as in the app. */
const JOB: Record<AgentId, string> = { wren: 'Wren answers your mail.', scout: 'Scout books and chases.', juno: 'Juno finds and compares.', ledger: 'Ledger checks the money.' };
const short = (t: string, n = 34) => (t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t);

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
/** The reverse: an element flies into another and is gone. */
function flyInto(el: Element | null | undefined, to: Element | null | undefined, dur = 520) {
  if (!el || !to || reducedMotion()) return Promise.resolve();
  const a = to.getBoundingClientRect(), b = el.getBoundingClientRect();
  const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height * 0.45 - (b.top + b.height / 2);
  return (el as HTMLElement).animate([
    { transform: 'none', opacity: 1 },
    { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 40}px) scale(.7) rotate(-8deg)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) scale(.2) rotate(-24deg)`, opacity: 0 },
  ], { duration: dur, easing: 'cubic-bezier(.45,0,.4,1)', fill: 'forwards' }).finished.catch(() => {});
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
const Mini = ({ who, s = 26, st = 'idle' }: { who: AgentId | null; s?: number; st?: MState }) => who
  ? <span className="ld-c ld-mini" data-who={who}><Crew who={who} size={s} state={st} /></span>
  : <span className="ld-k ld-mini"><Chief size={s} state={st} /></span>;

/** Keep speaking: a speech bubble whose words rise in one after another, a soft tick on every other word. */
function Speech({ text, sub }: { text: string; sub?: ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!document.activeElement || document.activeElement === document.body || (document.activeElement.closest('.phone') && !document.activeElement.matches('input, textarea'))) ref.current?.focus({ preventScroll: true });
    if (reducedMotion()) return;
    const ts = text.split(' ').map((_, i) => i % 2 === 0 ? window.setTimeout(() => play('tick', { vol: 0.22, step: (i / 2) % 6 }), 110 + i * 62) : 0);
    return () => ts.forEach(clearTimeout);
  }, [text]);
  return (
    <div className="ld-words">
      <div className="ld-bubble" key={text}>
        <p className="ld-say" id="ld-say" ref={ref} tabIndex={-1} aria-live="polite">
          {text.split(' ').map((w, i) => <span key={i} style={{ ['--i' as string]: i } as CSSProperties}>{w} </span>)}
        </p>
      </div>
      {sub && <p className="ld-sub" key={'s' + String(sub)}>{sub}</p>}
    </div>
  );
}

/** Progress, once set-up starts: the crew dealt so far. Before that, nothing: the story is the progress. */
function Progress() {
  const ob = useOb();
  const setup = ['computer', 'mail', 'calendar', 'school', 'reading', 'found', 'deck'].includes(ob.step);
  if (!setup) return <span />;
  return (
    <span className="ld-team" role="img" aria-label={ob.placed.length ? `Dealt so far: ${ob.placed.map(w => AGENTS[w].name).join(', ')}` : 'No crew dealt yet'}>
      {CREW.map(w => ob.placed.includes(w)
        ? <span key={w} className="ld-tc" data-who={w}><Crew who={w} size={30} /></span>
        : <i key={w} />)}
    </span>
  );
}

function Scene({ sky, cls = '', say, sub, children, foot, hz = 64, onTap, label }: {
  sky: Sky; cls?: string; say?: string; sub?: ReactNode; children?: ReactNode; foot?: ReactNode; hz?: number; onTap?: () => void; label?: string;
}) {
  return (
    <section className={`ld ${cls}`} data-sky={sky} style={{ ['--hz' as string]: `${hz}%` } as CSSProperties} aria-labelledby={say ? 'ld-say' : undefined} aria-label={say ? undefined : label} onClick={onTap}>
      <div className="ld-sky" aria-hidden="true"><i className="ld-stars" /><i className="ld-night" /></div>
      <div className="ld-glow" aria-hidden="true" />
      <div className="ld-ground" aria-hidden="true" />
      <div className="ld-stage">{children}</div>
      <header className="ld-top" onClick={e => e.stopPropagation()}>
        <Progress />
        <span className="ld-tools"><SoundToggle cls="ld-snd" /></span>
      </header>
      {say && <Speech text={say} sub={sub} />}
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

/** The user's cards, waiting under the horizon with their return times. Tapping a time moves it to the next choice. */
function Under({ items, editable = false }: { items: Item[]; editable?: boolean }) {
  const ob = useOb();
  const times = returnTimes(new Date());
  if (!items.length) return null;
  return (
    <ul className="ld-under" aria-label="Your cards, waiting under the line">
      {items.map((it, i) => (
        <li key={it.id} style={{ ['--i' as string]: i } as CSSProperties}>
          <Mini who={it.who} s={22} />
          <span className="t">{short(it.text, 26)}</span>
          {editable
            ? <button className="w" onClick={() => { const j = times.findIndex(t => t.at === it.back); const nx = times[(j + 1) % times.length]; ob.updateItem(it.id, { back: nx.at }); play('tick'); }} aria-label={`Comes back ${whenLabel(it.back, new Date())}. Change the time`}>{it.back ? whenLabel(it.back, new Date()) : 'No time'}</button>
            : <span className="w">{it.back ? whenLabel(it.back, new Date()) : ''}</span>}
        </li>
      ))}
    </ul>
  );
}

/** The user's card, with their own words on it. */
function Note({ item, text, cls = '', children, style }: { item?: Item; text?: string; cls?: string; children?: ReactNode; style?: CSSProperties }) {
  return (
    <div className={`ld-note ${cls}`} style={style}>
      <p className="ld-words-own">{text ?? item?.text}</p>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ 1. Hello: Keep climbs out of the horizon and says who it is */

const HELLO = ['I’m Keep. I’m an AI.', 'I hold on to things until they’re due. My crew does the legwork.', 'What should I call you?'];

function Title() {
  const ob = useOb();
  const rm = usePrefersReducedMotion();
  const after = useTimers();
  const [ph, setPh] = useState(rm ? 3 : 0); // 0 the line draws, 1 Keep climbs out, 2 the mark, 3 waiting for the tap, 4 Keep speaks
  const [line, setLine] = useState(0);
  const [k, setK] = useState<MState>('idle');
  const [name, setName] = useState(ob.name);
  const went = useRef(false);
  useEffect(() => { after(450, () => setPh(1)); after(1500, () => setPh(2)); after(2200, () => setPh(3)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const begin = () => {
    if (went.current) { if (ph === 4 && line < 2) { setLine(l => l + 1); } return; }
    went.current = true;
    if (soundOn()) unlock();
    setPh(4); setK('done'); play('rise');
    after(700, () => setK('idle'));
    after(2300, () => setLine(l => Math.max(l, 1)));
  };
  useEffect(() => { if (line === 2) setK('listening'); }, [line]);
  const done = (n: string) => { ob.setName(n); play('rise', { step: 3 }); ob.go('ask'); };
  if (ph < 4) return (
    <Scene sky="night" cls={`ld-title ph-${ph}`} hz={66} onTap={begin} label="Later">
      <div className="ld-above"><K s={250} st={k} cls="ld-tkeep" /></div>
      <span className="t-mark" aria-hidden="true"><wm-horizon variant="lower" state="idle" /></span>
      <p className="t-tag">Say later. It comes back ready.</p>
      <button className="t-go" onClick={e => { e.stopPropagation(); begin(); }}>
        <span className="sr">Later. Say later. It comes back ready. </span>Tap to start
        <small><Icon name="soundon" size={16} /> Sound on</small>
      </button>
    </Scene>
  );
  return (
    <Scene sky="night" cls="ld-title ld-hello" hz={66} say={HELLO[line]} onTap={begin}
      foot={line < 2
        ? <Hint>Tap to carry on</Hint>
        : <form className="ld-ask-name" onSubmit={e => { e.preventDefault(); if (name.trim()) done(name); }}>
            <label className="ld-field"><span className="sr">Your name</span>
              <input id="ob-name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="given-name" maxLength={24} autoFocus /></label>
            <button className="ld-btn primary" disabled={!name.trim()}>That’s me</button>
            <button type="button" className="ld-btn quiet sm" onClick={() => done('')}>Skip</button>
          </form>}>
      <div className="ld-above"><K s={250} st={k} cls="ld-tkeep talk" /></div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 2. Hand it over: the user's own words on a card */

const SUGGEST = ['Renew the car insurance', 'Reply to the school about the trip', 'Book the dentist'];
type Rec = { start: () => void; stop: () => void; lang: string; interimResults: boolean; processLocally?: boolean; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null };
/** Speech recognition, only where the browser can do it on the device; otherwise typing (and the keyboard's own dictation). */
function onDeviceSpeech(): (new () => Rec) | null {
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return SR && 'processLocally' in SR.prototype ? SR : null;
}

function Ask() {
  const ob = useOb();
  const after = useTimers();
  const [text, setText] = useState('');
  const [ph, setPh] = useState<'write' | 'going' | 'caught'>('write');
  const [listening, setListening] = useState(false);
  const card = useRef<HTMLDivElement>(null), area = useRef<HTMLTextAreaElement>(null), rec = useRef<Rec | null>(null);
  const SR = onDeviceSpeech();
  const drag = useRef<{ x: number; y: number; id: number; on: boolean } | null>(null);
  const hand = async () => {
    const t = text.trim(); if (!t || ph !== 'write') return;
    rec.current?.stop();
    ob.addItem(t);
    setPh('going'); play('deal');
    await flyInto(card.current, keepSvg());
    setPh('caught'); play('thup');
    after(2900, () => ob.go('plan'));
  };
  const listen = () => {
    if (!SR) return;
    if (listening) { rec.current?.stop(); return; }
    const r = new SR(); r.lang = 'en-GB'; r.interimResults = true; r.processLocally = true;
    r.onresult = e => setText(Array.from(e.results).map(x => x[0].transcript).join(' '));
    r.onend = () => setListening(false);
    rec.current = r; r.start(); setListening(true);
  };
  const down = (e: React.PointerEvent) => {
    if (ph !== 'write' || (e.target as HTMLElement).closest('textarea, button')) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, on: false };
    card.current?.setPointerCapture(e.pointerId); // a flick leaves the card at once, so capture from the first touch
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current, el = card.current; if (!d || d.id !== e.pointerId || !el) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.on && Math.hypot(dx, dy) < 6) return;
    d.on = true;
    setT(el, { x: dx, y: dy, r: dx / 20 });
  };
  const up = (e: React.PointerEvent) => {
    const d = drag.current, el = card.current; drag.current = null; if (!d || !el) return;
    if (!d.on) { area.current?.focus(); return; } // a tap on the card puts the cursor in it
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if ((dy < -50 || dx < -60) && text.trim()) { el.style.transform = ''; void hand(); return; }
    spring({ x: dx, y: dy, r: dx / 20 }, { x: 0, y: 0, r: 0 }, {}, { k: 520, c: 26 }, v => setT(el, v), () => { el.style.transform = ''; });
  };
  const hi = ob.name ? `Nice to meet you, ${ob.name}. ` : '';
  return (
    <Scene sky="clay" cls={`ld-ask ph-${ph}`} hz={70}
      say={ph === 'write' ? `${hi}What have you been putting off?` : 'Got it. That’s off your mind and on mine.'}
      onTap={() => ph === 'caught' && ob.go('plan')}
      foot={ph === 'write' ? <>
        <div className="ld-chips" role="group" aria-label="Or pick one">
          {SUGGEST.map(s => <button key={s} onClick={() => { setText(s); play('tick'); area.current?.focus(); }}>{s}</button>)}
        </div>
        <button className="ld-btn primary" disabled={!text.trim()} onClick={hand}>Hand it over</button>
      </> : <Hint show={ph === 'caught'}>Tap to carry on</Hint>}>
      <div className="ld-above"><K x={-120} s={170} st={ph === 'caught' ? 'done' : ph === 'going' ? 'listening' : 'waiting'} cls="ld-k-catch" /></div>
      {ph !== 'caught' && (
        <div ref={card} className={`ld-note big live ${text.trim() ? 'full' : ''}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={e => e.stopPropagation()}>
          <label className="sr" htmlFor="ob-thing">The thing you have been putting off</label>
          <textarea ref={area} id="ob-thing" value={text} maxLength={90} rows={3} placeholder="Type it here" onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void hand(); } }} />
          {SR && <button className={`ld-mic ${listening ? 'on' : ''}`} onClick={listen} aria-pressed={listening} aria-label={listening ? 'Stop listening' : 'Say it instead'}><Icon name="mic" size={20} /></button>}
          {text.trim() && <span className="ld-flick" aria-hidden="true"><Icon name="send" size={16} /> Flick it to Keep</span>}
        </div>
      )}
    </Scene>
  );
}

/* ------------------------------------------------------------------ 3. The plan: simple rules pick a crew member and three steps */

function Plan() {
  const ob = useOb();
  const after = useTimers();
  const it = ob.items[ob.items.length - 1] ?? ob.items[0];
  const [lines, setLines] = useState(reducedMotion() || ob.jumped ? 3 : 0);
  const [dealt, setDealt] = useState(reducedMotion() || ob.jumped);
  const crewRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (dealt || !it) return;
    after(500, () => { setDealt(true); play('deal'); });
    [0, 1, 2].forEach(i => after(1500 + i * 520, () => { setLines(i + 1); play('tick', { step: i * 3 }); }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { if (dealt && !ob.jumped) void fly(crewRef.current?.querySelector('svg'), keepSvg(), { dur: 640 }); }, [dealt]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!it) return null;
  const who = it.who;
  const say = who ? `${JOB[who]} This one’s for ${AGENTS[who].name}.` : 'I can’t tell what kind of job this is yet. I’ll keep it, and ask you one question later.';
  const chips = [it.found.date, it.found.person, it.found.amount].filter(Boolean) as string[];
  return (
    <Scene sky="navy" cls="ld-plan" hz={72} say={say} sub="Simple rules on this phone for now. The legwork starts once I have a home."
      foot={<button className="ld-btn primary" onClick={() => ob.go('when')} disabled={lines < 3}>Next</button>}>
      <div className="ld-above">
        <K x={who ? -138 : 118} s={who ? 120 : 190} st={who ? (dealt ? 'idle' : 'working') : 'thinking'} out={!!who && dealt} cls={who ? 'ld-k-side' : ''} />
        {who && <span ref={crewRef}><C who={who} x={124} s={196} st={lines >= 3 ? 'done' : dealt ? 'working' : 'idle'} cls={`ld-hero ${dealt ? 'in' : 'out'}`} /></span>}
      </div>
      <Note item={it} cls="plan" style={{ ['--x' as string]: who ? '-38px' : '-62px' } as CSSProperties}>
        {chips.length > 0 && <p className="ld-facts">{chips.map(c => <span key={c}>{c}</span>)}</p>}
        <p className="ld-plan-h">Plan</p>
        <ol className="ld-steps">
          {it.plan.map((p, i) => <li key={p} className={i < lines ? 'in' : ''}><i />{p}</li>)}
        </ol>
      </Note>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 4. Back when: a real time; it sinks under the line */

function When() {
  const ob = useOb();
  const after = useTimers();
  const it = ob.items[ob.items.length - 1] ?? ob.items[0];
  const times = returnTimes(new Date());
  const [ph, setPh] = useState<'pick' | 'gone'>(it?.back ? 'gone' : 'pick');
  const [own, setOwn] = useState(false);
  const [val, setVal] = useState(() => { const d = new Date(times[1].at); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T09:00`; });
  if (!it) return null;
  const pick = (at: number) => {
    if (!Number.isFinite(at) || ph !== 'pick') return;
    ob.updateItem(it.id, { back: at });
    setPh('gone'); play('later');
    after(900, () => play('thup', { vol: 0.5 }));
  };
  return (
    <Scene sky="deep" cls={`ld-when-s ph-${ph}`} hz={60}
      say={ph === 'pick' ? 'When do you want it back?' : 'Later. And I mean it.'}
      sub={ph === 'gone' ? 'Until I have a home, it comes back when you next open me.' : undefined}
      foot={ph === 'pick' ? <>
        <div className="ld-times">
          {times.map(t => <button key={t.id} className="ld-btn" onClick={() => pick(t.at)}><Icon name="clock" size={18} />{t.label}</button>)}
        </div>
        {own
          ? <div className="ld-row"><label className="ld-field grow"><span className="sr">Pick a date and time</span><input id="ob-when" type="datetime-local" value={val} onChange={e => setVal(e.target.value)} /></label>
              <button className="ld-btn primary" onClick={() => pick(new Date(val).getTime())}>Set</button></div>
          : <button className="ld-btn quiet sm" onClick={() => setOwn(true)}>Pick a time</button>}
      </> : <button className="ld-btn primary" onClick={() => ob.go('more')}>Carry on</button>}>
      <div className="ld-above">
        <K x={-112} s={150} st={ph === 'gone' ? 'rest' : 'waiting'} />
        <Note item={it} cls={`when ${ph === 'gone' ? 'sunk' : ''}`}>
          <span className="ld-who"><Mini who={it.who} s={24} />{it.who ? AGENTS[it.who].name : 'Keep'}</span>
          {it.back > 0 && <span className="ld-stamp"><Icon name="clock" size={14} /> Back {whenLabel(it.back, new Date())}</span>}
        </Note>
      </div>
      {ph === 'gone' && <Under items={[it]} />}
    </Scene>
  );
}

/* ------------------------------------------------------------------ 5. Anything else: the same, with less ceremony */

function More() {
  const ob = useOb();
  const [text, setText] = useState('');
  const [added, setAdded] = useState(0);
  const inRef = useRef<HTMLInputElement>(null);
  const times = returnTimes(new Date());
  const n = ob.items.length;
  const full = n >= 5;
  const add = () => {
    const t = text.trim(); if (!t || full) return;
    const it = ob.addItem(t);
    ob.updateItem(it.id, { back: times[1].at });
    setText(''); setAdded(a => a + 1);
    play('deal', { step: n * 2 });
    setTimeout(() => play('later', { vol: 0.4 }), 380);
    inRef.current?.focus();
  };
  const say = added === 0 ? 'Anything else on your mind?' : full ? 'That’s five. I’ll hold these.' : `${n} things off your mind. Anything else?`;
  return (
    <Scene sky="dawn" cls="ld-more" hz={56} say={say} sub={added > 0 ? 'Each one is back tomorrow at 08:30. Tap a time to change it.' : undefined}
      foot={<>
        {!full && <form className="ld-row" onSubmit={e => { e.preventDefault(); add(); }}>
          <label className="ld-field grow"><span className="sr">One more thing</span><input ref={inRef} id="ob-more" value={text} onChange={e => setText(e.target.value)} placeholder="One more thing" maxLength={90} autoComplete="off" /></label>
          <button className="ld-btn" disabled={!text.trim()}>Add</button>
        </form>}
        <button className="ld-btn primary" onClick={() => ob.go('terms')}>That’s all for now</button>
      </>}>
      <div className="ld-above">
        <K s={210} st={added ? 'done' : 'listening'} key={added} cls={added ? 'squash' : ''} />
        <span className="ld-count" aria-hidden="true" key={'c' + n}>{n}</span>
      </div>
      <Under items={ob.items} editable />
    </Scene>
  );
}

/* ------------------------------------------------------------------ 6. The terms, and what a yes will look like, on their own card */

const HOLD_MS = 1100;

function Terms() {
  const ob = useOb();
  const after = useTimers();
  const it = ob.items[0];
  const [ph, setPh] = useState<'wait' | 'hold' | 'done' | 'ready'>('wait');
  const h = useRef<{ done: () => void; cancel: () => void } | null>(null);
  const t = useRef(0);
  const start = () => {
    if (ph !== 'wait') return;
    setPh('hold'); h.current = hum(HOLD_MS);
    t.current = window.setTimeout(() => {
      h.current?.done(); h.current = null; setPh('done');
      // the confirmation always shows; the button to carry on arrives only after a beat, so a long hold cannot skip it
      after(900, () => setPh('ready'));
    }, HOLD_MS);
  };
  const stop = () => {
    if (!h.current) return;
    clearTimeout(t.current); h.current.cancel(); h.current = null; setPh('wait');
  };
  useEffect(() => () => { clearTimeout(t.current); h.current?.cancel(); }, []);
  if (!it) return null;
  const who = it.who;
  const done = ph === 'done' || ph === 'ready';
  return (
    <Scene sky="glow" cls={`ld-terms ph-${ph}`} hz={86}
      say={done ? 'Only practice. Nothing was sent.' : 'I’ll get things wrong sometimes. So nothing is sent, paid or deleted without your yes.'}
      foot={ph === 'ready'
        ? <button className="ld-btn primary" onClick={() => ob.go('doors')}>Carry on</button>
        : done ? <span className="ld-foot-space" />
          : <button className={`ld-hold ${ph === 'hold' ? 'on' : ''}`} style={{ ['--hold' as string]: `${HOLD_MS}ms` } as CSSProperties}
              onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); start(); }} onPointerUp={stop} onPointerCancel={stop} onPointerLeave={stop}
              onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } }}
              onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') stop(); }}>
              <i className="fill" /><span>Practice: hold to say yes</span>
            </button>}>
      <div className="ld-above"><K x={-128} s={130} st={done ? 'done' : ph === 'hold' ? 'listening' : 'waiting'} /></div>
      <div className={`ld-sheet ${done ? 'stamped' : ''}`}>
        <p className="ld-sheet-k">When the legwork is ready, a yes looks like this.</p>
        <div className="ld-sheet-card">
          <div className="hd"><Mini who={who} s={28} /><span>{who ? AGENTS[who].name : 'Keep'} asks</span></div>
          <h2>{it.text}</h2>
          <dl>
            <div><dt>Does</dt><dd>{it.plan[2]}</dd></div>
            <div><dt>Goes</dt><dd>30 seconds after you hold, unless you stop it</dd></div>
          </dl>
          {done && <span className="ld-practice">Practice</span>}
        </div>
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 7. The doors: a home of its own, announced before it happens */

function Doors() {
  const ob = useOb();
  return (
    <Scene sky="dawn" cls="ld-doors" hz={50} say="To do the legwork, I need a home. Yours, not ours."
      sub="About ten minutes on a computer: your Cloudflare account and your Anthropic key, billed to you up to a cap you set."
      foot={<>
        <button className="ld-btn primary" onClick={() => { play('rise'); ob.setPath('new'); ob.go('computer'); }}>Set up my home</button>
        <button className="ld-btn" onClick={() => { play('rise'); ob.setPath('returning'); ob.go('computer'); }}>I already have Later</button>
        <button className="ld-btn quiet sm" onClick={() => ob.toApp('skip')}>Look around first</button>
      </>}>
      <div className="ld-above">
        {CREW.map((w, i) => <C key={w} who={w} s={84} x={[-150, -104, 104, 150][i]} cls="hop" style={{ ['--i' as string]: i } as CSSProperties} />)}
        <K s={190} cls="wave" />
      </div>
      <Under items={ob.items} />
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
const things = (n: number) => `${n} thing${n === 1 ? '' : 's'}`;
const are = (n: number) => (n === 1 ? 'is' : 'are');

function Computer() {
  const ob = useOb();
  const after = useTimers();
  const back = ob.path === 'returning';
  const n = ob.items.length;
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
    wait: 'Set me up on a computer.', quiet: 'Your computer went quiet.', code: back ? 'Scan the code from your Later.' : 'My home is ready.',
    scan: 'Reading the code.', expired: 'That code has expired.', paired: back ? 'Paired. The crew are already at work.' : `Paired. Your ${things(n)} ${n === 1 ? 'is' : 'are'} moving in.`,
  }[phase];
  const sub = {
    wait: `Open later.sh/go there and type this code. Your ${things(n)} ${are(n)} safe on this phone.`, quiet: 'Run the installer again. It picks up where it stopped.',
    code: back ? 'On a paired device: Settings, then Add a phone.' : 'Scan the code your computer is showing.', scan: '',
    expired: 'Show a new code, then scan again.', paired: back ? '' : `Ledger checks the money. Your key is capped at ${usd(CAP)} a month.`,
  }[phase];
  return (
    <Scene sky="navy" cls={`ld-computer ph-${phase}`} say={say} sub={sub || undefined} hz={60}
      foot={<>
        {phase === 'wait' && <><Proto onClick={() => setPhase('code')}>Home created</Proto>
          <How>The installer puts Later in your own Cloudflare account and locks your Anthropic key and your spending cap there. When my home exists it shows a code, and this phone pairs. There is no Later server.</How></>}
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
        <b className="ld-phone">{n > 0 && <span className="ld-phone-n">{n}</span>}</b>
      </span>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 9 to 11. Mail, calendar, school: each ask names what it is for */

const GOOD_PW = 'abcd efgh ijkl mnop';

function useDealIn(who: AgentId) {
  useLayoutEffect(() => {
    const el = document.querySelector(`.ld .ld-hero svg`);
    void fly(el, keepSvg(), { delay: 260, dur: 680 });
    const t = setTimeout(() => play('deal'), reducedMotion() ? 0 : 260);
    return () => clearTimeout(t);
  }, [who]);
}

/** Which of the user's cards an ask helps with: the first one of these kinds. */
function helps(items: Item[], kinds: Kind[]) { return items.find(i => kinds.includes(i.kind)) ?? null; }

function Connect({ who, g, sky = 'navy', cls, say, sub, children, foot, st, finds }: {
  who: AgentId; g: G; sky?: Sky; cls: string; say: string; sub: ReactNode; children?: ReactNode; foot: ReactNode; st: 'idle' | 'checking' | 'ok' | 'bad'; finds?: string[];
}) {
  useDealIn(who);
  const cst: MState = st === 'bad' ? 'error' : st === 'checking' ? 'thinking' : st === 'ok' ? 'done' : 'idle';
  return (
    <Scene sky={sky} cls={`ld-connect ${cls} st-${st}`} say={say} sub={sub} hz={52} foot={foot}>
      <div className="ld-above">
        <K x={-112} s={150} st={st === 'ok' ? 'done' : 'idle'} cls="ld-k-side" />
        <span className="ld-hero-wrap"><C who={who} x={44} s={190} st={cst} cls="ld-hero" /></span>
        <span className={`ld-held ${st === 'ok' ? 'taken' : ''}`}><Icon name={g} size={30} stroke={1.8} /></span>
      </div>
      {st === 'ok' && finds && (
        <ul className="ld-finds" aria-label={`What ${AGENTS[who].name} found`}>
          {finds.map((f, i) => <li key={f} style={{ ['--i' as string]: i } as CSSProperties}><Mini who={who} s={22} />{f}</li>)}
        </ul>
      )}
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

const nextAfterCal = (items: Item[]) => items.some(i => i.kind === 'school' || /\b(school|nursery)\b/i.test(i.text)) ? 'school' : 'reading';

function Mail() {
  const ob = useOb();
  const after = useTimers();
  const [st, setSt] = useState<'idle' | 'checking' | 'ok' | 'bad'>(ob.mail ? 'ok' : 'idle');
  const [pw, setPw] = useState('');
  const card = helps(ob.items, ['message', 'school', 'money', 'general']) ?? ob.items[0];
  const go = () => {
    if (!pw || st === 'checking') return;
    setSt('checking');
    after(1200, () => {
      if (ob.take('wrong-password') || pw.replace(/\s/g, '').length !== 16) { setSt('bad'); play('thup'); return; }
      setSt('ok'); ob.setConn('mail', true); ob.place('wren');
      after(420, () => play('done'));
      after(900, () => play('tick', { step: 4 })); after(1100, () => play('tick', { step: 7 }));
    });
  };
  const starting = card ? `, starting with “${short(card.text, 30)}”` : '';
  return (
    <Connect who="wren" g="mail" cls="ld-mail" st={st}
      say={st === 'bad' ? 'Google said no to that password.' : st === 'ok' ? 'Mail connected. Wren found these.' : 'Can Wren read your mail?'}
      sub={st === 'bad' ? 'Paste the 16 letters again.' : st === 'ok' ? undefined : `To find what’s open and draft replies${starting}. Nothing is sent or deleted without you; remove the app password to stop.`}
      finds={[card ? `2 emails about “${short(card.text, 26)}”` : '2 emails waiting on a reply', '14 threads waiting on a reply']}
      foot={st === 'ok' ? <button className="ld-btn primary" onClick={() => ob.go('calendar')}>Carry on</button> : <>
        <Field id="ob-pw" label="Gmail app password" value={pw} set={v => { setPw(v); if (st === 'bad') setSt('idle'); }} placeholder="Gmail app password" paste={GOOD_PW} bad={st === 'bad'} onEnter={go} />
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
  const card = helps(ob.items, ['booking', 'health', 'travel']);
  const next = nextAfterCal(ob.items);
  const go = () => {
    if (!link || st === 'checking') return;
    setSt('checking');
    after(1000, () => {
      setSt('ok'); ob.setConn('cal', true); ob.place('scout');
      after(420, () => play('done'));
      after(900, () => play('tick', { step: 4 })); after(1100, () => play('tick', { step: 7 }));
    });
  };
  const first = ob.items.find(i => i.back > 0);
  return (
    <Connect who="scout" g="today" cls="ld-cal" st={st}
      say={st === 'ok' ? 'Calendar added. Scout found these.' : 'Can Scout see your calendar?'}
      sub={st === 'ok' ? undefined : `To find free times and spot clashes${card ? `, starting with “${short(card.text, 30)}”` : ''}. Read only; delete the private link to stop.`}
      finds={['You’re free Saturday morning', first ? `Nothing clashes with ${whenLabel(first.back, new Date())}` : 'Nothing clashes this week']}
      foot={st === 'ok' ? <button className="ld-btn primary" onClick={() => ob.go(next)}>Carry on</button> : <>
        <Field id="ob-ical" label="Private calendar link" value={link} set={setLink} placeholder="Private calendar link" paste="https://calendar.google.com/calendar/ical/example/basic.ics" onEnter={go} />
        <button className="ld-btn primary" disabled={!link || st === 'checking'} onClick={go}>{st === 'checking' ? 'Adding' : 'Add calendar'}</button>
        <div className="ld-row"><How>In Google Calendar, open Settings, choose your calendar, and copy the secret address in iCal format.</How>
          <button className="ld-btn quiet sm" onClick={() => ob.go(next)}>Skip</button></div>
      </>} />
  );
}

function School() {
  const ob = useOb();
  const after = useTimers();
  const [st, setSt] = useState<'idle' | 'ok'>(ob.school ? 'ok' : 'idle');
  const card = ob.items.find(i => i.kind === 'school' || /\b(school|nursery)\b/i.test(i.text));
  const yes = () => {
    setSt('ok'); ob.setConn('school', true); ob.place('juno');
    after(420, () => play('done'));
  };
  return (
    <Connect who="juno" g="cap" sky="dawn" cls="ld-school" st={st === 'ok' ? 'ok' : 'idle'}
      say={st === 'ok' ? 'Juno is watching for them.' : 'Juno can read the school’s emails too.'}
      sub={!ob.mail ? 'They come in by email, so this needs your mail first.' : st === 'ok' ? undefined : `For ${card ? `“${short(card.text, 30)}”` : 'school letters'} and anything like it. Nothing is sent without your yes.`}
      finds={['3 emails from the school this week', 'A trip letter with a form']}
      foot={st === 'ok' ? <button className="ld-btn primary" onClick={() => ob.go('reading')}>Carry on</button> : <>
        <button className="ld-btn primary" disabled={!ob.mail} onClick={yes}>Yes, watch for them</button>
        <button className="ld-btn quiet sm" onClick={() => ob.go('reading')}>Not now</button>
      </>} />
  );
}

/* ------------------------------------------------------------------ 12. Keep reads: finds narrated as they land; the cap is small */

const PASS_CAP = 1_000_000, PASS_USED = 420_000; // integer micro-USD, example data
const PASS_MS = 9000;
const BITS: G[] = ['mail', 'today', 'bill', 'cap', 'receipt', 'house', 'cake', 'plane'];
const FIND: Record<Kind, string> = { money: 'Found a renewal date', message: 'Found the thread it belongs to', booking: 'Found the booking page', health: 'Found the surgery’s booking page', home: 'Found two old quotes', travel: 'Found fare alerts', school: 'Found the trip letter', general: 'Found 3 related emails' };
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
  const lines = [
    ...ob.items.slice(0, 3).flatMap(i => [`Looking for “${short(i.text, 26)}”`, FIND[i.kind]]),
    'Found who Priya is', 'Found 14 threads waiting on you', 'Found 58 receipts since April',
  ];
  const shown = Math.min(lines.length, Math.max(1, Math.ceil(t * lines.length)));
  const last = useRef(0);
  useEffect(() => { if (shown > last.current) { if (last.current) play('tick', { step: shown % 7, vol: 0.5 }); last.current = shown; } }, [shown]);
  useEffect(() => {
    if (done) return;
    const i = setInterval(() => setT0(Math.min(1, (performance.now() - start.current) / PASS_MS)), 100);
    const b = setInterval(() => {
      if (reducedMotion()) return;
      const id = n.current++;
      setBits(v => [...v.slice(-7), { id, g: BITS[id % BITS.length], x: ((id * 73) % 260) - 130 }]);
    }, 420);
    return () => { clearInterval(i); clearInterval(b); };
  }, [done]);
  useEffect(() => { if (ob.take('learn-finish')) setT0(1); }, [ob.sim?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!done) return;
    play('done');
    after(1700, () => ob.go('found'));
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  const used = Math.round((PASS_USED * t) / 10_000) * 10_000;
  const who = ob.placed.length ? CREW.filter(w => ob.placed.includes(w)) : CREW;
  return (
    <Scene sky="deep" cls={`ld-reading ${done ? 'done' : ''}`} say={done ? 'That’s the first read.' : 'I’m reading your recent mail, newest first.'} hz={60}
      foot={<>
        <ul className="ld-log" aria-live="polite">
          {lines.slice(Math.max(0, shown - 3), shown).map((l, i, a) => <li key={l} className={i === a.length - 1 ? 'new' : ''}>{l.startsWith('Found') ? <Icon name="check" size={15} stroke={2.4} /> : <Icon name="search" size={15} />}{l}</li>)}
        </ul>
        <p className="ld-spend"><span className="num">{usd2(used)}</span> of a {usd2(PASS_CAP)} cap. Nothing is sent or deleted.</p>
        {!done && <Proto onClick={() => setT0(1)}>Finish reading</Proto>}
      </>}>
      <div className="ld-orbit-wrap">
        <svg className="ld-ring" viewBox="-140 -140 280 280" aria-hidden="true">
          <circle r={R} className="track" />
          <circle r={R} className="used" style={{ strokeDasharray: `${CIRC * (done ? 1 : t)} ${CIRC}` }} />
        </svg>
        <div className="ld-orbit" aria-hidden="true">
          {who.map((w, i) => (
            <span key={w} className="ld-orb" style={{ ['--a' as string]: `${(360 / who.length) * i + 30}deg` } as CSSProperties}>
              <span className="ld-c" data-who={w}><Crew who={w} size={58} state={done ? 'done' : 'working'} /></span>
            </span>
          ))}
        </div>
        <span className="ld-k ld-k-center"><Chief state={done ? 'done' : 'working'} size={160} /></span>
        {bits.map(b => <span key={b.id} className="ld-bit" style={{ ['--bx' as string]: `${b.x}px` } as CSSProperties}><Icon name={b.g} size={14} stroke={2} /></span>)}
      </div>
      <span className="sr" role="progressbar" aria-label="First read, spend against its cap" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((used / PASS_CAP) * 100)} />
    </Scene>
  );
}

/* ------------------------------------------------------------------ 13. What I found: Spaces with evidence, and what you told me */

const PROPOSED: { id: string; name: string; g: G; who: AgentId; why: string; job: string }[] = [
  { id: 'house', name: 'House move', g: 'house', who: 'scout', why: '6 emails from Hamptons and Bishop’s Move', job: 'Scout is chasing the survey date' },
  { id: 'mum', name: 'Mum’s 70th', g: 'cake', who: 'wren', why: 'Venue emails from The Old Mill', job: 'Wren drafted a reply to the venue' },
  { id: 'tax', name: 'Taxes 2026', g: 'receipt', who: 'ledger', why: '58 receipts since April', job: 'Ledger is matching October' },
  { id: 'japan', name: 'Japan in April', g: 'plane', who: 'juno', why: 'Fare alerts from 3 airlines', job: 'Juno is comparing fares' },
];

function Found() {
  const ob = useOb();
  const after = useTimers();
  const still = reducedMotion();
  const [dealt, setDealt] = useState(still ? 4 : 0);
  const [ph, setPh] = useState<'show' | 'check' | 'keep'>(still ? 'check' : 'show');
  useEffect(() => {
    if (still) return;
    PROPOSED.forEach((_, i) => after(400 + i * 420, () => { setDealt(i + 1); play('tick', { step: i * 3 }); }));
    after(400 + 4 * 420 + 200, () => setPh('check'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const gone = ob.gone;
  const kept = PROPOSED.filter(p => !gone.includes(p.id));
  const flick = (id: string) => { ob.setGone([...gone, id]); play('later', { vol: 0.6 }); };
  const keep = () => {
    setPh('keep'); play('deal');
    kept.forEach(p => ob.place(p.who));
    after(700, () => play('done'));
    after(1300, () => ob.go('deck'));
  };
  const drag = useRef<{ id: string; x: number; p: number; on: boolean } | null>(null);
  const down = (id: string) => (e: React.PointerEvent) => {
    if (ph !== 'check' || (e.target as HTMLElement).closest('button')) return;
    drag.current = { id, x: e.clientX, p: e.pointerId, on: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || d.p !== e.pointerId) return;
    const dx = e.clientX - d.x; if (!d.on && Math.abs(dx) < 6) return;
    const el = e.currentTarget as HTMLElement;
    d.on = true;
    el.style.translate = `${dx}px 0`;
  };
  const up = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null; if (!d || !d.on) return;
    const el = e.currentTarget as HTMLElement, dx = e.clientX - d.x;
    if (Math.abs(dx) > 80) { el.style.translate = ''; flick(d.id); return; }
    el.animate([{ translate: el.style.translate }, { translate: '0 0' }], { duration: 380, easing: 'cubic-bezier(.34,1.45,.64,1)' });
    el.style.translate = '';
  };
  return (
    <Scene sky="dawn" cls={`ld-found ph-${ph}`} hz={96} say={ph === 'keep' ? 'The crew are on them.' : 'Here’s what I found.'}
      sub={ph === 'check' ? 'Flick away anything that isn’t yours to keep.' : undefined}
      foot={ph === 'check' ? <button className="ld-btn primary" onClick={keep}>Keep {kept.length === PROPOSED.length ? 'all of it' : 'these'}</button> : null}>
      <div className="ld-found-body">
        <ul className="ld-spaces" aria-label="Spaces I found">
          {PROPOSED.map((p, i) => gone.includes(p.id) ? (
            <li key={p.id} className="ld-sp-gone"><span>{p.name}: flicked away</span><button onClick={() => ob.setGone(gone.filter(x => x !== p.id))}><Icon name="undo" size={14} /> Undo</button></li>
          ) : (
            <li key={p.id} className={`ld-sp ${i < dealt ? 'in' : ''}`} style={{ ['--i' as string]: i } as CSSProperties} onPointerDown={down(p.id)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
              <span className="glyph"><Icon name={p.g} size={20} stroke={1.9} /></span>
              <span className="txt"><b>{p.name}</b><small>{p.why}</small><span className="job"><Mini who={p.who} s={20} st={ph === 'keep' ? 'working' : 'idle'} />{p.job}</span></span>
              {ph === 'check' && <button className="ld-x" aria-label={`Not a Space: ${p.name}`} onClick={() => flick(p.id)}><Icon name="close" size={14} stroke={2.2} /></button>}
            </li>
          ))}
        </ul>
        {ob.items.length > 0 && (
          <div className={`ld-told ${dealt >= 4 ? 'in' : ''}`}>
            <p>Here’s what you told me</p>
            <ul>
              {ob.items.map(it => (
                <li key={it.id}>
                  <Mini who={it.who} s={22} />
                  <label className="sr" htmlFor={`ob-told-${it.id}`}>Edit what you told me</label>
                  <input id={`ob-told-${it.id}`} defaultValue={it.text} onBlur={e => { const v = e.target.value.trim(); if (v && v !== it.text) ob.updateItem(it.id, { text: v }); }} />
                  {ob.items.length > 1 && <button className="ld-x" aria-label={`Remove: ${it.text}`} onClick={() => ob.removeItem(it.id)}><Icon name="close" size={13} stroke={2.2} /></button>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ 14. You said later. Here it is. */

/** How far the legwork got (an example result in the prototype). Something the rules could not place starts with Keep's question. */
function statusOf(it: Item, i: number): { done: boolean; label: string } {
  if (!it.who) return [{ done: false, label: 'Needs your answer' }, { done: true, label: 'Done' }, { done: false, label: 'At the time you chose' }][i];
  return i < 2 ? { done: true, label: 'Done' } : { done: false, label: 'Ready for your yes' };
}

function Deck() {
  const ob = useOb();
  const after = useTimers();
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState<MState>('working');
  const it = ob.items[0];
  useLayoutEffect(() => {
    const els = box.current?.querySelectorAll<HTMLElement>('.ld-dc');
    // the user's own card is dealt first, then the rest behind it
    els && [...els].reverse().forEach((el, j) => { void fly(el, keepSvg(), { delay: 300 + j * 360, dur: 660, spin: -20 }); after(300 + j * 360, () => play('deal', { step: j * 2 })); });
    after(1600, () => { setK('done'); play('done'); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Scene sky="dawn" cls="ld-deck" hz={88} say="You said later. Here it is." sub={ob.items.length > 1 ? `And ${ob.items.length - 1} more, each at its time.` : undefined}
      foot={<button className="ld-btn primary" onClick={() => ob.toApp('handover')}>Open Today</button>}>
      <div className="ld-above"><K x={-130} s={110} st={k} /></div>
      <div className="ld-stack" ref={box}>
        <span className="ld-dc back" style={{ ['--j' as string]: 0 } as CSSProperties} aria-hidden="true" />
        <span className="ld-dc back" style={{ ['--j' as string]: 1 } as CSSProperties} aria-hidden="true" />
        {it && (
          <article className="ld-dc own" style={{ ['--j' as string]: 2 } as CSSProperties}>
            <div className="hd"><Mini who={it.who} s={26} st="done" /><span>{it.who ? AGENTS[it.who].name : 'Keep'}{it.back ? `, back ${whenLabel(it.back, new Date())}` : ''}</span></div>
            <h2>{it.text}</h2>
            <ul>
              {it.plan.map((p, i) => { const st = statusOf(it, i); return <li key={p} className={st.done ? 'done' : 'next'}>{st.done ? <Icon name="check" size={15} stroke={2.4} /> : <i />}<span>{p}</span><small>{st.label}</small></li>; })}
            </ul>
          </article>
        )}
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ Welcome back: Keep brings a card back at its time */

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
  const h = new Date().getHours();
  const hi = `${h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening'}${ob.name ? `, ${ob.name}` : ''}.`;
  const it = ob.back[0];
  const ready = ob.mail; // before a home, the legwork has not started, and Keep says so
  return (
    <div className="wb" onClick={ob.closeWelcome}>
      <div ref={ref} className="wb-card" role="dialog" aria-modal="true" aria-labelledby="wb-h" onClick={e => e.stopPropagation()} onKeyDown={e => e.key === 'Escape' && ob.closeWelcome()}>
        <span className="wb-keep"><Chief state={k} size={64} /></span>
        {it ? (
          <div>
            <h2 id="wb-h">{hi} You said later. Here it is.</h2>
            <p className="wb-own">{it.text}</p>
            <p>{!ready ? 'I couldn’t do the legwork yet. I need a home first.'
              : it.who ? `${AGENTS[it.who].name} has done the first two steps. ${it.plan[2]}.` : 'I looked for related mail. One question for you first.'}{ob.back.length > 1 ? ` ${ob.back.length - 1} more came back too.` : ''}</p>
          </div>
        ) : (
          <div>
            <h2 id="wb-h">{hi}</h2>
            <p>While you were out, Wren got Dave’s reply and Ledger filed two receipts. One thing needs you.</p>
          </div>
        )}
        <button className="btn primary block" onClick={ob.closeWelcome}>{it ? 'Got it' : 'Show me'}</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ the front door */

const VIEWS: Record<Step, () => JSX.Element | null> = {
  title: Title, ask: Ask, plan: Plan, when: When, more: More, terms: Terms,
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
