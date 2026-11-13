import { useEffect, useRef, useState } from 'react';
import { PAIRINGS, FROM_FILE, DEFAULT_PAIRING, applyPairing } from './type';
import { AppProvider, useApp, useFlash, type Screen, type SimEvent } from './store';
import { ChiefSheet } from './screens/Chief';
import { Chief } from './Mascot';
import { Spaces } from './screens/Spaces';
import { Story } from './screens/Story';
import { Today } from './screens/Today';
import { Templates } from './screens/Templates';
import { Approve } from './screens/Approve';
import { Icon } from './icons';
import './brand';
import { PALETTES, ThemeProvider, useTheme } from './theme';
import { ObProvider, OB_SIM, STEPS, useOb, type Step } from './onboard/flow';
import { Onboard, WelcomeBack } from './onboard/Onboard';
import { reducedMotion } from './motion';
import './onboard/onboard.css';
import { SoundToggle } from './onboard/Onboard';
import { play } from './sound';

const BASES: Screen[] = ['spaces', 'today', 'templates'];
const SCREENS: { id: Screen | 'keep' | 'thread'; label: string; note: string }[] = [
  { id: 'today', label: 'Today', note: 'decide, then read' },
  { id: 'story', label: 'Story', note: 'House move' },
  { id: 'spaces', label: 'Spaces', note: 'a desk of stacks' },
  { id: 'keep', label: 'Keep', note: 'talk, type, capture' },
  { id: 'thread', label: 'Thread', note: 'House move' },
  { id: 'approve', label: 'Approval', note: 'hold to send' },
  { id: 'templates', label: 'Templates', note: 'by rhythm' },
];
/** Each event changes mock data only. The client decides what grows, shrinks, merges, appears or recedes. */
const SIM: { id: SimEvent; label: string; short: string; note: string }[] = [
  { id: 'urgent', label: 'Something urgent arrives', short: 'Urgent', note: 'Keep deals a clay card on top; the crew line closes; the edition folds to a strip.' },
  { id: 'finish', label: 'An agent finishes', short: 'Agent done', note: 'The crew line opens on its result, hands you a card, then closes again.' },
  { id: 'deadline', label: 'A deadline nears', short: 'Deadline', note: 'The deposit rises to the top and grows; its bar fills.' },
  { id: 'merge', label: 'Similar cards pile up', short: 'Pile up', note: 'Three receipts land one by one, then merge into one stack.' },
  { id: 'read', label: 'You open a read', short: 'Read', note: 'That piece grows in place; the rest of the edition recedes.' },
  { id: 'evening', label: 'Evening comes', short: 'Evening', note: 'Reading moves above deciding; cards shrink; the drawer grows a line about tomorrow.' },
  { id: 'clear', label: 'You clear everything', short: 'Clear all', note: 'The deck closes to “That’s the lot”; the edition takes the page.' },
  { id: 'grow', label: 'A quiet Space gets something', short: 'Space grows', note: 'Garden fence grows from a crew card into a stack and moves up the desk.' },
  { id: 'settle', label: 'You clear a stack', short: 'Stack clears', note: 'Each top card goes, the next rises; it settles to a compact crew card.' },
  { id: 'assign', label: 'Keep assigns the crew', short: 'Assign', note: 'Juno is dealt into Reading list; it wakes from resting to working.' },
  { id: 'reset', label: 'Start again', short: 'Reset', note: '' },
];

function ChiefButton() {
  const app = useApp();
  const landed = useFlash('chief');
  const dealing = useFlash('deal');
  const dealt = useFlash('dealt');
  const st = app.rec ? app.chiefState : landed ? 'done' : app.chiefState;
  const say = { idle: 'idle', waiting: 'something needs you', rest: 'resting', done: 'done', thinking: 'thinking', working: 'working', listening: 'listening', error: 'something went wrong' }[st];
  return (
    <button className={`chief-btn ${landed ? 'landed' : ''} ${dealing ? 'dealing' : ''}`} onClick={() => app.openChief(null)} aria-label={`Keep, ${say}. Talk, type or capture`}>
      <Chief state={st} size={52} out={app.crewOut >= 2 || dealt} />
      <span className="chief-lbl">Keep</span>
    </button>
  );
}

/** The type switcher: one control swaps the display and text tokens. */
function TypeControl() {
  // the stored choice is keyed afresh, so viewers who had Mona Sans saved start on the founder's pairing
  const [id, setId] = useState(() => { try { const v = localStorage.getItem('later-type-2'); return v && PAIRINGS.some(p => p.id === v) ? v : DEFAULT_PAIRING.id; } catch { return DEFAULT_PAIRING.id; } });
  useEffect(() => {
    const p = PAIRINGS.find(x => x.id === id) ?? DEFAULT_PAIRING;
    applyPairing(p);
    try { localStorage.setItem('later-type-2', p.id); } catch { /* storage may be blocked */ }
    document.querySelectorAll('select.type-pick').forEach(s => { (s as HTMLSelectElement).value = p.id; });
    window.dispatchEvent(new CustomEvent('later-type', { detail: p.id }));
  }, [id]);
  useEffect(() => { const on = (e: Event) => setId((e as CustomEvent<string>).detail); window.addEventListener('later-type', on); return () => window.removeEventListener('later-type', on); }, []);
  return (
    <label className="typesel" title={FROM_FILE ? 'Pairings from design/brand/type-options.json' : 'Pairings from Google Fonts'}>
      <span>Type</span>
      <select className="type-pick" value={id} onChange={e => setId(e.target.value)} aria-label="Type pairing">
        {PAIRINGS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </label>
  );
}

/** While the front door is showing, Simulate fires its events instead: errors and the computer finishing. */
function ObSimPanel({ bar }: { bar: boolean }) {
  const ob = useOb();
  const jump = (step: Step) => ob.jump(step);
  const here = OB_SIM.filter(e => e.step === ob.step);
  const rest = OB_SIM.filter(e => e.step !== ob.step);
  const fire = (id: (typeof OB_SIM)[number]) => { if (id.step !== ob.step) jump(id.step); ob.simulate(id.id); };
  if (bar) return (
    <div className="simbar" role="group" aria-label="Front door controls">
      <label className="typesel"><span>Step</span>
        <select className="step-pick" value={ob.step} onChange={e => jump(e.target.value as Step)} aria-label="Jump to a front door step">
          {STEPS.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.label}</option>)}
        </select>
      </label>
      <button onClick={() => ob.toApp('skip')}>Skip to the app</button>
      <button className="reset" onClick={ob.replay}>Replay</button>
      {[...here, ...rest].map(e => <button key={e.id} aria-pressed={undefined} className={e.step === ob.step ? '' : 'far'} onClick={() => fire(e)}>{e.label}</button>)}
      <TypeControl />
    </div>
  );
  return (
    <div className="panel sim" role="group" aria-label="Simulate a front door event">
      <h2>Simulate</h2>
      {here.map(e => <button key={e.id} onClick={() => fire(e)}>{e.label}<small>{e.note}</small></button>)}
      {here.length > 0 && <p className="sim-sep">Elsewhere in the front door</p>}
      {rest.map(e => <button key={e.id} className="far" onClick={() => fire(e)}>{e.label}<small>{STEPS.find(x => x.id === e.step)!.label}: {e.note}</small></button>)}
      <p className="sim-moved">Nothing in the front door is sent, paid or deleted. Routines arrive paused.</p>
    </div>
  );
}

function Sim({ bar = false }: { bar?: boolean }) {
  const app = useApp();
  const ob = useOb();
  if (ob.mode === 'onboard') return <ObSimPanel bar={bar} />;
  return (
    <div className={bar ? 'simbar' : 'panel sim'} role="group" aria-label="Simulate an event">
      {!bar && <h2>Simulate</h2>}
      {bar && <span className="simbar-l">Simulate</span>}
      {bar && <TypeControl />}
      {bar && <button onClick={ob.replay}>Front door</button>}
      {bar && <button onClick={ob.welcomeBack}>Welcome back</button>}
      {bar && <button className="sp30" aria-pressed={app.many} onClick={() => app.setMany(!app.many)}>30 Spaces</button>}
      {SIM.map(e => (
        <button key={e.id} className={e.id === 'reset' ? 'reset' : ''} onClick={() => app.simulate(e.id)} aria-pressed={e.id === 'evening' ? app.phase === 'evening' : undefined}>
          {bar ? e.short : e.label}
          {!bar && e.note && <small>{e.note}</small>}
        </button>
      ))}
      {!bar && <p className="sim-moved" aria-live="polite">{app.event?.note ? <><b>What moved.</b> {app.event.note}</> : <>Consent never changes shape: the approval form, the hold, the pay slip and the send window stay fixed whatever happens.</>}</p>}
    </div>
  );
}

/** Arriving from the handover: a clean Today, and Keep in the tab bar deals the first card onto it. */
function useArrival() {
  const ob = useOb();
  const app = useApp();
  useEffect(() => {
    if (!ob.arrived) return;
    app.simulate('reset'); app.go('today');
    const t = setTimeout(() => {
      const card = document.querySelector('.phone .dcard') as HTMLElement | null, c = document.querySelector('.chief-btn')?.getBoundingClientRect();
      if (!card || !c || reducedMotion()) return;
      const r = card.getBoundingClientRect();
      card.animate([
        { transform: `translate(${c.left + c.width / 2 - (r.left + r.width / 2)}px, ${c.top + c.height / 2 - (r.top + r.height / 2)}px) scale(.12) rotate(-14deg)`, opacity: 0.5 },
        { transform: 'translateY(-8px) scale(1.02) rotate(.6deg)', opacity: 1, offset: 0.72 }, { transform: 'none', opacity: 1 },
      ], { duration: 720, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' });
    }, 60);
    return () => clearTimeout(t);
  }, [ob.arrived]); // eslint-disable-line react-hooks/exhaustive-deps
}

function Phone() {
  const ob = useOb();
  if (ob.mode === 'onboard') return (
    <div className="phone ob-phone" data-screen={'ob-' + ob.step}>
      <div className="statusbar" aria-hidden="true"><span className="num">09:41</span><span className="island" /><span style={{ fontSize: 13 }}>5G</span></div>
      <Onboard />
    </div>
  );
  return <AppPhone />;
}

function AppPhone() {
  const app = useApp();
  const ob = useOb();
  useArrival();
  // a card coming back from Later chimes; the app uses the same sounds as the front door, at half volume
  const prevLater = useRef(app.later.map(l => l.id));
  useEffect(() => {
    const gone = prevLater.current.filter(id => !app.later.some(l => l.id === id));
    if (gone.some(id => app.deck.some(c => c.id === id))) play('back', { vol: 0.5 });
    prevLater.current = app.later.map(l => l.id);
  }, [app.later]); // eslint-disable-line react-hooks/exhaustive-deps
  // the notification ask waits for the first thing that needs your yes
  const [ask, setAsk] = useState<'no' | 'ask' | 'done'>('no');
  useEffect(() => { if (app.screen === 'approve' && ask === 'no') setAsk('ask'); }, [app.screen]); // eslint-disable-line react-hooks/exhaustive-deps
  const base = useRef<Screen>('today');
  if (BASES.includes(app.screen)) base.current = app.screen;
  const b = base.current;
  return (
    <div className={`phone ${ob.arrived && Date.now() - ob.arrived < 1500 ? 'arriving' : ''}`} data-screen={app.screen}>
      <div className="statusbar" aria-hidden="true"><span className="num">09:41</span><span className="island" /><span style={{ fontSize: 13 }}>5G</span></div>
      {b === 'spaces' && <Spaces />}
      {b === 'today' && <Today />}
      {b === 'templates' && <Templates />}
      <nav className="tabbar" aria-label="Main">
        {(['today', 'spaces', 'templates'] as const).map(t => (
          <button key={t} className="tab" aria-current={b === t && !app.chief.open ? 'page' : undefined} onClick={() => { app.closeChief(); app.go(t); }}>
            <Icon name={t} size={21} />{t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
        <ChiefButton />
      </nav>
      {app.screen === 'story' && <Story key={app.storySpace ?? 'house'} />}
      <ChiefSheet />
      {app.screen === 'approve' && <div className="screen" style={{ background: 'var(--paper)', zIndex: 45 }}><Approve /></div>}
      {app.screen === 'approve' && ask === 'ask' && (
        <div className="notify-ask" role="dialog" aria-label="Notifications">
          <p>Want a nudge on this phone when something needs your yes?</p>
          <div><button className="btn primary sm" onClick={() => setAsk('done')}>Allow</button><button className="btn quiet sm" onClick={() => setAsk('done')}>Not now</button></div>
        </div>
      )}
      <WelcomeBack />
    </div>
  );
}

/** The front door in the chrome: jump to any step, skip to the app, replay, or reopen later in the day. */
function FrontDoor({ compact = false }: { compact?: boolean }) {
  const ob = useOb();
  return (
    <nav className="panel frontdoor" aria-label="Front door steps">
      <h2>Front door</h2>
      {!compact && <div className="fd-grid">
        {STEPS.map((s, i) => (
          <button key={s.id} title={s.note} aria-current={ob.mode === 'onboard' && ob.step === s.id ? 'step' : undefined} onClick={() => ob.jump(s.id)}>
            <span className="num">{i + 1}</span>{s.label}
          </button>
        ))}
      </div>}
      <div className="fd-acts">
        {compact && <select className="fd-pick" value="" onChange={e => e.target.value && ob.jump(e.target.value as Step)} aria-label="Jump to a front door step">
          <option value="">Jump to a step</option>
          {STEPS.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.label}</option>)}
        </select>}
        <button onClick={ob.replay}>Replay from the start</button>
        {ob.mode === 'onboard' && <button onClick={() => ob.toApp('skip')}>Skip to the app</button>}
        <button aria-pressed={!!ob.welcome} onClick={ob.welcomeBack}>Welcome back</button>
      </div>
    </nav>
  );
}

function Left() {
  const app = useApp();
  const ob = useOb();
  const { palette } = useTheme();
  const p = PALETTES.find(x => x.id === palette)!;
  if (ob.mode === 'onboard') return (
    <aside className="stage-left" aria-label="About the front door">
      <h1 className="mark-wm" aria-label="Later"><wm-horizon variant="lower" /></h1>
      <p className="lede">The front door. A five-scene story teaches one idea each, then two doors and seven short set-up steps. Keep is the guide; the crew it deals show how far you have come. Sound is synthesised, quiet and switchable.</p>
      <FrontDoor />
      <p className="fine">Example data. {p.name}. Nothing here sends, pays or deletes. Use Simulate for the errors.</p>
    </aside>
  );
  return (
    <aside className="stage-left" aria-label="About this direction">
      <h1 className="mark-wm" aria-label="Later"><wm-horizon variant="lower" /></h1>
      <p className="lede">One loud thing at a time. Today is what needs you, one card at a time; the crew’s work is one quiet line under it; then the edition. Anything can be set aside with a time to come back. Spaces is the same work by place: a desk of stacks, largest where you are needed.</p>
      <ul className="legend">
        <li><span className="chip-sw a" /><span><b>Needs you.</b> An urgent card, a nearing deadline, a stack’s count, the hold.</span></li>
        <li><span className="chip-sw b" /><span><b>Structure and the crew.</b> The tab bar, glyphs, primary actions, Keep and the crew, the night edition, stories.</span></li>
        <li><span className="chip-sw p" /><span><b>Done or back, briefly.</b> A mark when something lands or returns. Never a resting state.</span></li>
      </ul>
      <nav className="panel switcher" aria-label="Screens">
        {SCREENS.map(s => (
          <button key={s.id} aria-current={app.chief.open ? (s.id === 'keep' && !app.chief.thread) || (s.id === 'thread' && !!app.chief.thread) : app.screen === s.id} onClick={() => {
            app.closeChief();
            if (s.id === 'keep' || s.id === 'thread') { if (!BASES.includes(app.screen)) app.go('today'); app.openChief(s.id === 'keep' ? null : 'house'); }
            else if (s.id === 'story') app.openStory('house');
            else if (s.id === 'approve') app.openApproval('dave', 'today');
            else app.go(s.id);
          }}>{s.label}<small>{s.note}</small></button>
        ))}
      </nav>
      <FrontDoor compact />
      <p className="fine">Example data. {p.name}: {p.line}. Press Later on a card and try “In 15 seconds”. Tap a ring to play that Space, and tap Keep to talk.</p>
    </aside>
  );
}

function Right() {
  const app = useApp();
  const t = useTheme();
  return (
    <aside className="stage-right" aria-label="Prototype controls">
      <div className="panel">
        <div className="palettes" role="group" aria-label="Palette">
          {PALETTES.map(p => (
            <button key={p.id} className="pal" data-palette-swatch={p.id} aria-pressed={t.palette === p.id} onClick={() => t.setPalette(p.id)}>
              <span className="sw" aria-hidden="true"><i className={`sw-${p.id}-a`} /><i className={`sw-${p.id}-b`} /><i className={`sw-${p.id}-p`} /></span>
              {p.name}
            </button>
          ))}
        </div>
        <div className="chrome-row">
          <div className="themeseg" role="group" aria-label="Theme">
            <button aria-pressed={t.theme === 'light'} onClick={() => t.setTheme('light')}>Light</button>
            <button aria-pressed={t.theme === 'dark'} onClick={() => t.setTheme('dark')}>Dark</button>
          </div>
          <label className="toggle">
            <span>Agents running</span>
            <button className="switch" role="switch" aria-checked={app.running} aria-label="Agents running" onClick={() => app.setRunning(!app.running)} />
          </label>
        </div>
        <div className="chrome-row"><span className="chrome-l">Sound</span><SoundToggle /></div>
        <div className="chrome-row">
          <TypeControl />
          <label className="toggle">
            <span>30 Spaces</span>
            <button className="switch" role="switch" aria-checked={app.many} aria-label="Show 30 Spaces" onClick={() => app.setMany(!app.many)} />
          </label>
        </div>
      </div>
      <Sim />
    </aside>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppProvider><ObProvider>
        <main className="stage">
          <Sim bar />
          <Left />
          <Phone />
          <Right />
        </main>
      </ObProvider></AppProvider>
    </ThemeProvider>
  );
}
