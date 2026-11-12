import { useEffect, useState } from 'react';

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useReducedMotion() {
  const [r, setR] = useState(reducedMotion);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = (e: MediaQueryListEvent) => setR(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return r;
}

/** A damped spring sampled into a CSS linear() easing, so the compositor can run it (WAAPI, no per-frame JS). */
export interface Spring { easing: string; duration: number }
const cache = new Map<string, Spring>();
export function spring(stiffness = 260, damping = 24, mass = 1): Spring {
  const key = `${stiffness}/${damping}/${mass}`;
  const hit = cache.get(key); if (hit) return hit;
  const dt = 1 / 120;
  let x = 0, v = 0, t = 0;
  const samples: number[] = [];
  while (t < 3) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * dt; x += v * dt; t += dt;
    samples.push(x);
    if (t > 0.25 && Math.abs(x - 1) < 0.0015 && Math.abs(v) < 0.02) break;
  }
  const step = Math.max(1, Math.round(samples.length / 48));
  const pts: string[] = ['0'];
  for (let i = step; i < samples.length - 1; i += step) pts.push(samples[i].toFixed(4));
  pts.push('1');
  const s = { easing: `linear(${pts.join(', ')})`, duration: Math.round(t * 1000) };
  cache.set(key, s);
  return s;
}

/** Springs used across the lab. Move is firm, grow has one soft overshoot, deal lands with a small bounce. */
export const SPRING = {
  move: () => spring(230, 26),
  grow: () => spring(200, 21),
  deal: () => spring(190, 17),
  soft: () => spring(140, 22),
};

export const wait = (ms: number) => new Promise<void>(r => setTimeout(r, reducedMotion() ? Math.min(ms, 120) : ms));
