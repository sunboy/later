import { useEffect, useRef, useState } from 'react';
import { VoiceBeam } from 'voice-glow';
import { BorderBeam } from 'border-beam';
import { ThinkingOrb } from 'thinking-orbs';
import { NOTE, RAMBLE, space } from '../data';
import { Icon } from '../icons';
import { usePrefersReducedMotion } from '../motion';
import { useTheme } from '../theme';

type Phase = 'idle' | 'recording' | 'processing' | 'typing-work' | 'result' | 'filed';

/** A demo voice: syllable-rate envelope with phrase pauses. The artifact frame refuses the microphone. */
function demoLevel(t: number) {
  const phrase = (Math.sin(t * 0.0011) + 1) / 2;
  const syll = Math.pow(Math.max(0, Math.sin(t * 0.021) * Math.sin(t * 0.0077 + 1.3)), 0.6);
  const gap = Math.sin(t * 0.0006) > 0.82 ? 0.1 : 1;
  return Math.min(1, (0.25 + 0.75 * syll) * (0.45 + 0.55 * phrase) * gap);
}
const mmss = (s: number) => `0:${String(s).padStart(2, '0')}`;

export function Capture() {
  const reduced = usePrefersReducedMotion();
  const { theme, onB } = useTheme();
  const [phase, setPhase] = useState<Phase>('idle');
  const [words, setWords] = useState(0);
  const [secs, setSecs] = useState(0);
  const [text, setText] = useState('');
  const [typed, setTyped] = useState(false);
  const [raw, setRaw] = useState(false);
  const [moved, setMoved] = useState<Record<number, string>>({});
  const all = RAMBLE.split(' ');
  const t0 = useRef(0);
  const live = useRef<HTMLParagraphElement>(null);
  const say = (m: string) => { if (live.current) live.current.textContent = m; };

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
  useEffect(() => { if (phase === 'recording' && words >= all.length) stop(); }, [words]); // eslint-disable-line react-hooks/exhaustive-deps

  const startRec = () => { setWords(0); setSecs(0); setMoved({}); setTyped(false); setPhase('recording'); say('Listening.'); };
  const stop = () => {
    setPhase('processing'); say('Cleaning up your note.');
    setTimeout(() => { setPhase('result'); say('Note ready, with 3 cards to file.'); }, 3600);
  };
  const submitTyped = (e: React.FormEvent) => {
    e.preventDefault(); if (!text.trim()) return;
    setTyped(true); setMoved({}); setPhase('typing-work'); say('Filing.');
    setTimeout(() => { setPhase('result'); say('Note ready, with 3 cards to file.'); }, 3600);
  };
  const reset = () => { setPhase('idle'); setText(''); setWords(0); setSecs(0); setRaw(false); };

  const level = () => demoLevel(performance.now());
  const ix = phase === 'recording' ? words : all.length;
  const cards = NOTE.cards.map((c, i) => ({ ...c, spaceId: moved[i] ?? c.spaceId }));
  const where = Object.entries(cards.reduce<Record<string, number>>((m, c) => ({ ...m, [c.spaceId]: (m[c.spaceId] ?? 0) + 1 }), {}))
    .map(([id, n]) => `${n} to ${space(id).name}`).join(', ');
  const showPanel = phase === 'idle' || phase === 'recording' || phase === 'processing';

  const panel = (
    <div className="voice-panel">
      <div className="vp-top">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {phase === 'processing' && <ThinkingOrb state="composing" size={20} theme={onB} aria-hidden="true" />}
          {phase === 'recording' ? 'Listening' : phase === 'processing' ? 'Juno is cleaning up your note' : 'Ready when you are'}
        </span>
        {phase !== 'idle' && <span className="num">{mmss(secs)}</span>}
      </div>
      <div className={`transcript ${phase === 'idle' ? 'placeholder' : ''}`} aria-live="off">
        {phase === 'idle'
          ? 'Ramble. The removals, the party, the gym. It comes back as a note and cards, filed where they belong.'
          : <>{all.slice(0, ix).map((w, i) => <span key={i} className="w">{w} </span>)}<span className="dim">{phase === 'recording' ? all.slice(ix, ix + 2).join(' ') : ''}</span></>}
      </div>
      <div className="mic-row">
        <span className="fine">{phase === 'recording' ? 'Tap to stop. Nothing is sent anywhere yet.' : 'Demo voice. On a phone it records on the device, offline.'}</span>
        {phase === 'recording'
          ? <button className="mic rec" onClick={stop} aria-pressed="true" aria-label="Stop recording"><Icon name="stop" size={24} /></button>
          : <button className="mic" onClick={startRec} aria-pressed="false" aria-label="Start recording" disabled={phase === 'processing'}><Icon name="mic" size={28} stroke={1.9} /></button>}
      </div>
    </div>
  );

  return (
    <div className="screen">
      <div className="scroll no-dock">
        <div className="cap-head">
          <h1>Capture</h1>
          <p>Say it loosely. Juno and Scout do the filing.</p>
        </div>

        {showPanel && (phase === 'recording'
          ? <VoiceBeam className="voice-host" type="default" theme={onB} level={level}>{panel}</VoiceBeam>
          : phase === 'processing'
            // voice-glow's processing sweep is Pro in 0.3.0; the free path is an orb plus a beam on the working element
            ? <BorderBeam className="voice-host" size="md" colorVariant="colorful" theme={onB} strength={0.8} active={!reduced}>{panel}</BorderBeam>
            : <div className="voice-host">{panel}</div>)}

        {(phase === 'idle' || phase === 'typing-work') && (
          <form className="or-type" onSubmit={submitTyped}>
            <BorderBeam size="md" colorVariant="colorful" theme={theme} strength={0.8} active={phase === 'typing-work' && !reduced}>
              <div className="prompt" aria-busy={phase === 'typing-work'}>
                <input id="cap-type" value={text} onChange={e => setText(e.target.value)} placeholder="Or type it" aria-label="Type a capture" disabled={phase === 'typing-work'} />
                <button className="btn sm primary" type="submit" disabled={phase === 'typing-work'}>{phase === 'typing-work' ? 'Filing' : 'File it'}</button>
              </div>
            </BorderBeam>
            {phase === 'typing-work' && <p className="fine" style={{ margin: '8px 6px 0', display: 'flex', alignItems: 'center', gap: 8 }} role="status"><ThinkingOrb state="weaving" size={20} theme={theme} aria-hidden="true" />Juno is finding the right Spaces.</p>}
          </form>
        )}

        {(phase === 'result' || phase === 'filed') && (
          <div className="result">
            <div className="voice-panel compact">
              <div className="recap">
                <div><b>{typed ? 'Typed note' : `Recorded ${mmss(Math.max(1, secs))}`}</b><small>{typed ? 'Filed from what you wrote' : 'The raw transcript is kept with the note'}</small></div>
                <button className="btn sm" onClick={reset}><Icon name="mic" size={16} />Another</button>
              </div>
            </div>
            <div className="note-card bezel"><div className="well">
              <h3>Your note</h3>
              <p>{typed ? text.trim() : NOTE.clean}</p>
              {!typed && <button className="raw-toggle" onClick={() => setRaw(r => !r)} aria-expanded={raw}>{raw ? 'Hide what you said' : 'Show what you said'}</button>}
              {raw && !typed && <p className="raw">{RAMBLE}</p>}
            </div></div>

            {phase === 'result' ? (
              <section className="proposals" aria-labelledby="prop-h">
                <h3 id="prop-h">3 cards to file</h3>
                {cards.map((c, i) => (
                  <div key={c.title} className="pcard">
                    <span className="glyph"><Icon name={space(c.spaceId).glyph} size={16} /></span>
                    <div style={{ minWidth: 0 }}>
                      <b>{c.title}</b>
                      <small>For {space(c.spaceId).name}, {c.when}. <button onClick={() => setMoved(m => ({ ...m, [i]: c.spaceId === 'house' ? 'inbox' : 'house' }))}>Move</button></small>
                    </div>
                  </div>
                ))}
                <button className="btn primary" style={{ width: 'calc(100% - 24px)' }} onClick={() => { setPhase('filed'); say('Filed 3 cards.'); }}>File all 3</button>
              </section>
            ) : (
              <div className="filed-stack">
                <i style={{ ['--i' as string]: 1 }} aria-hidden="true" /><i style={{ ['--i' as string]: 2 }} aria-hidden="true" />
                <div className="filed" role="status">
                  <div><b>Filed 3 cards</b><small>{where}.</small></div>
                  <button className="btn sm quiet" onClick={() => setPhase('result')}><Icon name="undo" size={15} />Undo</button>
                </div>
              </div>
            )}
          </div>
        )}
        <p ref={live} className="sr" role="status" aria-live="polite" />
      </div>
    </div>
  );
}
