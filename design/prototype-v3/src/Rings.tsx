import { SPACES, space, type StoryCard } from './data';
import { Icon } from './icons';
import { useApp, useFlash } from './store';

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

export function Rings() {
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
