import { useEffect, useState } from 'react';

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(reducedMotion);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

export type Vec = Record<string, number>;

/** A small damped spring (semi-implicit Euler). Returns a cancel function. */
export function spring(
  from: Vec, to: Vec, v0: Vec, cfg: { k?: number; c?: number },
  onFrame: (s: Vec) => void, onDone?: () => void,
): () => void {
  const { k = 340, c = 24 } = cfg;
  if (reducedMotion()) { onFrame(to); onDone?.(); return () => {}; }
  const keys = Object.keys(to);
  const x: Vec = { ...from };
  const v: Vec = {};
  keys.forEach(key => { v[key] = v0[key] ?? 0; if (x[key] == null) x[key] = to[key]; });
  let last = performance.now();
  let raf = 0;
  const step = (t: number) => {
    const dt = Math.min(0.032, (t - last) / 1000); last = t;
    let moving = false;
    for (const key of keys) {
      const a = -k * (x[key] - to[key]) - c * v[key];
      v[key] += a * dt; x[key] += v[key] * dt;
      if (Math.abs(v[key]) > 0.02 || Math.abs(x[key] - to[key]) > 0.002) moving = true;
    }
    onFrame(x);
    if (moving) raf = requestAnimationFrame(step); else { onFrame(to); onDone?.(); }
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

export const setT = (el: HTMLElement, s: Vec) => {
  el.style.transform = `translate3d(${s.x ?? 0}px, ${s.y ?? 0}px, 0) rotate(${s.r ?? 0}deg) scale(${s.s ?? 1})`;
};

export const wait = (ms: number) => new Promise<void>(r => setTimeout(r, reducedMotion() ? 0 : ms));
