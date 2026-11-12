import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AGENTS, BILLS, EDITION, FOLLOWING, RECEIPTS, RETURNS, space, type DeckCard, type NextItem, type Snippet } from '../data';
import { Icon } from '../icons';
import { Chief, Crew } from '../Mascot';
import { Rings } from '../Rings';
import { useApp, useClock, useFlash } from '../store';
import { reducedMotion, setT, spring, useFlip, usePrefersReducedMotion, wait } from '../motion';
import { OutboxRow, PaySlip } from './Approve';

type Undo = { card: DeckCard; how: 'done' | 'later'; line: string };
type Size = 'hero' | 'regular' | 'compact';

/** Fly an element in from the chief in the tab bar: how Keep deals a card. */
function dealFromChief(el: HTMLElement, delay = 0, dur = 720) {
  const c = document.querySelector('.chief-btn')?.getBoundingClientRect(), r = el.getBoundingClientRect();
  if (!c || reducedMotion()) return;
  el.animate([
    { transform: `translate(${c.left + c.width / 2 - (r.left + r.width / 2)}px, ${c.top + c.height / 2 - (r.top + r.height / 2)}px) scale(.12) rotate(-14deg)`, opacity: 0.5 },
    { transform: 'translateY(-8px) scale(1.02) rotate(.6deg)', opacity: 1, offset: 0.72 },
    { transform: 'none', opacity: 1 },
  ], { duration: dur, delay, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' });
}

/* ---------- Now: the deck. One decision at a time; size is a hint the client honours ---------- */
function Deck({ size, onLater }: { size: Size; onLater: (id: string, el: HTMLElement) => void }) {
  const app = useApp();
  const { deck } = app;
  const [undo, setUndo] = useState<Undo | null>(null);
  const [enter, setEnter] = useState<'rise' | 'undo' | null>(null);
  const [busy, setBusy] = useState(false);
  const [nudge, setNudge] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const top = deck[0];
  const edges = Math.min(Math.max(deck.length - 1, 0), 3);
  const flash = useFlash(top?.id ?? '-');
  const urgent = top?.emphasis === 'urgent';

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
    if (ev.type === 'urgent') dealFromChief(el);
    else if (ev.type === 'deadline') {
      el.animate([{ transform: 'translateY(46px) scale(.9)', opacity: 0.6 }, { transform: 'translateY(-7px) scale(1.015)', opacity: 1, offset: 0.68 }, { transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.2,.9,.3,1)' });
    }
  }, [app.event?.at]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (app.event?.type === 'reset') setUndo(null); }, [app.event]);
  useEffect(() => { if (!nudge) return; const t = setTimeout(() => setNudge(false), 2600); return () => clearTimeout(t); }, [nudge]);

  const leave = async (how: 'done' | 'later', from?: { x: number; y: number; r: number }, dir = 1, vx = 1.4) => {
    const el = cardRef.current; if (!el || !top || busy) return;
    if (how === 'done' && top.send) { app.openApproval(top.send, 'today'); return; }
    if (how === 'later' && urgent) { setNudge(true); return; }
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
    const line = how === 'later' ? 'Resting in Later until tomorrow morning.' : top.bill ? BILLS[top.bill].paidLine : top.done;
    setUndo({ card: top, how, line });
    if (how === 'done') { if (top.bill) app.markPaid(top.bill); else app.actDeck(top.id); } else app.toLater(top.id, 1);
    setEnter('rise');
    setBusy(false);
  };
  const doUndo = () => { if (!undo) return; app.restore(undo.card, undo.how); setUndo(null); setEnter('undo'); };

  /* drag: sideways sets it aside until tomorrow; down (mouse, or from the Later handle) asks when. Urgent cards resist. */
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
    const rx = urgent ? Math.sign(dx) * Math.min(28, Math.abs(dx) * 0.16) : dx; // an urgent card only gives a little
    setT(el, { x: rx, y: urgent ? 0 : dy * 0.2 - Math.abs(dx) * 0.04, r: (rx / w) * 12 });
    if (urgent) return;
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
    if (urgent) {
      const rx = Math.sign(dx) * Math.min(28, Math.abs(dx) * 0.16);
      if (Math.abs(dx) > 40) setNudge(true);
      spring({ x: rx, r: (rx / w) * 12 }, { x: 0, r: 0 }, {}, { k: 600, c: 22 }, v => setT(el, v), () => { el.style.transform = ''; });
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

  const undoRow = undo && <div className="undo-line" role="status" aria-live="polite"><span className="ok"><Icon name={undo.how === 'done' ? 'check' : 'sink'} size={16} />{undo.line}</span><button onClick={doUndo}>Undo</button></div>;
  if (!top) return (
    <>
      <div className="deck-clear" data-flip="deck-clear">
        <Chief state="rest" size={44} />
        <div><b>That’s the lot.</b><span>Nothing needs you until 14:00, when The Old Mill confirms.</span></div>
      </div>
      {undoRow}
    </>
  );
  const s = space(top.spaceId);
  const bill = top.bill ? BILLS[top.bill] : null;
  return (
    <>
      <div className={`deck size-${size}`} style={{ ['--n' as string]: edges }}>
        {Array.from({ length: edges }, (_, i) => (
          <div key={i} className="deck-edge" style={{ ['--i' as string]: i + 1 }} aria-hidden="true">
            {i === 0 && deck[1] && <div className="peek"><b>{space(deck[1].spaceId).name}</b><p>{deck[1].title}</p></div>}
          </div>
        ))}
        <div ref={cardRef} key={top.id} className={`dcard bezel ${urgent ? 'urgent' : ''} ${top.near ? 'near' : ''} ${bill ? 'is-bill' : ''} ${flash ? 'flash' : ''}`} tabIndex={0} aria-roledescription="card"
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
            {bill
              ? <PaySlip id={bill.id} onMark={() => leave('done')} />
              : <div className="dc-acts">
                  <button className="btn primary" onClick={() => leave('done')}>{top.act}</button>
                  <button className="btn" onClick={() => urgent && cardRef.current ? onLater(top.id, cardRef.current) : leave('later')}>{urgent ? 'Choose a time' : 'Tomorrow'}</button>
                </div>}
          </article>
        </div>
      </div>
      {undoRow ?? (
        <div className="undo-line" role="status" aria-live="polite">
          {nudge
            ? <span className="fine strong">An urgent card does not flick away. Choose a time if it can wait.</span>
            : size === 'compact'
              ? <button className="btn quiet sm" onClick={app.allToMorning}>Send {deck.length === 1 ? 'it' : `all ${deck.length}`} to the morning</button>
              : <span className="fine">{urgent ? 'This one stays on top until you decide or choose a time.' : 'Flick sideways for tomorrow. Nothing sends or pays from a swipe.'}</span>}
        </div>
      )}
    </>
  );
}

/* ---------- A counted stack: cards of one kind arrive, then merge ---------- */
function Stack() {
  const app = useApp();
  const st = app.stack;
  const [shown, setShown] = useState<'arriving' | 'merged' | null>(st?.phase ?? null);
  const rows = useRef<HTMLDivElement>(null);
  const flash = useFlash('stack');

  // arriving: each receipt is dealt from Keep, one after another
  useLayoutEffect(() => {
    if (st?.phase === 'arriving' && shown !== 'arriving') setShown('arriving');
    if (st?.phase === 'merged' && !shown) setShown('merged');
    if (!st) setShown(null);
  }, [st?.phase]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (shown !== 'arriving' || !rows.current) return;
    rows.current.querySelectorAll<HTMLElement>('.rc').forEach((el, i) => dealFromChief(el, i * 260, 640));
  }, [shown]);
  // merging: the later rows slide into the first and the group becomes one counted stack
  useEffect(() => {
    if (st?.phase !== 'merged' || shown !== 'arriving') return;
    const box = rows.current;
    if (!box || reducedMotion()) { setShown('merged'); return; }
    const els = [...box.querySelectorAll<HTMLElement>('.rc')];
    const t0 = els[0].getBoundingClientRect().top;
    const anims = els.map((el, i) => el.animate(
      i === 0 ? [{ transform: 'none' }, { transform: 'scale(1.03)' }, { transform: 'none' }]
        : [{ transform: 'none', opacity: 1 }, { transform: `translateY(${t0 - el.getBoundingClientRect().top + i * 5}px) scale(${1 - i * 0.03})`, opacity: 0.9 }],
      { duration: 460, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'forwards' }));
    Promise.all(anims.map(a => a.finished)).then(() => setShown('merged')).catch(() => setShown('merged'));
  }, [st?.phase, shown]);

  if (!st || !shown) return null;
  if (shown === 'arriving') return (
    <div className="stack-arrive" ref={rows} data-flip="stack" aria-live="polite">
      <p className="stack-note">Ledger found {RECEIPTS.length} more like the Screwfix receipt</p>
      {RECEIPTS.map(r => (
        <div key={r.id} className="rc"><span className="glyph"><Icon name="receipt" size={15} /></span><b>{r.what}</b><span className="num">{r.amount}</span><small>{r.date}</small></div>
      ))}
    </div>
  );
  return (
    <div className={`stack ${flash ? 'flash' : ''}`} data-flip="stack">
      <i aria-hidden="true" style={{ ['--i' as string]: 1 }} /><i aria-hidden="true" style={{ ['--i' as string]: 2 }} />
      <div className="stack-card">
        <span className="glyph"><Icon name="receipt" size={17} /></span>
        <div className="stack-txt"><b>Receipts to sort</b><span>Taxes 2026. Ledger put them in one pile so they cost you one decision, not four.</span></div>
        <span className="stack-n"><b className="num">{st.count}</b>cards</span>
        <button className="btn sm" onClick={app.openStack}>Sort them</button>
      </div>
    </div>
  );
}

/* ---------- Next: the crew at work ---------- */
function NextRow({ item }: { item: NextItem }) {
  const { running, finished, leaving } = useApp();
  const s = space(item.spaceId);
  const flash = useFlash(item.id);
  const done = finished.includes(item.id);
  const working = !!item.orb && running;
  const status = item.orb && !running ? 'Paused by you' : item.status;
  const slot = useRef<HTMLSpanElement>(null);
  const isLeaving = leaving.includes(item.id);
  useEffect(() => {
    const el = slot.current, phone = document.querySelector('.phone') as HTMLElement | null, chief = document.querySelector('.chief-btn svg');
    if (!isLeaving || !done || !el || !phone || !chief || reducedMotion()) return;
    const p = phone.getBoundingClientRect(), a = el.getBoundingClientRect(), c = chief.getBoundingClientRect();
    const clone = el.cloneNode(true) as HTMLElement;
    clone.classList.add('crew-fly');
    Object.assign(clone.style, { left: a.left - p.left + 'px', top: a.top - p.top + 'px', width: a.width + 'px', height: a.height + 'px' });
    phone.appendChild(clone);
    const dx = c.left + c.width / 2 - (a.left + a.width / 2), dy = c.top + c.height / 2 - (a.top + a.height / 2);
    clone.animate([
      { transform: 'none', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) rotate(-14deg) scale(1.05)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) rotate(-4deg) scale(.6)`, opacity: 0 },
    ], { duration: 900, easing: 'cubic-bezier(.5,0,.4,1)' }).finished.finally(() => clone.remove()).catch(() => {});
  }, [isLeaving]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={`nrow ${working ? '' : 'waiting'} ${done ? 'landed' : ''} ${leaving.includes(item.id) ? 'leaving' : ''} ${flash ? 'flash' : ''}`} data-flip={'n-' + item.id} aria-busy={working}>
      <span className="crew-slot" ref={slot}><Crew who={item.agent} size={38} state={done ? 'done' : working ? 'working' : running ? 'idle' : 'rest'} /></span>
      <div className="n-main">
        <span className="n-name">{s.name}</span>
        <span className="n-status">
          {AGENTS[item.agent].name}: {status}{item.progress && running ? <>. <span className="num">{item.progress[0]} of {item.progress[1]}</span> matched</> : null}
        </span>
        {item.progress && running && !done && <span className="drain prog" aria-hidden="true"><i style={{ transform: `scaleX(${item.progress[0] / (item.progress[1] - 17)})` }} /></span>}
      </div>
      <div className="n-when"><small>{done ? 'landed' : 'reaches you'}</small><strong>{item.eta}</strong><span>{item.day}</span></div>
    </div>
  );
}

/* ---------- The edition: reading, not deciding ---------- */
function Snip({ sn, open, dim, read, less, dropped, onToggle, onLess }: { sn: Snippet; open: boolean; dim: boolean; read: boolean; less: boolean; dropped: boolean; onToggle: () => void; onLess: (on: boolean) => void }) {
  const [saved, setSaved] = useState(false);
  const mono = sn.source.replace(/^The /, '').split(/\s|&/).filter(Boolean).slice(0, 2).map(w => w[0]).join('');
  if (less || dropped) return (
    <li className="snip folded" data-flip={'s-' + sn.id}>
      <p><span>{dropped ? `You stopped following ${sn.topic}. This was the last from ${sn.source}.` : `Fewer like this from ${sn.source}. Noted for tomorrow’s edition.`}</span>
        {less && <button onClick={() => onLess(false)}>Undo</button>}</p>
    </li>
  );
  return (
    <li className={`snip k-${sn.kind} ${open ? 'open' : ''} ${dim ? 'dim' : ''} ${read ? 'read' : ''}`} data-flip={'s-' + sn.id} id={'snip-' + sn.id}>
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
            <button onClick={() => onLess(true)}>Less like this</button>
          </div>
        </div>
      )}
    </li>
  );
}

/* ---------- screen ---------- */
export function Today() {
  const app = useApp();
  const { deck, next, later, phase, outbox } = app;
  const scroller = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState<string | null>(null);
  const [read, setRead] = useState<string[]>([]);
  const [less, setLess] = useState<string[]>([]);
  const [follow, setFollow] = useState<string[]>(FOLLOWING);
  const [editFollow, setEditFollow] = useState(false);
  const [edOpen, setEdOpen] = useState(false);
  const [nextOpen, setNextOpen] = useState(false);
  const [sheetFor, setSheetFor] = useState<{ id: string; el: HTMLElement } | null>(null);
  const [laterOpen, setLaterOpen] = useState(false);
  const [settle, setSettle] = useState(false);
  const live = useRef<HTMLParagraphElement>(null);
  const edList = useRef<HTMLOListElement>(null);

  const urgent = deck[0]?.emphasis === 'urgent';
  const evening = phase === 'evening';
  const cleared = !deck.length && !app.stack;
  const size: Size = urgent || deck[0]?.near ? 'hero' : evening ? 'compact' : 'regular';
  const edMode = cleared ? 'full' : urgent && !edOpen ? 'strip' : 'normal';
  const rowsOpen = (nextOpen && !urgent) || app.finished.length > 0;
  const readLoud = evening || cleared || !!open;
  useEffect(() => { setEdOpen(false); setNextOpen(false); }, [urgent, evening, cleared]);
  useEffect(() => { if (app.event?.type === 'reset') { setOpen(null); setRead([]); setLess([]); setFollow(FOLLOWING); setEditFollow(false); } }, [app.event]);

  // each event brings the view to where the change happens
  useEffect(() => {
    const ev = app.event; if (!ev || Date.now() - ev.at > 400) return;
    const sc = scroller.current; if (!sc) return;
    const to = (sel: string, block: ScrollLogicalPosition = 'start') => {
      const el = sc.querySelector(sel) as HTMLElement | null; if (!el) return;
      const top = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - (block === 'center' ? sc.clientHeight / 2 - el.offsetHeight / 2 : 60);
      sc.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth' });
    };
    if (ev.type === 'read') {
      setEdOpen(true); setOpen('e2'); setRead(r => r.includes('e2') ? r : [...r, 'e2']);
      setTimeout(() => to('#snip-e2', 'center'), 60);
    } else if (ev.type === 'finish') setTimeout(() => to('[data-flip="next"]'), 40);
    else if (ev.type === 'send' || ev.type === 'stop') to(ev.type === 'stop' ? '[data-flip="now"]' : '[data-flip="next"]');
    else if (ev.type === 'merge') setTimeout(() => to('[data-flip="stack"]', 'center'), 40);
    else sc.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }, [app.event, reduced]);

  // when the edition takes the page, its type grows from the size it was
  const lastMode = useRef(edMode);
  useLayoutEffect(() => {
    const was = lastMode.current; lastMode.current = edMode;
    if (was === edMode || edMode !== 'full' || reduced || !edList.current) return;
    edList.current.querySelectorAll<HTMLElement>('.snip').forEach((el, i) => el.animate(
      [{ transform: 'scale(.9)', opacity: 0.4 }, { transform: 'none', opacity: 1 }],
      { duration: 620, delay: 80 + i * 70, easing: 'cubic-bezier(.2,.9,.3,1.1)', fill: 'backwards' }));
  }, [edMode, reduced]);

  useFlip(scroller, [phase, deck.map(c => c.id + (c.near ? '!' : '')).join(','), size, edMode, rowsOpen, next.map(n => n.id).join(','),
    app.finished.join(','), open, outbox.map(o => o.id + o.status).join(','), app.stack?.phase ?? '-', less.join(','), follow.join(','), editFollow].join('|'));

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
  const leftToRead = EDITION.length - read.length;

  const line = urgent ? <><b>One cannot wait.</b> Everything else is parked behind it.</>
    : cleared ? <><b>Nothing needs you.</b> {working.length} on the way. Read, or don’t.</>
    : evening ? <><b>{deck.length} left, and {deck.length === 1 ? 'it keeps' : 'they keep'} till morning.</b> Tonight is for reading.</>
    : <><b>{deck.length + (app.stack ? 1 : 0)} need you.</b> {working.length} on the way, then {leftToRead} short read{leftToRead === 1 ? '' : 's'}.</>;

  const now = (
    <section className="band" aria-labelledby="h-now" data-flip="now" key="now">
      <div className="sec-head"><h2 id="h-now">{cleared ? 'Nothing needs you' : urgent ? 'Needs you first' : 'Needs you'}</h2>
        {!cleared && <span className="sec-count num">{Math.min(app.handled + 1, app.handled + deck.length)} of {app.handled + deck.length}</span>}
        <div className="progress" aria-hidden="true">
          {Array.from({ length: Math.min(8, app.handled + deck.length) }, (_, i) => <span key={i} className={i < app.handled ? 'done' : i === app.handled ? 'cur' : ''} />)}
        </div>
      </div>
      <Deck size={size} onLater={(id, el) => setSheetFor({ id, el })} />
      <Stack />
    </section>
  );
  const sending = outbox.length > 0;
  /* the crew's work is one quiet line; it opens into its rows on a tap, or by itself when a run lands */
  const crewNames = [...new Set(next.map(n => n.agent))].map(a => AGENTS[a].name);
  const names = crewNames.length > 1 ? `${crewNames.slice(0, -1).join(', ')} and ${crewNames[crewNames.length - 1]}` : crewNames[0];
  const firstEta = next.find(n => n.orb && !app.finished.includes(n.id))?.eta ?? next[0]?.eta;
  const nextBand = (next.length > 0 || sending) && (
    <section className={`crew-band ${rowsOpen ? 'open' : ''}`} aria-label="What the crew are doing" data-flip="next" key="next">
      {/* the send window is never folded away */}
      {sending && <div className="next-list out-list">{outbox.map(o => <OutboxRow key={o.id} id={o.id} />)}</div>}
      {next.length > 0 && <>
        <button className="crew-line" onClick={() => setNextOpen(v => !v)} aria-expanded={rowsOpen}>
          <span className="crew-pile">{[...new Set(next.map(n => n.agent))].slice(0, 3).map(a => <Crew key={a} who={a} size={28} state={!app.running ? 'rest' : next.some(n => n.agent === a && app.finished.includes(n.id)) ? 'done' : next.some(n => n.agent === a && n.orb) ? 'working' : 'idle'} />)}</span>
          <span>{app.finished.length ? <><b>{AGENTS[next.find(n => app.finished.includes(n.id))!.agent].name} just finished.</b> {next.length - app.finished.length} still going.</>
            : <>{names} {crewNames.length > 1 ? 'are' : 'is'} on {next.length} thing{next.length === 1 ? '' : 's'}{evening ? ' overnight' : ''}. Next reaches you at <b className="num">{firstEta}</b>.</>}</span>
          <Icon name="chev" size={16} />
        </button>
        {rowsOpen && <div className="next-list" data-flip="next-rows">{next.map(n => <NextRow key={n.id} item={n} />)}</div>}
      </>}
    </section>
  );
  const dropped = (sn: Snippet) => sn.via === 'following' && !!sn.topic && !follow.includes(sn.topic);
  const edition = (
    <section className={`edition ed-${edMode} ${evening ? 'night' : ''}`} aria-labelledby="h-ed" data-flip="edition" key="edition">
      {edMode === 'strip' ? (
        <button className="ed-strip" onClick={() => setEdOpen(true)}>
          <span className="ed-title" id="h-ed">The edition</span>
          <span>{leftToRead} short reads. It will keep.</span><Icon name="chev" size={16} />
        </button>
      ) : (
        <>
          <header className="ed-head">
            <h2 className="ed-title" id="h-ed">{evening ? 'The evening edition' : 'The edition'}</h2>
            <p>Thursday 12 November. Six short reads from your newsletters and the things you follow. <span className="num">{read.length} of 6</span> read.</p>
          </header>
          <ol className="ed-list" ref={edList}>
            {EDITION.map(sn => <Snip key={sn.id} sn={sn} open={open === sn.id} dim={!!open && open !== sn.id} read={read.includes(sn.id)}
              less={less.includes(sn.id)} dropped={dropped(sn)} onToggle={() => toggle(sn.id)}
              onLess={on => { setLess(l => on ? [...l, sn.id] : l.filter(x => x !== sn.id)); if (on) setOpen(null); }} />)}
          </ol>
          <footer className="ed-end" data-flip="ed-end">
            <b>That is the edition.</b>
            <p>The next one is tomorrow at 07:00. {follow.length
              ? <>You follow {follow.length > 1 ? `${follow.slice(0, -1).join(', ')} and ${follow[follow.length - 1]}` : follow[0]}.</>
              : <>You follow nothing, so it is newsletters only.</>} <button aria-expanded={editFollow} onClick={() => setEditFollow(v => !v)}>{editFollow ? 'Done' : 'Change what you follow'}</button></p>
            {editFollow && (
              <ul className="follow-edit">
                {FOLLOWING.map(t => (
                  <li key={t}><span>{t}</span>
                    <button onClick={() => setFollow(f => f.includes(t) ? f.filter(x => x !== t) : FOLLOWING.filter(x => x === t || f.includes(x)))}>{follow.includes(t) ? 'Stop following' : 'Follow again'}</button></li>
                ))}
                <li className="fine">To follow something new, tell Keep. “Follow removals news until the move.”</li>
              </ul>
            )}
          </footer>
        </>
      )}
    </section>
  );

  return (
    <div className={`screen today ${evening ? 'is-evening' : ''} ${readLoud ? 'loud-read' : 'loud-decide'} ${open ? 'reading' : ''}`}>
      <div className={`scroll ${evening ? 'dock-tall' : ''}`} ref={scroller}>
        <div className="td-head" data-flip="head">
          <div><h1>{evening ? 'This evening' : 'Today'}</h1><p>{line}</p></div>
          <span className="avatar-me" aria-label="Your profile, Sam Reid">SR</span>
        </div>
        <div data-flip="rings"><Rings /></div>
        {evening ? [edition, now, nextBand] : [now, nextBand, edition]}
        <p ref={live} className="sr" role="status" aria-live="polite" />
      </div>

      {/* Later is a gesture, not a band: this small drawer is only what is resting and when it comes back */}
      <button className={`dock ${settle ? 'settle' : ''} ${evening ? 'tall' : ''}`} onClick={() => setLaterOpen(true)} aria-label={`Later: ${later.length} resting. Open the list`}>
        <span className="dock-row">
          <span className="glyphs" aria-hidden="true">{later.slice(0, 3).map(l => <span key={l.id} className="glyph"><Icon name={space(l.spaceId).glyph} size={12} /></span>)}</span>
          <span className="txt"><b>{later.length} set aside</b> {soon ? <span className="soon">One back in {secs} second{secs === 1 ? '' : 's'}</span> : <>Next back Monday 08:30</>}</span>
          <Icon name="chev" size={16} />
        </span>
        {evening && <span className="dock-eve">Tomorrow at 07:00: {deck.length} card{deck.length === 1 ? '' : 's'} and a new edition</span>}
      </button>

      <div className={`scrim ${sheetFor ? 'open' : ''}`} hidden={!sheetFor} onClick={cancel} />
      <div className={`sheet ${sheetFor ? 'open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="ret-h" hidden={!sheetFor} onKeyDown={e => e.key === 'Escape' && cancel()}>
        <div className="bezel"><div className="well">
          <h3 className="h-later" id="ret-h">Set it aside until</h3>
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
          <h3 className="h-later" id="later-h">Set aside</h3>
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
