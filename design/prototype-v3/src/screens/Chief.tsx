import { useEffect, useRef, useState } from 'react';
import { AGENTS, NOTE, RAMBLE, SPACES, space, type Msg } from '../data';
import { Icon } from '../icons';
import { Chief, Crew } from '../Mascot';
import { useApp, useFlash } from '../store';
import { reducedMotion } from '../motion';

/** A demo voice: syllable-rate envelope with phrase pauses. The artifact frame refuses the microphone. */
function demoLevel(t: number) {
  const phrase = (Math.sin(t * 0.0011) + 1) / 2;
  const syll = Math.pow(Math.max(0, Math.sin(t * 0.021) * Math.sin(t * 0.0077 + 1.3)), 0.6);
  const gap = Math.sin(t * 0.0006) > 0.82 ? 0.1 : 1;
  return Math.min(1, (0.25 + 0.75 * syll) * (0.45 + 0.55 * phrase) * gap);
}
const mmss = (s: number) => `0:${String(s).padStart(2, '0')}`;
const WORDS = RAMBLE.split(' ');

/** Talking to Keep: Keep listens, what you say appears under it, and the cards it proposes land in the Keep thread. */
function Listening() {
  const app = useApp();
  const [words, setWords] = useState(0);
  const [secs, setSecs] = useState(0);
  const bars = useRef<HTMLSpanElement>(null);
  const tidying = app.rec === 'tidying';
  const t0 = useRef(performance.now());

  useEffect(() => {
    if (tidying) return;
    const t = setInterval(() => {
      const el = performance.now() - t0.current;
      setSecs(Math.floor(el / 1000));
      setWords(Math.min(WORDS.length, Math.floor(el / 190)));
    }, 120);
    return () => clearInterval(t);
  }, [tidying]);
  useEffect(() => { if (!tidying && words >= WORDS.length) app.stopRec(Math.max(1, secs)); }, [words]); // eslint-disable-line react-hooks/exhaustive-deps
  // the level meter: five strokes driven by the voice, transform only
  useEffect(() => {
    if (tidying || reducedMotion()) return;
    let raf = 0;
    const step = (t: number) => {
      const lv = demoLevel(t);
      bars.current?.querySelectorAll<HTMLElement>('i').forEach((b, i) => { b.style.transform = `scaleY(${0.18 + lv * (0.5 + 0.5 * Math.abs(Math.sin(t / 140 + i * 1.7)))})`; });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [tidying]);

  return (
    <div className="listen" aria-live="off">
      <p className="listen-state" role="status">{tidying ? 'Keep is tidying your note and finding where each part goes' : 'Keep is listening'}<span className="num">{mmss(secs)}</span></p>
      <p className={`listen-words ${tidying ? 'tidy' : ''}`}>
        {words === 0 && !tidying ? <span className="dim">Ramble. The removals, the party, the gym.</span> : WORDS.slice(0, words).map((w, i) => <span key={i} className="w">{w} </span>)}
      </p>
      {!tidying && (
        <div className="listen-row">
          <span className="meter" ref={bars} aria-hidden="true"><i /><i /><i /><i /><i /></span>
          <span className="fine">Demo voice. On a phone it is heard on the device, offline. Nothing leaves it yet.</span>
          <button className="mic rec" onClick={() => app.stopRec(Math.max(1, secs))} aria-label="Stop and file"><Icon name="stop" size={22} /></button>
        </div>
      )}
    </div>
  );
}

function Proposal({ id }: { id: string }) {
  const app = useApp();
  const pr = app.proposals[id]; if (!pr) return null;
  const where = Object.entries(pr.spaces.reduce<Record<string, number>>((m, s) => ({ ...m, [s]: (m[s] ?? 0) + 1 }), {}))
    .map(([sid, n]) => `${n} to ${space(sid).name}${app.staff[sid] ? ` with ${AGENTS[app.staff[sid]!].name}` : ''}`).join(', ');
  if (pr.filed) return (
    <div className="filed" role="status">
      <div><b>Filed 3 cards</b><small>{where}. Each will come to Now when it needs you.</small></div>
      <button className="btn sm quiet" onClick={() => app.fileProposal(id, false)}><Icon name="undo" size={15} />Undo</button>
    </div>
  );
  return (
    <section className="proposals" aria-label="Cards to file">
      {NOTE.cards.map((c, i) => {
        const sid = pr.spaces[i]; const who = app.staff[sid];
        return (
          <div key={c.title} className="pcard">
            {who ? <Crew who={who} size={32} state="idle" /> : <span className="glyph"><Icon name={space(sid).glyph} size={16} /></span>}
            <div style={{ minWidth: 0 }}>
              <b>{c.title}</b>
              <small>{space(sid).name}, {c.when}. <button onClick={() => app.moveProposal(id, i)} aria-label={`Move ${c.title} to another Space`}>Move</button></small>
            </div>
          </div>
        );
      })}
      <button className="btn primary" onClick={() => app.fileProposal(id, true)}>File all 3</button>
    </section>
  );
}

function VoiceMsg({ m }: { m: Msg }) {
  const [raw, setRaw] = useState(false);
  return (
    <div className="m-you voice">
      <small><Icon name="mic" size={13} />Voice note, {mmss(m.voice!.secs)}</small>
      <p>{m.text}</p>
      <button className="raw-toggle" onClick={() => setRaw(r => !r)} aria-expanded={raw}>{raw ? 'Hide what you said' : 'Show what you said'}</button>
      {raw && <p className="raw">{m.voice!.raw}</p>}
    </div>
  );
}

/** One surface for talking, typing and capturing. Threads are lenses on Spaces, plus one with Keep. Reached only from Keep. */
export function ChiefSheet() {
  const app = useApp();
  const { chief, threads } = app;
  const [text, setText] = useState('');
  const [focus, setFocus] = useState(false);
  const [fwd, setFwd] = useState<'closed' | 'open' | 'copied'>('closed');
  const end = useRef<HTMLDivElement>(null);
  const landed = useFlash('chief');
  const t = chief.thread;
  const msgs: Msg[] = t ? threads[t] ?? [] : [];
  const lastProposal = msgs.filter(m => m.proposal).map(m => m.proposal!.id).pop();
  const proposalFiled = lastProposal ? app.proposals[lastProposal]?.filed : false;
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length, t, chief.busy, proposalFiled]);
  useEffect(() => { if (!chief.open) setFwd('closed'); }, [chief.open]);
  if (!chief.open) return null;

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const v = text.trim(); if (!v) return;
    setText('');
    if (!t) app.openChief('keep');
    app.say(t ?? 'keep', v);
  };
  const mood = app.rec === 'listening' ? 'listening' : app.rec === 'tidying' || chief.busy ? 'thinking' : landed ? 'done' : focus ? 'listening' : app.chiefState === 'rest' ? 'idle' : app.chiefState;
  const who = t && t !== 'keep' ? app.staff[t] : null;
  const copyFwd = async () => { try { await navigator.clipboard.writeText('keep@later-sam.workers.dev'); } catch { /* the frame may block the clipboard */ } setFwd('copied'); };

  const composer = (
    <form className="talk" onSubmit={send}>
      <input id="keep-say" value={text} onChange={e => setText(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        placeholder={t && t !== 'keep' ? `Say something about ${space(t).name}` : 'Say it, or type it'} aria-label="Message" autoComplete="off" />
      {text.trim()
        ? <button className="talk-btn" type="submit" aria-label="Send to Keep"><Icon name="send" size={20} /></button>
        : <button className="talk-btn mic-btn" type="button" onClick={app.startRec} aria-label="Talk to Keep"><Icon name="mic" size={22} /></button>}
    </form>
  );

  // the needs-you dot: a Space with an unseen card that asks for you, or a card in Now
  const needs = (id: string) => (app.stories[id] ?? []).some(c => c.state === 'new' && (c.send || c.bill || c.kind === 'Needs a reply' || c.kind === 'Decision')) || app.deck.some(c => c.spaceId === id && (c.send || c.bill || c.emphasis));
  const ordered = [...SPACES].sort((a, b) => Number(needs(b.id)) - Number(needs(a.id)));

  if (app.rec || !t) return (
    <div className={`keep ${app.rec ? 'is-rec' : ''}`} role="dialog" aria-modal="true" aria-label="Keep" onKeyDown={e => e.key === 'Escape' && app.closeChief()}>
      <div className="keep-top"><span /><button className="btn quiet sm" onClick={app.closeChief}><Icon name="close" size={16} />Close</button></div>
      <div className="keep-scroll">
        <div className="keep-hero">
          <Chief state={mood} size={128} out={app.crewOut >= 2} />
          <h2>Keep</h2>
          {!app.rec && <p>Tell me once, out loud or typed. I file it in the right Space and put someone on it.</p>}
        </div>
        {app.rec ? <Listening /> : (
          <>
            {composer}
            <div className="keep-ways">
              <button onClick={app.startRec}><Icon name="mic" size={17} /><span><b>Ramble</b>Speak loosely, get cards</span></button>
              <button onClick={() => setFwd(f => f === 'closed' ? 'open' : 'closed')} aria-expanded={fwd !== 'closed'}><Icon name="forward" size={17} /><span><b>Forward</b>Send any email to Keep</span></button>
            </div>
            {fwd !== 'closed' && (
              <div className="fwd" role="status">
                <span>Forward any email to <span className="code">keep@later-sam.workers.dev</span>. It lands in your Keep thread and gets filed.</span>
                <button className="btn sm" onClick={copyFwd}>{fwd === 'copied' ? 'Copied' : 'Copy'}</button>
              </div>
            )}
            <h3 className="keep-h">Threads</h3>
            <div className="thr-list">
              <ThreadRow id="keep" name="Keep" last={threads.keep} needs={false} />
              {ordered.map(s => <ThreadRow key={s.id} id={s.id} name={s.name} last={threads[s.id] ?? []} needs={needs(s.id)} />)}
            </div>
            <p className="fine keep-note">One thread with Keep, and one for each Space. A thread is that Space’s log, with a place to talk. Nothing is approved in a thread.</p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="keep" role="dialog" aria-modal="true" aria-label="Thread" onKeyDown={e => e.key === 'Escape' && app.closeChief()}>
      <div className="keep-top thread">
        <button className="btn quiet sm" onClick={() => app.openChief(null)} aria-label="All threads"><Icon name="back" size={16} />Threads</button>
        <div className="thr-title">
          {who ? <Crew who={who} size={30} state={chief.busy ? 'thinking' : 'idle'} /> : <Chief size={30} state={mood} out={app.crewOut >= 2} />}
          <div><b>{t === 'keep' ? 'Keep' : space(t).name}</b><small>{t === 'keep' ? 'Anything, unfiled' : who ? `${AGENTS[who].name} is on it` : 'No one is on it'}</small></div>
        </div>
        <button className="btn quiet sm" onClick={app.closeChief} aria-label="Close"><Icon name="close" size={16} /></button>
      </div>
      <div className="keep-scroll msgs">
        {msgs.length === 0 && <p className="m-log"><span>Nothing here yet. What happens in {space(t).name} is logged here as it happens.</span></p>}
        {msgs.map((m, i) => m.who === 'log'
          ? <p key={i} className="m-log"><span>{m.text}</span><time>{m.at}</time></p>
          : m.voice ? <VoiceMsg key={i} m={m} />
          : <div key={i} className={`m-${m.who}`}>
              <p>{m.text}</p>
              {m.proposal && <Proposal id={m.proposal.id} />}
              {m.card && (
                <button className="m-card" onClick={() => { const id = m.card!.spaceId ?? t; if (id !== 'keep' && (app.stories[id] ?? []).length) app.openStory(id); else app.openChief(id === 'keep' ? null : id); }}>
                  <small>{m.card.kind}{m.card.spaceId ? `, ${space(m.card.spaceId).name}` : ''}</small><b>{m.card.title}</b><span>{m.card.state}</span>
                </button>
              )}
            </div>)}
        {chief.busy && <p className="m-log"><span>{who ? AGENTS[who].name : 'Keep'} is working it out</span></p>}
        <div ref={end} />
      </div>
      <div className="keep-foot">{composer}<p className="fine">Sends come to Now for a press and hold, and bills as ready to pay. Nothing goes from a thread.</p></div>
    </div>
  );
}

function ThreadRow({ id, name, last, needs }: { id: string; name: string; last: Msg[]; needs: boolean }) {
  const app = useApp();
  const m = last[last.length - 1];
  const who = id === 'keep' ? null : app.staff[id];
  return (
    <button className="thr" onClick={() => app.openChief(id)}>
      {id === 'keep' ? <Chief size={36} state={app.chiefState === 'rest' ? 'idle' : app.chiefState} out={app.crewOut >= 2} /> : who ? <Crew who={who} size={36} state={needs ? 'waiting' : 'idle'} /> : <span className="glyph"><Icon name={space(id).glyph} size={16} /></span>}
      <span className="thr-main"><b>{name}{who ? <em>, {AGENTS[who].name}</em> : id === 'keep' ? null : <em>, no one yet</em>}</b><span>{m ? (m.who === 'you' ? 'You: ' : '') + m.text : 'Nothing said yet'}</span></span>
      {needs && <i className="thr-dot" aria-label="needs you" />}
    </button>
  );
}
