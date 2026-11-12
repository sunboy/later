import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPE } from 'react';
import { ThinkingOrb } from 'thinking-orbs';
import { RETURNS, SPACES, space, AGENTS, type NextItem, type NowItem, type StoryCard } from '../data';
import { Icon } from '../icons';
import { Wordmark } from '../Wordmark';
import { useApp, useClock, useFlash } from '../store';
import { useTheme } from '../theme';
import { spring, usePrefersReducedMotion, wait } from '../motion';

/* ---------- ring ---------- */
export function RingSvg({ cards }: { cards: StoryCard[] }) {
  const waiting = cards.filter(c => c.state !== 'done');
  const n = waiting.length;
  const r = 29.5, C = 2 * Math.PI * r;
  if (!n) return <svg className="seg" viewBox="0 0 62 62" aria-hidden="true"><circle cx="31" cy="31" r={r} fill="none" className="seg-quiet" strokeWidth="1.2" /></svg>;
  const gap = n > 1 ? 6 : 0, len = C / n - gap;
  return (
    <svg className="seg" viewBox="0 0 62 62" aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
      {waiting.map((c, i) => (
        <circle key={c.id} cx="31" cy="31" r={r} fill="none"
          className={c.state === 'new' ? 'seg-ember' : 'seg-seen'}
          strokeWidth={c.state === 'new' ? 2.2 : 1.6} strokeLinecap="round"
          strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-i * (len + gap) - gap / 2}
          style={{ transition: 'stroke-dasharray .5s var(--ease), stroke-dashoffset .5s var(--ease)' }} />
      ))}
    </svg>
  );
}

function Rings() {
  const { stories, openStory } = useApp();
  const ordered = [...SPACES].sort((a, b) => {
    const wa = (stories[a.id] ?? []).filter(c => c.state === 'new').length;
    const wb = (stories[b.id] ?? []).filter(c => c.state === 'new').length;
    return (wb > 0 ? 1 : 0) - (wa > 0 ? 1 : 0);
  }).slice(0, 8);
  return (
    <div className="rings" role="list" aria-label="Spaces with something waiting">
      {ordered.map(s => <RingButton key={s.id} id={s.id} cards={stories[s.id] ?? []} onOpen={() => openStory(s.id)} />)}
    </div>
  );
}
function RingButton({ id, cards, onOpen }: { id: string; cards: StoryCard[]; onOpen: () => void }) {
  const s = space(id);
  const waiting = cards.filter(c => c.state !== 'done').length;
  const fresh = cards.filter(c => c.state === 'new').length;
  const flash = useFlash('ring-' + id);
  return (
    <div role="listitem">
      <button className={`ring ${fresh ? 'lit' : waiting ? '' : 'quiet'} ${flash ? 'flash' : ''}`} onClick={onOpen} disabled={!cards.length}
        aria-label={`${s.name}: ${waiting ? `${waiting} waiting, ${fresh} new` : 'nothing waiting'}`}>
        <span className="ring-disc"><RingSvg cards={cards} /><span className="core"><Icon name={s.glyph} size={20} /></span></span>
        <span className="ring-name">{s.name}</span>
      </button>
    </div>
  );
}

/* ---------- Now tile, with the flick to Later ---------- */
let pendingRise: string | null = null;

function NowTile({ item, span, top, onLater }: { item: NowItem; span: boolean; top: boolean; onLater: (id: string, el: HTMLElement) => void }) {
  const { openApproval, actNow, paid } = useApp();
  const reduced = usePrefersReducedMotion();
  const s = space(item.spaceId);
  const ref = useRef<HTMLDivElement>(null);
  const flash = useFlash(item.id);
  const [done, setDone] = useState(false);
  const drag = useRef<{ y0: number; x0: number; id: number; moved: boolean; samples: { y: number; t: number }[] } | null>(null);

  // rise back from the Later dock
  useLayoutEffect(() => {
    if (pendingRise !== item.id || !ref.current) return;
    pendingRise = null;
    const el = ref.current;
    const dock = document.querySelector('.dock') as HTMLElement | null;
    el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    if (!dock || reduced) return;
    requestAnimationFrame(() => {
      const a = el.getBoundingClientRect(), d = dock.getBoundingClientRect();
      el.animate([
        { transform: `translate(${d.left - a.left}px, ${d.top - a.top}px) scale(${Math.min(1, d.width / a.width)}, ${d.height / a.height})`, opacity: 0.2 },
        { transform: 'translateY(-6px) scale(1.01)', opacity: 1, offset: 0.8 },
        { transform: 'none', opacity: 1 },
      ], { duration: 720, easing: 'cubic-bezier(.2,.9,.3,1.05)' });
    });
  }, [item.id, reduced]);

  const onDown = (e: RPE) => {
    const onHandle = !!(e.target as HTMLElement).closest('.sink');
    if (!onHandle && (e.pointerType !== 'mouse' || (e.target as HTMLElement).closest('button'))) return;
    drag.current = { y0: e.clientY, x0: e.clientX, id: e.pointerId, moved: false, samples: [{ y: e.clientY, t: e.timeStamp }] };
  };
  const onMove = (e: RPE) => {
    const d = drag.current; const el = ref.current;
    if (!d || e.pointerId !== d.id || !el) return;
    const dy = e.clientY - d.y0;
    if (!d.moved && Math.abs(dy) < 6) return;
    if (!d.moved) { d.moved = true; el.classList.add('dragging'); el.setPointerCapture(e.pointerId); }
    d.samples.push({ y: e.clientY, t: e.timeStamp }); if (d.samples.length > 6) d.samples.shift();
    // resistance: free downward, stiff upward
    const k = dy > 0 ? dy * 0.62 : dy * 0.18;
    el.style.transform = `translate3d(0, ${k}px, 0) rotate(${Math.max(-1, Math.min(3.5, k / 34))}deg) scale(${1 - Math.min(0.05, Math.abs(k) / 1200)})`;
  };
  const onUp = (e: RPE) => {
    const d = drag.current; const el = ref.current;
    drag.current = null;
    if (!d || !el || e.pointerId !== d.id) return;
    if (!d.moved) { if ((e.target as HTMLElement).closest('.sink')) onLater(item.id, el); return; }
    el.classList.remove('dragging');
    const a = d.samples[0], b = d.samples[d.samples.length - 1];
    const v = b.t - a.t > 0 ? (b.y - a.y) / (b.t - a.t) : 0;
    const dy = e.clientY - d.y0;
    if (dy > 70 || (v > 0.55 && dy > 18)) { onLater(item.id, el); return; }
    const k = dy > 0 ? dy * 0.62 : dy * 0.18;
    spring({ y: k, r: k / 34 }, { y: 0, r: 0 }, { y: v * 1000 }, { k: 520, c: 26 },
      st => { el.style.transform = `translate3d(0, ${st.y}px, 0) rotate(${st.r}deg)`; },
      () => { el.style.transform = ''; });
  };

  const act = async () => {
    if (item.payment) { openApproval(item.payment, 'spaces'); return; }
    setDone(true);
    await wait(900);
    actNow(item.id);
  };
  // the first Now tile is the solid one: attention comes from colour and weight, not from an effect
  const hero = top && span;
  void paid;
  return (
    <div ref={ref} className={`tilewrap ${span ? 'span2' : ''} ${flash || done ? 'flash' : ''}`} data-id={item.id}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <div className="tile-edges" aria-hidden="true">
        {Array.from({ length: Math.min(3, item.depth - 1) }, (_, i) => <i key={i} style={{ ['--i' as string]: i + 1 }} />)}
      </div>
    <article className={`tile ${hero ? 'hero' : 'soft'}`} aria-label={`${s.name}: ${item.ask}`}>
        <div className="tile-top">
          <span className="glyph"><Icon name={s.glyph} size={17} /></span>
          <div className="who"><b>{s.name}</b>
            {item.backNote ? <small className="back">{item.backNote}</small> : <small>{AGENTS[space(item.spaceId).agent].name}, {item.at === 'now' ? 'just now' : item.at}</small>}
          </div>
          <button className={`sink ${span && !item.payment ? '' : 'icon-only'}`} aria-label={`Move ${s.name} to Later`}>
            <Icon name="sink" size={15} />{span && !item.payment && <span>Later</span>}
          </button>
        </div>
        <p className="tile-ask">{item.ask}</p>
        {span && item.payment === 'deposit' && !done ? (
          <div className="pay-line">
            <div className="pay-args"><b>£250.00</b><small>to The Old Mill Ltd, ref <span className="code">MUM70-DEP</span></small></div>
            <button className="btn primary" onClick={act}>Review and pay</button>
          </div>
        ) : <div className="tile-foot">
          {done
            ? <span className="flare-line"><Icon name="check" size={16} />{item.done}</span>
            : <button className={`btn primary ${span ? '' : 'block'}`} onClick={act}>{item.act}</button>}
          {span && !done && <span style={{ fontSize: 12, color: hero ? 'var(--on-a-2)' : 'var(--ink-3)' }}>{item.depth} in this stack</span>}
        </div>}
    </article>
    </div>
  );
}

/* ---------- Next row ---------- */
function NextRow({ item }: { item: NextItem }) {
  const { running } = useApp();
  const { theme } = useTheme();
  const s = space(item.spaceId);
  const flash = useFlash(item.id);
  const working = !!item.orb && running;
  const status = item.orb && !running ? 'Paused by you' : item.status;
  return (
    <div className={`nrow ${working ? '' : 'waiting'} ${flash ? 'flash' : ''}`} data-id={item.id} aria-busy={working}>
      <span className={`orb-slot ${working ? '' : 'still'}`}>
        {working
          ? <ThinkingOrb state={item.orb!} size={20} theme={theme} aria-hidden="true" />
          : <Icon name={s.glyph} size={16} />}
      </span>
      <div className="n-main">
        <span className="n-name">{s.name}</span>
        <span className="n-status">
          {AGENTS[item.agent].name}: {status}{item.progress && running ? <>. <span className="num">{item.progress[0]} of {item.progress[1]}</span> matched</> : null}
        </span>
      </div>
      <div className="n-when"><small>reaches you</small><strong>{item.eta}</strong><span>{item.day}</span></div>
    </div>
  );
}

/* ---------- screen ---------- */
export function Spaces() {
  const app = useApp();
  const { now, next, later } = app;
  const [sheetFor, setSheetFor] = useState<{ id: string; el: HTMLElement } | null>(null);
  const [laterOpen, setLaterOpen] = useState(false);
  const [settle, setSettle] = useState(false);
  const phoneRef = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const live = useRef<HTMLParagraphElement>(null);

  useEffect(() => { phoneRef.current = document.querySelector('.phone'); }, []);

  // announce returns
  useEffect(() => {
    const f = app.flash; if (!f || !live.current) return;
    if (now.some(n => n.id === f.id && n.backNote)) live.current.textContent = 'Back, as promised.';
  }, [app.flash, now]);

  const choose = async (ri: number) => {
    const target = sheetFor; setSheetFor(null);
    if (!target) return;
    const phone = phoneRef.current!, dock = phone.querySelector('.dock') as HTMLElement;
    const el = target.el;
    if (!reduced) {
      const p = phone.getBoundingClientRect(), a = el.getBoundingClientRect(), d = dock.getBoundingClientRect();
      const clone = el.cloneNode(true) as HTMLElement;
      clone.classList.add('flyer'); clone.classList.remove('dragging', 'flash');
      Object.assign(clone.style, { left: a.left - p.left + 'px', top: a.top - p.top + 'px', width: a.width + 'px', height: a.height + 'px', transform: 'none' });
      phone.appendChild(clone);
      el.style.visibility = 'hidden';
      app.toLater(target.id, ri);
      const anim = clone.animate([
        { transform: el.style.transform || 'none', opacity: 1 },
        { transform: 'translateY(-10px) scale(.97) rotate(-1.2deg)', opacity: 1, offset: 0.16 },
        { transform: `translate(${d.left + d.width - 70 - a.left}px, ${d.top + 8 - a.top}px) scale(${38 / a.width}, ${38 / a.height})`, opacity: 0.15 },
      ], { duration: 780, easing: 'cubic-bezier(.55,0,.3,1)', fill: 'forwards' });
      await anim.finished.catch(() => {});
      clone.remove();
      setSettle(true); setTimeout(() => setSettle(false), 800);
    } else {
      app.toLater(target.id, ri);
    }
    if (live.current) live.current.textContent = 'Resting in Later.';
  };
  const cancel = () => {
    const el = sheetFor?.el; setSheetFor(null);
    if (el) spring({ y: 60 }, { y: 0 }, {}, { k: 420, c: 24 }, st => { el.style.transform = `translate3d(0, ${st.y}px, 0)`; }, () => { el.style.transform = ''; });
  };
  const rise = (id: string) => { pendingRise = id; setLaterOpen(false); app.bringBack(id, false); };
  const clock = useClock(!!later.find(l => l.backAt) || laterOpen);
  // on-time demo returns also rise from the dock
  useEffect(() => {
    const due = later.find(l => l.backAt && l.backAt - clock < 1100);
    if (due) pendingRise = due.id;
  }, [clock, later]);

  const soon = later.find(l => l.backAt);
  const secs = soon ? Math.max(0, Math.ceil((soon.backAt! - clock) / 1000)) : 0;
  const top = now.find(n => n.payment);
  const nowOrdered = top ? [top, ...now.filter(n => n !== top)] : now;

  return (
    <div className="screen">
      <div className="scroll">
        <div className="sp-head">
          <Wordmark size={30} />
          <span className="avatar-me" aria-label="Your profile, Sam Reid">SR</span>
        </div>
        <p className="sp-date">Thu 12 Nov. <b>{now.length} need you</b>, {next.filter(n => n.orb && app.running).length} on the way, {later.length} resting.</p>
        <Rings />

        <section className="band" aria-labelledby="h-now">
          <div className="band-head"><h2 className="h-now" id="h-now">Now</h2><p>needs you</p></div>
          <div className="now-grid">
            {nowOrdered.length
              ? nowOrdered.map((n, i) => <NowTile key={n.id} item={n} top={i === 0} span={i === 0 || (i === nowOrdered.length - 1 && i % 2 === 1)} onLater={(id, el) => setSheetFor({ id, el })} />)
              : <div className="empty-now">That is the lot. Nothing needs you until 14:00.</div>}
          </div>
        </section>

        <section className="band band-next" aria-labelledby="h-next">
          <div className="band-head"><h2 className="h-next" id="h-next">Next</h2><p>the agents have these</p></div>
          <div className="next-list">
            {next.map(n => <NextRow key={n.id} item={n} />)}
          </div>
        </section>
        <p ref={live} className="sr" role="status" aria-live="polite" />
      </div>

      <button className={`dock ${settle ? 'settle' : ''}`} onClick={() => setLaterOpen(true)} aria-label={`Later: ${later.length} resting. Open the list`}>
        <span className="h-later">Later</span>
        <span className="txt"><b>{later.length} resting</b><br />{soon ? <span className="soon">One back in {secs} second{secs === 1 ? '' : 's'}</span> : 'Next back Monday 08:30'}</span>
        <span className="glyphs" aria-hidden="true">{later.slice(0, 4).map(l => <span key={l.id} className="glyph"><Icon name={space(l.spaceId).glyph} size={13} /></span>)}</span>
        <Icon name="chev" size={18} />
      </button>

      {/* return-time sheet */}
      <div className={`scrim ${sheetFor ? 'open' : ''}`} hidden={!sheetFor} onClick={cancel} />
      <div className={`sheet ${sheetFor ? 'open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="ret-h" hidden={!sheetFor} onKeyDown={e => e.key === 'Escape' && cancel()}>
        <div className="bezel"><div className="well">
          <h3 className="h-later" id="ret-h">Set it down until</h3>
          <p>It rests in Later and comes back up on its own.</p>
          {RETURNS.map((r, i) => (
            <button key={r.label} className={`opt ${r.demo ? 'try' : ''}`} onClick={() => choose(i)} autoFocus={i === 0}>
              <span>{r.label}</span><em className={r.demo ? '' : 'num'}>{r.when}</em>
            </button>
          ))}
          <button className="btn quiet" onClick={cancel}>Keep it in Now</button>
        </div></div>
      </div>

      {/* Later list sheet */}
      <div className={`scrim ${laterOpen ? 'open' : ''}`} hidden={!laterOpen} onClick={() => setLaterOpen(false)} />
      <div className={`sheet ${laterOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="later-h" hidden={!laterOpen} onKeyDown={e => e.key === 'Escape' && setLaterOpen(false)}>
        <div className="bezel"><div className="well">
          <h3 className="h-later" id="later-h" style={{ fontSize: 36 }}>Later</h3>
          <p>Resting. Each one comes back up when it said it would.</p>
          {later.map(l => (
            <div key={l.id} className="lrow">
              <span className="glyph"><Icon name={space(l.spaceId).glyph} size={16} /></span>
              <div><div className="l-name">{l.from ? l.from.ask : space(l.spaceId).name}</div>
                <div className="l-wake">{l.backAt ? `Back in ${Math.max(0, Math.ceil((l.backAt - clock) / 1000))} seconds` : l.wake}</div></div>
              <button className="btn icon sm" onClick={() => rise(l.id)} aria-label={`Bring ${space(l.spaceId).name} back now`}><Icon name="rise" size={17} /></button>
            </div>
          ))}
          <button className="btn quiet" onClick={() => setLaterOpen(false)}>Close</button>
        </div></div>
      </div>
    </div>
  );
}
