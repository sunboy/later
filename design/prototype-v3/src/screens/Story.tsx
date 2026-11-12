import { useCallback, useEffect, useRef, useState } from 'react';
import { BotAvatar } from 'bot-avatars';
import { ThinkingOrb } from 'thinking-orbs';
import { AGENTS, SPACES, space } from '../data';
import { Icon } from '../icons';
import { useApp } from '../store';
import { useTheme } from '../theme';
import { ApprovalBody } from './Approve';
import { reducedMotion } from '../motion';

const DUR = 7000;

export function Story() {
  const app = useApp();
  const { theme } = useTheme();
  const sid = app.storySpace ?? 'house';
  const s = space(sid);
  const agent = AGENTS[s.agent];
  const cards = app.stories[sid] ?? [];
  // the queue is fixed when the story opens: what was waiting then
  const [queue] = useState(() => cards.filter(c => c.state !== 'done').map(c => c.id));
  const [idx, setIdx] = useState(0);
  const [atEnd, setAtEnd] = useState(queue.length === 0);
  const [paused, setPaused] = useState(false);
  const [acted, setActed] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [tally, setTally] = useState({ done: 0, later: 0 });
  const elapsed = useRef(0);
  const segRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const live = useRef<HTMLParagraphElement>(null);
  const card = cards.find(c => c.id === queue[idx]);
  const isPay = !!card?.payment;
  const hold = paused || confirming || !!acted;

  const next = useCallback(() => {
    elapsed.current = 0; setActed(null); setConfirming(false);
    setIdx(i => { if (i < queue.length - 1) return i + 1; setAtEnd(true); return i; });
  }, [queue.length]);
  const prev = () => { elapsed.current = 0; setActed(null); setConfirming(false); if (atEnd) { setAtEnd(false); return; } setIdx(i => Math.max(0, i - 1)); };

  // mark seen when shown; the ring loses brightness for that segment
  useEffect(() => {
    if (!atEnd && card && card.state === 'new') app.decideStory(sid, card.id, 'seen');
    if (live.current && card && !atEnd) live.current.textContent = `${s.name}, card ${idx + 1} of ${queue.length}. ${card.kind}. ${card.title}.`;
  }, [idx, atEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  // progress clock
  useEffect(() => {
    if (atEnd) return;
    let raf = 0, last = performance.now();
    const tick = (t: number) => {
      if (!hold) elapsed.current += t - last;
      last = t;
      const fill = segRef.current?.children[idx]?.firstElementChild as HTMLElement | undefined;
      if (fill) fill.style.transform = `scaleX(${Math.min(1, elapsed.current / DUR)})`;
      if (elapsed.current >= DUR) { next(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [idx, atEnd, hold, next]);

  const act = () => {
    if (!card || atEnd) return;
    if (card.payment) { setConfirming(true); return; } // money and sending never act from a gesture
    if (card.state === 'done') { next(); return; }
    app.decideStory(sid, card.id, 'done');
    setTally(t => ({ ...t, done: t.done + 1 }));
    setActed(card.id);
    if (live.current) live.current.textContent = card.done;
    setTimeout(next, reducedMotion() ? 600 : 1500);
  };
  const later = () => { if (atEnd) return; setTally(t => ({ ...t, later: t.later + 1 })); next(); };
  const close = () => app.go('spaces');

  // when a payment inside the story is approved, count it and move on
  useEffect(() => {
    if (card?.payment && app.paid.includes(card.payment) && confirming) {
      setTally(t => ({ ...t, done: t.done + 1 }));
      const t = setTimeout(next, 1800);
      return () => clearTimeout(t);
    }
  }, [app.paid]); // eslint-disable-line react-hooks/exhaustive-deps

  /* gestures: tap sides to move, hold to pause, swipe up for reversible actions only */
  const pd = useRef<{ x: number; y: number; id: number; held: boolean; timer: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    if (atEnd || confirming || e.button > 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pd.current = { x: e.clientX, y: e.clientY, id: e.pointerId, held: false, timer: window.setTimeout(() => { if (pd.current) { pd.current.held = true; setPaused(true); } }, 230) };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = pd.current; if (!d) return;
    const dy = e.clientY - d.y;
    const el = cardRef.current;
    if (dy < -8 && el) {
      clearTimeout(d.timer);
      const k = isPay ? dy * 0.12 : dy * 0.7; // payments resist: the gesture does nothing
      el.style.transform = `translate3d(0, ${k}px, 0) rotate(${k * -0.012}deg)`;
    }
  };
  const onUp = (e: React.PointerEvent) => {
    const d = pd.current; if (!d) return;
    clearTimeout(d.timer); pd.current = null;
    const el = cardRef.current;
    if (el) { el.style.transition = 'transform .35s var(--spring)'; el.style.transform = ''; setTimeout(() => { if (el) el.style.transition = ''; }, 360); }
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (d.held) { setPaused(false); return; }
    if (dy < -60) { if (!isPay) act(); return; }
    if (Math.abs(dx) > 12 || Math.abs(dy) > 12) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientX - r.left < r.width / 3) prev(); else next();
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (confirming) { if (e.key === 'Escape') setConfirming(false); return; }
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowUp' && !isPay) act();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const nextSpace = SPACES.find(x => x.id !== sid && (app.stories[x.id] ?? []).some(c => c.state === 'new'));
  const left = cards.filter(c => c.state !== 'done').length;

  return (
    <section className={`story ${paused ? 'is-paused' : ''}`} aria-label={`${s.name} story`} aria-roledescription="story">
      <div className="segs" ref={segRef} aria-hidden="true">
        {queue.map((id, i) => {
          const c = cards.find(x => x.id === id)!;
          const full = atEnd || i < idx;
          return <span key={id} className={c.state === 'done' ? 'decided' : ''}><i style={{ transform: `scaleX(${full ? 1 : 0})`, transformOrigin: '0 50%', width: '100%' }} /></span>;
        })}
      </div>
      <div className="story-head">
        <span className="glyph"><Icon name={s.glyph} size={17} /></span>
        <div style={{ minWidth: 0 }}><b>{s.name}</b><small>{agent.name}, {queue.length} {queue.length === 1 ? 'card' : 'cards'}</small></div>
        <span className="paused">Paused</span>
        <button className="btn quiet icon" onClick={close} aria-label="Close story"><Icon name="close" size={20} /></button>
      </div>

      <div className="story-body" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        {atEnd ? (
          <div className="end">
            <h2>{left ? `That is ${s.name} for now.` : `${s.name} is clear.`}</h2>
            <p>{left ? `${left} still waiting. ${agent.name} brings ${left === 1 ? 'it' : 'them'} back tomorrow at 08:00.` : `${agent.name} carries on and only comes back when something needs you.`}</p>
            <div className="tally">
              <div><b className="num">{tally.done}</b><span>decided</span></div>
              <div><b className="num">{tally.later}</b><span>for later</span></div>
              <div><b className="num">{queue.length}</b><span>seen</span></div>
            </div>
          </div>
        ) : confirming && card?.payment ? (
          <div className="confirm-inline" onPointerDown={e => e.stopPropagation()}>
            <ApprovalBody id={card.payment} compact />
          </div>
        ) : card && (
          <>
            <div className="tapzones" aria-hidden="true"><span /><span /></div>
            <div ref={cardRef} className={`scard bezel ${card.payment && card.state !== 'done' ? 'needs' : ''} ${acted === card.id ? 'acted' : ''}`}>
              <article className="well" aria-label={`Card ${idx + 1} of ${queue.length}`}>
                <div className="kind"><span>{card.kind}</span><span className="num">{idx + 1} of {queue.length}</span></div>
                <div className="big" style={card.big.startsWith('£') ? { fontWeight: 400, fontSize: 44 } : undefined}>{card.big}</div>
                <h3>{card.title}</h3>
                <div className="rows">{card.rows.map(([k, v, q]) => <div key={k}><span className="k">{k}</span><span className={q ? 'q' : ''}>{q ? `“${v}”` : v}</span></div>)}</div>
                {acted === card.id
                  ? <div className="stamp"><Icon name="check" size={18} />{card.done}</div>
                  : card.live && app.running
                    ? <div className="live"><ThinkingOrb state={card.live.state} size={20} theme={theme} aria-hidden="true" />{card.live.text}</div>
                    : <div className="src">{card.source}</div>}
              </article>
            </div>
          </>
        )}
      </div>

      <div className="story-foot">
        {atEnd ? (
          <div className="acts">
            <button className="btn" onClick={close}>Back to Spaces</button>
            {nextSpace ? <button className="btn primary" onClick={() => app.openStory(nextSpace.id)}>Next: {nextSpace.name}</button> : <button className="btn primary" onClick={close}>Done</button>}
          </div>
        ) : confirming ? (
          <div className="acts" style={{ gridTemplateColumns: '1fr' }}>
            <button className="btn quiet" onClick={() => { setConfirming(false); }}>{card && app.paid.includes(card.payment!) ? 'Carry on' : 'Back to the card'}</button>
          </div>
        ) : card && (
          <>
            <div className="hint" aria-hidden="true">
              {isPay ? <>Payments and sends need a press and hold</> : <><Icon name="chev" size={16} />Swipe up to {card.act.charAt(0).toLowerCase() + card.act.slice(1)}</>}
            </div>
            <div className="acts">
              <button className="btn" onClick={later}>Not now</button>
              <button className="btn primary" onClick={act}>{card.act}</button>
            </div>
          </>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <BotAvatar className="bot" type={agent.avatar} size={32} state={app.running && card?.live ? 'working' : 'default'} paused={!app.running} aria-hidden="true" />
          <span className="fine">{agent.name} prepared {queue.length === 1 ? 'this' : 'these'}{card?.live && app.running && !atEnd ? `. ${card.source}.` : '.'}</span>
        </div>
      </div>
      <p ref={live} className="sr" aria-live="polite" />
    </section>
  );
}
