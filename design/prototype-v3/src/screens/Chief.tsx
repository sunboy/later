import { useEffect, useRef, useState } from 'react';
import { AGENTS, SPACES, space, type Msg } from '../data';
import { Icon } from '../icons';
import { Chief, Crew } from '../Mascot';
import { useApp, useFlash } from '../store';

/** One surface for talking, typing and capturing. Threads are lenses on Spaces, plus one with Keep. */
export function ChiefSheet() {
  const app = useApp();
  const { chief, threads } = app;
  const [text, setText] = useState('');
  const [focus, setFocus] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const landed = useFlash('chief');
  const t = chief.thread;
  const msgs: Msg[] = t ? threads[t] ?? [] : [];
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length, t, chief.busy]);
  if (!chief.open) return null;

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const v = text.trim(); if (!v) return;
    setText('');
    if (!t) app.openChief('keep');
    app.say(t ?? 'keep', v);
  };
  const speak = () => { app.closeChief(); app.go('capture'); };
  const mood = chief.busy ? 'thinking' : landed ? 'done' : focus ? 'listening' : app.chiefState === 'rest' ? 'idle' : app.chiefState;
  const who = t && t !== 'keep' ? app.staff[t] : null;

  const composer = (
    <form className="talk" onSubmit={send}>
      <input id="keep-say" value={text} onChange={e => setText(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        placeholder={t && t !== 'keep' ? `Say something about ${space(t).name}` : 'Say it, or type it'} aria-label="Message" autoComplete="off" />
      {text.trim()
        ? <button className="talk-btn" type="submit" aria-label="Send"><Icon name="send" size={20} /></button>
        : <button className="talk-btn" type="button" onClick={speak} aria-label="Speak instead"><Icon name="mic" size={20} /></button>}
    </form>
  );

  return (
    <div className="keep" role="dialog" aria-modal="true" aria-label={t ? 'Thread' : 'Keep'} onKeyDown={e => e.key === 'Escape' && app.closeChief()}>
      {!t ? (
        <>
          <div className="keep-top"><span /><button className="btn quiet sm" onClick={app.closeChief}><Icon name="close" size={16} />Close</button></div>
          <div className="keep-scroll">
            <div className="keep-hero">
              <Chief state={mood} size={132} />
              <h2>Keep</h2>
              <p>Tell me once. I file it in the right Space and put someone on it.</p>
            </div>
            {composer}
            <div className="keep-ways">
              <button onClick={speak}><Icon name="mic" size={17} /><span><b>Ramble</b>Speak loosely, get cards</span></button>
              <button onClick={() => app.openChief('keep')}><Icon name="forward" size={17} /><span><b>Forward</b>Send any email to Keep</span></button>
            </div>
            <h3 className="keep-h">Threads</h3>
            <div className="thr-list">
              <ThreadRow id="keep" name="Keep" last={threads.keep} />
              {SPACES.filter(s => (threads[s.id] ?? []).length > 0).map(s => <ThreadRow key={s.id} id={s.id} name={s.name} last={threads[s.id]} />)}
            </div>
            <p className="fine keep-note">One thread per Space, and this one. A thread is that Space’s log, with a place to talk.</p>
          </div>
        </>
      ) : (
        <>
          <div className="keep-top thread">
            <button className="btn quiet sm" onClick={() => app.openChief(null)} aria-label="All threads"><Icon name="back" size={16} />Threads</button>
            <div className="thr-title">
              {who ? <Crew who={who} size={30} state={chief.busy ? 'thinking' : 'idle'} /> : <Chief size={30} state={mood} />}
              <div><b>{t === 'keep' ? 'Keep' : space(t).name}</b><small>{t === 'keep' ? 'Anything, unfiled' : who ? `${AGENTS[who].name} is on it` : 'No one is on it'}</small></div>
            </div>
            <button className="btn quiet sm" onClick={app.closeChief} aria-label="Close"><Icon name="close" size={16} /></button>
          </div>
          <div className="keep-scroll msgs">
            {msgs.map((m, i) => m.who === 'log'
              ? <p key={i} className="m-log"><span>{m.text}</span><time>{m.at}</time></p>
              : <div key={i} className={`m-${m.who}`}>
                  <p>{m.text}</p>
                  {m.card && (
                    <button className="m-card" onClick={() => { const id = m.card!.spaceId ?? t; if (id !== 'keep' && (app.stories[id] ?? []).length) app.openStory(id); else app.openChief(id === 'keep' ? null : id); }}>
                      <small>{m.card.kind}{m.card.spaceId ? `, ${space(m.card.spaceId).name}` : ''}</small><b>{m.card.title}</b><span>{m.card.state}</span>
                    </button>
                  )}
                </div>)}
            {chief.busy && <p className="m-log"><span>{who ? AGENTS[who].name : 'Keep'} is working it out</span></p>}
            <div ref={end} />
          </div>
          <div className="keep-foot">{composer}<p className="fine">Anything that sends or pays still comes to Now for a press and hold. Never from here.</p></div>
        </>
      )}
    </div>
  );
}

function ThreadRow({ id, name, last }: { id: string; name: string; last: Msg[] }) {
  const app = useApp();
  const m = last[last.length - 1];
  const who = id === 'keep' ? null : app.staff[id];
  const needs = id !== 'keep' && (app.stories[id] ?? []).some(c => c.state === 'new');
  return (
    <button className="thr" onClick={() => app.openChief(id)}>
      {who ? <Crew who={who} size={36} state={needs ? 'waiting' : 'idle'} /> : <Chief size={36} />}
      <span className="thr-main"><b>{name}</b><span>{m ? (m.who === 'you' ? 'You: ' : '') + m.text : 'Nothing said yet'}</span></span>
      {needs && <i className="thr-dot" aria-label="needs you" />}
    </button>
  );
}
