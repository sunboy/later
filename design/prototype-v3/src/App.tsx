import { useRef } from 'react';
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
  { id: 'spaces', label: 'Spaces', note: 'the crew, assigned' },
  { id: 'keep', label: 'Keep', note: 'talk, type, capture' },
  { id: 'thread', label: 'Thread', note: 'House move' },
  { id: 'approve', label: 'Approval', note: 'hold to send' },
  { id: 'templates', label: 'Templates', note: 'by rhythm' },
];
/** Each event changes mock data only. The client decides what grows, shrinks, merges, appears or recedes. */
const SIM: { id: SimEvent; label: string; short: string; note: string }[] = [
  { id: 'urgent', label: 'Something urgent arrives', short: 'Urgent', note: 'Keep deals a clay card on top; Next and the edition fold away.' },
  { id: 'finish', label: 'An agent finishes', short: 'Agent done', note: 'Its row becomes the result, hands Now a card, then leaves.' },
  { id: 'deadline', label: 'A deadline nears', short: 'Deadline', note: 'The deposit rises to the top and grows; its bar fills.' },
  { id: 'merge', label: 'Similar cards pile up', short: 'Pile up', note: 'Three receipts land one by one, then merge into one stack.' },
  { id: 'read', label: 'You open a read', short: 'Read', note: 'That piece grows in place; the rest of the edition recedes.' },
  { id: 'evening', label: 'Evening comes', short: 'Evening', note: 'Reading moves above deciding; cards shrink to compact.' },
  { id: 'clear', label: 'You clear everything', short: 'Clear all', note: 'The deck closes to a line; the edition takes the page.' },
  { id: 'assign', label: 'Keep assigns the crew', short: 'Assign', note: 'Juno is dealt into Reading list; the tile moves to Next.' },
  { id: 'reset', label: 'Start again', short: 'Reset', note: '' },
];

function ChiefButton() {
  const app = useApp();
  const landed = useFlash('chief');
  const dealing = useFlash('deal');
  const st = app.rec ? app.chiefState : landed ? 'done' : app.chiefState;
  const say = { idle: 'idle', waiting: 'something needs you', rest: 'resting', done: 'done', thinking: 'thinking', working: 'working', listening: 'listening', error: 'something went wrong' }[st];
  return (
    <button className={`chief-btn ${landed ? 'landed' : ''} ${dealing ? 'dealing' : ''}`} onClick={() => app.openChief(null)} aria-label={`Keep, ${say}. Talk, type or capture`}>
      <Chief state={st} size={56} out={app.crewOut} />
      <span className="chief-lbl">Keep</span>
    </button>
  );
}

function Sim({ bar = false }: { bar?: boolean }) {
  const app = useApp();
  return (
    <div className={bar ? 'simbar' : 'panel sim'} role="group" aria-label="Simulate an event">
      {!bar && <h2>Simulate</h2>}
      {bar && <span className="simbar-l">Simulate</span>}
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
      <p className="lede">The interface keeps time. What needs you rises and grows, what the crew have in hand shrinks to a line, and what can wait sinks to Later. Keep, the stack in the corner, deals the cards. Each crew member away working is a card missing from its stack.</p>
      <ul className="legend">
        <li><span className="chip-sw a" /><span><b>Needs you.</b> The heading of Now, an urgent card, a nearing deadline, the hold.</span></li>
        <li><span className="chip-sw b" /><span><b>The crew and Later.</b> Keep and the crew, the Later dock, the night edition, stories.</span></li>
        <li><span className="chip-sw p" /><span><b>Done or back, briefly.</b> A mark when something lands or returns. Never a resting state.</span></li>
      </ul>
      <nav className="panel switcher" aria-label="Screens">
        {SCREENS.map(s => (
          <button key={s.id} aria-current={app.chief.open ? (s.id === 'keep' && !app.chief.thread) || (s.id === 'thread' && !!app.chief.thread) : app.screen === s.id} onClick={() => {
            app.closeChief();
            if (s.id === 'keep') app.openChief(null);
            else if (s.id === 'thread') app.openChief('house');
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
