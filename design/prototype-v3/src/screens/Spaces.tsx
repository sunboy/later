import { useEffect, useLayoutEffect, useRef } from 'react';
import { AGENTS, SPACES, SPACE_META, type AgentId, type Space } from '../data';
import { Icon } from '../icons';
import { Crew, type MState } from '../Mascot';
import { Wordmark } from '../Wordmark';
import { useApp, useFlash } from '../store';
import { reducedMotion, useFlip, usePrefersReducedMotion } from '../motion';

/** A crew member assigned to a Space is its card, tucked into the top of the Space's tile. */
function Tucked({ spaceId, who, state }: { spaceId: string; who: AgentId; state: MState }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { event } = useApp();
  // when Keep assigns someone, their card is dealt from the chief into the tile
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !event || event.type !== 'assign' || event.id !== spaceId || Date.now() - event.at > 400 || reducedMotion()) return;
    const c = document.querySelector('.chief-btn')?.getBoundingClientRect(), r = el.getBoundingClientRect();
    if (!c) return;
    el.classList.add('flying');
    el.animate([
      { transform: `translate(${c.left + c.width / 2 - (r.left + r.width / 2)}px, ${c.top + c.height / 2 - (r.top + r.height / 2)}px) scale(1.5) rotate(-20deg)` },
      { transform: 'translateY(-16px) rotate(4deg)', offset: 0.75 },
      { transform: 'none' },
    ], { duration: 820, easing: 'cubic-bezier(.3,.9,.3,1)' }).finished.then(() => el.classList.remove('flying')).catch(() => {});
  }, [event, spaceId]);
  return <span ref={ref} className="tucked"><Crew who={who} state={state} size={44} /></span>;
}

function SpaceTile({ s, group }: { s: Space; group: 'now' | 'next' | 'later' }) {
  const app = useApp();
  const who = app.staff[s.id];
  const cards = app.stories[s.id] ?? [];
  const fresh = cards.filter(c => c.state === 'new').length;
  const job = app.next.find(n => n.spaceId === s.id);
  const flash = useFlash('staff-' + s.id);
  const meta = SPACE_META[s.id];
  const state: MState = !app.running ? 'rest' : group === 'now' ? 'waiting' : job?.orb ? 'working' : group === 'later' ? 'rest' : 'idle';
  const live = cards.filter(c => c.state !== 'done').length;
  const Main = cards.length ? 'button' : 'div';
  return (
    <div className={`sp-tile g-${group} ${flash ? 'flash' : ''}`} data-flip={'t-' + s.id} id={'tile-' + s.id}>
      {who && <Tucked spaceId={s.id} who={who} state={state} />}
      <div className="sp-card">
        <Main className="sp-main" onClick={cards.length ? () => app.openStory(s.id) : undefined} aria-label={cards.length ? `${s.name}. ${meta.status}. Play its cards` : undefined}>
          <span className="glyph"><Icon name={s.glyph} size={17} /></span>
          <span className="sp-text">
            <b>{s.name}</b>
            <span>{job ? `${AGENTS[job.agent].name}: ${job.status}` : meta.status}</span>
            <small>{who ? `${AGENTS[who].name}, as of ${meta.asOf}` : `as of ${meta.asOf}`}</small>
          </span>
          {group === 'now' && fresh > 0 && <span className="sp-count"><b>{fresh}</b>need you</span>}
          {group === 'next' && job && <span className="sp-count quiet"><b>{job.eta}</b>reaches you</span>}
        </Main>
        {(!who || cards.length > 0) && <div className="sp-foot">
          {!who && <button className="put" onClick={() => app.assign(s.id, 'juno')}>Ask Keep to put Juno on it</button>}
          {cards.length > 0 && <button onClick={() => app.openStory(s.id)}><Icon name="chev" size={14} />Play {live || 'the'} {live === 1 ? 'card' : 'cards'}</button>}
        </div>}
      </div>
    </div>
  );
}

export function Spaces() {
  const app = useApp();
  const ASK = ['Needs a reply', 'Approval', 'Ready to pay', 'Decision', 'From the school'];
  const needs = (id: string) => (app.stories[id] ?? []).some(c => c.state === 'new' && ASK.includes(c.kind)) || app.deck.some(c => c.spaceId === id && (c.emphasis === 'urgent' || c.near));
  const scroller = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  useFlip(scroller, [...SPACES.map(s => s.id + (needs(s.id) ? 'n' : app.next.some(n => n.spaceId === s.id) ? 'x' : 'l') + (app.staff[s.id] ?? ''))].join('|'));
  // Keep assigning someone: bring that tile into view so the deal is seen
  useEffect(() => {
    const ev = app.event; if (!ev || ev.type !== 'assign' || Date.now() - ev.at > 400) return;
    const el = scroller.current?.querySelector('#tile-read') as HTMLElement | null, sc = scroller.current;
    if (el && sc) sc.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 200), behavior: reduced ? 'auto' : 'smooth' });
  }, [app.event, reduced]);
  const now = SPACES.filter(s => needs(s.id));
  const next = SPACES.filter(s => !needs(s.id) && app.next.some(n => n.spaceId === s.id));
  const later = SPACES.filter(s => !now.includes(s) && !next.includes(s));
  const crew = (Object.keys(AGENTS) as AgentId[]).map(a => ({ a, on: SPACES.filter(s => app.staff[s.id] === a) }));
  return (
    <div className="screen">
      <div className="scroll no-dock" ref={scroller}>
        <div className="sp-head">
          <Wordmark size={30} />
          <span className="avatar-me" aria-label="Your profile, Sam Reid">SR</span>
        </div>
        <p className="sp-date">{SPACES.length} Spaces. <b>{now.length} need you</b>, {next.length} in hand, {later.length} resting.</p>

        <div className="roster" role="list" aria-label="Keep’s crew and where each is working">
          {crew.map(({ a, on }) => (
            <div key={a} role="listitem">
              <Crew who={a} size={40} state={!app.running ? 'rest' : app.next.some(n => n.agent === a && n.orb) ? 'working' : 'idle'} />
              <b>{AGENTS[a].name}</b><span>{on.length} {on.length === 1 ? 'Space' : 'Spaces'}</span>
            </div>
          ))}
        </div>

        <section className="band" aria-labelledby="sh-now">
          <div className="band-head"><h2 className="h-now" id="sh-now">Now</h2><p>Spaces that need you</p></div>
          <div className="sp-list">{now.length ? now.map(s => <SpaceTile key={s.id} s={s} group="now" />) : <div className="empty-now">No Space needs you.</div>}</div>
        </section>
        {next.length > 0 && <section className="band" aria-labelledby="sh-next">
          <div className="band-head"><h2 className="h-next" id="sh-next">Next</h2><p>the crew are on these</p></div>
          <div className="sp-list">{next.map(s => <SpaceTile key={s.id} s={s} group="next" />)}</div>
        </section>}
        <section className="band band-later" aria-labelledby="sh-later">
          <div className="band-head"><h2 className="h-later" id="sh-later">Later</h2><p>resting until their time</p></div>
          <div className="sp-list">{later.map(s => <SpaceTile key={s.id} s={s} group="later" />)}</div>
        </section>
      </div>
    </div>
  );
}
