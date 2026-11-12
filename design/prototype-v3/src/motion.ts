import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

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

/**
 * Layout motion for the generative behaviours. Every block marked [data-flip] is measured after each commit;
 * when the layout signature changes, blocks slide from where they were, blocks that grew are unveiled from their
 * old height, and new blocks rise in. The client owns this: agents only change data and hints.
 */
export function useFlip(scroller: RefObject<HTMLElement | null>, sig: string) {
  const prev = useRef(new Map<string, { top: number; left: number; h: number }>());
  const last = useRef(sig);
  useLayoutEffect(() => {
    const sc = scroller.current; if (!sc) return;
    const sr = sc.getBoundingClientRect(), base = sr.top - sc.scrollTop;
    const now = new Map<string, { top: number; left: number; h: number }>();
    const els = new Map<string, HTMLElement>();
    sc.querySelectorAll<HTMLElement>('[data-flip]').forEach(el => {
      const r = el.getBoundingClientRect();
      now.set(el.dataset.flip!, { top: r.top - base, left: r.left - sr.left, h: r.height }); els.set(el.dataset.flip!, el);
    });
    if (last.current !== sig && prev.current.size && !reducedMotion()) {
      now.forEach((n, id) => {
        const o = prev.current.get(id), el = els.get(id)!;
        if (!o) { el.animate([{ opacity: 0, transform: 'translateY(16px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 460, easing: 'cubic-bezier(.3,1.25,.4,1)' }); return; }
        const dy = o.top - n.top, dx = o.left - n.left, dh = n.h - o.h;
        if (Math.abs(dy) > 1 || Math.abs(dx) > 1) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 560, easing: 'cubic-bezier(.3,1.2,.4,1)' });
        if (dh > 2) el.animate([{ clipPath: `inset(-30px -30px ${dh}px -30px)` }, { clipPath: 'inset(-30px -30px -40px -30px)' }], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' });
        else if (dh < -2) el.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });
      });
    }
    prev.current = now; last.current = sig;
  });
}
