import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App';
import { SPRING } from './motion';

// the same springs drive CSS transitions inside blocks (chart lines, bars, meters)
const r = document.documentElement.style;
for (const [k, f] of Object.entries(SPRING)) { const s = f(); r.setProperty(`--sp-${k}`, s.easing); r.setProperty(`--sp-${k}-d`, `${s.duration}ms`); }

createRoot(document.getElementById('root')!).render(<App />);
