import { useEffect, useRef, useState } from 'react';
import { Liquid } from 'liquid-gooey';
import { AppProvider, useApp, type Screen } from './store';
import { Spaces } from './screens/Spaces';
import { Story } from './screens/Story';
import { Today } from './screens/Today';
import { Capture } from './screens/Capture';
import { Templates } from './screens/Templates';
import { Approve } from './screens/Approve';
import { Icon } from './icons';
import { Wordmark } from './Wordmark';

const BASES: Screen[] = ['spaces', 'today', 'capture', 'templates'];
const SCREENS: { id: Screen; label: string; note: string }[] = [
  { id: 'spaces', label: 'Spaces', note: 'rings, Now, Next, Later' },
  { id: 'story', label: 'Story', note: 'House move' },
  { id: 'today', label: 'Today', note: 'the deck' },
  { id: 'capture', label: 'Capture', note: 'voice' },
  { id: 'templates', label: 'Templates', note: 'by rhythm' },
  { id: 'approve', label: 'Approval', note: 'press and hold' },
];

function useToken(name: string) {
  const [v, setV] = useState('');
  useEffect(() => { setV(getComputedStyle(document.documentElement).getPropertyValue(name).trim()); }, [name]);
  return v;
}

function CaptureMenu({ open, setOpen }: { open: boolean; setOpen: (f: (o: boolean) => boolean) => void }) {
  const { go } = useApp();
  const fill = useToken('--raise-2');
  const items: { label: string; icon: 'mic' | 'type' | 'forward'; y: number }[] = [
    { label: 'Speak', icon: 'mic', y: -62 },
    { label: 'Type', icon: 'type', y: -118 },
    { label: 'Forward an email', icon: 'forward', y: -174 },
  ];
  const pick = () => { setOpen(() => false); go('capture'); };
  if (!fill) return null;
  return (
    <div className={`cap-slot ${open ? 'goo-open' : ''}`} onKeyDown={e => e.key === 'Escape' && setOpen(() => false)}>
      <Liquid fill={fill} blur={8} contrast={20} style={{ position: 'absolute', right: 0, bottom: 0, width: 52, height: 236 }}>
        {items.map((a, i) => (
          <Liquid.Item key={a.label} className="goo-sat" style={{ position: 'absolute', left: 0, bottom: 0 }} x={0} y={open ? a.y : 0} transition="bouncy" delay={i * 45}>
            <button className="goo-btn" onClick={pick} tabIndex={open ? 0 : -1} aria-hidden={!open} aria-label={a.label}>
              <Icon name={a.icon} size={20} />
              <span className="goo-label" style={{ bottom: 15 }}>{a.label}</span>
            </button>
          </Liquid.Item>
        ))}
        <Liquid.Item style={{ position: 'absolute', left: 0, bottom: 0 }}>
          <button className="goo-btn" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={open ? 'Close capture menu' : 'Capture something'}
            style={{ transform: open ? 'rotate(45deg)' : 'none', transition: 'transform .3s var(--spring)' }}>
            <Icon name="plus" size={22} stroke={2} />
          </button>
        </Liquid.Item>
      </Liquid>
    </div>
  );
}

function Phone() {
  const app = useApp();
  const base = useRef<Screen>('spaces');
  if (BASES.includes(app.screen)) base.current = app.screen;
  const b = base.current;
  const [menu, setMenu] = useState(false);
  return (
    <div className="phone" data-screen={app.screen}>
      <div className="statusbar" aria-hidden="true"><span className="num">09:41</span><span className="island" /><span style={{ fontSize: 13 }}>5G</span></div>
      {b === 'spaces' && <Spaces />}
      {b === 'today' && <Today />}
      {b === 'capture' && <Capture />}
      {b === 'templates' && <Templates />}
      <div className={`scrim ${menu ? 'open' : ''}`} hidden={!menu} style={{ zIndex: 24 }} onClick={() => setMenu(false)} />
      <nav className="tabbar" aria-label="Main">
        {(['today', 'spaces', 'templates'] as const).map(t => (
          <button key={t} className="tab" aria-current={b === t ? 'page' : undefined} onClick={() => app.go(t)}>
            <Icon name={t} size={21} />{t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
        <CaptureMenu open={menu} setOpen={setMenu} />
      </nav>
      {app.screen === 'story' && <Story key={app.storySpace ?? 'house'} />}
      {app.screen === 'approve' && <div className="screen" style={{ background: 'var(--ground)', zIndex: 45 }}><Approve /></div>}
    </div>
  );
}

function Left() {
  return (
      <aside className="stage-left" aria-label="About this direction">
        <Wordmark size={46} />
        <p className="lede">Colour is light, and light means something is alive or needs you. Everything else is quiet, layered black. Later has no light at all.</p>
        <ul className="legend">
          <li><span className="lamp ember" /><span><b>Ember</b>. Needs you: one warm light, on the thing that most needs a decision.</span></li>
          <li><span className="lamp prism" /><span><b>Prism</b>. An agent is working. Shown only while one really is.</span></li>
          <li><span className="lamp flare" /><span><b>Flare</b>. Done, or back on time. One pop that fades.</span></li>
          <li><span className="lamp unlit" /><span><b>Unlit</b>. Later. Narrow, light and at rest.</span></li>
        </ul>
      </aside>
  );
}

function Right() {
  const app = useApp();
  return (
      <aside className="stage-right" aria-label="Prototype controls">
        <nav className="switcher" aria-label="Screens">
          {SCREENS.map(s => (
            <button key={s.id} aria-current={app.screen === s.id} onClick={() => {
              if (s.id === 'story') app.openStory('house');
              else if (s.id === 'approve') app.openApproval('deposit', 'spaces');
              else app.go(s.id);
            }}>{s.label}<small>{s.note}</small></button>
          ))}
        </nav>
        <div className="toggle">
          <span><b>Agents running</b>Off pauses every orb, beam and working bot.</span>
          <button className="switch" role="switch" aria-checked={app.running} aria-label="Agents running" onClick={() => app.setRunning(!app.running)} />
        </div>
        <p className="fine">Prototype with example data. Flick a Now tile down to set it aside; try “In 15 seconds”. Tap a ring to play that Space.</p>
      </aside>
  );
}

export function App() {
  return (
    <AppProvider>
      <main className="stage">
        <Left />
        <Phone />
        <Right />
      </main>
    </AppProvider>
  );
}
