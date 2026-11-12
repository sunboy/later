import { useRef } from 'react';
import { AppProvider, useApp, useFlash, type Screen, type SimEvent } from './store';
import { ChiefSheet } from './screens/Chief';
import { Chief } from './Mascot';
import { Spaces } from './screens/Spaces';
import { Story } from './screens/Story';
import { Today } from './screens/Today';
import { Capture } from './screens/Capture';
import { Templates } from './screens/Templates';
import { Approve } from './screens/Approve';
import { Icon } from './icons';
import { Wordmark } from './Wordmark';
import { PALETTES, ThemeProvider, useTheme } from './theme';

const BASES: Screen[] = ['spaces', 'today', 'capture', 'templates'];
const SCREENS: { id: Screen | 'keep' | 'thread'; label: string; note: string }[] = [
  { id: 'today', label: 'Today', note: 'decide, then read' },
  { id: 'story', label: 'Story', note: 'House move' },
  { id: 'spaces', label: 'Spaces', note: 'the crew, assigned' },
  { id: 'keep', label: 'Keep', note: 'talk, type, capture' },
  { id: 'thread', label: 'Thread', note: 'House move' },
  { id: 'capture', label: 'Capture', note: 'voice' },
  { id: 'templates', label: 'Templates', note: 'by rhythm' },
  { id: 'approve', label: 'Approval', note: 'press and hold' },
];
const SIM: { id: SimEvent; label: string; note: string }[] = [
  { id: 'urgent', label: 'Something urgent arrives', note: 'a card is dealt, the rest recedes' },
  { id: 'finish', label: 'An agent finishes', note: 'its row lands and hands over a card' },
  { id: 'deadline', label: 'A deadline nears', note: 'that card rises and grows' },
  { id: 'evening', label: 'Evening comes', note: 'reading first, deciding shrinks' },
  { id: 'clear', label: 'You clear everything', note: 'the edition takes the page' },
  { id: 'reset', label: 'Start again', note: '' },
];

function ChiefButton() {
  const app = useApp();
  const landed = useFlash('chief');
  const st = landed ? 'done' : app.chiefState;
  const say = { idle: 'idle', waiting: 'something needs you', rest: 'resting', done: 'done', thinking: 'thinking', working: 'working', listening: 'listening', error: 'something went wrong' }[st];
  return (
    <button className={`chief-btn ${landed ? 'landed' : ''}`} onClick={() => app.openChief(null)} aria-label={`Keep, ${say}. Talk, type or capture`}>
      <Chief state={st} size={56} />
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
        <button key={e.id} onClick={() => app.simulate(e.id)} aria-pressed={e.id === 'evening' ? app.phase === 'evening' : undefined}>
          {bar ? e.label.replace('Something urgent arrives', 'Urgent').replace('An agent finishes', 'Agent done').replace('A deadline nears', 'Deadline').replace('Evening comes', 'Evening').replace('You clear everything', 'Clear all').replace('Start again', 'Reset') : e.label}
          {!bar && e.note && <small>{e.note}</small>}
        </button>
      ))}
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
      {b === 'capture' && <Capture />}
      {b === 'templates' && <Templates />}
      <nav className="tabbar" aria-label="Main">
        {(['today', 'spaces', 'templates'] as const).map(t => (
          <button key={t} className="tab" aria-current={b === t ? 'page' : undefined} onClick={() => app.go(t)}>
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
  const { palette } = useTheme();
  const p = PALETTES.find(x => x.id === palette)!;
  return (
      <aside className="stage-left" aria-label="About this direction">
        <Wordmark size={46} />
        <p className="lede">The interface keeps time. What needs you rises and grows, what the crew have in hand shrinks to a line, and what can wait sinks to Later. Keep, the stack in the corner, deals the cards.</p>
        <ul className="legend">
          <li><span className="chip-sw a" /><span><b>Needs you.</b> Now tiles, the one action on each, anything you must hold to confirm.</span></li>
          <li><span className="chip-sw b" /><span><b>The crew and Later.</b> What they hold, the night horizon things sink into, the stories they play you.</span></li>
          <li><span className="chip-sw p" /><span><b>Done or back.</b> A brief mark when something lands, never a resting state.</span></li>
        </ul>
        <p className="fine">{p.name}. {p.line}.</p>
      </aside>
  );
}

function Right() {
  const app = useApp();
  const t = useTheme();
  return (
      <aside className="stage-right" aria-label="Prototype controls">
        <div className="panel">
          <h2 id="pal-h">Palette</h2>
          <div className="palettes" role="group" aria-labelledby="pal-h">
            {PALETTES.map(p => (
              <button key={p.id} className="pal" data-palette-swatch={p.id} aria-pressed={t.palette === p.id} onClick={() => t.setPalette(p.id)}>
                <span className="sw" aria-hidden="true"><i className={`sw-${p.id}-a`} /><i className={`sw-${p.id}-b`} /><i className={`sw-${p.id}-p`} /></span>
                {p.name}
              </button>
            ))}
          </div>
          <div className="themeseg" role="group" aria-label="Theme">
            <button aria-pressed={t.theme === 'light'} onClick={() => t.setTheme('light')}>Light</button>
            <button aria-pressed={t.theme === 'dark'} onClick={() => t.setTheme('dark')}>Dark</button>
          </div>
          <div className="toggle">
            <span><b>Agents running</b>Off pauses the agents: their orbs stop and Next shows paused.</span>
            <button className="switch" role="switch" aria-checked={app.running} aria-label="Agents running" onClick={() => app.setRunning(!app.running)} />
          </div>
        </div>
        <Sim />
        <nav className="panel switcher" aria-label="Screens">
          {SCREENS.map(s => (
            <button key={s.id} aria-current={app.chief.open ? (s.id === 'keep' && !app.chief.thread) || (s.id === 'thread' && !!app.chief.thread) : app.screen === s.id} onClick={() => {
              app.closeChief();
              if (s.id === 'keep') app.openChief(null);
              else if (s.id === 'thread') app.openChief('house');
              else if (s.id === 'story') app.openStory('house');
              else if (s.id === 'approve') app.openApproval('deposit', 'today');
              else app.go(s.id);
            }}>{s.label}<small>{s.note}</small></button>
          ))}
        </nav>
        <p className="fine">Example data. Fire an event and watch Today rearrange. Press Later on a card and try “In 15 seconds”. Tap a ring to play that Space, and tap Keep to talk.</p>
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
