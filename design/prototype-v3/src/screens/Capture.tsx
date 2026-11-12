import { useEffect, useRef, useState } from 'react';
import { VoiceBeam } from 'voice-glow';
import { BorderBeam } from 'border-beam';
import { BotAvatar } from 'bot-avatars';
import { ThinkingOrb } from 'thinking-orbs';
import { AGENTS, NOTE, RAMBLE, space } from '../data';
import { Icon } from '../icons';
import { useApp } from '../store';
import { usePrefersReducedMotion } from '../motion';

type Phase = 'idle' | 'recording' | 'processing' | 'typing-work' | 'result';

/** A demo voice: syllable-rate envelope with phrase pauses. The artifact frame refuses the microphone. */
function demoLevel(t: number) {
  const phrase = (Math.sin(t * 0.0011) + 1) / 2;
  const syll = Math.pow(Math.max(0, Math.sin(t * 0.021) * Math.sin(t * 0.0077 + 1.3)), 0.6);
  const gap = Math.sin(t * 0.0006) > 0.82 ? 0.1 : 1;
  return Math.min(1, (0.25 + 0.75 * syll) * (0.45 + 0.55 * phrase) * gap);
}

export function Capture() {
  const app = useApp();
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('idle');
  const [words, setWords] = useState(0);
  const [secs, setSecs] = useState(0);
  const [text, setText] = useState('');
  const [raw, setRaw] = useState(false);
  const [filed, setFiled] = useState<number[]>([]);
  const [moved, setMoved] = useState<Record<number, string>>({});
  const all = RAMBLE.split(' ');
  const t0 = useRef(0);
  const live = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (phase !== 'recording') return;
    t0.current = performance.now();
    const t = setInterval(() => {
      const el = performance.now() - t0.current;
      setSecs(Math.floor(el / 1000));
      setWords(Math.min(all.length, Math.floor(el / 190)));
    }, 120);
    return () => clearInterval(t);
  }, [phase, all.length]);
  useEffect(() => {
    if (phase === 'recording' && words >= all.length) stop();
  }, [words]); // eslint-disable-line react-hooks/exhaustive-deps

  const startRec = () => { setWords(0); setSecs(0); setFiled([]); setMoved({}); setPhase('recording'); if (live.current) live.current.textContent = 'Listening.'; };
  const stop = () => {
    setPhase('processing'); if (live.current) live.current.textContent = 'Cleaning up your note.';
    setTimeout(() => { setPhase('result'); if (live.current) live.current.textContent = 'Note ready, with 3 cards to file.'; }, 3600);
  };
  const submitTyped = (e: React.FormEvent) => {
    e.preventDefault(); if (!text.trim()) return;
    setPhase('typing-work'); setFiled([]); setMoved({});
    setTimeout(() => setPhase('result'), 3600);
  };
  const fileAll = () => setFiled([0, 1, 2]);

  const level = () => demoLevel(performance.now());
  const working = phase === 'typing-work';
  const showVoice = phase !== 'typing-work';
  const ix = phase === 'recording' ? words : all.length;
  const panel = (
      <div className={`voice-panel ${phase === 'result' ? 'compact' : ''}`}>
        <div className="vp-top">
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{phase === 'processing' && <ThinkingOrb state="composing" size={20} theme="dark" aria-hidden="true" />}{phase === 'recording' ? 'Listening' : phase === 'processing' ? 'Cleaning up your note' : phase === 'result' ? 'Recorded. Tap to add more' : 'Ready'}</span>
          {phase !== 'result' && <span className="num">0:{String(secs).padStart(2, '0')}</span>}
        </div>
        <div className={`transcript ${phase === 'idle' ? 'placeholder' : phase === 'result' ? 'clamp' : ''}`} aria-live="off">
          {phase === 'idle'
            ? 'Ramble. The removals, the party, the gym. Juno and Scout will sort it.'
            : <>{all.slice(0, ix).join(' ')} <span className="dim">{phase === 'recording' ? all.slice(ix, ix + 3).join(' ') : ''}</span></>}
        </div>
        <div className="mic-row">
          {phase === 'recording'
            ? <button className="mic rec" onClick={stop} aria-pressed="true" aria-label="Stop recording"><Icon name="stop" size={24} /></button>
            : <button className="mic" onClick={startRec} aria-pressed="false" aria-label="Start recording" disabled={phase === 'processing'}><Icon name="mic" size={28} stroke={1.9} /></button>}
        </div>
      </div>
  );

  return (
    <div className="screen">
      <div className="scroll">
        <div className="cap-head">
          <h1>Capture</h1>
          <p>Talk it through. It comes back as a clean note and cards, filed where they belong.</p>
        </div>

        {showVoice && (phase === 'recording'
          ? <VoiceBeam className="voice-host" type="default" level={level}>{panel}</VoiceBeam>
          : phase === 'processing'
            // voice-glow's processing sweep is Pro in 0.3.0; the free path is an orb plus a beam on the working element
            ? <BorderBeam className="voice-host" size="md" colorVariant="colorful" theme="dark" strength={0.7} active={!reduced}>{panel}</BorderBeam>
            : <div className="voice-host">{panel}</div>)}
        <p className="fine" style={{ margin: '8px 6px 0' }}>Demo voice. A real phone records on the device, offline, and syncs later.</p>

        {phase !== 'recording' && phase !== 'processing' && (
          <form className="or-type" onSubmit={submitTyped}>
            <BorderBeam size="md" colorVariant="colorful" theme="dark" strength={0.75} active={working && !reduced}>
              <div className="prompt" aria-busy={working}>
                <input id="cap-type" value={text} onChange={e => setText(e.target.value)} placeholder="Or type it" aria-label="Type a capture" />
                <button className="btn sm" type="submit" disabled={working}>{working ? 'Filing' : 'File it'}</button>
              </div>
            </BorderBeam>
            {working && <p className="fine" style={{ margin: '8px 6px 0' }} role="status">Juno is reading it and finding the right Spaces.</p>}
          </form>
        )}

        {phase === 'result' && (
          <div className="result">
            <div className="note-card bezel"><div className="well">
              <h3>Your note</h3>
              <p>{text.trim() || NOTE.clean}</p>
              <button className="raw-toggle" onClick={() => setRaw(r => !r)} aria-expanded={raw}>{raw ? 'Hide what you said' : 'Show what you said'}</button>
              {raw && <p className="raw">{RAMBLE}</p>}
            </div></div>
            {NOTE.cards.map((c, i) => {
              const sp = moved[i] ?? c.spaceId;
              return (
                <div key={c.title} className={`pcard ${filed.includes(i) ? 'filed' : ''}`}>
                  <span className="glyph"><Icon name={space(sp).glyph} size={16} /></span>
                  <div style={{ minWidth: 0 }}>
                    <b>{c.title}</b>
                    <small>{filed.includes(i) ? 'Filed to ' : 'For '}{space(sp).name}, {c.when}. <button onClick={() => setMoved(m => ({ ...m, [i]: sp === 'house' ? 'inbox' : 'house' }))}>Move</button></small>
                  </div>
                  <BotAvatar className="bot" type={AGENTS[c.agent].avatar} size={32} paused={!app.running} aria-hidden="true" />
                </div>
              );
            })}
            {filed.length < 3
              ? <button className="btn primary block" onClick={fileAll}>File all 3</button>
              : <p className="undo-line" style={{ margin: '4px 6px' }}><span className="ok"><Icon name="check" size={16} />Filed 3 cards.</span><button onClick={() => setFiled([])}>Undo</button></p>}
          </div>
        )}
        <p ref={live} className="sr" role="status" aria-live="polite" />
      </div>
    </div>
  );
}
