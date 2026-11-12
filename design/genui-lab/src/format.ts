import { useEffect, useRef, useState } from 'react';
import type { Money } from './spec/types';
import { reducedMotion } from './motion';

/** Integer pence to pounds. Whole pounds drop the pence. */
export const gbp = (minor: number, always = false) => {
  const whole = minor % 100 === 0 && !always;
  return '£' + (minor / 100).toLocaleString('en-GB', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 });
};
export const money = (m: Money) => gbp(m.minor);

export function fmt(v: number, f: 'money' | 'count' | 'days' | 'percent') {
  if (f === 'money') return gbp(Math.round(v));
  if (f === 'percent') return `${Math.round(v)}%`;
  return Math.round(v).toLocaleString('en-GB');
}

/** Tween a number when it changes, so a stat counts to its new value instead of jumping. */
export function useTween(target: number, ms = 750) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reducedMotion() || from.current === target) { from.current = target; setV(target); return; }
    const a = from.current, t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 4);
      const x = a + (target - a) * e;
      from.current = x; setV(x);
      if (k < 1) raf = requestAnimationFrame(step); else from.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/** Width of an element, kept current; charts draw in real pixels so strokes and type stay crisp at every size. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export const CREW_NAME = { keep: 'Keep', wren: 'Wren', scout: 'Scout', juno: 'Juno', ledger: 'Ledger' } as const;
