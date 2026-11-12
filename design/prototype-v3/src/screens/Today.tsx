import { useLayoutEffect, useRef, useState } from 'react';
import { BotAvatar } from 'bot-avatars';
import { AGENTS, DAYLINE, DECK0, space, type DeckCard } from '../data';
import { Icon } from '../icons';
import { useApp } from '../store';
import { reducedMotion, setT, spring, wait } from '../motion';

type Undo = { card: DeckCard; how: 'done' | 'later'; line: string };

export function Today() {
  const app = useApp();
  const [deck, setDeck] = useState<DeckCard[]>(DECK0);
  const [handled, setHandled] = useState(0);
  const [undo, setUndo] = useState<Undo | null>(null);
  const [enter, setEnter] = useState<'rise' | 'undo' | null>(null);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const top = deck[0];
  const total = DECK0.length;
  const edges = Math.min(Math.max(deck.length - 1, 0), 4);

  // the next card rises with a spring; an undone card slides back in
  useLayoutEffect(() => {
    const el = cardRef.current; if (!el || !enter) return;
    if (enter === 'rise') { setT(el, { y: 9, s: 0.955 }); spring({ y: 9, s: 0.955 }, { y: 0, s: 1 }, {}, { k: 430, c: 17 }, v => setT(el, v), () => { el.style.transform = ''; }); }
    else { setT(el, { x: -360, r: -12 }); spring({ x: -360, r: -12 }, { x: 0, r: 0 }, {}, { k: 300, c: 22 }, v => setT(el, v), () => { el.style.transform = ''; }); }
    setEnter(null);
  }, [enter, top?.id]);

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
      // carry the release velocity off the edge, then deal the next card
      const s0 = from ?? { x: 0, y: 0, r: 0 };
      const w = el.offsetWidth;
      const dur = reducedMotion() ? 1 : Math.max(180, Math.min(360, (w + 160 - Math.abs(s0.x)) / vx));
      el.animate([
        { transform: `translate3d(${s0.x}px, ${s0.y}px, 0) rotate(${s0.r}deg)` },
        { transform: `translate3d(${dir * (w + 160)}px, ${s0.y + 40}px, 0) rotate(${dir * 20}deg)`, opacity: 0.4 },
      ], { duration: dur, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' });
      await wait(dur);
    }
    const line = how === 'done' ? top.done : 'Moved to tomorrow morning.';
    setUndo({ card: top, how, line });
    setHandled(h => h + 1);
    setDeck(d => d.slice(1));
    setEnter('rise');
    el.classList.remove('acted');
    setBusy(false);
  };
  const doUndo = () => {
    if (!undo) return;
    setDeck(d => [undo.card, ...d]); setHandled(h => h - 1); setUndo(null); setEnter('undo');
  };

  /* horizontal drag with velocity: either side sets it aside until tomorrow (reversible) */
  const st = useRef<{ x: number; y: number; id: number; axis: 'x' | 'y' | null; samples: { x: number; t: number }[] } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button') || busy) return;
    st.current = { x: e.clientX, y: e.clientY, id: e.pointerId, axis: null, samples: [{ x: e.clientX, t: e.timeStamp }] };
  };
  const onMove = (e: React.PointerEvent) => {
    const s = st.current, el = cardRef.current; if (!s || !el || e.pointerId !== s.id) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (!s.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (s.axis === 'y') { st.current = null; return; }
      el.setPointerCapture(e.pointerId); el.classList.add('dragging');
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
    if (!s || !el || s.axis !== 'x') return;
    el.classList.remove('dragging');
    const dx = e.clientX - s.x, dy = e.clientY - s.y, w = el.offsetWidth;
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

  const minutes = Math.max(1, Math.round(deck.length * 1.2));
  return (
    <div className="screen">
      <div className="scroll">
        <div className="td-head">
          <h1>Today</h1>
          <p>{deck.length ? <><b>{deck.length} {deck.length === 1 ? 'card' : 'cards'}</b>, about {minutes} minutes. Then nothing until 14:00.</> : <>All {total} dealt with.</>}</p>
        </div>
        <div className="progress" aria-hidden="true">
          {DECK0.map((c, i) => <span key={c.id} className={i < handled ? 'done' : i === handled && deck.length ? 'cur' : ''} />)}
        </div>

        {top ? (
          <div className="deck" style={{ ['--n' as string]: edges }}>
            {Array.from({ length: edges }, (_, i) => (
              <div key={i} className="deck-edge" style={{ ['--i' as string]: i + 1 }} aria-hidden="true">
                {i === 0 && deck[1] && <div className="peek"><b>{space(deck[1].spaceId).name}</b><p>{deck[1].title}</p></div>}
              </div>
            ))}
            <div ref={cardRef} key={top.id} className="dcard bezel" tabIndex={0} aria-roledescription="card"
              aria-label={`${space(top.spaceId).name}. ${top.kind}. ${top.title}`}
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
              onKeyDown={e => { if (e.target !== e.currentTarget) return; if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); leave('later', undefined, e.key === 'ArrowLeft' ? -1 : 1); } }}>
              <article className="well">
                <div className="dc-src">
                  <span className="glyph"><Icon name={space(top.spaceId).glyph} size={17} /></span>
                  <div className="who"><b>{space(top.spaceId).name}</b><small>{top.kind}, from {AGENTS[top.agent].name}</small></div>
                  <BotAvatar className="bot" type={AGENTS[top.agent].avatar} size={32} paused={!app.running} aria-hidden="true" />
                </div>
                <h2 className="dc-title">{top.title}</h2>
                {top.quote && <p className="quote">{top.quote}</p>}
                <dl className="kv">{top.kv.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd className={/£|\d/.test(v) ? 'num' : ''} style={{ fontSize: /£|\d/.test(v) ? 12.5 : undefined }}>{v}</dd></div>)}</dl>
                {top.note && <p className="dc-note">{top.note}</p>}
                <div className="dc-acts">
                  <button className="btn primary" onClick={() => leave('done')}>{top.act}</button>
                  <button className="btn" onClick={() => leave('later')}>Tomorrow</button>
                </div>
              </article>
            </div>
          </div>
        ) : (
          <div className="deck-end">
            <h2>That’s the lot.</h2>
            <p>Nothing else needs you until 07:00 tomorrow.</p>
            <div className="dayline">
              {DAYLINE.map(d => <div key={d.t} className="dl"><time className="num">{d.t}</time><div><b>{d.what}</b><small>{d.sub}</small></div></div>)}
            </div>
          </div>
        )}

        <div className="undo-line" role="status" aria-live="polite">
          {undo && <><span className="ok"><Icon name={undo.how === 'done' ? 'check' : 'sink'} size={16} />{undo.line}</span><button onClick={doUndo}>Undo</button></>}
        </div>
        {top && <p className="fine" style={{ margin: '6px 6px 0' }}>Drag either way, or press Tomorrow, to set a card aside. Nothing here sends or pays from a swipe.</p>}
      </div>
    </div>
  );
}
