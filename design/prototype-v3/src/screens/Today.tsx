import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AGENTS, EDITION, FOLLOWING, RETURNS, space, type DeckCard, type NextItem, type Snippet } from '../data';
import { Icon } from '../icons';
import { Chief, Crew } from '../Mascot';
import { Rings } from '../Rings';
import { useApp, useClock, useFlash } from '../store';
import { reducedMotion, setT, spring, useFlip, usePrefersReducedMotion, wait } from '../motion';

type Undo = { card: DeckCard; how: 'done' | 'later'; line: string };
type Size = 'hero' | 'regular' | 'compact';

/* ---------- Now: the deck. One decision at a time; size is a hint the client honours ---------- */
function Deck({ size, onLater }: { size: Size; onLater: (id: string, el: HTMLElement) => void }) {
  const app = useApp();
  const { deck } = app;
  const [undo, setUndo] = useState<Undo | null>(null);
  const [enter, setEnter] = useState<'rise' | 'undo' | null>(null);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const top = deck[0];
  const edges = Math.min(Math.max(deck.length - 1, 0), 3);
  const flash = useFlash(top?.id ?? '-');

  useLayoutEffect(() => {
    const el = cardRef.current; if (!el || !enter) return;
    if (enter === 'rise') { setT(el, { y: 9, s: 0.955 }); spring({ y: 9, s: 0.955 }, { y: 0, s: 1 }, {}, { k: 430, c: 17 }, v => setT(el, v), () => { el.style.transform = ''; }); }
    else { setT(el, { x: -360, r: -12 }); spring({ x: -360, r: -12 }, { x: 0, r: 0 }, {}, { k: 300, c: 22 }, v => setT(el, v), () => { el.style.transform = ''; }); }
    setEnter(null);
  }, [enter, top?.id]);

  // an urgent card is dealt from the chief; a promoted card rises through the stack
  useLayoutEffect(() => {
    const ev = app.event, el = cardRef.current;
    if (!ev || !el || Date.now() - ev.at > 400 || reducedMotion() || ev.id !== top?.id) return;
    if (ev.type === 'urgent') {
      const c = document.querySelector('.chief-btn')?.getBoundingClientRect(), r = el.getBoundingClientRect();
      if (!c) return;
      el.animate([
        { transform: `translate(${c.left + c.width / 2 - (r.left + r.width / 2)}px, ${c.top + c.height / 2 - (r.top + r.height / 2)}px) scale(.12) rotate(-14deg)`, opacity: 0.6 },
        { transform: 'translateY(-8px) scale(1.02) rotate(.6deg)', opacity: 1, offset: 0.72 },
        { transform: 'none' },
      ], { duration: 720, easing: 'cubic-bezier(.2,.9,.3,1)' });
    } else if (ev.type === 'deadline') {
      el.animate([{ transform: 'translateY(26px) scale(.93)' }, { transform: 'translateY(-5px) scale(1.01)', offset: 0.7 }, { transform: 'none' }], { duration: 620, easing: 'cubic-bezier(.2,.9,.3,1)' });
    }
  }, [app.event?.at]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (app.event?.type === 'reset') setUndo(null); }, [app.event, app.handled]);

  const leave = async (how: 'done' | 'later', from?: { x: number; y: number; r: number }, dir = 1, vx = 1.4) => {
    const el = cardRef.current; if (!el || !top || busy) return;
    if (how === 'done' && top.payment) { app.openApproval(top.payment, 'today'); return; }
    setBusy(true);
    if (how === 'done') {
      el.classList.add('acted');
      await wait(520);
      el.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate3d(0,-70px,0) scale(.96)', opacity: 0 }], { duration: reducedMotion() ? 1 : 300, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
      await wait(280);
    } else {
      const s0 = from ?? { x: 0, y: 0, r: 0 };
      const w = el.offsetWidth;
      const dur = reducedMotion() ? 1 : Math.max(180, Math.min(360, (w + 160 - Math.abs(s0.x)) / vx));
      el.animate([
        { transform: `translate3d(${s0.x}px, ${s0.y}px, 0) rotate(${s0.r}deg)` },
        { transform: `translate3d(${dir * (w + 160)}px, ${s0.y + 40}px, 0) rotate(${dir * 20}deg)`, opacity: 0.4 },
      ], { duration: dur, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' });
      await wait(dur);
    }
    setUndo({ card: top, how, line: how === 'done' ? top.done : 'Resting in Later until tomorrow morning.' });
    if (how === 'done') app.actDeck(top.id); else app.toLater(top.id, 1);
    setEnter('rise');
    setBusy(false);
  };
  const doUndo = () => { if (!undo) return; app.restore(undo.card, undo.how); setUndo(null); setEnter('undo'); };

  /* drag: sideways sets it aside until tomorrow; down (mouse, or from the Later handle) asks when */
  const st = useRef<{ x: number; y: number; id: number; axis: 'x' | 'y' | null; handle: boolean; samples: { x: number; t: number }[] } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    const handle = !!(e.target as HTMLElement).closest('.sink');
    if (e.button !== 0 || busy || (!handle && (e.target as HTMLElement).closest('button'))) return;
    st.current = { x: e.clientX, y: e.clientY, id: e.pointerId, axis: null, handle, samples: [{ x: e.clientX, t: e.timeStamp }] };
  };
  const onMove = (e: React.PointerEvent) => {
    const s = st.current, el = cardRef.current; if (!s || !el || e.pointerId !== s.id) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (!s.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (s.axis === 'y' && !s.handle && e.pointerType !== 'mouse') { st.current = null; return; }
      el.setPointerCapture(e.pointerId); el.classList.add('dragging');
    }
    if (s.axis === 'y') {
      const k = dy > 0 ? dy * 0.62 : dy * 0.18;
      el.style.transform = `translate3d(0, ${k}px, 0) rotate(${Math.max(-1, Math.min(3, k / 40))}deg) scale(${1 - Math.min(0.05, Math.abs(k) / 1200)})`;
      return;
    }
    s.samples.push({ x: e.clientX, t: e.timeStamp }); if (s.samples.length > 6) s.samples.shift();
    const w = el.offsetWidth;
    setT(el, { x: dx, y: dy * 0.2 - Math.abs(dx) * 0.04, r: (dx / w) * 12 });
    const edge = el.parentElement?.querySelector('.deck-edge') as HTMLElement | null;
    const p = Math.min(1, Math.abs(dx) / (w * 0.5));
    if (edge) edge.style.transform = `translateY(${(1 - p * 0.85) * 7}px) scale(${1 - 0.035 * (1 - p)})`;
  };
  const onUp = (e: React.PointerEvent) => {
    const s = st.current, el = cardRef.current; st.current = null;
    if (!s || !el || !top) return;
    if (!s.axis) { if (s.handle) onLater(top.id, el); return; }
    el.classList.remove('dragging');
    const dx = e.clientX - s.x, dy = e.clientY - s.y, w = el.offsetWidth;
    if (s.axis === 'y') {
      if (dy > 64) { onLater(top.id, el); return; }
      const k = dy > 0 ? dy * 0.62 : dy * 0.18;
      spring({ y: k }, { y: 0 }, {}, { k: 520, c: 26 }, v => { el.style.transform = `translate3d(0, ${v.y}px, 0)`; }, () => { el.style.transform = ''; });
      return;
    }
    const a = s.samples[0], b = s.samples[s.samples.length - 1];
    const vx = b.t - a.t > 0 ? (b.x - a.x) / (b.t - a.t) : 0;
    const edge = el.parentElement?.querySelector('.deck-edge') as HTMLElement | null;
    if (edge) edge.style.transform = '';
    const from = { x: dx, y: dy * 0.2 - Math.abs(dx) * 0.04, r: (dx / w) * 12 };
    if (Math.abs(dx) > w * 0.34 || (Math.abs(vx) > 0.5 && Math.sign(vx) === Math.sign(dx))) {
      leave('later', from, Math.sign(dx || vx), Math.max(1.1, Math.abs(vx)));
    } else {
      spring(from, { x: 0, y: 0, r: 0 }, { x: vx * 1000 }, { k: 520, c: 24 }, v => setT(el, v), () => { el.style.transform = ''; });
    }
  };

  if (!top) return (
    <>
      <div className="deck-clear">
        <Chief state="done" size={44} />
        <div><b>That’s the lot.</b><span>Nothing needs you until 14:00, when The Old Mill confirms.</span></div>
      </div>
      {undo && <div className="undo-line" role="status" aria-live="polite"><span className="ok"><Icon name={undo.how === 'done' ? 'check' : 'sink'} size={16} />{undo.line}</span><button onClick={doUndo}>Undo</button></div>}
    </>
  );
  const s = space(top.spaceId);
  const urgent = top.emphasis === 'urgent';
  return (
    <>
      <div className={`deck size-${size}`} style={{ ['--n' as string]: edges }}>
        {Array.from({ length: edges }, (_, i) => (
          <div key={i} className="deck-edge" style={{ ['--i' as string]: i + 1 }} aria-hidden="true">
            {i === 0 && deck[1] && <div className="peek"><b>{space(deck[1].spaceId).name}</b><p>{deck[1].title}</p></div>}
          </div>
        ))}
        <div ref={cardRef} key={top.id} className={`dcard bezel ${urgent ? 'urgent' : ''} ${top.near ? 'near' : ''} ${flash ? 'flash' : ''}`} tabIndex={0} aria-roledescription="card"
          aria-label={`${s.name}. ${top.kind}. ${top.title}`}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          onKeyDown={e => { if (e.target !== e.currentTarget) return; if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); leave('later', undefined, e.key === 'ArrowLeft' ? -1 : 1); } }}>
          <article className="well">
            <div className="dc-src">
              <span className="glyph"><Icon name={s.glyph} size={17} /></span>
              <div className="who"><b>{s.name}</b>
                {top.backNote ? <small className="back">{top.backNote}</small> : <small>{top.kind}{urgent ? '' : `, from ${AGENTS[top.agent].name}`}</small>}
              </div>
              <button className="sink" aria-label={`Move this ${s.name} card to Later`}><Icon name="sink" size={15} /><span>Later</span></button>
            </div>
            <h2 className="dc-title">{top.title}</h2>
            {top.deadline && <p className="dline"><Icon name="clock" size={15} /><span>{top.deadline}</span><i aria-hidden="true" /></p>}
            <div className="dc-body">
              {top.quote && <p className="quote">{top.quote}</p>}
              {top.kv.length > 0 && <dl className="kv">{top.kv.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd className={/£|\d/.test(v) ? 'num' : ''}>{v}</dd></div>)}</dl>}
              {top.note && <p className="dc-note">{top.note}</p>}
            </div>
            <div className="dc-acts">
              <button className="btn primary" onClick={() => leave('done')}>{top.act}</button>
              <button className="btn" onClick={() => urgent && cardRef.current ? onLater(top.id, cardRef.current) : leave('later')}>{urgent ? 'Not now' : 'Tomorrow'}</button>
            </div>
          </article>
        </div>
      </div>
      <div className="undo-line" role="status" aria-live="polite">
        {undo
          ? <><span className="ok"><Icon name={undo.how === 'done' ? 'check' : 'sink'} size={16} />{undo.line}</span><button onClick={doUndo}>Undo</button></>
          : size === 'compact'
            ? <button className="btn quiet sm" onClick={app.allToMorning}>Send {deck.length === 1 ? 'it' : `all ${deck.length}`} to the morning</button>
            : <span className="fine">Flick sideways for tomorrow. Nothing sends or pays from a swipe.</span>}
      </div>
    </>
  );
}

/* ---------- Next: the crew at work ---------- */
function NextRow({ item }: { item: NextItem }) {
  const { running, finished } = useApp();
  const s = space(item.spaceId);
  const flash = useFlash(item.id);
  const done = finished.includes(item.id);
  const working = !!item.orb && running;
  const status = item.orb && !running ? 'Paused by you' : item.status;
  return (
    <div className={`nrow ${working ? '' : 'waiting'} ${done ? 'landed' : ''} ${flash ? 'flash' : ''}`} data-flip={'n-' + item.id} aria-busy={working}>
      <span className="crew-slot"><Crew who={item.agent} size={38} state={done ? 'done' : working ? 'working' : running ? 'idle' : 'rest'} /></span>
      <div className="n-main">
        <span className="n-name">{s.name}</span>
        <span className="n-status">
          {AGENTS[item.agent].name}: {status}{item.progress && running ? <>. <span className="num">{item.progress[0]} of {item.progress[1]}</span> matched</> : null}
        </span>
      </div>
      <div className="n-when"><small>{done ? 'landed' : 'reaches you'}</small><strong>{item.eta}</strong><span>{item.day}</span></div>
    </div>
  );
}

/* ---------- The edition: reading, not deciding ---------- */
function Snip({ sn, open, dim, read, onToggle }: { sn: Snippet; open: boolean; dim: boolean; read: boolean; onToggle: () => void }) {
  const [saved, setSaved] = useState(false);
  const mono = sn.source.replace(/^The /, '').split(/\s|&/).filter(Boolean).slice(0, 2).map(w => w[0]).join('');
  return (
    <li className={`snip k-${sn.kind} ${open ? 'open' : ''} ${dim ? 'dim' : ''} ${read ? 'read' : ''}`} data-flip={'s-' + sn.id}>
      <button className="snip-main" aria-expanded={open} onClick={onToggle}>
        <span className="snip-src"><i aria-hidden="true">{mono}</i><b>{sn.source}</b><em>{sn.via === 'following' ? `you follow ${sn.topic}` : 'your newsletter'}</em></span>
        {sn.big && <span className="snip-big">{sn.big}</span>}
        <span className="snip-head">{sn.head}</span>
        {sn.kind === 'trio' && open
          ? <span className="snip-items">{sn.items!.map(t => <span key={t}>{t}</span>)}</span>
          : <span className="snip-gist">{sn.gist}</span>}
      </button>
      {open && (
        <div className="snip-more">
          {sn.more && <p>{sn.more}</p>}
          <div className="snip-acts">
            <span className="orig">The original is a {sn.mins} minute read in {sn.source}</span>
            {sn.spaceId && (saved
              ? <span className="saved"><Icon name="check" size={14} />Saved to {space(sn.spaceId).name}</span>
              : <button onClick={() => setSaved(true)}>Save to {space(sn.spaceId).name}</button>)}
            <button>Less like this</button>
          </div>
        </div>
      )}
    </li>
  );
}

/* ---------- screen ---------- */
export function Today() {
  const app = useApp();
  const { deck, next, later, phase } = app;
  const scroller = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState<string | null>(null);
  const [read, setRead] = useState<string[]>([]);
  const [edOpen, setEdOpen] = useState(false);
  const [nextOpen, setNextOpen] = useState(false);
  const [sheetFor, setSheetFor] = useState<{ id: string; el: HTMLElement } | null>(null);
  const [laterOpen, setLaterOpen] = useState(false);
  const [settle, setSettle] = useState(false);
  const live = useRef<HTMLParagraphElement>(null);

  const urgent = deck[0]?.emphasis === 'urgent';
  const evening = phase === 'evening';
  const cleared = !deck.length;
  const size: Size = urgent || deck[0]?.near ? 'hero' : evening ? 'compact' : 'regular';
  const edMode = cleared ? 'full' : urgent && !edOpen ? 'strip' : 'normal';
  const nextLine = (urgent || evening || cleared) && !nextOpen && next.length > 0 && !app.finished.length;
  useEffect(() => { setEdOpen(false); setNextOpen(false); }, [urgent, evening, cleared]);
  useEffect(() => { if (app.event?.type === 'reset') { setOpen(null); setRead([]); } }, [app.event]);
  // a new urgent card brings the view back to the top, where it lands
  useEffect(() => {
    const ev = app.event; if (!ev || Date.now() - ev.at > 400) return;
    scroller.current?.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }, [app.event, reduced]);

  useFlip(scroller, [phase, deck.map(c => c.id + (c.near ? '!' : '')).join(','), size, edMode, nextLine, next.map(n => n.id).join(','), app.finished.join(','), open].join('|'));

  const toggle = (id: string) => { setOpen(o => o === id ? null : id); setRead(r => r.includes(id) ? r : [...r, id]); };

  /* Later: flick, choose when, sink to the dock */
  const choose = async (ri: number) => {
    const target = sheetFor; setSheetFor(null);
    if (!target) return;
    const phone = document.querySelector('.phone') as HTMLElement, dock = phone.querySelector('.dock') as HTMLElement;
    const el = target.el;
    if (!reduced && el.isConnected) {
      const p = phone.getBoundingClientRect(), a = el.getBoundingClientRect(), d = dock.getBoundingClientRect();
      const clone = el.cloneNode(true) as HTMLElement;
      clone.classList.add('flyer'); clone.classList.remove('dragging', 'flash');
      Object.assign(clone.style, { left: a.left - p.left + 'px', top: a.top - p.top + 'px', width: a.width + 'px', height: a.height + 'px', transform: 'none' });
      phone.appendChild(clone);
      el.style.visibility = 'hidden';
      app.toLater(target.id, ri);
      const anim = clone.animate([
        { transform: 'none', opacity: 1 },
        { transform: 'translateY(-10px) scale(.97) rotate(-1.2deg)', opacity: 1, offset: 0.16 },
        { transform: `translate(${d.left + d.width - 70 - a.left}px, ${d.top + 8 - a.top}px) scale(${38 / a.width}, ${38 / a.height})`, opacity: 0.15 },
      ], { duration: 780, easing: 'cubic-bezier(.55,0,.3,1)', fill: 'forwards' });
      await anim.finished.catch(() => {});
      clone.remove();
      setSettle(true); setTimeout(() => setSettle(false), 800);
    } else app.toLater(target.id, ri);
    if (live.current) live.current.textContent = 'Resting in Later.';
  };
  const cancel = () => {
    const el = sheetFor?.el; setSheetFor(null);
    if (el) spring({ y: 40 }, { y: 0 }, {}, { k: 420, c: 24 }, st => { el.style.transform = `translate3d(0, ${st.y}px, 0)`; }, () => { el.style.transform = ''; });
  };
  const clock = useClock(!!later.find(l => l.backAt) || laterOpen);
  const soon = later.find(l => l.backAt);
  const secs = soon ? Math.max(0, Math.ceil((soon.backAt! - clock) / 1000)) : 0;
  const working = next.filter(n => n.orb && app.running);

  const line = urgent ? <><b>One cannot wait.</b> Everything else is parked behind it.</>
    : cleared ? <><b>Nothing needs you.</b> {working.length} on the way. Read, or don’t.</>
    : evening ? <><b>{deck.length} left, and {deck.length === 1 ? 'it keeps' : 'they keep'} till morning.</b> Tonight is for reading.</>
    : <><b>{deck.length} need you.</b> {working.length} on the way, then 6 short reads.</>;

  const now = (
    <section className="band" aria-labelledby="h-now" data-flip="now" key="now">
      <div className="band-head"><h2 className="h-now" id="h-now">Now</h2><p>{cleared ? 'clear' : urgent ? 'needs you first' : 'needs you'}</p>
        <div className="progress" aria-hidden="true">
          {Array.from({ length: Math.min(8, app.handled + deck.length) }, (_, i) => <span key={i} className={i < app.handled ? 'done' : i === app.handled ? 'cur' : ''} />)}
        </div>
      </div>
      <Deck size={size} onLater={(id, el) => setSheetFor({ id, el })} />
    </section>
  );
  const nextBand = next.length > 0 && (
    <section className="band" aria-labelledby="h-next" data-flip="next" key="next">
      <div className="band-head"><h2 className="h-next" id="h-next">Next</h2><p>{evening ? 'the crew work on overnight' : 'the crew have these'}</p></div>
      {nextLine ? (
        <button className="next-line" onClick={() => setNextOpen(true)} aria-label={`${next.length} on the way. Show them`}>
          <span className="crew-pile">{next.slice(0, 3).map(n => <Crew key={n.id} who={n.agent} size={30} state={n.orb && app.running ? 'working' : 'idle'} />)}</span>
          <span><b>{next.length} on the way.</b> First reaches you at {next.find(n => n.orb)?.eta ?? next[0].eta}.</span>
          <Icon name="chev" size={16} />
        </button>
      ) : <div className="next-list">{next.map(n => <NextRow key={n.id} item={n} />)}</div>}
    </section>
  );
  const edition = (
    <section className={`edition ed-${edMode} ${evening ? 'night' : ''}`} aria-labelledby="h-ed" data-flip="edition" key="edition">
      {edMode === 'strip' ? (
        <button className="ed-strip" onClick={() => setEdOpen(true)}>
          <span className="ed-title" id="h-ed">The edition</span>
          <span>6 short reads. It will keep.</span><Icon name="chev" size={16} />
        </button>
      ) : (
        <>
          <header className="ed-head">
            <h2 className="ed-title" id="h-ed">{evening ? 'The evening edition' : 'The edition'}</h2>
            <p>Thursday 12 November. Six short reads from your newsletters and the things you follow. <span className="num">{read.length} of 6</span> read.</p>
          </header>
          <ol className="ed-list">
            {EDITION.map(sn => <Snip key={sn.id} sn={sn} open={open === sn.id} dim={!!open && open !== sn.id} read={read.includes(sn.id)} onToggle={() => toggle(sn.id)} />)}
          </ol>
          <footer className="ed-end" data-flip="ed-end">
            <b>That is the edition.</b>
            <p>The next one is tomorrow at 07:00. You follow {FOLLOWING.slice(0, -1).join(', ')} and {FOLLOWING[FOLLOWING.length - 1]}. <button>Change what you follow</button></p>
          </footer>
        </>
      )}
    </section>
  );

  return (
    <div className={`screen today ${evening ? 'is-evening' : ''}`}>
      <div className={`scroll ${evening ? 'dock-tall' : ''}`} ref={scroller}>
        <div className="td-head" data-flip="head">
          <div><h1>{evening ? 'This evening' : 'Today'}</h1><p>{line}</p></div>
          <span className="avatar-me" aria-label="Your profile, Sam Reid">SR</span>
        </div>
        <div data-flip="rings"><Rings /></div>
        {evening ? [edition, now, nextBand] : [now, nextBand, edition]}
        <p ref={live} className="sr" role="status" aria-live="polite" />
      </div>

      <button className={`dock ${settle ? 'settle' : ''} ${evening ? 'tall' : ''}`} onClick={() => setLaterOpen(true)} aria-label={`Later: ${later.length} resting. Open the list`}>
        <span className="h-later">Later</span>
        <span className="txt"><b>{later.length} resting</b><br />{soon ? <span className="soon">One back in {secs} second{secs === 1 ? '' : 's'}</span> : evening ? 'Tomorrow 07:00: 4 cards so far, and a new edition' : 'Next back Monday 08:30'}</span>
        <span className="glyphs" aria-hidden="true">{later.slice(0, 4).map(l => <span key={l.id} className="glyph"><Icon name={space(l.spaceId).glyph} size={13} /></span>)}</span>
        <Icon name="chev" size={18} />
      </button>

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

      <div className={`scrim ${laterOpen ? 'open' : ''}`} hidden={!laterOpen} onClick={() => setLaterOpen(false)} />
      <div className={`sheet ${laterOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="later-h" hidden={!laterOpen} onKeyDown={e => e.key === 'Escape' && setLaterOpen(false)}>
        <div className="bezel"><div className="well">
          <h3 className="h-later" id="later-h" style={{ fontSize: 36 }}>Later</h3>
          <p>Resting. Each one comes back up when it said it would.</p>
          <div className="later-scroll">
            {later.map(l => (
              <div key={l.id} className="lrow">
                <span className="glyph"><Icon name={space(l.spaceId).glyph} size={16} /></span>
                <div><div className="l-name">{l.from ? l.from.title : space(l.spaceId).name}</div>
                  <div className="l-wake">{l.backAt ? `Back in ${Math.max(0, Math.ceil((l.backAt - clock) / 1000))} seconds` : l.wake}</div></div>
                <button className="btn icon sm" onClick={() => { setLaterOpen(false); app.bringBack(l.id, false); scroller.current?.scrollTo({ top: 0 }); }} aria-label={`Bring ${space(l.spaceId).name} back now`}><Icon name="rise" size={17} /></button>
              </div>
            ))}
          </div>
          <button className="btn quiet" onClick={() => setLaterOpen(false)}>Close</button>
        </div></div>
      </div>
    </div>
  );
}
