import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Clamp, Issue, Placed, ViewSpec } from './spec/types';
import { validateView } from './spec/validate';
import { SPACES, STEP_LABEL, spaceById, type StepId } from './data/scenarios';
import { REQUESTS, matchRequest, type Refinement, type Request } from './data/requests';
import { CLAMPED, REJECTS } from './data/rejects';
import { Composer, type Arrival, type GroupLabel, type Item } from './Composer';
import { SpecJson } from './SpecPanel';
import { Chief, Crew, type MState } from './Mascot';
import { Icon } from './icons';
import { CREW_NAME } from './format';
import { wait, SPRING } from './motion';
import { describeChange } from './diff';

type Mode = { kind: 'space'; space: string; step: StepId } | { kind: 'answer'; req: string; ref?: string } | { kind: 'test'; id: string; space: string };
type Theme = 'dark' | 'light';
interface Shown { rev: number; spec: ViewSpec; placed: Placed[]; clamps: Clamp[]; from: string }
interface Refusal { title: string; issues: Issue[]; spec: unknown; agent: string }

const STEPS: StepId[] = ['before', 'today', 'eve', 'after'];
const readTheme = (): Theme => { try { return localStorage.getItem('genui-theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; } };
const reqById = (id: string) => REQUESTS.find(r => r.id === id)!;

function pinMerge(spec: ViewSpec, pin: { req: Request; ref?: Refinement } | undefined): ViewSpec {
  if (!pin) return spec;
  const src = (pin.ref ?? pin.req).spec;
  const extra = src.blocks.filter(b => b.type !== 'headline').map(b => ({ ...b, group: 'pinned' }));
  const [head, ...rest] = spec.blocks;
  const blocks = head?.type === 'headline' ? [head, ...extra, ...rest] : [...extra, ...spec.blocks];
  return { ...spec, groups: [...(spec.groups ?? []), { id: 'pinned', label: `Pinned from Keep: ${pin.req.pinLabel}` }], blocks: blocks.slice(0, 12) };
}

export function App() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('genui-theme', theme); } catch { /* storage may be blocked */ }
  }, [theme]);

  const [mode, setMode] = useState<Mode>({ kind: 'space', space: 'japan', step: 'today' });
  const [pins, setPins] = useState<Record<string, { req: Request; ref?: Refinement }>>({});
  const first = useMemo(() => { const r = validateView(spaceById('japan').steps[1].spec); return r.ok ? r : null; }, []);
  const [shown, setShown] = useState<Shown>({ rev: 0, spec: first!.spec!, placed: first!.value, clamps: first!.clamps, from: 'Juno sent' });
  const [arrival, setArrival] = useState<Arrival>('grow');
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [keep, setKeep] = useState<MState>('idle');
  const [bubble, setBubble] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [crewMood, setCrewMood] = useState<MState>('idle');
  const moodT = useRef(0);
  const [specOpen, setSpecOpen] = useState(false);
  const [hot, setHot] = useState<string | null>(null);
  const [ask, setAsk] = useState('');
  const [askOpen, setAskOpen] = useState(false);
  const [sheet, setSheet] = useState<null | 'lab' | 'spec'>(null);
  const [playing, setPlaying] = useState(false);
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 719px)').matches);
  useEffect(() => { const mq = window.matchMedia('(max-width: 719px)'); const on = () => setNarrow(mq.matches); mq.addEventListener('change', on); return () => mq.removeEventListener('change', on); }, []);

  const scroller = useRef<HTMLDivElement>(null);
  const shownRef = useRef(shown);
  const lastChange = useRef<string | null>(null);
  const bubbleT = useRef(0);
  shownRef.current = shown;
  const keepRef = useRef<HTMLDivElement>(null);
  const token = useRef(0);

  const present = useCallback((spec: unknown, how: Arrival, from: string, opts: { top?: boolean; title?: string } = {}) => {
    const r = validateView(spec);
    if (!r.ok) {
      setRefusal({ title: opts.title ?? 'A view', issues: r.issues, spec, agent: from });
      setKeep('error'); setTimeout(() => setKeep(k => (k === 'error' ? 'idle' : k)), 2600);
      return false;
    }
    setRefusal(null);
    setArrival(how);
    lastChange.current = describeChange(shownRef.current.placed, r.value);
    setShown(s => ({ rev: s.rev + 1, spec: r.spec!, placed: r.value, clamps: r.clamps, from }));
    if (opts.top) requestAnimationFrame(() => scroller.current?.scrollTo({ top: 0, behavior: 'smooth' }));
    return true;
  }, []);

  const spaceSpec = useCallback((space: string, step: StepId, p = pins) => {
    const s = spaceById(space);
    return pinMerge(s.steps.find(x => x.id === step)!.spec, step === 'today' ? p[space] : undefined);
  }, [pins]);

  const goSpace = (space: string, step: StepId = 'today', how: Arrival = 'grow', p = pins) => {
    token.current++; setBusy(false); setKeep('idle');
    if (!(mode.kind === 'space' && mode.space === space)) setBubble(null);
    const s = spaceById(space);
    setMode({ kind: 'space', space, step });
    clearTimeout(moodT.current);
    setCrewMood('working');
    moodT.current = window.setTimeout(() => setCrewMood(step === 'after' ? 'done' : 'idle'), 900);
    const same = mode.kind === 'space' && mode.space === space;
    present(spaceSpec(space, step, p), how, `${CREW_NAME[s.crew]} sent`, { top: !same });
    clearTimeout(bubbleT.current);
    if (same && lastChange.current) {
      setBubble(`${CREW_NAME[s.crew]} recomposed for ${s.steps.find(x => x.id === step)!.date}. ${lastChange.current}`);
      bubbleT.current = window.setTimeout(() => setBubble(null), 3200);
    }
  };

  const compose = async (req: Request, ref?: Refinement) => {
    const t = ++token.current;
    setAskOpen(false); setAsk(''); setBusy(true); setPlaying(false);
    setKeep('thinking');
    setBubble(ref ? `Changing this view: ${ref.label.toLowerCase()}` : `${req.reading}`);
    await wait(ref ? 700 : 1100);
    if (t !== token.current) return;
    setKeep('working');
    setMode({ kind: 'answer', req: req.id, ref: ref?.id });
    const spec = (ref ?? req).spec;
    present(spec, 'deal', 'Keep sent', { top: !ref });
    setBubble(ref
      ? `${lastChange.current ?? 'Same view.'} Written in advance for this prototype.`
      : `Composed ${spec.blocks.length} blocks for this. Written in advance for this prototype.`);
    await wait(spec.blocks.length * 85 + SPRING.deal().duration);
    if (t !== token.current) return;
    setKeep('done'); setBusy(false);
    await wait(1600);
    if (t !== token.current) return;
    setKeep('idle'); setBubble(null);
  };

  const submit = (text: string) => {
    const cur = mode.kind === 'answer' ? reqById(mode.req) : undefined;
    const m = matchRequest(text, cur);
    if (!m) {
      token.current++;
      setKeep('waiting'); setAskOpen(true);
      setBubble('This prototype only knows the examples below. In the product, Keep would compose a view for anything you ask.');
      setTimeout(() => setKeep(k => (k === 'waiting' ? 'idle' : k)), 2400);
      return;
    }
    void compose(m.req, m.ref);
  };

  const pin = () => {
    if (mode.kind !== 'answer') return;
    const req = reqById(mode.req);
    if (!req.pinTo) return;
    const ref = req.refine.find(r => r.id === mode.ref);
    const next = { ...pins, [req.pinTo]: { req, ref } };
    setPins(next);
    goSpace(req.pinTo, 'today', 'grow', next);
    setBubble(`Pinned to ${spaceById(req.pinTo).name}. It stays there until you unpin it.`);
    setTimeout(() => setBubble(null), 2600);
  };
  const unpin = (space: string) => {
    const next = { ...pins }; delete next[space];
    setPins(next);
    goSpace(space, 'today', 'grow', next);
  };

  const runTest = (id: string) => {
    const x = id === CLAMPED.id ? CLAMPED : REJECTS.find(r => r.id === id)!;
    const by = (x.spec as { composedBy?: keyof typeof CREW_NAME }).composedBy;
    const ok = present(x.spec, 'grow', `${by ? CREW_NAME[by] : 'An agent'} sent`, { title: x.title, top: true });
    if (ok) setMode({ kind: 'test', id, space: x.space });
    if (narrow) setSheet('spec'); else setSpecOpen(true);
  };

  // stepping a Space through time on its own
  useEffect(() => {
    if (!playing || mode.kind !== 'space') return;
    const i = STEPS.indexOf(mode.step);
    const t = setTimeout(() => {
      if (i === STEPS.length - 1) { setPlaying(false); return; }
      goSpace(mode.space, STEPS[i + 1]);
    }, i === -1 ? 0 : 2600);
    return () => clearTimeout(t);
  });

  const items = useMemo(() => {
    const out: (Item | GroupLabel)[] = [];
    let g: string | undefined;
    for (const b of shown.placed) {
      if (b.group !== g && b.group) {
        const label = shown.spec.groups?.find(x => x.id === b.group)?.label ?? '';
        const space = shown.spec.space;
        out.push({ kind: 'group', id: b.group, label, ...(b.group === 'pinned' && mode.kind === 'space' ? { action: { text: 'Unpin', run: () => unpin(space) } } : {}) });
      }
      g = b.group;
      out.push({ kind: 'block', b });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  const space = mode.kind === 'space' ? spaceById(mode.space) : mode.kind === 'test' ? spaceById(mode.space) : null;
  const curReq = mode.kind === 'answer' ? reqById(mode.req) : null;
  const curStep = mode.kind === 'space' ? space!.steps.find(s => s.id === mode.step)! : null;
  const specFrom = `${shown.from} this view. The app validated it, clamped the hints and drew every pixel.`;

  const toggleSpec = () => { if (narrow) setSheet(s => (s === 'spec' ? null : 'spec')); else setSpecOpen(o => !o); };

  /* ---------------- the phone ---------------- */
  const phone = (
    <div className={`phone ${narrow ? 'bare' : ''}`} data-busy={busy || undefined}>
      {!narrow && <div className="statusbar" aria-hidden="true"><span>09:41</span><span className="island" /><span>5G</span></div>}
      <header className="ph-head">
        {curReq ? (
          <>
            <button className="ph-back" onClick={() => goSpace(curReq.pinTo ?? 'japan')} aria-label="Back to Spaces"><Icon name="back" size={20} /></button>
            <div className="ph-title"><b>Keep</b><small>You asked: {curReq.refine.find(r => r.id === (mode as { ref?: string }).ref)?.label ?? curReq.label}</small></div>
          </>
        ) : space ? (
          <>
            <span className="glyph"><Icon name={space.glyph} size={18} /></span>
            <div className="ph-title"><b>{space.name}</b><small key={curStep?.date ?? 'test'} className="roll">{curStep ? curStep.date : 'Test view'}, with {CREW_NAME[space.crew]}</small></div>
            <span className="ph-crew"><Crew who={space.crew} size={30} state={crewMood} /></span>
          </>
        ) : null}
        {narrow && <button className="btn sm quiet lab-btn" onClick={() => setSheet('lab')}>Lab</button>}
        <button className={`spec-btn ${specOpen || sheet === 'spec' ? 'on' : ''}`} onClick={toggleSpec} aria-pressed={specOpen || sheet === 'spec'} aria-label="Show the spec">
          <Icon name="braces" size={18} /><span>Spec</span>
        </button>
      </header>
      {refusal && (
        <div className="refusal" role="status">
          <Icon name="lock" size={16} />
          <p><b>The app refused a view.</b> {refusal.issues[0].message} The last good view stands.</p>
        </div>
      )}
      <div className="ph-scroll" ref={scroller}>
        <Composer rev={String(shown.rev)} items={items} arrival={arrival} dealFrom={keepRef} hot={hot} onHot={setHot} specOpen={specOpen || sheet === 'spec'} />
        {curReq && (
          <div className="refine">
            <p className="refine-h">Change this view</p>
            {curReq.refine.filter(r => r.id !== (mode as { ref?: string }).ref).map(r => (
              <button key={r.id} className="refine-o" disabled={busy} onClick={() => compose(curReq, r)}>{r.label}<Icon name="arrow" size={16} /></button>
            ))}
            {(mode as { ref?: string }).ref && <button className="refine-o" disabled={busy} onClick={() => compose(curReq)}>Back to the first version<Icon name="undo" size={16} /></button>}
            {curReq.pinTo
              ? <button className="btn primary block pin-btn" disabled={busy} onClick={pin}><Icon name="pin" size={18} />Pin to {spaceById(curReq.pinTo).name}</button>
              : <p className="fine">This view spans several Spaces, so it stays with Keep.</p>}
          </div>
        )}
        <p className="honest">{curReq ? 'Example view, written in advance. In the product, Keep writes this spec from your Spaces and the app draws it.' : `Example composition. In the product, ${space ? CREW_NAME[space.crew] : 'an agent'} writes this spec and the app draws it.`}</p>
      </div>
      <div className={`askbar ${askOpen ? 'open' : ''}`}>
        {(askOpen || bubble) && (
          <div className="ask-pop">
            {bubble && <p className="bubble" aria-live="polite">{bubble}</p>}
            {askOpen && (
              <div className="examples" role="listbox" aria-label="Example requests">
                {REQUESTS.map(r => <button key={r.id} role="option" aria-selected={false} onClick={() => compose(r)}>{r.label}</button>)}
              </div>
            )}
          </div>
        )}
        <form className="ask" onSubmit={e => { e.preventDefault(); if (ask.trim()) submit(ask.trim()); else setAskOpen(o => !o); }}>
          <div className="ask-keep" ref={keepRef}><Chief state={keep} size={40} /></div>
          <label className="sr" htmlFor="ask">Ask Keep for a view</label>
          <input id="ask" value={ask} placeholder={curReq ? 'Change this view, or ask for another' : 'Ask Keep for a view'} autoComplete="off"
            onFocus={() => setAskOpen(true)} onChange={e => setAsk(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setAskOpen(false); }} />
          <button className="ask-go" type="submit" aria-label={ask.trim() ? 'Ask' : 'Show examples'} disabled={busy}><Icon name={ask.trim() ? 'send' : 'chev'} size={18} /></button>
        </form>
      </div>
    </div>
  );

  /* ---------------- controls ---------------- */
  const controls = (
    <div className="ctrl">
      <div className="intro">
        <h1>Generative UI lab</h1>
        <p>Agents send a <b>view spec</b>: typed blocks with data and two hints, size and emphasis. The app validates it, clamps it, lays it out and moves the furniture. These are example compositions; in the product an agent writes these specs.</p>
      </div>
      <section className="panel">
        <h2>Spaces, composed by their crew</h2>
        <div className="spaces">
          {SPACES.map(s => {
            const on = (mode.kind === 'space' || mode.kind === 'test') && mode.space === s.id;
            return (
              <button key={s.id} className={`sp ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => { setPlaying(false); goSpace(s.id, mode.kind === 'space' ? mode.step : 'today'); if (sheet) setSheet(null); }}>
                <span className="glyph"><Icon name={s.glyph} size={16} /></span>
                <span className="sp-n"><b>{s.name}</b><small>{s.deadline}</small></span>
                <Crew who={s.crew} size={24} state={on && busy ? 'working' : 'idle'} />
              </button>
            );
          })}
        </div>
        <h2 className="h-time">Step {space?.name ?? 'this Space'} through time</h2>
        <div className="time" role="radiogroup" aria-label="When">
          {STEPS.map(id => {
            const st = (space ?? spaceById('japan')).steps.find(s => s.id === id)!;
            const on = mode.kind === 'space' && mode.step === id;
            return (
              <button key={id} role="radio" aria-checked={on} className={`tm ${on ? 'on' : ''}`} disabled={mode.kind !== 'space'}
                onClick={() => { setPlaying(false); if (sheet) setSheet(null); if (mode.kind === 'space') goSpace(mode.space, id); }}>
                <i aria-hidden="true" /><b>{STEP_LABEL[id]}</b><small>{st.date}</small>
              </button>
            );
          })}
        </div>
        <button className="btn sm play" disabled={mode.kind !== 'space'} onClick={() => {
          if (playing) { setPlaying(false); return; }
          if (mode.kind === 'space') { if (sheet) setSheet(null); goSpace(mode.space, 'before'); setPlaying(true); }
        }}><Icon name={playing ? 'pause' : 'clock'} size={16} />{playing ? 'Stop' : 'Play the four moments'}</button>
      </section>
      <section className="panel">
        <h2>Ask Keep for a view</h2>
        <div className="reqs">
          {REQUESTS.map(r => {
            const on = mode.kind === 'answer' && mode.req === r.id;
            return (
              <div key={r.id} className={`rq ${on ? 'on' : ''}`}>
                <button className="rq-main" disabled={busy} onClick={() => { if (sheet) setSheet(null); void compose(r); }}>{r.label}</button>
                {on && r.refine.map(f => (
                  <button key={f.id} className={`rq-ref ${mode.kind === 'answer' && mode.ref === f.id ? 'cur' : ''}`} disabled={busy} onClick={() => { if (sheet) setSheet(null); void compose(r, f); }}>
                    <Icon name="arrow" size={14} />{f.label}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
        <p className="fine">Or type in the phone. Free text is matched to these examples by keywords; anything else gets a plain answer.</p>
      </section>
      <section className="panel looks">
        <div className="themeseg" role="radiogroup" aria-label="Theme">
          <button role="radio" aria-checked={theme === 'dark'} onClick={() => setTheme('dark')}>Dark</button>
          <button role="radio" aria-checked={theme === 'light'} onClick={() => setTheme('light')}>Light</button>
        </div>
        <p className="fine">Harbour palette. Motion follows your system’s reduced-motion setting.</p>
      </section>
    </div>
  );

  const refused = (
    <section className="panel refused">
      <h2>What the client refuses</h2>
      <p className="fine">Send each one to the phone. The validator decides; the view on screen stands unless the spec passes.</p>
      <div className="rj-list">
        {REJECTS.map(r => {
          const res = validateView(r.spec);
          const code = res.ok ? 'accepted' : res.issues[0].code;
          return (
            <button key={r.id} className={`rj ${mode.kind === 'test' && mode.id === r.id ? 'on' : ''} ${refusal?.title === r.title ? 'on' : ''}`} onClick={() => runTest(r.id)}>
              <span className="rj-t"><b>{r.title}</b><small>{r.why}</small></span>
              <span className="rj-c code">{code}</span>
            </button>
          );
        })}
        <button className={`rj ok ${mode.kind === 'test' && mode.id === CLAMPED.id ? 'on' : ''}`} onClick={() => runTest(CLAMPED.id)}>
          <span className="rj-t"><b>{CLAMPED.title}</b><small>{CLAMPED.why}</small></span>
          <span className="rj-c code">clamped</span>
        </button>
      </div>
    </section>
  );

  const spec = refusal
    ? <SpecJson spec={refusal.spec} hot={null} onHot={() => {}} clamps={[]} issues={refusal.issues} from={`${refusal.agent} this view. The app refused it.`} />
    : <SpecJson spec={shown.spec} hot={hot} onHot={setHot} clamps={shown.clamps} from={specFrom} />;

  if (narrow) {
    return (
      <div className="lab narrow">
        {phone}
        <div className={`scrim ${sheet ? 'open' : ''}`} onClick={() => setSheet(null)} aria-hidden="true" />
        <div className={`sheet ${sheet ? 'open' : ''} ${sheet === 'spec' ? 'is-spec' : ''}`} role="dialog" aria-modal="true" aria-label={sheet === 'spec' ? 'Spec' : 'Lab controls'} aria-hidden={!sheet}>
          <div className="sheet-top"><span className="grab" /><button className="btn sm quiet" onClick={() => setSheet(null)}><Icon name="close" size={16} />Close</button></div>
          <div className="sheet-body">{sheet === 'spec' ? spec : <>{controls}{refused}</>}</div>
        </div>
      </div>
    );
  }
  return (
    <div className={`lab ${specOpen ? 'with-spec' : ''}`}>
      <aside className="col-l">{controls}</aside>
      <main className="col-c">{phone}</main>
      <aside className="col-r">
        {specOpen ? <section className="panel spec-panel"><div className="spec-head"><h2>The spec</h2><button className="btn sm quiet" onClick={() => setSpecOpen(false)}><Icon name="close" size={16} />Hide</button></div>{spec}</section> : null}
        {refused}
      </aside>
    </div>
  );
}
