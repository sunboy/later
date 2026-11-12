/* The composer: lays out a validated view and moves the furniture between revisions.
   Shared blocks (same id) slide and resize from where they were; new blocks grow in, or are dealt from Keep when
   Keep composed the view; blocks that left recede. Springs run on the compositor as linear() easings. */
import { useLayoutEffect, useRef, type RefObject } from 'react';
import type { Placed } from './spec/types';
import { BlockBody } from './blocks/Blocks';
import { SPRING, reducedMotion } from './motion';

export type Arrival = 'grow' | 'deal';
interface Snap { x: number; y: number; w: number; h: number; clone: HTMLElement }

export interface Item { kind: 'block'; b: Placed }
export interface GroupLabel { kind: 'group'; id: string; label: string; action?: { text: string; run: () => void } }

export function Composer({ rev, items, arrival, dealFrom, hot, onHot, specOpen }: {
  rev: string;
  items: (Item | GroupLabel)[];
  arrival: Arrival;
  dealFrom: RefObject<HTMLElement | null>;
  hot: string | null;
  onHot: (id: string | null) => void;
  specOpen: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const ghosts = useRef<HTMLDivElement>(null);
  const lastRev = useRef(rev);
  const snaps = useRef<Map<string, Snap> | null>(null);

  // Last moment the old DOM exists: measure what is on screen now (mid-flight positions included) and keep a copy.
  if (lastRev.current !== rev && root.current && !snaps.current) {
    const base = root.current.getBoundingClientRect();
    const m = new Map<string, Snap>();
    root.current.querySelectorAll<HTMLElement>(':scope > [data-bid]').forEach(el => {
      const skin = el.querySelector<HTMLElement>(':scope > .skin') ?? el;
      const r = skin.getBoundingClientRect();
      const clone = el.cloneNode(true) as HTMLElement;
      m.set(el.dataset.bid!, { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height, clone });
    });
    snaps.current = m;
  }

  useLayoutEffect(() => {
    const el = root.current, gl = ghosts.current;
    const before = snaps.current;
    snaps.current = null;
    if (lastRev.current === rev || !el || !gl) { lastRev.current = rev; return; }
    lastRev.current = rev;
    const reduced = reducedMotion();
    const kids = Array.from(el.querySelectorAll<HTMLElement>(':scope > [data-bid]'));
    kids.forEach(k => k.getAnimations({ subtree: true }).forEach(a => { if (a.id === 'flip') a.cancel(); }));
    const base = el.getBoundingClientRect();
    const move = SPRING.move(), grow = SPRING.grow(), deal = SPRING.deal();
    const from = dealFrom.current?.getBoundingClientRect();
    let entering = 0;
    const seen = new Set<string>();

    kids.forEach(k => {
      const id = k.dataset.bid!;
      seen.add(id);
      const r = k.getBoundingClientRect();
      const n = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
      const o = before?.get(id);
      const skin = k.querySelector<HTMLElement>(':scope > .skin');
      const body = k.querySelector<HTMLElement>(':scope > .body');
      if (!o) {
        const i = entering++;
        if (reduced) { k.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, id: 'flip' }); return; }
        if (arrival === 'deal' && from) {
          const dx = from.left + from.width / 2 - (r.left + r.width / 2), dy = from.top + from.height / 2 - (r.top + 30);
          k.animate([
            { transform: `translate(${dx}px, ${dy}px) scale(.18) rotate(${i % 2 ? 9 : -9}deg)`, opacity: 0 },
            { opacity: 1, offset: 0.25 },
            { transform: 'none', opacity: 1 },
          ], { duration: deal.duration, easing: deal.easing, delay: 80 + i * 85, fill: 'backwards', id: 'flip' });
        } else {
          k.animate([{ transform: 'translateY(22px) scale(.94)', opacity: 0 }, { transform: 'none', opacity: 1 }],
            { duration: grow.duration, easing: grow.easing, delay: 120 + i * 70, fill: 'backwards', id: 'flip' });
        }
        return;
      }
      if (reduced) return;
      const dx = o.x - n.x, dy = o.y - n.y, dw = n.w - o.w, dh = n.h - o.h;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        k.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: move.duration, easing: move.easing, id: 'flip' });
      }
      if (skin && (Math.abs(dw) > 1 || Math.abs(dh) > 1)) {
        // the card itself resizes (absolute, so nothing else reflows); its contents are revealed or settle inside it
        skin.animate([{ width: `${o.w}px`, height: `${o.h}px` }, { width: `${n.w}px`, height: `${n.h}px` }], { duration: grow.duration, easing: grow.easing, id: 'flip' });
        if (body) {
          if (dh > 1 || dw > 1) {
            body.animate([{ clipPath: `inset(0 ${Math.max(0, dw)}px ${Math.max(0, dh)}px 0 round 22px)` }, { clipPath: 'inset(0 0 0 0 round 22px)' }],
              { duration: grow.duration, easing: grow.easing, id: 'flip' });
          } else {
            body.animate([{ opacity: 0.35, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)', id: 'flip' });
          }
        }
      }
    });

    // blocks that left recede from where they were last seen
    if (before && !reduced) {
      before.forEach((s, id) => {
        if (seen.has(id)) return;
        const g = s.clone;
        g.removeAttribute('data-bid');
        g.classList.add('ghost');
        Object.assign(g.style, { position: 'absolute', left: `${s.x}px`, top: `${s.y}px`, width: `${s.w}px`, height: `${s.h}px`, margin: '0', gridColumn: 'auto' });
        gl.appendChild(g);
        const a = g.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(14px) scale(.9)' }], { duration: 300, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
        a.onfinish = () => g.remove();
      });
    }
  });

  return (
    <div className={`view ${specOpen ? 'spec-on' : ''}`} ref={root} onMouseLeave={() => onHot(null)}>
      {items.map(it => it.kind === 'group' ? (
        <div key={`g:${it.id}`} data-bid={`g:${it.id}`} className="grp">
          <span>{it.label}</span>
          {it.action && <button className="grp-act" onClick={it.action.run}>{it.action.text}</button>}
        </div>
      ) : (
        <section key={it.b.id} data-bid={it.b.id}
          className={`blk t-${it.b.type} s-${it.b.size} e-${it.b.emphasis} span-${it.b.span} ${hot === it.b.id ? 'is-hot' : ''}`}
          onMouseEnter={() => onHot(it.b.id)} onFocus={() => onHot(it.b.id)}
          onClick={() => { if (specOpen) onHot(it.b.id); }}
          aria-label={it.b.type}>
          <div className="skin" aria-hidden="true" />
          <div className="body"><BlockBody b={it.b} /></div>
        </section>
      ))}
      <div className="ghosts" ref={ghosts} aria-hidden="true" />
    </div>
  );
}
