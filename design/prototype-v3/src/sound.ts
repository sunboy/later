/* Sound, synthesised with the Web Audio API: no files, no libraries. Every sound is short (30 to 180 ms), quiet,
   pitched per event and slightly detuned at random so repeats do not grate. The context is created only inside a
   user gesture (browsers block audio before one), so nothing can play before the first tap.
   Sound is on by default, except for people who prefer reduced motion, who get it only if they turn it on.
   Every played sound is logged to window.__soundLog with its time, so a recording can be checked against frames. */

export type Sfx = 'deal' | 'thup' | 'rise' | 'later' | 'back' | 'done' | 'tick';

const KEY = 'later-sound';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const listeners = new Set<(on: boolean) => void>();

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function readOn(): boolean {
  try { const v = localStorage.getItem(KEY); if (v === 'on') return true; if (v === 'off') return false; } catch { /* storage may be blocked */ }
  return !prefersReduced();
}
let on = readOn();

export const soundOn = () => on;
export function setSound(v: boolean) {
  on = v;
  try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch { /* storage may be blocked */ }
  if (v) unlock();
  listeners.forEach(f => f(v));
}
export function onSoundChange(f: (on: boolean) => void) { listeners.add(f); return () => { listeners.delete(f); }; }

/** Create or resume the context. Only ever called from a gesture handler. */
export function unlock() {
  if (typeof window === 'undefined') return;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.16; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch { ctx = null; }
}
if (typeof window !== 'undefined') {
  // the first tap anywhere unlocks audio; until then every play() is silently skipped
  const first = () => { if (on) unlock(); };
  window.addEventListener('pointerdown', first, { capture: true });
  window.addEventListener('keydown', first, { capture: true });
}

const log = (name: string, vol: number) => {
  const w = window as unknown as { __soundLog?: { name: string; t: number; vol: number; ctx: string }[] };
  (w.__soundLog ??= []).push({ name, t: performance.now(), vol, ctx: ctx ? ctx.state : 'none' });
};
const ready = () => on && ctx && master && ctx.state !== 'closed';
const det = () => 1 + (Math.random() - 0.5) * 0.03; // about 25 cents either way

function tone(f0: number, f1: number, dur: number, type: OscillatorType, peak: number, at = 0, vol = 1) {
  const c = ctx!, t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  const d = det();
  o.type = type; o.frequency.setValueAtTime(f0 * d, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1 * d), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak * vol, t + Math.min(0.012, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master!); o.start(t); o.stop(t + dur + 0.02);
}
let noiseBuf: AudioBuffer | null = null;
function whoosh(f0: number, f1: number, dur: number, peak: number, vol = 1) {
  const c = ctx!, t = c.currentTime;
  if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate * 0.3, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noiseBuf; bp.type = 'bandpass'; bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(f0 * det(), t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak * vol, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(bp); bp.connect(g); g.connect(master!); s.start(t); s.stop(t + dur + 0.02);
}

/** Play one sound. `vol` scales it (the app proper uses about half). `step` nudges pitch for a run of the same sound. */
export function play(name: Sfx, opts: { vol?: number; step?: number } = {}) {
  const vol = opts.vol ?? 1, k = Math.pow(2, (opts.step ?? 0) / 12);
  if (typeof window !== 'undefined') log(name, ready() ? vol : 0);
  if (!ready()) return;
  switch (name) {
    case 'deal': whoosh(2400 * k, 700 * k, 0.09, 0.9, vol); tone(1500 * k, 1300 * k, 0.03, 'sine', 0.25, 0.07, vol); break; // whoosh, then a tick as it lands
    case 'thup': tone(150, 70, 0.12, 'sine', 0.9, 0, vol); break;
    case 'rise': tone(480 * k, 860 * k, 0.12, 'triangle', 0.5, 0, vol); break;
    case 'later': tone(760 * k, 240 * k, 0.18, 'sine', 0.45, 0, vol); whoosh(1400, 300, 0.16, 0.35, vol); break;
    case 'back': tone(880 * k, 880 * k, 0.16, 'sine', 0.32, 0, vol); tone(1320 * k, 1320 * k, 0.17, 'sine', 0.26, 0.06, vol); break;
    case 'done': tone(660 * k, 660 * k, 0.07, 'triangle', 0.45, 0, vol); tone(990 * k, 990 * k, 0.12, 'triangle', 0.45, 0.07, vol); break;
    case 'tick': tone(1800 * k, 1600 * k, 0.03, 'sine', 0.18, 0, vol); break;
  }
}

/** The press-and-hold hum: rises while held, resolves into "done" on completion, fades if let go. */
export function hum(ms: number) {
  log('hum', ready() ? 1 : 0);
  if (!ready()) return { done: () => play('done'), cancel: () => log('hum-cancel', 0) };
  const c = ctx!, t = c.currentTime, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
  o.type = 'triangle'; o2.type = 'sine';
  o.frequency.setValueAtTime(196, t); o.frequency.linearRampToValueAtTime(294, t + ms / 1000);
  o2.frequency.setValueAtTime(392, t); o2.frequency.linearRampToValueAtTime(588, t + ms / 1000);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.08); g.gain.linearRampToValueAtTime(0.24, t + ms / 1000);
  o.connect(g); o2.connect(g); g.connect(master!); o.start(t); o2.start(t);
  const stop = (fade: number) => { const n = c.currentTime; g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), n); g.gain.exponentialRampToValueAtTime(0.0001, n + fade); o.stop(n + fade + 0.02); o2.stop(n + fade + 0.02); };
  return { done: () => { stop(0.05); play('done'); }, cancel: () => { log('hum-cancel', 1); stop(0.14); } };
}
