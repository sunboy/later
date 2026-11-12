/* The block vocabulary. Each block reads its typed data and its size and emphasis hints; nothing else. */
import { useEffect, useState } from 'react';
import type { AgentId, Placed, SourceRef } from '../spec/types';
import { CREW_NAME, fmt, money, useTween } from '../format';
import { useInnerFlip } from '../flip';
import { Crew, Chief } from '../Mascot';
import { Icon } from '../icons';
import { RouteMap, SeriesChart, ThumbArt } from './charts';
import { Consent, Pay } from './fixed';

type B<T extends Placed['type']> = { b: Extract<Placed, { type: T }> };

const Who = ({ a, size = 22, state = 'idle' }: { a: AgentId; size?: number; state?: 'idle' | 'rest' }) => a === 'keep' ? <Chief size={size} state={state} /> : <Crew who={a} size={size} state={state} />;

function Sources({ s }: { s: SourceRef[] }) {
  return (
    <p className="src">
      {s.map((x, i) => (
        <span key={i} className={x.trust === 'external' ? 'ext' : undefined} title={x.trust === 'external' ? 'From outside your control' : undefined}>{i ? (i === s.length - 1 ? ' and ' : ', ') : 'From '}{x.name}{x.when ? ` ${x.when}` : ''}</span>
      ))}
    </p>
  );
}

function Headline({ b }: B<'headline'>) {
  const d = b.data;
  return (
    <div className="hl">
      <h2 className="hl-t">{d.title}</h2>
      {d.line && <p className="hl-l">{d.crew && <Who a={d.crew} size={24} state={b.emphasis === 'quiet' ? 'rest' : 'idle'} />}<span>{d.line}</span></p>}
    </div>
  );
}

function Prose({ b }: B<'prose'>) {
  return <div className="prose"><p className="pr-t">{b.data.text}</p><Sources s={b.data.sources} /></div>;
}

function Stat({ b }: B<'stat'>) {
  const d = b.data;
  const v = useTween(d.value);
  const pct = d.of ? Math.min(1, d.value / d.of) : 0;
  const down = d.trend && d.trend.delta < 0;
  return (
    <div className="stat">
      <p className="st-v num">{fmt(v, d.format)}{d.format === 'days' && <small>{Math.round(d.value) === 1 ? ' day' : ' days'}</small>}</p>
      <p className="st-l">{d.label}</p>
      {d.of !== undefined && (
        <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={d.of} aria-valuenow={d.value} aria-label={d.label}>
          <i style={{ transform: `scaleX(${pct})` }} />
          <span>of {fmt(d.of, d.format)}</span>
        </div>
      )}
      {d.trend && (
        <p className={`st-t ${down ? 'down' : 'up'}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d={down ? 'M6 2v8M2.5 6.5 6 10l3.5-3.5' : 'M6 10V2M2.5 5.5 6 2l3.5 3.5'} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <b>{fmt(Math.abs(d.trend.delta), d.format)}</b> <span>{d.trend.basis}</span>
        </p>
      )}
    </div>
  );
}

function Series({ b }: B<'series'>) {
  const d = b.data;
  const last = d.points[d.points.length - 1];
  const v = useTween(last.y);
  return (
    <div className="series">
      <div className="se-top">
        <p className="se-l">{d.label}</p>
        <p className="se-v num">{fmt(v, d.format)}<small> {last.x}</small></p>
      </div>
      <SeriesChart b={b} />
      {b.size !== 'small' && (
        <p className="src">{d.compare && <span className="key"><i className="k-now" />This month<i className="k-cmp" />{d.compare.label}<span className="sep" /></span>}From {d.source.name}{d.source.when ? ` ${d.source.when}` : ''}</p>
      )}
    </div>
  );
}

function Comparison({ b }: B<'comparison'>) {
  const d = b.data;
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => setPicked(null), [d.options.map(o => o.id).join()]);
  const ref = useInnerFlip<HTMLDivElement>(`${d.form}|${d.options.map(o => o.id).join()}`);
  const facts = b.size === 'small' ? 1 : b.size === 'medium' ? 2 : 4;
  const cheapest = d.options.reduce((a, o) => (o.price.minor < a.price.minor ? o : a), d.options[0]);
  return (
    <div className="cmp-b">
      <p className="b-q">{d.question}</p>
      <div ref={ref} className={`opts f-${d.form} n-${d.options.length}`} role="list">
        {d.form === 'table' && (
          <div className="tr th" data-k="__head" role="presentation"><span>Option</span><span>Price</span>{d.options[0].facts.slice(0, 2).map(f => <span key={f.k}>{f.k}</span>)}</div>
        )}
        {d.options.map(o => {
          const rec = o.id === d.recommended;
          const sel = picked === o.id;
          return d.form === 'columns' ? (
            <div key={o.id} data-k={o.id} role="listitem" className={`opt ${rec ? 'rec' : ''} ${sel ? 'sel' : ''}`}>
              {o.thumb && <ThumbArt kind={o.thumb} />}
              <div className="opt-in">
                <b className="opt-n">{o.name}</b>
                <span className="opt-p num">{money(o.price)}</span>
                <dl className="opt-f">{o.facts.slice(0, facts).map(f => <div key={f.k}><dt>{f.k}</dt><dd>{f.v}</dd></div>)}</dl>
                {rec && <span className="opt-rec">{d.options.length > 1 ? 'Recommended' : 'The one to take'}</span>}
                {b.size !== 'small' && <button className={`btn sm ${rec ? 'onrec' : ''}`} aria-pressed={sel} onClick={() => setPicked(sel ? null : o.id)}>{sel ? <><Icon name="check" size={16} />Chosen</> : 'Choose'}</button>}
              </div>
            </div>
          ) : (
            <div key={o.id} data-k={o.id} role="listitem" className={`tr ${rec ? 'rec' : ''}`}>
              <span className="tn"><b>{o.name}</b>{rec && <em>Recommended</em>}{o.id === cheapest.id && d.options.length > 1 && !rec && <em className="cheap">Cheapest</em>}</span>
              <span className="tp num">{money(o.price)}</span>
              {o.facts.slice(0, 2).map(f => <span key={f.k} className="tf">{f.v}</span>)}
            </div>
          );
        })}
      </div>
      {d.reason && b.size !== 'small' && <p className="b-why"><Icon name="check" size={15} /><span>{d.reason}</span></p>}
      <p className="src">From {d.source.name}{d.source.when ? ` ${d.source.when}` : ''}</p>
    </div>
  );
}

function Timeline({ b }: B<'timeline'>) {
  const steps = b.data.steps;
  const ref = useInnerFlip<HTMLOListElement>(`${b.size}|${steps.map(s => s.id + s.state).join()}`);
  if (b.size === 'small') {
    const now = steps.find(s => s.state === 'now') ?? steps.find(s => s.state === 'next') ?? steps[steps.length - 1];
    const i = steps.indexOf(now);
    return (
      <div className="tl-s">
        <div className="tl-track" aria-hidden="true">{steps.map((s, j) => <i key={s.id} className={`${s.state} ${j === i ? 'cur' : ''}`} />)}</div>
        <p><b>{now.label}</b> <span>{now.date}</span></p>
      </div>
    );
  }
  return (
    <ol ref={ref} className={`tl ${b.size}`}>
      {steps.map(s => (
        <li key={s.id} data-k={s.id} className={s.state}>
          <span className="tl-dot" aria-hidden="true" />
          <time>{s.date}</time>
          <div><b>{s.label}</b>{s.state === 'now' && <span className="now-tag">Now</span>}{s.detail && b.size === 'large' && <small>{s.detail}</small>}</div>
        </li>
      ))}
    </ol>
  );
}

function Checklist({ b }: B<'checklist'>) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const key = b.data.items.map(i => i.id + i.done).join();
  useEffect(() => setDone({}), [key]);
  const items = b.data.items.map(i => ({ ...i, done: done[i.id] ?? i.done }));
  const ref = useInnerFlip<HTMLDivElement>(`${b.size}|${b.data.items.map(i => i.id).join()}`);
  const me = items.filter(i => i.owner === 'me'), crew = items.filter(i => i.owner === 'crew');
  const left = items.filter(i => !i.done).length;
  if (b.size === 'small') {
    return (
      <div className="ck-s">
        <p><b className="num">{left}</b> left <span>{me.filter(i => !i.done).length} for you, {crew.filter(i => !i.done).length} with the crew</span></p>
        <div className="ck-bar" aria-hidden="true">{items.map(i => <i key={i.id} className={`${i.owner} ${i.done ? 'done' : ''}`} />)}</div>
      </div>
    );
  }
  const Col = ({ title, list, who }: { title: string; list: typeof items; who: 'me' | 'crew' }) => (
    <div className={`ck-col ${who}`}>
      <p className="ck-h">{title}<span className="num">{list.filter(i => !i.done).length}</span></p>
      <ul>
        {list.map(i => (
          <li key={i.id} data-k={i.id} className={i.done ? 'done' : ''}>
            {who === 'me'
              ? <button className="ck-box" role="checkbox" aria-checked={i.done} aria-label={i.text} onClick={() => setDone(s => ({ ...s, [i.id]: !i.done }))}>{i.done && <Icon name="check" size={14} stroke={2.2} />}</button>
              : <span className="ck-crew" title={i.crew ? CREW_NAME[i.crew] : 'Crew'}>{i.crew && i.crew !== 'keep' ? <Crew who={i.crew} size={22} state={i.done ? 'idle' : 'working'} /> : <Chief size={22} />}</span>}
            <span className="ck-t">{i.text}{i.due && !i.done && <small>{i.due}</small>}</span>
          </li>
        ))}
        {list.length === 0 && <li className="ck-none">Nothing here</li>}
      </ul>
    </div>
  );
  return (
    <div ref={ref} className={`ck ${me.length && crew.length ? 'two' : 'one'}`}>
      {me.length > 0 && <Col title="You" list={me} who="me" />}
      {crew.length > 0 && <Col title="The crew" list={crew} who="crew" />}
    </div>
  );
}

function People({ b }: B<'people'>) {
  const ps = b.data.people;
  const ref = useInnerFlip<HTMLUListElement>(`${b.size}|${ps.map(p => p.id).join()}`);
  if (b.size === 'small') {
    return (
      <div className="pp-s">
        <span className="pp-stack">{ps.map(p => <i key={p.id} className="av">{p.initials}</i>)}</span>
        <p>{ps.map(p => p.name.split(' ')[0]).join(', ')}</p>
      </div>
    );
  }
  return (
    <ul ref={ref} className="pp">
      {ps.map(p => (
        <li key={p.id} data-k={p.id}>
          <i className="av">{p.initials}</i>
          <div><b>{p.name}</b><span>{p.role}</span>{(b.size === 'large' || ps.length <= 2) && <small><Icon name="book" size={13} />{p.note}</small>}</div>
        </li>
      ))}
    </ul>
  );
}

function Route({ b }: B<'route'>) {
  const d = b.data;
  const total = d.legs.reduce((s, l) => s + l.minutes, 0);
  return (
    <div className="rt-b">
      <RouteMap d={d} size={b.size} />
      <p className="rt-sum">
        <b>{d.stops[0].time} to {d.stops[d.stops.length - 1].time}</b>
        <span className={`rt-tt ${d.showTimes ? 'on' : ''}`}>{d.showTimes ? `${total} min travelling, ${d.legs.length} legs` : `${d.stops.length} stops`}</span>
      </p>
    </div>
  );
}

function Media({ b }: B<'media'>) {
  const ref = useInnerFlip<HTMLDivElement>(`${b.size}|${b.data.items.map(i => i.id).join()}`);
  return (
    <div ref={ref} className={`media n-${b.data.items.length} ${b.size}`}>
      {b.data.items.map(i => (
        <figure key={i.id} data-k={i.id}>
          <ThumbArt kind={i.thumb} />
          <figcaption><b>{i.title}</b>{b.size !== 'small' && <span>{i.caption}</span>}</figcaption>
        </figure>
      ))}
      <p className="src media-note">Drawings stand in for photos in this prototype.</p>
    </div>
  );
}

function Quote({ b }: B<'quote'>) {
  return (
    <figure className="qt">
      <blockquote>{b.data.text}</blockquote>
      <figcaption><b>{b.data.by}</b> <span>{b.data.source.name}{b.data.source.when ? `, ${b.data.source.when}` : ''}</span></figcaption>
    </figure>
  );
}

function Choice({ b }: B<'choice'>) {
  const d = b.data;
  const [sel, setSel] = useState(d.selected);
  useEffect(() => setSel(d.selected), [d.selected, d.question]);
  return (
    <div className="ch">
      <p className="b-q">{d.question}</p>
      <div className="ch-opts" role="radiogroup" aria-label={d.question}>
        {d.options.map(o => (
          <button key={o.id} role="radio" aria-checked={sel === o.id} className={`ch-o ${sel === o.id ? 'on' : ''}`} onClick={() => setSel(sel === o.id ? undefined : o.id)}>
            <span className="ch-r" aria-hidden="true">{sel === o.id && <Icon name="check" size={14} stroke={2.4} />}</span>
            <span><b>{o.label}</b>{o.detail && <small>{o.detail}</small>}</span>
          </button>
        ))}
      </div>
      <p className="ch-note">{sel ? 'You can change this until it is booked.' : 'Pick one. You can change it later.'}</p>
    </div>
  );
}

function Input({ b }: B<'input'>) {
  const d = b.data;
  const [v, setV] = useState(d.value ?? '');
  const [saved, setSaved] = useState(!!d.value);
  useEffect(() => { setV(d.value ?? ''); setSaved(!!d.value); }, [d.value, d.label]);
  const fid = `in-${b.id}`;
  return (
    <form className="inp" onSubmit={e => { e.preventDefault(); if (v) setSaved(true); }}>
      <label htmlFor={fid}>{d.label}</label>
      <div className="inp-row">
        {d.kind === 'money' && <span className="inp-pre">£</span>}
        <input id={fid} type={d.kind === 'date' ? 'date' : 'text'} inputMode={d.kind === 'money' ? 'decimal' : undefined} value={v} placeholder={d.placeholder}
          onChange={e => { setV(e.target.value); setSaved(false); }} />
        <button className="btn sm primary" type="submit" disabled={!v || saved}>{saved ? 'Saved' : 'Save'}</button>
      </div>
      <p className="inp-help">{d.help}</p>
    </form>
  );
}

export function BlockBody({ b }: { b: Placed }) {
  switch (b.type) {
    case 'headline': return <Headline b={b} />;
    case 'prose': return <Prose b={b} />;
    case 'stat': return <Stat b={b} />;
    case 'series': return <Series b={b} />;
    case 'comparison': return <Comparison b={b} />;
    case 'timeline': return <Timeline b={b} />;
    case 'checklist': return <Checklist b={b} />;
    case 'people': return <People b={b} />;
    case 'route': return <Route b={b} />;
    case 'media': return <Media b={b} />;
    case 'quote': return <Quote b={b} />;
    case 'choice': return <Choice b={b} />;
    case 'input': return <Input b={b} />;
    case 'consent': return <Consent d={b.data} />;
    case 'pay': return <Pay d={b.data} />;
  }
}
