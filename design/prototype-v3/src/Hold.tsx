import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';
import { reducedMotion } from './motion';

/**
 * Press-and-hold confirm for anything that pays or sends. Never a tap.
 * Pointer: hold for `ms`. Keyboard: hold Space or Enter. Letting go early cancels.
 */
export function HoldButton({ label, ms = 1600, onDone, done }: { label: string; ms?: number; onDone: () => void; done: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  const st = useRef<{ t0: number; raf: number; p: number } | null>(null);
  const [holding, setHolding] = useState(false);
  const [hint, setHint] = useState('Press and hold. Letting go cancels.');

  const paint = (p: number) => ref.current?.style.setProperty('--p', String(p));

  const start = () => {
    if (done || st.current) return;
    setHolding(true); setHint('Keep holding');
    const t0 = performance.now();
    const s = { t0, raf: 0, p: 0 };
    st.current = s;
    const step = (t: number) => {
      // ease-in so the first moment is gentle and the commit is deliberate
      const lin = Math.min(1, (t - t0) / ms);
      s.p = lin < 0.5 ? 2 * lin * lin : 1 - Math.pow(-2 * lin + 2, 2) / 2;
      paint(s.p);
      if (lin >= 1) { st.current = null; setHolding(false); setHint(''); onDone(); return; }
      s.raf = requestAnimationFrame(step);
    };
    s.raf = requestAnimationFrame(step);
  };
  const stop = () => {
    const s = st.current; if (!s) return;
    cancelAnimationFrame(s.raf); st.current = null; setHolding(false);
    setHint('Let go early, so nothing happened. Hold until the bar fills.');
    // drain back
    const from = s.p, t0 = performance.now();
    if (reducedMotion()) { paint(0); return; }
    const drain = (t: number) => {
      const k = Math.min(1, (t - t0) / 320);
      paint(from * (1 - (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(drain);
    };
    requestAnimationFrame(drain);
  };
  useEffect(() => () => { if (st.current) cancelAnimationFrame(st.current.raf); }, []);
  useEffect(() => { if (done) paint(1); }, [done]);

  return (
    <div className="hold-wrap">
      <button ref={ref} className={`hold ${holding ? 'holding' : ''} ${done ? 'done' : ''}`} aria-describedby="hold-hint"
        aria-disabled={done}
        onPointerDown={e => { if (e.button === 0) { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); start(); } }}
        onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}
        onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } }}
        onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') stop(); }}
        onClick={e => e.preventDefault()}
        onContextMenu={e => e.preventDefault()}>
        <span className="fill" aria-hidden="true" />
        <span className="lbl">{done ? <><Icon name="check" size={18} />Done</> : label}</span>
      </button>
      <p className="hold-hint" id="hold-hint" aria-live="polite">{done ? '' : hint}</p>
    </div>
  );
}
