/* Choreography: a camera, Keep, and three beats.
   One rAF loop owns time. Tweens move things on exact curves (the camera, hops, flights); springs give Keep's pose its
   weight (anticipation is scripted, then each part overshoots by a hair and settles). Lamps and windows warm through
   CSS opacity transitions, triggered by classes. */
import { buildWorld, P, OX, OY, GY, gy, el, obj, plane } from './world.js';
import { makeKeep, letterCard } from './keep.js';
import { unlock, play, setSound, soundOn } from './audio.js';

const $ = id => document.getElementById(id);
const root = document.documentElement;
const device = $('device'), scene = $('scene'), camEl = $('cam');

/* ---------- theme: dark (deep dawn) is the default; an explicit choice wins ---------- */
let theme = root.dataset.theme === 'light' ? 'light' : 'dark';
try { const t = localStorage.getItem('later-world-theme'); if (t === 'light' || t === 'dark') theme = t; } catch { /* blocked */ }
const setTheme = t => {
  theme = t; root.dataset.theme = t;
  try { localStorage.setItem('later-world-theme', t); } catch { /* blocked */ }
  $('theme').setAttribute('aria-label', t === 'dark' ? 'Switch to light' : 'Switch to dark');
  $('k-theme').textContent = t === 'dark' ? 'Light' : 'Dark';
};
setTheme(theme);

let still = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- build ---------- */
const W = buildWorld(camEl, $('defs'));
const K = makeKeep(camEl);
const TW = W.towerGeom;
const DOOR = { x: TW.x, y: TW.base, z: TW.z + TW.td / 2 - 9 };

/* ---------- fit: phone fills the screen, desktop fits the frame ---------- */
function fit() {
  const desk = innerWidth >= 760;
  if (desk) {
    root.style.setProperty('--fs', Math.min(1, (innerHeight - 48) / 844).toFixed(4));
    root.style.setProperty('--ss', 1);
  } else {
    root.style.setProperty('--fs', 1);
    const r = device.getBoundingClientRect();
    root.style.setProperty('--ss', Math.max(r.width / 390, r.height / 844).toFixed(4));
  }
}
addEventListener('resize', fit); fit();

/* ---------- time, tweens, springs ---------- */
const ease = {
  out: t => 1 - Math.pow(1 - t, 3),
  cam: t => 1 - Math.pow(1 - t, 4.2),                        // eased out, like cubic-bezier(.23,1,.32,1)
  inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  travel: t => { const a = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; return a * .35 + (1 - Math.pow(1 - t, 3.4)) * .65; },
  lin: t => t,
};
let tweens = [], tasks = [], gen = 0;
const now = () => performance.now();
function tween(o, k, to, dur, e = ease.out, delay = 0) {
  const tw = { o, k, from: null, to, t0: now() + delay, dur, e, gen };
  tweens = tweens.filter(x => !(x.o === o && x.k === k && x.t0 <= tw.t0));
  tweens.push(tw);
  return tw;
}
function custom(dur, fn, delay = 0) { const tw = { fn, t0: now() + delay, dur, gen }; tweens.push(tw); return tw; }
function at(ms, fn) { tasks.push({ t: now() + ms, fn, gen }); }
function cancelAll() { gen++; tweens = []; tasks = []; }

const cam = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
const look = { yaw: 0, pitch: 0, ty: 0, tp: 0, vy: 0, vp: 0 };
const ZF = -120;

/* springs for Keep's pose */
const SPR = { x: [2, .8], y: [2.4, .75], z: [2, .8], yaw: [1.7, .7], pitch: [2, .7], roll: [2.2, .62], fan: [2.3, .58], square: [2.6, .72], flap: [3.2, .62],
  ex: [5, .8], ey: [5, .8], depth: [2, .65], scale: [2, .8] };
const target = {}, vel = {};
for (const k in SPR) { target[k] = K.s[k]; vel[k] = 0; }
const set = (o) => Object.assign(target, o);
const snap = (o) => { Object.assign(target, o); Object.assign(K.s, o); for (const k in o) vel[k] = 0; };

let blinkT = -1, nextBlink = now() + 2600, idle = true, lastT = now();
function blink() { blinkT = now(); }

/* ---------- the loop ---------- */
const frames = []; window.__frames = frames;
let beat = -1, label = '';
function loop() {
  const t = now(), dt = Math.min(.05, (t - lastT) / 1000);
  frames.push([Math.round(t), +(t - lastT).toFixed(2), label]); if (frames.length > 6000) frames.splice(0, 1000);
  lastT = t;
  // tasks
  if (tasks.length) { const due = tasks.filter(x => x.t <= t && x.gen === gen); tasks = tasks.filter(x => x.t > t && x.gen === gen); due.forEach(x => x.fn()); }
  // tweens
  for (const tw of tweens) {
    if (t < tw.t0) continue;
    const u = Math.min(1, (t - tw.t0) / tw.dur);
    if (tw.fn) { tw.fn(u); if (u >= 1) tw.done = true; continue; }
    if (tw.from === null) tw.from = tw.o[tw.k];
    tw.o[tw.k] = tw.from + (tw.to - tw.from) * tw.e(u);
    if (u >= 1) tw.done = true;
  }
  tweens = tweens.filter(x => !x.done);
  // springs
  // springs, in small fixed substeps so a slow frame can never make them unstable
  const n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;
  for (const k in SPR) {
    const [f, z] = SPR[k], w = 2 * Math.PI * f;
    for (let i = 0; i < n; i++) {
      const a = w * w * (target[k] - K.s[k]) - 2 * z * w * vel[k];
      vel[k] += a * h; K.s[k] += vel[k] * h;
    }
  }
  // idle life: a slow breath and the odd blink
  if (idle && !still) { K.s.lean = Math.sin(t / 900) * 1.1; }
  if (t > nextBlink) { blink(); nextBlink = t + 2800 + Math.random() * 2600; }
  if (blinkT > 0) { const u = (t - blinkT) / 150; K.s.blink = u < 1 ? Math.sin(Math.PI * u) : 0; if (u >= 1) blinkT = -1; }
  // look (drag / tilt / hover) springs back
  for (const [v, tg, vv] of [['yaw', 'ty', 'vy'], ['pitch', 'tp', 'vp']]) {
    const w = 2 * Math.PI * 1.4, a = w * w * (look[tg] - look[v]) - 2 * .9 * w * look[vv];
    look[vv] += a * dt; look[v] += look[vv] * dt;
  }
  const yaw = cam.yaw + look.yaw, pitch = cam.pitch + look.pitch;
  camEl.style.transform = `translateZ(${ZF}px) rotateX(${pitch.toFixed(3)}deg) rotateY(${yaw.toFixed(3)}deg) translateZ(${-ZF}px) translate3d(${(-cam.x).toFixed(2)}px,${(-cam.y).toFixed(2)}px,${cam.z.toFixed(2)}px)`;
  K.camYaw = yaw;
  K.apply();
  // letters in flight
  for (const L of letters) L.apply?.(t);
  requestAnimationFrame(loop);
}

/* ---------- words ---------- */
const BEATS = [
  { h: 'Later. It does what you put off.', p: 'It’s AI. It finds, drafts and chases, and asks before anything goes out.' },
  { h: 'I’m Keep. I hold it all.', p: 'You hand it over once. I hold it, and bring it back when it’s ready.' },
  { h: 'Each part of life gets a place.', p: 'A house move, school, taxes. Each keeps its own mail, plans and crew.' },
];
function words(i, delay = 0) {
  const b = BEATS[i], hl = $('hl'), ln = $('ln');
  hl.innerHTML = ''; ln.textContent = ''; ln.className = '';
  const parts = b.h.split(' ');
  parts.forEach((w, j) => {
    const s = el('span', 'w' + (still ? '' : ' word-in'), still ? '' : `animation-delay:${delay + j * 55}ms`, w + (j < parts.length - 1 ? ' ' : ''));
    hl.appendChild(s);
  });
  ln.textContent = b.p;
  if (!still) { ln.className = 'line-in'; ln.style.animationDelay = (delay + parts.length * 55 + 260) + 'ms'; }
  document.querySelectorAll('.lamps i').forEach((l, j) => l.classList.toggle('on', j <= i));
  $('step-sr').textContent = `Step ${i + 1} of 3`;
  $('next-t').textContent = i < 2 ? 'Next' : 'Tap a place to look in';
  $('next').classList.toggle('ghost', i === 2);
  $('next').querySelector('svg').style.display = i < 2 ? '' : 'none';
}
function clearWords() { $('hl').innerHTML = ''; $('ln').textContent = ''; }

/* ---------- poses: the settled state of each beat (used for jumps, stills and reduced motion) ---------- */
const POSE = {
  0: { cam: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 } },
  1: { cam: { x: -45, y: 86, z: 350, yaw: 0, pitch: 0 } },
  2: { cam: { x: 540, y: -52, z: 90, yaw: 0, pitch: 0 } },
};
const KEEP_HOME = { x: DOOR.x, y: DOOR.y, z: DOOR.z, scale: .31, yaw: 0, pitch: 0, roll: 0, fan: 1, square: 0, flap: 196, ex: 0, ey: 1, depth: 0 };
const KEEP_FWD = { x: 150, y: W.pierGeom.y, z: 238, scale: .3, yaw: 0, pitch: 0, roll: 0, fan: 1, square: 0, flap: 190, ex: 0, ey: 2, depth: .3 };

function lightWorld(level) {
  // 0: before dawn; 1: arrived (sun up, tower lit, first lamp); 3: every place lit
  const up = level >= 1;
  W.tower.classList.toggle('on', up);
  W.sun.firstChild.style.transform = `translateY(${up ? 0 : 66}px)`;
  W.bloom.style.opacity = up ? 1 : .25;
  W.quayLamps[0].classList.toggle('on', up);
  W.quayLamps[1].classList.toggle('on', level >= 3);
  W.quayLamps[2].classList.toggle('on', level >= 3);
  W.places.forEach(p => { p.G.classList.toggle('on', level >= 3); p.tagHolder.classList.toggle('on', level >= 3); });
  root.classList.toggle('l-sun', up); root.classList.toggle('l-tower', up); root.classList.toggle('l-lamp', up); root.classList.toggle('l-places', level >= 3);
}

function setLetters(n) { // n letters already in the hand
  while (K.cards.length > 3) { const c = K.cards.pop(); c.el.remove(); }
  letters.forEach(L => L.node.remove()); letters.length = 0;
  for (let i = 0; i < n; i++) K.addCard(letterCard(LETTERS[i].t));
}

function pose(i) {
  cancelAll();
  $('band').classList.remove('away');
  Object.assign(cam, POSE[i].cam);
  closeInside(true);
  if (i === 0) { lightWorld(1); setLetters(0); snap(KEEP_HOME); }
  if (i === 1) { lightWorld(1); setLetters(3); snap({ ...KEEP_FWD, flap: 212 }); }
  if (i === 2) { lightWorld(3); setLetters(3); snap({ ...KEEP_FWD, yaw: 28, ex: 4 }); }
  K.s.hop = 0; K.s.squash = 1; idle = true;
  K.setHappy(false);
}

/* ---------- beat 1: the arrival ---------- */
function arrive() {
  cancelAll(); beat = 0; label = 'arrival'; idle = false;
  closeInside(true); clearWords();
  setLetters(0);
  lightWorld(0);
  Object.assign(cam, { x: 18, y: -660, z: -170, yaw: -2, pitch: 0 });
  $('band').classList.add('away');
  snap({ ...KEEP_HOME, yaw: 38, flap: 180, ex: -6, ey: -3 });
  if (still) { $('band').classList.remove('away'); pose(0); words(0); return; }
  // paint the starting frame first (the first raster of the cloud is slow), then start the clock
  const g = gen;
  requestAnimationFrame(() => requestAnimationFrame(() => { if (g === gen) arriveMotion(); }));
}
function arriveMotion() {
  // the camera sinks through the cloud to the island
  tween(cam, 'y', 0, 2900, ease.cam, 150);
  tween(cam, 'z', 0, 3100, ease.cam, 150);
  tween(cam, 'x', 0, 3100, ease.cam, 150);
  tween(cam, 'yaw', 0, 3300, ease.inOut, 150);
  at(400, () => play('air'));
  // the sun touches the horizon; the sky warms
  const sunIn = W.sun.firstChild;
  custom(2300, u => { sunIn.style.transform = `translateY(${(66 * (1 - ease.out(u))).toFixed(2)}px)`; W.bloom.style.opacity = (.25 + .75 * ease.out(u)).toFixed(3); }, 1300);
  at(2150, () => play('arrive'));
  // the tower's windows warm
  at(1700, () => root.classList.add('l-sun'));
  at(2200, () => { W.tower.classList.add('on'); root.classList.add('l-tower'); });
  // Keep in the doorway: lifts a card corner, turns, notices you, blinks
  at(2450, () => { set({ flap: 252, roll: -4 }); play('flick'); });
  at(2800, () => { set({ yaw: 0, ex: 0, ey: 1, roll: 0, z: DOOR.z + 6 }); hop(DOOR.z + 6, DOOR.y, 420, 9); });
  at(3300, () => { blink(); play('blink'); });
  at(3500, () => set({ flap: 200 }));
  at(3050, () => { label = 'arrival-words'; $('band').classList.remove('away'); words(0, 250); });
  at(4300, () => { W.quayLamps[0].classList.add('on'); root.classList.add('l-lamp'); play('lamp', { step: 0 }); });
  at(5000, () => { idle = true; label = 'idle-0'; });
  nextBlink = now() + 6500;
}

/* ---------- beat 2: Keep comes forward and takes things into its hand ---------- */
const LETTERS = [
  { t: 'Renew car insurance', x: 58, z: -10, side: -1 },
  { t: 'Reply to school trip', x: 248, z: 30, side: 1 },
  { t: 'Book the dentist', x: 66, z: 70, side: -1 },
];
const letters = [];
function floatLetter(spec, i, delay) {
  const node = letterCard(spec.t);
  const holder = obj(camEl, 0, 0, 0, 'letter-holder');
  holder.appendChild(node);
  node.style.transform = 'none';
  const L = { node: holder, card: node, spec, x: spec.x - spec.side * 160, z: spec.z, y: GY, rx: 72, rz: spec.side * 8, ry: 0, s: .26, phase: i * 1.7, mode: 'drift', t0: now() + delay };
  L.apply = (t) => {
    if (L.mode === 'drift') {
      const u = Math.max(0, Math.min(1, (t - L.t0) / 3200));
      L.x = spec.x - spec.side * 160 * (1 - ease.out(u));
      const bobY = Math.sin((t / 700) + L.phase) * 2.2;
      L.y = GY - 4 + bobY; L.rx = 70 + Math.sin(t / 900 + L.phase) * 4; L.rz = spec.side * 8 + Math.sin(t / 1100 + L.phase) * 3;
    }
    holder.style.transform = `translate3d(${L.x.toFixed(2)}px,${L.y.toFixed(2)}px,${L.z.toFixed(2)}px) rotateY(${L.ry.toFixed(2)}deg) rotateX(${L.rx.toFixed(2)}deg) rotateZ(${L.rz.toFixed(2)}deg) scale(${L.s})`;
    // shade it a little as it lies on the water
    const dims = node.querySelectorAll('.dim'); if (dims[1]) dims[1].style.opacity = (L.rx / 90 * .35).toFixed(3);
  };
  // the card holder is positioned with its bottom centre at the origin, like Keep's cards
  node.style.left = '-60px'; node.style.top = '-165px';
  letters.push(L);
  return L;
}
function takeLetter(L, k) {
  L.mode = 'fly';
  const from = { x: L.x, y: L.y, z: L.z, rx: L.rx, rz: L.rz };
  play('swish', { step: k * 2 });
  // lift off the water, arc up and over into the back of the hand
  custom(820, u => {
    const e = ease.inOut(u), lift = Math.sin(Math.PI * Math.min(1, u * 1.1)) * 70;
    const to = { x: K.s.x, y: K.s.y - 20 * K.s.scale * 3, z: K.s.z - 16 };
    L.x = from.x + (to.x - from.x) * e; L.z = from.z + (to.z - from.z) * e;
    L.y = from.y + (to.y - from.y) * e - lift;
    L.rx = from.rx * (1 - ease.out(Math.min(1, u * 1.6)));
    L.rz = from.rz * (1 - e) + (K.cards.length % 2 ? -1 : 1) * 14 * e;
    L.ry = (1 - e) * L.spec.side * -30;
    L.s = .26 + (K.s.scale - .26) * e;
  });
  at(820, () => {
    L.node.remove(); letters.splice(letters.indexOf(L), 1);
    K.addCard(L.card); L.card.style.left = ''; L.card.style.top = '';
    const c = K.cards[K.cards.length - 1];
    c.offset = { x: 0, y: -18, z: 0, a: (K.cards.length % 2 ? -1 : 1) * 6 };
    custom(420, u => { const e = 1 - Math.exp(-u * 6) * Math.cos(u * 9); c.offset.y = -18 * (1 - e); c.offset.a *= (1 - u * .4); if (u >= 1) c.offset = null; });
    play('card', { step: k * 2 });
    set({ fan: 1.35 }); at(240, () => set({ fan: 1 }));
    K.setHappy(true); at(650, () => K.setHappy(false));
  });
}
function hop(toZ, toY, dur = 520, H = 26) {
  const z0 = target.z, y0 = target.y;
  let landed = false;
  custom(dur, u => {
    if (u < .2) { K.s.squash = 1 - .12 * ease.out(u / .2); K.s.hop = 0; }
    else if (u < .8) {
      const p = (u - .2) / .6; K.s.hop = H * 4 * p * (1 - p); K.s.squash = 1.06 - .06 * Math.min(1, p * 2);
      K.s.z = target.z = z0 + (toZ - z0) * ease.inOut(p); K.s.y = target.y = y0 + (toY - y0) * ease.inOut(p);
    } else {
      if (!landed) { landed = true; play('tap', { step: -2 }); }
      const q = (u - .8) / .2; K.s.hop = 0; K.s.squash = 1 - .1 * Math.exp(-q * 3) * Math.cos(q * 7);
    }
    if (u >= 1) K.s.squash = 1;
  });
}
function comeForward() {
  cancelAll(); beat = 1; label = 'keep'; idle = false;
  $('band').classList.remove('away');
  closeInside(true);
  words(1, 120);
  setLetters(0);
  lightWorld(1);
  snap({ ...KEEP_HOME, flap: K.s.flap });
  K.s.lean = 0;
  if (still) { pose(1); words(1); return; }
  // camera dollies down to Keep's level as it comes out along the pier
  const C = POSE[1].cam;
  tween(cam, 'z', C.z, 2600, ease.cam, 200); tween(cam, 'y', C.y, 2600, ease.cam, 200); tween(cam, 'x', C.x, 2600, ease.cam, 200);
  // three hops along the pier, each with a crouch before and a squash after
  set({ flap: 188, ey: 2 });
  hop(10, W.pierGeom.y, 560, 26);
  at(600, () => hop(125, W.pierGeom.y, 540, 24));
  at(1160, () => hop(KEEP_FWD.z, W.pierGeom.y, 560, 20));
  // letters drift in on the water
  LETTERS.forEach((s, i) => floatLetter(s, i, 300 + i * 500));
  at(400, () => play('plop')); at(900, () => play('plop'));
  // it turns all the way round, showing its backs, then fans open in depth, squares up and looks at you
  at(1900, () => { set({ yaw: 16 }); });                                 // anticipation
  at(2120, () => { play('swish', { step: -3 }); custom(1000, u => { target.yaw = 16 - 376 * ease.inOut(u); if (u >= 1) { snap({ yaw: target.yaw + 360 }); K.s.yaw += 0; } }); });
  at(3200, () => { set({ fan: 2.6, depth: 2.2, yaw: -34, pitch: 6 }); play('swish', { step: 2 }); });
  at(4000, () => { set({ fan: 1, depth: 0, square: 1, yaw: 12, pitch: 0 }); play('tap', { step: 3 }); });
  at(4160, () => play('tap', { step: 5 }));
  at(4700, () => { set({ square: 0, depth: .3, yaw: 0 }); play('flick'); });
  at(4900, () => { set({ ex: 0, ey: 1, flap: 214 }); blink(); });
  // and takes the three letters into its hand, which visibly holds more
  at(5100, () => takeLetter(letters[0], 0));
  at(5800, () => takeLetter(letters[0], 1));
  at(6500, () => takeLetter(letters[0], 2));
  at(7600, () => { idle = true; label = 'idle-1'; set({ depth: .3 }); });
  nextBlink = now() + 9000;
}

/* ---------- beat 3: along the harbour to three places ---------- */
function places() {
  cancelAll(); beat = 2; label = 'travel'; idle = false;
  $('band').classList.remove('away');
  closeInside(true);
  words(2, 900);
  if (K.cards.length < 6) setLetters(3);
  lightWorld(1);
  if (still) { pose(2); words(2); return; }
  // Keep turns to watch you go
  set({ yaw: 28, ex: 4 });
  // one continuous move: pull back from Keep and travel along the quay
  const C = POSE[2].cam;
  play('air');
  tween(cam, 'x', C.x, 3000, ease.travel, 100);
  tween(cam, 'z', C.z, 3000, ease.inOut, 100);
  tween(cam, 'y', C.y, 3000, ease.inOut, 100);
  custom(3000, u => { cam.yaw = -5 * Math.sin(Math.PI * u) * (1 - u * .3); cam.pitch = 1.5 * Math.sin(Math.PI * u); }, 100);
  // lamps light as each place is named
  W.places.forEach((p, i) => at(1500 + i * 600, () => {
    p.G.classList.add('on'); p.tagHolder.classList.add('on'); if (i === 0) root.classList.add('l-places');
    play('lamp', { step: [0, 4, 7][i] });
  }));
  at(1300, () => { W.quayLamps[1].classList.add('on'); }); at(1700, () => { W.quayLamps[2].classList.add('on'); });
  at(3400, () => { idle = true; label = 'idle-2'; });
}

/* ---------- looking inside a place ---------- */
const ICON = {
  house: '<svg viewBox="0 0 20 20"><path d="M3.5 9.5L10 4l6.5 5.5V16h-13z"/><path d="M8 16v-4h4v4"/></svg>',
  school: '<svg viewBox="0 0 20 20"><path d="M2.5 8L10 4.5 17.5 8 10 11.5z"/><path d="M5.5 9.5v4c1.4 1.2 3 1.8 4.5 1.8s3.1-.6 4.5-1.8v-4"/></svg>',
  office: '<svg viewBox="0 0 20 20"><rect x="4" y="3" width="12" height="14" rx="1.5"/><path d="M7 7h6M7 10h6M7 13h3"/></svg>',
};
const INSIDE = {
  house: { name: 'House move', n: 3, h: 'Can Dave see the loft on Tuesday at 10?', src: 'Needs a reply, from Dave Ellis at 08:12. Scout drafted a yes.', p: 'Review and send', s: 'Not now', crew: 'Scout is chasing the survey date. Back 15:00.' },
  school: { name: 'School', n: 1, h: 'Science Museum trip: consent and £12.00 by Friday', src: 'From the school office. Juno found the form and filled in what it could.', p: 'Review', s: 'Not now', crew: 'Juno is watching the school’s emails.' },
  office: { name: 'Taxes', n: 1, h: 'Payment on account: £1,240.00 due 31 Jan', src: 'Ledger checked it against HMRC’s letter. Not paid yet. That one’s yours.', p: 'How to pay', s: 'Not now', crew: 'Ledger is reconciling October. Back 16:00.' },
};
let insideOpen = null, beforeInside = null;
function openInside(id) {
  if (insideOpen || beat !== 2) return;
  const p = W.places.find(x => x.id === id), d = INSIDE[id];
  insideOpen = id; beforeInside = { ...cam };
  $('in-name').textContent = d.name;
  $('in-tile').innerHTML = `<div class="sp-tile"><div class="edges">${d.n > 1 ? '<i></i><i></i>' : '<i></i>'}</div><div class="sp-card">
    <div class="sp-head"><span class="sp-ico">${ICON[id]}</span><b>${d.name}</b><span class="sp-count">${d.n}</span></div>
    <h3>${d.h}</h3><div class="src">${d.src}</div>
    <div class="acts"><span class="p">${d.p}</span><span class="s">${d.s}</span></div></div></div>
    <div class="sp-foot"><span class="crewdot"></span>${d.crew}</div>`;
  label = 'inside';
  play('in');
  // look in through the window: the camera moves up to the glass
  // aim at the place's main window, close enough that the lit room and whoever works there fill the top of the screen
  const win = { house: [-19, -15], school: [0, -36], office: [-12, -30] }[id];
  const wx = p.x + win[0], wy = p.base + win[1], zf = p.z + p.d / 2, k = 2, cz = P - P / k - zf;
  const tx = wx - 195, ty = wy - (300 + (250 - 300) / k);
  if (still) { Object.assign(cam, { x: tx, y: ty, z: cz, yaw: 0, pitch: 0 }); }
  else {
    tween(cam, 'x', tx, 1000, ease.cam); tween(cam, 'y', ty, 1000, ease.cam); tween(cam, 'z', cz, 1000, ease.cam);
    tween(cam, 'yaw', 0, 600, ease.out); tween(cam, 'pitch', 0, 600, ease.out);
  }
  setTimeout(() => { $('inside').classList.add('open'); $('in-close').focus({ preventScroll: true }); }, still ? 0 : 420);
  $('band').style.visibility = 'hidden';
}
function closeInside(instant) {
  if (!insideOpen) { $('inside').classList.remove('open'); $('band').style.visibility = ''; return; }
  insideOpen = null;
  $('inside').classList.remove('open');
  $('band').style.visibility = '';
  if (instant) return;
  play('out');
  const C = beforeInside || POSE[2].cam;
  if (still) Object.assign(cam, C);
  else { tween(cam, 'x', C.x, 800, ease.cam, 120); tween(cam, 'y', C.y, 800, ease.cam, 120); tween(cam, 'z', C.z, 800, ease.cam, 120); }
  label = 'idle-2';
}
$('in-close').addEventListener('click', e => { e.stopPropagation(); closeInside(false); });

/* ---------- moving between beats ---------- */
const RUN = [arrive, comeForward, places];
function veil(fn) { const v = $('veil'); v.classList.add('on'); setTimeout(() => { fn(); requestAnimationFrame(() => v.classList.remove('on')); }, 260); }
function go(i) {
  if (i < 0 || i > 2) return;
  if (still) { veil(() => { beat = i; pose(i); words(i); label = 'still-' + i; }); return; }
  if (i === beat + 1) RUN[i]();
  else { veil(() => { pose(i); beat = i; words(i); label = 'idle-' + i; }); }
}
function next() { if (insideOpen) return closeInside(false); if (beat < 2) go(beat + 1); }
function back() { if (insideOpen) return closeInside(false); if (beat > 0) go(beat - 1); }
function replay() { if (still) { veil(() => { beat = 0; pose(0); words(0); }); return; } veil(() => arrive()); }
function skip() { veil(() => { beat = 2; pose(2); words(2); label = 'idle-2'; }); }

/* ---------- input: tap, swipe, drag to look ---------- */
let pd = null;
device.addEventListener('pointerdown', e => {
  unlock();
  if (e.target.closest('button, .inside')) return;
  pd = { x: e.clientX, y: e.clientY, t: now(), id: e.pointerId, moved: false };
});
device.addEventListener('pointermove', e => {
  const r = device.getBoundingClientRect();
  if (pd && e.pointerId === pd.id) {
    const dx = e.clientX - pd.x, dy = e.clientY - pd.y;
    if (Math.hypot(dx, dy) > 8) pd.moved = true;
    look.ty = Math.max(-6, Math.min(6, -dx * .035)); look.tp = Math.max(-3, Math.min(3, dy * .02));
  } else if (e.pointerType === 'mouse' && !still) {
    look.ty = ((e.clientX - r.left) / r.width - .5) * -2.4; look.tp = ((e.clientY - r.top) / r.height - .5) * 1.2;
  }
});
const end = e => {
  if (!pd || e.pointerId !== pd.id) return;
  const dx = e.clientX - pd.x, dy = e.clientY - pd.y, dt = now() - pd.t;
  look.ty = 0; look.tp = 0;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 700) { dx < 0 ? next() : back(); }
  else if (!pd.moved) {
    const pl = e.target.closest?.('.place');
    if (beat === 2 && pl) openInside(pl.dataset.place);
    else if (insideOpen) closeInside(false);
    else next();
  }
  pd = null;
};
device.addEventListener('pointerup', end);
device.addEventListener('pointercancel', () => { pd = null; look.ty = 0; look.tp = 0; });
device.addEventListener('pointerleave', e => { if (!pd && e.pointerType === 'mouse') { look.ty = 0; look.tp = 0; } });
addEventListener('deviceorientation', e => { if (still || e.gamma == null) return; look.ty = Math.max(-4, Math.min(4, -e.gamma * .12)); look.tp = Math.max(-2, Math.min(2, (e.beta - 50) * .05)); });
addEventListener('keydown', e => {
  unlock();
  if (e.target.closest?.('button') && (e.key === 'Enter' || e.key === ' ')) return;
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); }
  else if (e.key === 'ArrowLeft') back();
  else if (e.key === 'Escape') closeInside(false);
});

/* ---------- controls ---------- */
const sndBtn = $('snd');
const paintSound = () => { sndBtn.setAttribute('aria-pressed', String(soundOn())); $('snd-hint').textContent = soundOn() ? 'Sound on' : 'Sound off'; };
paintSound();
setTimeout(() => { $('snd-hint').style.display = 'none'; }, 9000);
sndBtn.addEventListener('click', () => { setSound(!soundOn()); paintSound(); });
$('replay').addEventListener('click', replay); $('k-replay').addEventListener('click', () => { unlock(); replay(); });
$('skip').addEventListener('click', skip);
$('next').addEventListener('click', () => { if (beat < 2) next(); });
const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
$('theme').addEventListener('click', toggleTheme); $('k-theme').addEventListener('click', toggleTheme);
$('k-still').addEventListener('click', () => {
  still = !still; $('k-still').setAttribute('aria-pressed', String(still)); $('k-still').textContent = still ? 'Motion' : 'Stills';
  root.classList.toggle('stills', still);
  veil(() => { pose(Math.max(0, beat)); words(Math.max(0, beat)); });
});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', e => { still = e.matches; root.classList.toggle('stills', still); });
root.classList.toggle('stills', still);

/* hooks for the headless checks */
window.__world = { go, pose: i => { beat = i; pose(i); words(i); }, arrive, comeForward, places, openInside, closeInside, cam, K, setTheme, get beat() { return beat; }, get label() { return label; } };

// load every face the tour uses before the arrival starts, so no font arrives mid-motion
const faces = ['700 37px "Familjen Grotesk"', '700 17px "Familjen Grotesk"', '400 17px "Hanken Grotesk"', '650 15px "Hanken Grotesk"', '700 21px "Familjen Grotesk"'];
const fontsReady = Promise.race([Promise.all(faces.map(f => document.fonts?.load(f, 'Later Keep'))), new Promise(r => setTimeout(r, 1200))]).catch(() => {});
words(0); clearWords();
// the very first paint is already the start of the arrival (above the cloud), not the resting harbour
Object.assign(cam, { x: 18, y: -660, z: -170, yaw: -2, pitch: 0 }); lightWorld(0); $('band').classList.add('away');
snap({ ...KEEP_HOME, yaw: 38, flap: 180, ex: -6, ey: -3 }); K.apply();
camEl.style.transform = `translateZ(${ZF}px) translate3d(-18px,660px,-170px) translateZ(${-ZF}px)`;
fontsReady.then(() => requestAnimationFrame(() => { lastT = now(); loop(); arrive(); }));
