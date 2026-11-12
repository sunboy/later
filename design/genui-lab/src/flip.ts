import { useLayoutEffect, useRef } from 'react';
import { SPRING, reducedMotion } from './motion';

/**
 * Motion for the pieces inside a block (rows of a checklist, columns of a comparison, steps of a timeline).
 * Children marked [data-k] are measured just before React commits a new `dep`; afterwards each one slides from
 * where it was, and new ones grow in. Reading layout in render is deliberate: it is the last moment the old DOM exists.
 */
export function useInnerFlip<T extends HTMLElement>(dep: string) {
  const ref = useRef<T>(null);
  const prev = useRef<Map<string, DOMRect> | null>(null);
  const last = useRef(dep);
  if (last.current !== dep && ref.current && !prev.current) {
    const m = new Map<string, DOMRect>();
    ref.current.querySelectorAll<HTMLElement>('[data-k]').forEach(el => m.set(el.dataset.k!, el.getBoundingClientRect()));
    prev.current = m;
  }
  useLayoutEffect(() => {
    const root = ref.current;
    const before = prev.current;
    prev.current = null;
    if (last.current === dep) return;
    last.current = dep;
    if (!root || !before || reducedMotion()) return;
    const sp = SPRING.move();
    let n = 0;
    root.querySelectorAll<HTMLElement>('[data-k]').forEach(el => {
      const o = before.get(el.dataset.k!);
      const r = el.getBoundingClientRect();
      if (!o) {
        el.animate([{ opacity: 0, transform: 'translateY(10px) scale(.96)' }, { opacity: 1, transform: 'none' }],
          { duration: SPRING.grow().duration, easing: SPRING.grow().easing, delay: 90 + n++ * 45, fill: 'backwards' });
        return;
      }
      const dx = o.left - r.left, dy = o.top - r.top;
      const sx = r.width ? o.width / r.width : 1, sy = r.height ? o.height / r.height : 1;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.02 && Math.abs(sy - 1) < 0.02) return;
      const scale = Math.abs(sx - 1) > 0.02 || Math.abs(sy - 1) > 0.02;
      // slide from the old place; a piece that changed shape fades up rather than stretching its text
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: sp.duration, easing: sp.easing });
      if (scale) el.animate([{ opacity: 0.15 }, { opacity: 1 }], { duration: 420, delay: 60, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    });
  });
  return ref;
}
