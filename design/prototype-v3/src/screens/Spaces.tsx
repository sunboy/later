import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { goneSpaces } from '../onboard/handed';
import { AGENTS, ALL_SPACES, SPACES, SPACE_META, type AgentId, type Space, type StoryCard } from '../data';
import { Icon } from '../icons';
import { Crew, type MState } from '../Mascot';
import { useApp, useFlash } from '../store';
import { reducedMotion, setT, spring, useFlip, usePrefersReducedMotion } from '../motion';
import { OutboxRow } from './Approve';

/** The view by place. Every Space is a stack on a desk.
    A Space that needs you is a face-up stack: its top card is the one thing it needs, with the action on it, and
    the edges underneath show how much more is waiting. Deal with the top card and the next rises on a spring.
    A Space with nothing for you is its crew member's card, saying what it is doing and when it next reaches you.
    A resting Space lies low and quiet, with the time it wakes. The desk is ordered by need, and size follows need. */

type Mode = 'stack' | 'crew' | 'rest';
type Size = 'lg' | 'md' | 'wide' | 'half' | 'third';
interface Row { s: Space; mode: Mode; queue: StoryCard[]; who: AgentId | null; job: { status: string; eta: string; working: boolean } | null; back: string; score: number }

function useDesk() {
  const app = useApp();
  const gone = goneSpaces();
  const list = (app.many ? ALL_SPACES : SPACES).filter(x => !gone.has(x.id));
  const rows: Row[] = list.map(s => {
    const queue = (app.stories[s.id] ?? []).filter(c => c.state === 'new');
    const who = app.staff[s.id];
    const run = app.next.find(n => n.spaceId === s.id && !app.finished.includes(n.id));
    const meta = SPACE_META[s.id];
    const job = run ? { status: run.status, eta: run.eta, working: !!run.orb && app.running } : meta?.doing ? { ...meta.doing, working: app.running } : null;
    const hot = app.deck.some(c => c.spaceId === s.id && (c.emphasis === 'urgent' || c.near));
    const mode: Mode = queue.length ? 'stack' : job && who ? 'crew' : 'rest';
    const back = app.later.find(l => l.spaceId === s.id)?.wake.replace(/^Wakes |^Back /, '').replace(/^You are off\. Wakes /, '') ?? meta?.back ?? 'When something changes';
    const score = (hot ? 100 : 0) + (queue.some(c => c.send || c.bill) ? 10 : 0) + queue.length;
    return { s, mode, queue, who, job, back: meta?.back ?? back, score };
  });
  const stacks = rows.filter(r => r.mode === 'stack').sort((a, b) => b.score - a.score);
  const crew = rows.filter(r => r.mode === 'crew').sort((a, b) => Number(b.job!.working) - Number(a.job!.working));
  const rest = rows.filter(r => r.mode === 'rest');
  // size follows need: the most pressing stack is large; the rest pair up; an odd one out lies wide
  const sized: { r: Row; size: Size }[] = [];
  stacks.forEach((r, i) => sized.push({ r, size: i === 0 ? 'lg' : 'md' }));
  const md = stacks.length - 1;
  if (md > 0 && md % 2 === 1) sized[sized.length - 1].size = 'wide';
  crew.forEach((r, i) => sized.push({ r, size: crew.length % 2 === 1 && i === crew.length - 1 ? 'wide' : 'half' }));
  rest.forEach(r => sized.push({ r, size: app.many ? 'third' : 'half' }));
  return { sized, stacks, crew, rest };
}

/** Fly an element in from Keep in the tab bar. */
function dealFrom(el: HTMLElement) {
  const c = document.querySelector('.chief-btn')?.getBoundingClientRect(), r = el.getBoundingClientRect();
  if (!c || reducedMotion()) return;
  el.animate([
    { transform: `translate(${c.left + c.width / 2 - (r.left + r.width / 2)}px, ${c.top + c.height / 2 - (r.top + r.height / 2)}px) scale(1.4) rotate(-20deg)` },
    { transform: 'translateY(-14px) rotate(4deg)', offset: 0.75 },
    { transform: 'none' },
  ], { duration: 820, easing: 'cubic-bezier(.3,.9,.3,1)' });
}

function Tile({ r, size }: { r: Row; size: Size }) {
  const app = useApp();
  const { s, mode, queue, who, job } = r;
  const top = queue[0];
  const n = queue.length;
  const edges = Math.min(Math.max(n - 1, 0), 3);
  const tileRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const mascotRef = useRef<HTMLSpanElement>(null);
  const prev = useRef<{ key: string; node: HTMLElement; top: number; left: number; w: number } | null>(null);
  const dir = useRef(1);
  const [stamp, setStamp] = useState<string | null>(null);
  const [nudge, setNudge] = useState(false);
  const simStamp = useFlash('stamp-' + (top?.id ?? '-'));
  const g1 = useFlash('staff-' + s.id), g2 = useFlash('ring-' + s.id), grown = g1 || g2;
  const hot = app.deck.some(c => c.spaceId === s.id && c.emphasis === 'urgent');
  const pending = top?.send && app.outbox.some(o => o.id === top.send && o.status === 'pending');
  const key = mode === 'stack' ? 'c-' + top.id : mode;

  // whenever the face changes, the old face is flung off and the new one rises on a spring
  useLayoutEffect(() => {
    const tile = tileRef.current, el = cardRef.current, p = prev.current;
    if (p && p.key !== key && tile && p.key.startsWith('c-') && !reducedMotion()) {
      const c = p.node;
      c.classList.add('dk-fly');
      Object.assign(c.style, { top: p.top + 'px', left: p.left + 'px', width: p.w + 'px' });
      tile.appendChild(c);
      const d = dir.current, st = { x: 0, y: 0, r: 0 }; let vy = -160, last = performance.now(); const t0 = last;
      const fly = (t: number) => {
        const dt = (t - last) / 1000; last = t;
        st.x += d * 1300 * dt; vy += 1900 * dt; st.y += vy * dt; st.r += d * 40 * dt;
        setT(c, st); c.style.opacity = String(Math.max(0, 1 - (t - t0) / 440));
        if (t - t0 < 440) requestAnimationFrame(fly); else c.remove();
      };
      requestAnimationFrame(fly);
      dir.current = 1;
      if (el && mode === 'stack') { setT(el, { y: 10, s: 0.95 }); spring({ y: 10, s: 0.95 }, { y: 0, s: 1 }, {}, { k: 430, c: 16 }, v => setT(el, v), () => { el.style.transform = ''; }); }
      else if (el) el.animate([{ transform: 'translateY(-12px) rotate(-1.5deg)' }, { transform: 'translateY(3px) rotate(.4deg)', offset: 0.6 }, { transform: 'none' }], { duration: 620, easing: 'cubic-bezier(.3,1.3,.5,1)' });
    }
    prev.current = el ? { key, node: el.cloneNode(true) as HTMLElement, top: el.offsetTop, left: el.offsetLeft, w: el.offsetWidth } : null;
  });

  // a quiet Space that gets something: its first card lands on the desk with one overshoot
  useLayoutEffect(() => {
    const ev = app.event, el = cardRef.current;
    if (!ev || ev.id !== s.id || Date.now() - ev.at > 500 || !el || reducedMotion()) return;
    if (ev.type === 'grow' && mode === 'stack') el.animate([{ transform: 'translateY(-34px) scale(.9) rotate(-3deg)', opacity: 0.2 }, { transform: 'translateY(4px) scale(1.01)', opacity: 1, offset: 0.7 }, { transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.2,.9,.3,1)' });
    if (ev.type === 'assign' && mascotRef.current) dealFrom(mascotRef.current);
  }, [app.event?.at]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!nudge) return; const t = setTimeout(() => setNudge(false), 2400); return () => clearTimeout(t); }, [nudge]);

  const act = () => {
    if (!top || stamp) return;
    if (top.send) { if (!pending) app.openApproval(top.send, 'spaces'); return; } // sends go to the fixed approval, held
    if (top.bill) { app.openStory(s.id, top.id); return; } // the pay slip is fixed and lives in the story
    setStamp(top.done.split('.')[0]);
    window.setTimeout(() => { setStamp(null); app.decideStory(s.id, top.id, 'done'); }, reducedMotion() ? 0 : 560);
  };
  const aside = (d = 1) => { if (!top) return; if (hot) { setNudge(true); return; } dir.current = d; app.setAside(s.id, top.id); };

  /* sideways drag sets the top card aside until tomorrow; the edge underneath lifts as it goes */
  const drag = useRef<{ x: number; y: number; id: number; on: boolean; moved: boolean } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('.dk-acts, .outrow')) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, on: false, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current, el = cardRef.current; if (!d || !el || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.on) {
      if (Math.abs(dx) < 7 && Math.abs(dy) < 7) return;
      if (Math.abs(dy) > Math.abs(dx)) { drag.current = null; return; }
      d.on = true; d.moved = true; el.setPointerCapture(e.pointerId); el.classList.add('dragging');
    }
    const w = el.offsetWidth, rx = hot ? Math.sign(dx) * Math.min(24, Math.abs(dx) * 0.15) : dx;
    setT(el, { x: rx, y: -Math.abs(rx) * 0.04, r: (rx / w) * 12 });
    const edge = tileRef.current?.querySelector('.dk-edge') as HTMLElement | null;
    if (edge && !hot) edge.style.translate = `0 ${-Math.min(1, Math.abs(dx) / (w * 0.5)) * 7}px`;
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current, el = cardRef.current; drag.current = null;
    if (!d || !el) return;
    const edge = tileRef.current?.querySelector('.dk-edge') as HTMLElement | null; if (edge) edge.style.translate = '';
    if (!d.on) return;
    el.classList.remove('dragging');
    const dx = e.clientX - d.x, w = el.offsetWidth;
    if (!hot && Math.abs(dx) > w * 0.32) { aside(Math.sign(dx)); return; }
    if (hot && Math.abs(dx) > 40) setNudge(true);
    const rx = hot ? Math.sign(dx) * Math.min(24, Math.abs(dx) * 0.15) : dx;
    spring({ x: rx, r: (rx / w) * 12 }, { x: 0, r: 0 }, {}, { k: 520, c: 24 }, v => setT(el, v), () => { el.style.transform = ''; });
  };

  const crewState: MState = !app.running ? 'rest' : job?.working ? 'working' : 'idle';
  const cls = `dk dk-${mode} sz-${size} ${grown ? 'grown' : ''}`;
  return (
    <div className={cls} ref={tileRef} data-flip={'sp-' + s.id} id={'tile-' + s.id} style={{ ['--n' as string]: edges }}>
      {mode === 'stack' && <>
        {Array.from({ length: edges }, (_, i) => <i key={i} className="dk-edge" style={{ ['--i' as string]: i + 1 }} aria-hidden="true" />)}
        <article ref={cardRef} key={top.id} className={`dk-card ${hot ? 'hot' : ''}`} aria-roledescription="card" aria-label={`${s.name}. ${n} waiting. ${top.title}`}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <button className="dk-open" onClick={() => { if (!drag.current?.moved) app.openStory(s.id, top.id); }} aria-label={`Open ${s.name}: ${n} waiting`}>
            <span className="dk-top">
              <span className="glyph"><Icon name={s.glyph} size={size === 'lg' ? 18 : 16} /></span>
              <b>{s.name}</b>
              <span className="dk-n num" aria-hidden="true">{n}</span>
            </span>
            <span className="dk-ask">{top.title}</span>
            {size === 'lg' && <span className="dk-meta">{top.kind}, {top.source.charAt(0).toLowerCase() + top.source.slice(1)}{who ? `, via ${AGENTS[who].name}` : ''}</span>}
          </button>
          {pending
            ? <OutboxRow id={top.send!} />
            : <div className="dk-acts">
                <button className={`btn primary sm ${size === 'md' ? 'block' : ''}`} onClick={act}>{size === 'lg' ? top.act : top.short ?? top.act}</button>
                {size !== 'md' && <button className="btn quiet sm" onClick={() => aside(1)}>Not now</button>}
              </div>}
          {nudge && <p className="dk-nudge">This one stays until you decide.</p>}
          {(stamp || simStamp) && <span className="dk-stamp" aria-hidden="true"><Icon name="check" size={15} />{stamp ?? top.done.split('.')[0]}</span>}
        </article>
      </>}
      {mode === 'crew' && who && job && (
        <button ref={cardRef as React.RefObject<HTMLButtonElement>} key="crew" className="dk-face" onClick={() => app.openChief(s.id)} aria-label={`${s.name}. ${AGENTS[who].name}: ${job.status}. Next reaches you ${job.eta}. Open the thread`}>
          <span className="dk-mascot" ref={mascotRef}><Crew who={who} state={crewState} size={36} /><em>{AGENTS[who].name}</em></span>
          <span className="dk-txt">
            <b><span className="glyph sm"><Icon name={s.glyph} size={13} /></span><span>{s.name}</span></b>
            <span>{job.working ? job.status : 'Waiting: ' + job.status.charAt(0).toLowerCase() + job.status.slice(1)}</span>
          </span>
          <span className="dk-when"><small>next</small><strong className="num">{job.eta}</strong></span>
        </button>
      )}
      {mode === 'rest' && (
        <button ref={cardRef as React.RefObject<HTMLButtonElement>} key="rest" className="dk-low" onClick={() => app.openChief(s.id)} aria-label={`${s.name}, resting. ${r.back}. Open the thread`}>
          <span className="glyph"><Icon name={s.glyph} size={14} /></span>
          <span className="dk-txt"><b>{s.name}</b><span>{who ? r.back : 'No one on it'}</span></span>
        </button>
      )}
    </div>
  );
}

export function Spaces() {
  const app = useApp();
  const { sized, stacks, crew, rest } = useDesk();
  const scroller = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  useFlip(scroller, sized.map(x => x.r.s.id + x.r.mode + x.size).join('|'));
  // events on this screen bring the Space that changes into view
  useEffect(() => {
    const ev = app.event; if (!ev || !ev.id || Date.now() - ev.at > 600 || !['assign', 'grow', 'settle'].includes(ev.type)) return;
    const t = window.setTimeout(() => {
      const el = scroller.current?.querySelector('#tile-' + ev.id) as HTMLElement | null, sc = scroller.current;
      if (el && sc) sc.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 140), behavior: reduced ? 'auto' : 'smooth' });
    }, ev.type === 'assign' ? 0 : 80);
    return () => clearTimeout(t);
  }, [app.event, reduced]);
  const waiting = stacks.reduce((a, r) => a + r.queue.length, 0);
  return (
    <div className="screen">
      <div className={`scroll no-dock desk-scroll ${app.many ? 'many' : ''}`} ref={scroller}>
        <div className="dk-head">
          <h1>Spaces</h1>
          <p><b>{stacks.length} need you</b>, {waiting} cards<br />{crew.length} with the crew, {rest.length} resting</p>
        </div>
        <div className="desk">
          {sized.map(({ r, size }, i) => (
            <Fragment key={r.s.id}>
              {r.mode === 'rest' && sized[i - 1]?.r.mode !== 'rest' && <p className="dk-div" data-flip="dk-div">Resting</p>}
              <Tile r={r} size={size} />
            </Fragment>
          ))}
        </div>
        <p className="fine dk-foot">Tap a stack to play it, or its button to act. Drag a top card aside for tomorrow. Sends and payments always open their fixed form.</p>
      </div>
    </div>
  );
}
