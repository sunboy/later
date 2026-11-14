/* Sound, synthesised with the Web Audio API (no files), grown from prototype-v3's sound module.
   Everything is tied to a motion on screen: the water under the whole scene, a paper swish when cards move, a soft
   tap when a card lands, a warm click when a lamp lights, a low resolved chord when you arrive, air when the camera
   travels. The context is only created inside a gesture, so nothing plays before the first tap.
   Every sound is logged to window.__soundLog with its time, so a recording can be checked against frames. */

let ctx = null, master = null, water = null, noiseBuf = null;
let on = true;
try { const v = localStorage.getItem('later-world-sound'); if (v === 'off') on = false; } catch { /* storage may be blocked */ }

const log = (name) => { (window.__soundLog ??= []).push({ name, t: Math.round(performance.now()), live: !!(on && ctx && ctx.state === 'running') }); };
export const soundOn = () => on;

export function unlock() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = on ? .2 : 0; master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); let b = 0;
      for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = .97 * b + .03 * w; d[i] = w * .5 + b * 4; }
      startWater();
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch { ctx = null; }
}

export function setSound(v) {
  on = v;
  try { localStorage.setItem('later-world-sound', v ? 'on' : 'off'); } catch { /* storage may be blocked */ }
  if (v) unlock();
  if (master) master.gain.setTargetAtTime(v ? .2 : 0, ctx.currentTime, .15);
  log(v ? 'sound-on' : 'sound-off');
}

const ready = () => on && ctx && master && ctx.state !== 'closed';
const det = () => 1 + (Math.random() - .5) * .03;

function noise(dur, type, f0, f1, q, peak, at = 0, attack = .3) {
  const t = ctx.currentTime + at, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; s.loop = true; f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0 * det(), t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + dur * attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur + .05);
}
function tone(f0, f1, dur, type, peak, at = 0, attack = .01) {
  const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain(), d = det();
  o.type = type; o.frequency.setValueAtTime(f0 * d, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1 * d), t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + Math.max(.005, dur * attack)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
}

/* the sea: brown noise through a low-pass that swells slowly, with an occasional lap against the pier */
function startWater() {
  const s = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
  s.buffer = noiseBuf; s.loop = true; lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = .4;
  g.gain.value = .5; lfo.frequency.value = .09; lg.gain.value = .3; lfo.connect(lg); lg.connect(g.gain);
  const lfo2 = ctx.createOscillator(), lg2 = ctx.createGain(); lfo2.frequency.value = .13; lg2.gain.value = 160; lfo2.connect(lg2); lg2.connect(lp.frequency);
  s.connect(lp); lp.connect(g); g.connect(master); s.start(); lfo.start(); lfo2.start();
  water = g;
  const lap = () => { if (ready() && document.visibilityState === 'visible') noise(.5 + Math.random() * .4, 'bandpass', 700, 260, 1.2, .12, 0, .25); setTimeout(lap, 2600 + Math.random() * 3800); };
  setTimeout(lap, 1800);
}

export function play(name, o = {}) {
  log(name);
  if (!ready()) return;
  const k = Math.pow(2, (o.step || 0) / 12);
  switch (name) {
    case 'swish': noise(.26, 'bandpass', 3200 * k, 900 * k, 1.1, .5, 0, .35); break;                       // a card moving through air
    case 'flick': noise(.12, 'bandpass', 4200 * k, 2000 * k, 1.6, .35, 0, .2); break;                     // a corner lifting
    case 'tap': noise(.07, 'lowpass', 2400, 600, .7, .7, 0, .08); tone(170 * k, 90, .1, 'sine', .45); break; // a card landing
    case 'card': noise(.06, 'bandpass', 2600 * k, 1600, 1.4, .55, 0, .1); tone(1180 * k, 1040 * k, .05, 'sine', .14, .035); break; // taken into the hand
    case 'blink': tone(2100, 1900, .025, 'sine', .07); break;
    case 'lamp': tone(1650 * k, 1500 * k, .03, 'square', .05); tone(392 * k, 392 * k, .9, 'sine', .18, .02, .02); tone(587 * k, 587 * k, .7, 'sine', .07, .04, .05); break; // click, then a warm glow
    case 'arrive': // low, resolved: G, D, G, B, slow in, long out
      [[98, .28], [147, .2], [196, .14], [247, .07]].forEach(([f, p], i) => tone(f, f, 3.2, i ? 'sine' : 'triangle', p, i * .05, .18)); break;
    case 'air': noise(2.2, 'bandpass', 380, 900, .6, .22, 0, .45); break;                                   // the camera moving along the harbour
    case 'plop': noise(.2, 'bandpass', 900, 300, 2, .18); break;
    case 'in': noise(.5, 'lowpass', 600, 2400, .5, .2, 0, .5); break;
    case 'out': noise(.45, 'lowpass', 2000, 500, .5, .16, 0, .3); break;
  }
}
