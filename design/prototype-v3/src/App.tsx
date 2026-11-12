import { useEffect, useRef, useState } from 'react';
import { PAIRINGS, FROM_FILE, applyPairing } from './type';
import { AppProvider, useApp, useFlash, type Screen, type SimEvent } from './store';
import { ChiefSheet } from './screens/Chief';
import { Chief } from './Mascot';
import { Spaces } from './screens/Spaces';
import { Story } from './screens/Story';
import { Today } from './screens/Today';
import { Templates } from './screens/Templates';
import { Approve } from './screens/Approve';
import { Icon } from './icons';
import { Wordmark } from './Wordmark';
import { PALETTES, ThemeProvider, useTheme } from './theme';

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
  const [id, setId] = useState(() => { try { return localStorage.getItem('later-type') ?? PAIRINGS[0].id; } catch { return PAIRINGS[0].id; } });
  useEffect(() => {
    const p = PAIRINGS.find(x => x.id === id) ?? PAIRINGS[0];
    applyPairing(p);
    try { localStorage.setItem('later-type', p.id); } catch { /* storage may be blocked */ }
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

function Sim({ bar = false }: { bar?: boolean }) {
  const app = useApp();
  return (
    <div className={bar ? 'simbar' : 'panel sim'} role="group" aria-label="Simulate an event">
      {!bar && <h2>Simulate</h2>}
      {bar && <span className="simbar-l">Simulate</span>}
      {bar && <TypeControl />}
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

function Phone() {
  const app = useApp();
  const base = useRef<Screen>('today');
  if (BASES.includes(app.screen)) base.current = app.screen;
  const b = base.current;
  return (
    <div className="phone" data-screen={app.screen}>
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
    </div>
  );
}

function Left() {
  const app = useApp();
  const { palette } = useTheme();
  const p = PALETTES.find(x => x.id === palette)!;
  return (
    <aside className="stage-left" aria-label="About this direction">
      <Wordmark size={46} />
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
      <AppProvider>
        <main className="stage">
          <Sim bar />
          <Left />
          <Phone />
          <Right />
        </main>
      </AppProvider>
    </ThemeProvider>
  );
}
