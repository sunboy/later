/* The world: a cut-paper harbour at dawn, built from flat paper planes placed at real depths.
   Units are CSS px. P is the perspective; (OX, OY) is the vanishing point, which is also the horizon.
   A backdrop flat at depth z is authored in "rest screen" coordinates and scaled by (P - z) / P, so it looks exactly as
   drawn from the resting camera and moves with true parallax when the camera moves. Solid things (the tower, the quay,
   the pier, the buildings, Keep) are real boxes and planes at world coordinates. Water level is GY in world y. */

const P = 800, OX = 195, OY = 300, GY = 430;
const gy = (z, h = 0) => OY + (GY - h - OY) * P / (P - z);           // screen y of a point h above the water at depth z
const NS = 'http://www.w3.org/2000/svg';

let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const rr = (a, b) => a + (b - a) * rnd();
const f1 = n => Math.round(n * 10) / 10;

function el(tag, cls, css, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (css) e.style.cssText = css;
  if (html != null) e.innerHTML = html;
  return e;
}

/* ---------- paper ---------- */
function makeGrain() {
  const c = document.createElement('canvas'); c.width = c.height = 160;
  const x = c.getContext('2d'), img = x.createImageData(160, 160), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = rnd();
    const light = v > .5;
    d[i] = d[i + 1] = d[i + 2] = light ? 255 : 20;
    d[i + 3] = Math.pow(Math.abs(v - .5) * 2, 3) * 46;
  }
  x.putImageData(img, 0, 0);
  // fibres
  for (let i = 0; i < 70; i++) {
    x.strokeStyle = rnd() > .5 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.10)';
    x.lineWidth = rr(.4, 1);
    x.beginPath(); const a = rr(0, 160), b = rr(0, 160), ang = rr(-.6, .6), L = rr(5, 16);
    x.moveTo(a, b); x.quadraticCurveTo(a + L / 2, b + rr(-2, 2), a + Math.cos(ang) * L, b + Math.sin(ang) * L); x.stroke();
  }
  return c.toDataURL('image/png');
}

/* smooth closed path through ridge points, closed down to `bottom` */
function ridge(pts, bottom) {
  let d = `M${f1(pts[0][0])} ${bottom}L${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${f1(c1x)} ${f1(c1y)} ${f1(c2x)} ${f1(c2y)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + `L${f1(pts[pts.length - 1][0])} ${bottom}Z`;
}
/* hill silhouette: a few soft peaks with hand-cut wobble */
function hills(x0, x1, base, peaks, step = 22) {
  const pts = [];
  for (let x = x0; x <= x1 + .1; x += step) {
    let y = base;
    for (const [px, h, w] of peaks) y -= h * Math.exp(-Math.pow((x - px) / w, 2));
    y += rr(-1.4, 1.4);
    const edge = Math.min(1, (x - x0) / 70, (x1 - x) / 70);
    y = base + (y - base) * Math.max(0, edge);
    pts.push([x, y]);
  }
  return pts;
}

/* one paper cut-out: a soft shadow cast behind, the cut thickness below, a lit edge on top, the sheet, its grain */
function paper(d, o) {
  const { fill, hi, rim, sh = .35, shDy = 8, blur = 'b6', th = 3, hiDy = 1.6, grain = true, extra = '' } = o;
  return `${sh ? `<path d="${d}" transform="translate(${o.shDx || 0} ${shDy})" style="fill:var(--shade);opacity:${sh}" filter="url(#${blur})"/>` : ''}`
    + (rim ? `<path d="${d}" transform="translate(0 ${th})" style="fill:${rim}"/>` : '')
    + (hi ? `<path d="${d}" style="fill:${hi}"/>` : '')
    + `<path d="${d}" transform="translate(0 ${hi ? hiDy : 0})" style="fill:${fill}"/>`
    + (grain ? `<path d="${d}" transform="translate(0 ${hi ? hiDy : 0})" fill="url(#grain)" style="opacity:var(--grain-op)"/>` : '')
    + extra;
}

/* ---------- flats ---------- */
function flat(cam, z, left, top, w, h, inner, cls = '') {
  const k = (P - z) / P;
  // Chrome culls parts of a 3D plane whose box does not contain the perspective origin, so every flat's box is
  // grown to include it and the artwork is offset inside
  const L = Math.min(left, OX - 20), T = Math.min(top, OY - 20), R = Math.max(left + w, OX + 20), B = Math.max(top + h, OY + 20);
  const e = el('div', 'flat ' + cls, `left:${L}px;top:${T}px;width:${R - L}px;height:${B - T}px;transform-origin:${OX - L}px ${OY - T}px;transform:translateZ(${z}px) scale(${f1(k * 1000) / 1000})`);
  const d = el('div', 'drift', `position:absolute;left:${left - L}px;top:${top - T}px;width:${w}px;height:${h}px`);
  if (typeof inner === 'string') d.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="${NS}">${inner}</svg>`;
  else d.appendChild(inner);
  e.appendChild(d);
  cam.appendChild(e);
  return e;
}

/* ---------- objects at world positions ---------- */
function obj(parent, x, y, z, cls = '', extra = '') {
  const e = el('div', 'obj p3 ' + cls, `transform:translate3d(${x}px,${y}px,${z}px)${extra}`);
  parent.appendChild(e);
  return e;
}
/* a plane of size w x h; `t` is its transform relative to the object's origin */
function plane(parent, w, h, t, inner, cls = '', bg = '') {
  const e = el('div', 'face ' + cls, `width:${w}px;height:${h}px;transform:${t};${bg}`);
  if (inner) e.innerHTML = inner;
  parent.appendChild(e);
  return e;
}
const svgBox = (w, h, inner) => `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;overflow:visible">${inner}</svg>`;

/* rounded-top arch window as a path */
const arch = (x, y, w, h) => { const r = w / 2; return `M${x} ${y + h}V${y + r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h}Z`; };
const rect = (x, y, w, h) => `M${x} ${y}H${x + w}V${y + h}H${x}Z`;

/* a face with holes cut for windows (even-odd), drawn as paper */
let cpN = 0;
function wallSVG(w, h, outline, holes, fill, opts = {}) {
  const d = outline + holes.join(''), id = 'cp' + (cpN++);
  return svgBox(w, h, `<clipPath id="${id}"><path d="${d}" clip-rule="evenodd"/></clipPath><path d="${d}" fill-rule="evenodd" transform="translate(0 2.5)" style="fill:${opts.rim || 'var(--shade)'};opacity:.55"/>`
    + `<path d="${d}" fill-rule="evenodd" style="fill:${fill}"/>`
    + (opts.inner ? `<g clip-path="url(#${id})">${opts.inner}</g>` : '')
    + `<path d="${d}" fill-rule="evenodd" fill="url(#grain)" style="opacity:var(--grain-op)"/>`
    + (opts.over || '')
    + holes.map(hd => `<path d="${hd}" style="fill:none;stroke:var(--shade);stroke-width:2.2;opacity:.35"/>`).join(''));
}

/* ---------- the scene ---------- */
export function buildWorld(cam, defs) {
  const grain = makeGrain();
  document.documentElement.style.setProperty('--grain-url', `url(${grain})`);
  defs.innerHTML = `<defs>
    <pattern id="grain" patternUnits="userSpaceOnUse" width="160" height="160"><image href="${grain}" width="160" height="160"/></pattern>
    <filter id="b3" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="b6" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="b12" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="12"/></filter>
    <linearGradient id="g-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--far)"/><stop offset="1" style="stop-color:var(--sea-far)"/></linearGradient>
    <linearGradient id="g-mid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--mid)"/><stop offset="1" style="stop-color:var(--mid-rim)"/></linearGradient>
    <linearGradient id="g-land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--land-2)"/><stop offset="1" style="stop-color:var(--land)"/></linearGradient>
    <linearGradient id="g-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sea-far)"/><stop offset=".25" style="stop-color:var(--sea)"/><stop offset="1" style="stop-color:var(--sea-near)"/></linearGradient>
    <linearGradient id="g-cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--cloud-2)"/><stop offset=".55" style="stop-color:var(--cloud-2)"/><stop offset="1" style="stop-color:color-mix(in srgb, var(--cloud-lit) 60%, var(--cloud-2))"/></linearGradient>
    <linearGradient id="g-tower" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--tower)"/><stop offset="1" style="stop-color:color-mix(in srgb, var(--tower) 82%, var(--sky-4))"/></linearGradient>
    <radialGradient id="g-sun"><stop offset="0" style="stop-color:var(--sun-core)"/><stop offset=".7" style="stop-color:var(--sun)"/><stop offset="1" style="stop-color:var(--sun)"/></radialGradient>
  </defs>`;

  const W = { cam };

  /* sky: a tall gradient far behind everything, with a few last stars */
  {
    const sky = el('div', '', `width:1100px;height:1500px;background:linear-gradient(180deg,var(--sky-0) 0%,var(--sky-0) 24%,var(--sky-1) 46%,var(--sky-2) 58%,var(--sky-3) 64.5%,var(--sky-4) 68.5%,var(--sky-5) 70%,var(--sky-5) 100%)`);
    let stars = '';
    for (let i = 0; i < 46; i++) stars += `<i style="position:absolute;left:${f1(rr(0, 1100))}px;top:${f1(rr(60, 700))}px;width:${f1(rr(1.2, 2.6))}px;height:${f1(rr(1.2, 2.6))}px;border-radius:50%;background:var(--sun-core);opacity:${f1(rr(.15, .7))}"></i>`;
    sky.innerHTML = `<div class="stars" style="position:absolute;inset:0;opacity:var(--star-op,1)">${stars}</div>`;
    // horizon at OY=300 must land at 70% of 1500 = 1050 -> top = 300 - 1050
    W.sky = flat(cam, -4000, -350, -750, 1100, 1500, sky, 'sky');
  }
  /* sun bloom and disc; the sea plate in front hides the sun until it rises */
  {
    const bl = el('div', '', `width:900px;height:900px;border-radius:50%;background:radial-gradient(closest-side,var(--bloom),var(--bloom-2) 45%,transparent 100%)`);
    W.bloom = flat(cam, -3500, 292 - 450, 296 - 450, 900, 900, bl, 'bloom leafglow');
    const sun = `<circle cx="40" cy="40" r="27" fill="url(#g-sun)"/><circle cx="40" cy="40" r="36" style="fill:var(--sun);opacity:.18"/>`;
    W.sun = flat(cam, -3400, 252, 240, 80, 80, sun, 'sun');
  }
  /* long stratus streaks lit from below near the horizon */
  {
    let s = '';
    const streak = (x, y, w, h) => { const d = `M${x} ${y}c${w * .2} ${-h} ${w * .5} ${-h} ${w * .7} ${-h * .6}c${w * .1} ${-h * .3} ${w * .25} ${-h * .2} ${w * .3} ${h * .1}c${-w * .3} ${h * .7} ${-w * .7} ${h * .6} ${-w} ${h * .5}Z`;
      return paper(d, { fill: 'var(--cloud-2)', hi: 'var(--cloud-lit)', hiDy: -1.6, sh: 0, grain: true }); };
    s += streak(-120, 262, 260, 9) + streak(140, 238, 210, 7) + streak(330, 270, 300, 8) + streak(520, 228, 220, 9) + streak(40, 214, 160, 6);
    W.stratus = flat(cam, -3000, -300, 150, 1300, 200, s.replace(/M(-?\d+)/g, (m, a) => 'M' + (+a + 300)), 'cloud');
  }
  /* sea plate */
  {
    let gl = '';
    for (let i = 0; i < 26; i++) {
      const t = i / 26, y = 304 + t * t * 120, w = 10 + t * 50 * rr(.5, 1.2), x = 292 + rr(-1, 1) * (8 + t * 40) - w / 2;
      gl += `<i style="left:${f1(x + 600)}px;top:${f1(y - 296)}px;width:${f1(w)}px;--d:${f1(rr(1.6, 3.4))}s;--dl:-${f1(rr(0, 3))}s;opacity:.5"></i>`;
    }
    const sea = el('div', '', `width:2200px;height:700px;position:relative;background:linear-gradient(180deg,var(--sea-far),var(--sea) 30%,var(--sea-near))`);
    sea.innerHTML = `<div class="glints sunglints" style="position:absolute;inset:0">${gl}</div>`;
    W.sea = flat(cam, -2600, -600, 296, 2200, 700, sea, 'sea');
  }
  /* far headland with a small lighthouse, then a nearer ridge that runs behind the quay */
  {
    // each ridge stands on the water at its own depth: its foot is at gy(z)
    const ridgeFlat = (z, x0, x1, peaks, fill, hi, rim, cls, extra = '') => {
      const foot = gy(z) + 4, top = foot - 200, pts = hills(x0, x1, foot, peaks, 16);
      return flat(cam, z, x0, top, x1 - x0, 260, paper(ridge(pts.map(([x, y]) => [x - x0, y - top]), 260), { fill, hi, rim, sh: .3, blur: 'b12', shDy: 5, hiDy: 2 }) + extra, cls);
    };
    W.far1 = ridgeFlat(-2300, -320, 330, [[-170, 150, 130], [20, 104, 100], [180, 40, 70]], 'url(#g-far)', 'var(--far-hi)', 'var(--far-rim)', 'far');
    const lhX = 800 - 340, lhY = 190 - 122;
    W.far2 = ridgeFlat(-2000, 340, 1500, [[470, 46, 70], [800, 118, 140], [1080, 70, 120], [1310, 104, 120]], 'url(#g-far)', 'var(--far-hi)', 'var(--far-rim)', 'far',
      `<g transform="translate(${lhX} ${lhY})"><path d="M-5 30 L-3.5 -6 H3.5 L5 30Z" style="fill:var(--tower)"/><path d="M-4.5 -6h9v-4h-9z" style="fill:var(--far-rim)"/><circle cx="0" cy="-13" r="3" style="fill:var(--lamp)"/><circle cx="0" cy="-13" r="9" style="fill:var(--lamp);opacity:.25"/></g>`);
    { const hz = el('div', '', 'width:2400px;height:260px;background:linear-gradient(180deg,transparent,var(--haze) 55%,var(--haze) 80%,transparent)');
      W.haze = flat(cam, -1500, -800, 170, 2400, 260, hz, 'haze'); }
    W.mid = ridgeFlat(-1150, 380, 1500, [[520, 50, 80], [690, 110, 120], [930, 70, 100], [1170, 132, 150], [1400, 70, 90]], 'url(#g-mid)', 'var(--mid-hi)', 'var(--mid-rim)', 'mid');
  }

  /* clouds: two sheets each, a darker back sheet and a front sheet lit along its underside by the low sun */
  const cloudShape = (w, h, n) => {
    let d = `M0 ${h}`, px = 0;
    for (let i = 0; i < n; i++) {
      const t = (i + .5) / n, ry = h * (.28 + .72 * Math.sin(Math.PI * t)) * rr(.8, 1.05);
      const x2 = i === n - 1 ? w : Math.min(w - 6, px + w / n * rr(.85, 1.15)), y2 = i === n - 1 ? h : h * rr(.42, .62);
      d += `A${f1((x2 - px) / 2 * 1.04)} ${f1(ry)} 0 0 1 ${f1(x2)} ${f1(y2)}`; px = x2;
    }
    return d + 'Z';
  };
  const cloud = (z, x, y, w, h, n, a, dur) => {
    const back = cloudShape(w, h, n), front = cloudShape(w * .78, h * .72, Math.max(2, n - 1));
    const inner = paper(back, { fill: 'var(--cloud)', hi: 'var(--cloud-lit)', hiDy: -1.6, sh: .28, shDy: 12, blur: 'b12' })
      + `<g transform="translate(${f1(w * .1)} ${f1(h * .34)})">` + paper(front, { fill: 'url(#g-cloud)', hi: 'var(--cloud-hi)', hiDy: -2.4, rim: 'var(--cloud-lit)', th: -1.2, sh: .35, shDy: 8, blur: 'b6' }) + '</g>';
    const f = flat(cam, z, x, y, w, h * 1.1 + 24, inner, 'cloud');
    f.firstChild.style.cssText += `;--a:${a}px;--d:${dur}s`;
    return f;
  };
  W.clouds = [
    cloud(-1700, -300, 150, 280, 58, 4, 26, 50), cloud(-1600, 470, 96, 380, 74, 5, -24, 56), cloud(-1000, -150, 40, 250, 70, 4, 18, 44),
    cloud(-800, 290, -6, 260, 78, 4, -16, 48), cloud(-1300, 720, 190, 240, 48, 3, 14, 52), cloud(-600, 860, 30, 300, 82, 5, -12, 50),
    // near: far above the resting view; the camera sinks through them on arrival
    cloud(120, -260, -600, 560, 150, 5, 0, 30), cloud(200, 120, -760, 520, 170, 5, 0, 30), cloud(300, -380, -1000, 640, 200, 6, 0, 30),
    cloud(380, 60, -1240, 640, 230, 6, 0, 30), cloud(460, -500, -1480, 760, 260, 6, 0, 30), cloud(540, -80, -1760, 820, 300, 6, 0, 30),
    cloud(600, -700, -2050, 900, 320, 6, 0, 30),
  ];

  /* waves: theatre wave flats, far to near; each slides gently side to side. The reflections of the sun, the tower's
     windows and the places' lamps are painted on the strip of water each flat shows, so they sit on the water at the
     right depth and slide with it. */
  W.waves = [];
  const zs = [-1700, -1050, -700, -470, -310, -195, -105, -25, 60, 150, 245, 345, 450, 570];
  const SRC = [
    { cls: 'rf-sun', x: 292, inf: true, w0: 10, w1: 46, col: 'var(--glint)', n: 2 },
    { cls: 'rf-tower', x: 150, z: -120, w0: 5, w1: 12, col: 'var(--window-on)', n: 1 },
    { cls: 'rf-lamp', x: 262, z: -50, w0: 4, w1: 10, col: 'var(--lamp)', n: 1 },
    { cls: 'rf-places', x: 372, z: -50, w0: 4, w1: 10, col: 'var(--lamp)', n: 1 },
    { cls: 'rf-places', x: 470, z: -50, w0: 4, w1: 10, col: 'var(--lamp)', n: 1 },
    { cls: 'rf-places', x: 614, z: -70, w0: 14, w1: 30, col: 'var(--window-on)', n: 2 },
    { cls: 'rf-places', x: 735, z: -70, w0: 16, w1: 34, col: 'var(--window-on)', n: 2 },
    { cls: 'rf-places', x: 854, z: -70, w0: 14, w1: 30, col: 'var(--window-on)', n: 2 },
  ];
  zs.forEach((z, i) => {
    const t = i / (zs.length - 1);
    const y = gy(z), yNext = i < zs.length - 1 ? gy(zs[i + 1]) : y + 300;
    const A = 1.2 + 6.5 * t * t, w = 2700, x0 = -950;
    // each strip only needs to reach a little below the next strip's crest; the last one reaches the bottom
    const h = i < zs.length - 1 ? Math.min(900 - y + 60, (yNext - y) * (P - z) / P * 2.4 + 40 + A * 2) : 900 - y + 160;
    let d = `M0 ${f1(A + 3)}`;
    for (let x = 0; x < w;) { const L = (24 + 80 * t) * rr(.7, 1.35); d += `q${f1(L / 2)} ${f1(-A * 2 * rr(.55, 1.25))} ${f1(L)} 0`; x += L; }
    d += `V${f1(h)}H0Z`;
    const fill = `color-mix(in srgb, var(--wave-near) ${Math.round(t * 100)}%, var(--wave-far))`;
    const crest = `color-mix(in srgb, var(--crest-near) ${Math.round(Math.min(100, t * 125))}%, var(--crest-far))`;
    // reflections on this strip's visible band
    const band = Math.max(3, (yNext - y) * (P - z) / P), k = P / (P - z);
    let rf = '';
    for (const S of SRC) {
      if (!S.inf && S.z >= z) continue;
      const sx = S.inf ? S.x : OX + (S.x - OX) * k;
      const ww = (S.w0 + (S.w1 - S.w0) * t);
      for (let j = 0; j < S.n; j++) {
        const yy = A + 4 + rr(0, Math.max(1, band - 4)), wj = ww * rr(.5, 1.15);
        rf += `<i class="rf ${S.cls}" style="left:${f1(sx - x0 - wj / 2 + rr(-3, 3))}px;top:${f1(yy)}px;width:${f1(wj)}px;height:${f1(1 + t * 1.2)}px;background:${S.col}"></i>`;
      }
    }
    const inner = paper(d, { fill, hi: crest, hiDy: .9 + t * 2.2, rim: 'var(--rim-wave)', th: 0, sh: .16 + t * .22, shDy: -4 - t * 7, blur: t > .5 ? 'b6' : 'b3', grain: t > .25 })
    // the low sun warms the water toward it: a soft light pooled on each strip under the sun
    const gid = 'sunw' + i, R = 120 + t * 420;
    const warm = `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${f1(292 - x0)}" cy="0" r="${f1(R)}" gradientTransform="translate(${f1(292 - x0)} 0) scale(1 .22) translate(${f1(-(292 - x0))} 0)"><stop offset="0" style="stop-color:var(--sky-5);stop-opacity:.5"/><stop offset=".45" style="stop-color:var(--sky-4);stop-opacity:.16"/><stop offset="1" style="stop-color:var(--sky-4);stop-opacity:0"/></radialGradient>`;
    const inner2 = inner + warm + `<path d="${d}" transform="translate(0 ${f1(.9 + t * 2.2)})" fill="url(#${gid})" class="sunwarm"/>`;
    const box = el('div', '', `position:relative;width:${w}px;height:${f1(h)}px`);
    box.innerHTML = `<svg width="${w}" height="${f1(h)}" viewBox="0 0 ${w} ${f1(h)}" style="position:absolute;left:0;top:0">${inner2}</svg>${rf}`;
    const f = flat(cam, z, x0, f1(y - A - 3), w, h, box, 'wave');
    f.firstChild.style.cssText += `;--a:${f1(3 + t * 15)}px;--d:${f1(rr(5.5, 9.5))}s;--dl:-${f1(rr(0, 6))}s`;
    W.waves.push(f);
  });

  /* ---------- the island, the tower (the keep), the pier ---------- */
  const isl = obj(cam, 0, 0, 0, 'island');
  W.island = isl;
  // rock front, a flat at z -55
  {
    const top = gy(-55, 14);
    const pts = [[40, top + 10], [62, top + 2], [96, top - 2], [140, top - 1], [190, top + 1], [236, top - 1], [262, top + 4], [290, top + 12]];
    flat(cam, -55, 0, top - 20, 330, 160, paper(ridge(pts.map(([x, y]) => [x, y - (top - 20)]), 160), { fill: 'url(#g-land)', hi: 'var(--land-hi)', rim: 'var(--land-rim)', sh: .4, shDy: 10, hiDy: 2.2, th: 4 }), 'rock');
  }
  // island top: a lit horizontal sheet from z -175 to -55
  plane(isl, 250, 120, `translate3d(40px,${GY - 14}px,-175px) rotateX(90deg)`, '', 'isle-top', 'transform-origin:0 0;background:var(--land-2);border-radius:60px 60px 0 0;background-image:var(--grain-url);background-size:160px');

  // the tower: a box of stacked card, door and windows cut through, warm rooms behind
  {
    const tw = 84, th = 236, td = 84, x = 150, z = -120, base = GY - 14;
    const T = obj(cam, x, base, z, 'tower');
    W.tower = T;
    // interior, lit
    plane(T, tw - 8, th - 20, `translate3d(${-tw / 2 + 4}px,${-th + 10}px,${td / 2 - 22}px)`, '', 'lit-room', 'background:linear-gradient(180deg,var(--interior),var(--interior))');
    const room = plane(T, tw - 8, th - 20, `translate3d(${-tw / 2 + 4}px,${-th + 10}px,${td / 2 - 21}px)`, '', 'lit-fade', 'background:radial-gradient(60% 30% at 50% 92%,var(--interior-lit),color-mix(in srgb,var(--interior-lit) 40%,var(--interior)) 70%,var(--interior))');
    W.towerRoom = room;
    // front face with courses of card, crenels, door and two windows
    const merl = 12;
    let out = `M0 ${th}V18`;
    for (let i = 0; i < 4; i++) { const mx = i * (tw / 3.5); out += `H${f1(mx)}V0H${f1(mx + merl)}V18`; }
    out += `H${tw}V${th}Z`;
    out = `M0 ${th}V18H0V0H${merl}V18H${f1(tw / 2 - merl / 2)}V0H${f1(tw / 2 + merl / 2)}V18H${tw - merl}V0H${tw}V${th}Z`;
    const door = arch(tw / 2 - 22, th - 66, 44, 66), w1 = arch(tw / 2 - 8, 60, 16, 30), w2 = arch(tw / 2 - 8, 122, 16, 30);
    let courses = '';
    for (let y = 30; y < th - 4; y += 13) courses += `<path d="M0 ${y}H${tw}" style="stroke:var(--tower-rim);stroke-width:1;opacity:.35"/><path d="M0 ${y + 1}H${tw}" style="stroke:var(--tower-top);stroke-width:1;opacity:.5"/>`;
    const front = plane(T, tw, th, `translate3d(${-tw / 2}px,${-th}px,${td / 2}px)`,
      wallSVG(tw, th, out, [door, w1, w2], 'url(#g-tower)', { inner: courses + `<path d="M0 18H${tw}" style="stroke:var(--tower-rim);stroke-width:2;opacity:.6"/><rect x="${tw - 7}" width="7" height="${th}" style="fill:var(--sky-5);opacity:.28"/><rect x="${tw - 2}" width="2" height="${th}" style="fill:var(--sun-core);opacity:.5"/>` }), 'tower-front');
    // window glows
    for (const [wy, wid] of [[75, 16], [137, 16]]) {
      const g = el('div', 'glow lit-fade', `left:${tw / 2 - 40}px;top:${wy - 40}px;width:80px;height:80px;background:radial-gradient(closest-side,var(--glow),var(--glow-2) 55%,transparent)`);
      front.appendChild(g);
    }
    // light from the door spills on the ground in front of it
    plane(T, 90, 60, `translate3d(-45px,-.6px,${td / 2}px) rotateX(90deg)`, '', 'lit-fade', 'transform-origin:0 0;background:radial-gradient(closest-side,var(--glow),transparent)');
    // right side, shaded
    let sideCourses = '';
    for (let y = 30; y < th - 4; y += 13) sideCourses += `<path d="M0 ${y}H${td}" style="stroke:var(--tower-rim);stroke-width:1;opacity:.35"/>`;
    plane(T, td, th, `translate3d(${tw / 2}px,${-th}px,${td / 2}px) rotateY(90deg)`, svgBox(td, th, `<path d="M0 ${th}V0H${merl}V18H${td / 2 - 6}V0H${td / 2 + 6}V18H${td - merl}V0H${td}V${th}Z" style="fill:var(--tower-side)"/><path d="M0 ${th}V0H${td}V${th}Z" fill="url(#grain)" style="opacity:var(--grain-op)"/>${sideCourses}`), 'tower-side', 'transform-origin:0 0');
    // pennant
    const pen = plane(T, 40, 60, `translate3d(${tw / 2 - 16}px,${-th - 52}px,${td / 2 - 10}px)`, svgBox(40, 60, `<path d="M2 60V2" style="stroke:var(--tower-rim);stroke-width:2"/><path d="M3 4 L30 10 L3 17Z" style="fill:var(--citrus)"/>`), 'pennant');
    W.pennant = pen;
    W.towerGeom = { x, z, tw, th, td, base };
  }

  // the pier: planks laid on the water from the island toward the camera, with posts
  {
    const x0 = 126, w = 48, z0 = -60, z1 = 470, y = GY - 7;
    const Pr = obj(cam, 0, 0, 0, 'pier');
    let planks = '';
    const len = z1 - z0;
    for (let i = 0; i < len; i += 11) planks += `<path d="M0 ${i}H${w}" style="stroke:var(--plank-2);stroke-width:1.4"/><path d="M0 ${i + 1.2}H${w}" style="stroke:var(--plank-hi);stroke-width:.8;opacity:.6"/>`;
    // the plane is laid flat: local y runs from z1 (near) to z0 (far)
    plane(Pr, w, len, `translate3d(${x0}px,${y}px,${z0}px) rotateX(90deg)`, svgBox(w, len, `<rect width="${w}" height="${len}" style="fill:var(--plank)"/><rect width="${w}" height="${len}" fill="url(#grain)" style="opacity:var(--grain-op)"/>${planks}`), 'pier-top', 'transform-origin:0 0');
    // front edge
    plane(Pr, w, 7, `translate3d(${x0}px,${y}px,${z1}px)`, '', 'pier-edge', 'background:var(--plank-2)');
    // shadow on the water under the pier
    plane(Pr, w + 16, len, `translate3d(${x0 - 4}px,${GY - .5}px,${z0}px) rotateX(90deg)`, '', 'pier-shadow', 'transform-origin:0 0;background:linear-gradient(90deg,transparent,var(--shade) 25%,var(--shade) 75%,transparent);opacity:.4');
    // posts
    for (let zz = z0 + 70; zz <= z1; zz += 110) for (const px of [x0 - 3, x0 + w - 3]) {
      plane(Pr, 6, 40, `translate3d(${px}px,${y - 12}px,${zz}px)`, '', 'post', 'background:linear-gradient(90deg,var(--post),color-mix(in srgb,var(--post) 70%,var(--plank-hi)))');
    }
    W.pierGeom = { x0, w, z0, z1, y };
  }

  /* ---------- the quay, with lamps and the three places ---------- */
  {
    const q = obj(cam, 0, 0, 0, 'quay');
    const x0 = 192, x1 = 1240, zf = -40, zb = -150, h = 24, top = GY - h;
    W.quayGeom = { x0, x1, zf, zb, top };
    let blocks = '';
    for (let x = 0; x < x1 - x0; x += 34) blocks += `<path d="M${x} 0V${h}" style="stroke:var(--stone-side);stroke-width:1.4;opacity:.6"/>`;
    plane(q, x1 - x0, h + 8, `translate3d(${x0}px,${top}px,${zf}px)`, svgBox(x1 - x0, h + 8, `<rect width="${x1 - x0}" height="${h + 8}" style="fill:var(--stone)"/><rect width="${x1 - x0}" height="2" style="fill:var(--stone-top)"/><rect width="${x1 - x0}" height="${h + 8}" fill="url(#grain)" style="opacity:var(--grain-op)"/>${blocks}`), 'quay-front');
    plane(q, x1 - x0, zf - zb, `translate3d(${x0}px,${top}px,${zb}px) rotateX(90deg)`, '', 'quay-top', `transform-origin:0 0;background:var(--stone-top);background-image:var(--grain-url);background-size:160px`);
    // lamp posts along the quay; the first lights on arrival
    W.quayLamps = [];
    for (const lx of [262, 372, 470]) {
      const L = obj(cam, lx, top, zf - 8, 'qlamp');
      plane(L, 4, 44, `translate3d(-2px,-44px,0)`, '', '', 'background:var(--post)');
      plane(L, 12, 12, `translate3d(-6px,-54px,0)`, '', '', 'background:var(--window-off);border-radius:3px 3px 2px 2px');
      plane(L, 12, 12, `translate3d(-6px,-54px,.5px)`, '', 'lit-fade', 'background:var(--lamp);border-radius:3px 3px 2px 2px');
      plane(L, 90, 90, `translate3d(-45px,-93px,1px)`, '', 'lit-fade glow', 'background:radial-gradient(closest-side,var(--glow),var(--glow-2) 50%,transparent)');
      W.quayLamps.push(L);
    }
  }

  /* places: built of card. house (house move), school, office with a desk (taxes) */
  W.places = [];
  const Q = W.quayGeom;
  const place = (id, x, label, spec) => {
    const z = -96, base = Q.top, G = obj(cam, x, base, z, 'place');
    G.dataset.place = id;
    const { w, h, d, rise, color, side, roof, roofSide } = spec;
    // interior room (behind the front, seen through the windows)
    plane(G, w - 6, h - 4, `translate3d(${-w / 2 + 3}px,${-h + 2}px,${d / 2 - 16}px)`, '', '', 'background:var(--interior)');
    plane(G, w - 6, h - 4, `translate3d(${-w / 2 + 3}px,${-h + 2}px,${d / 2 - 15.5}px)`, '', 'lit-fade', 'background:radial-gradient(70% 70% at 50% 60%,var(--interior-lit),color-mix(in srgb,var(--interior-lit) 45%,var(--interior)) 75%)');
    if (spec.inner) spec.inner(G, w, h, d);
    // front: wall plus gable, holes for windows and door
    const H = h + rise;
    let outline;
    if (spec.shape === 'gable') outline = `M0 ${H}V${rise}L${w / 2} 0L${w} ${rise}V${H}Z`;
    else outline = `M0 ${H}V${rise}H${w}V${H}Z`;
    const holes = spec.holes.map(([kind, a, b, c, e]) => kind === 'a' ? arch(a, b + rise, c, e) : rect(a, b + rise, c, e));
    const over = (spec.over || '') + (spec.shape === 'gable'
      ? `<path d="M-6 ${rise + 5}L${w / 2} -3L${w + 6} ${rise + 5}" style="fill:none;stroke:var(${roof});stroke-width:9;stroke-linejoin:round"/>`
      : `<path d="M-5 ${rise + 2}H${w + 5}" style="stroke:var(${roof});stroke-width:8"/>`);
    const front = plane(G, w, H, `translate3d(${-w / 2}px,${-H}px,${d / 2}px)`, wallSVG(w, H, outline, holes, `var(${color})`, { over }), 'p-front');
    for (const [kind, a, b, c, e] of spec.holes) {
      if (kind === 'r' && spec.door && a === spec.door) continue;
      const g = el('div', 'glow lit-fade', `left:${a + c / 2 - c * 1.3}px;top:${b + rise + e / 2 - e * 1.3}px;width:${c * 2.6}px;height:${e * 2.6}px;background:radial-gradient(closest-side,var(--glow),var(--glow-2) 60%,transparent)`);
      front.appendChild(g);
    }
    // sides
    for (const s of [-1, 1]) {
      plane(G, d, h, `translate3d(${s * w / 2}px,${-h}px,${d / 2}px) rotateY(${s * 90}deg)`, '', '', `transform-origin:0 0;background:var(${side});background-image:var(--grain-url);background-size:160px`);
    }
    // roof planes for a gable: two sheets sloping back from the ridge
    if (spec.shape === 'gable') {
      const slope = Math.hypot(w / 2 + 6, rise + 8), ang = Math.atan2(rise + 8, w / 2 + 6) * 180 / Math.PI;
      for (const s of [-1, 1]) {
        plane(G, slope, d + 8, `translate3d(0px,${-H - 3}px,${d / 2 + 4}px) rotateZ(${s > 0 ? ang : 180 - ang}deg) rotateX(-90deg)`, '', '', `transform-origin:0 0;background:var(${s > 0 ? roofSide : roof});background-image:var(--grain-url);background-size:160px`);
      }
    } else {
      plane(G, w + 10, d + 6, `translate3d(${-w / 2 - 5}px,${-H}px,${d / 2 + 3}px) rotateX(90deg)`, '', '', `transform-origin:0 0;background:var(${roofSide})`);
    }
    if (spec.extra) spec.extra(G, w, H, d, front);
    // street lamp beside the door
    const L = obj(G, w / 2 + 12, 0, d / 2 + 14, 'plamp');
    plane(L, 3, 40, `translate3d(-1.5px,-40px,0)`, '', '', 'background:var(--post)');
    plane(L, 11, 11, `translate3d(-5.5px,-50px,0)`, '', '', 'background:var(--window-off);border-radius:3px');
    plane(L, 11, 11, `translate3d(-5.5px,-50px,.5px)`, '', 'lit-fade', 'background:var(--lamp);border-radius:3px');
    plane(L, 110, 110, `translate3d(-55px,-100px,1px)`, '', 'lit-fade glow', 'background:radial-gradient(closest-side,var(--glow),var(--glow-2) 50%,transparent)');
    // light spilled on the quay
    plane(G, w + 40, 46, `translate3d(${-w / 2 - 20}px,-.5px,${d / 2}px) rotateX(90deg)`, '', 'lit-fade', 'transform-origin:0 0;background:radial-gradient(closest-side,var(--glow),transparent)');
    // tag on a string under the quay edge
    const tagHolder = obj(cam, x, base + 3, Q.zf + 2, 'tagh');
    const tag = el('div', 'tag', '', label);
    tagHolder.appendChild(tag);
    tag.style.left = '0px'; tag.style.top = '0px';
    requestAnimationFrame(() => { tag.style.left = -tag.offsetWidth / 2 + 'px'; });
    const P_ = { id, G, x, z, base, w, H, d, tagHolder, spec };
    W.places.push(P_);
    return P_;
  };

  place('house', 614, 'House move', {
    shape: 'gable', w: 92, h: 70, d: 60, rise: 38, color: '--house', side: '--house-side', roof: '--roof-a', roofSide: '--roof-a-side',
    holes: [['r', 12, 14, 22, 18], ['r', 58, 14, 22, 18], ['r', 10, 44, 34, 22], ['a', 58, 38, 22, 32]], door: 58,
    over: `<path d="M27 20h10" style="stroke:var(--house-side);stroke-width:1.5"/>`,
    inner(G, w, h, d) {
      // Scout, at work in the big downstairs window
      const c = obj(G, -w / 2 + 27, -6, d / 2 - 8, 'crew-holder');
      const wrap = el('div', 'crew-wrap', 'position:absolute;left:-15px;top:-38px;width:30px;height:38px');
      wrap.innerHTML = '<div class="crew-card"><i></i><i></i><b></b><b></b></div>';
      c.appendChild(wrap);
    },
    extra(G, w, H, d) {
      // chimney and moving boxes
      plane(G, 12, 26, `translate3d(${w / 4 - 2}px,${-H + 2}px,${d / 2 - 14}px)`, '', '', 'background:var(--roof-a-side)');
      const bx = (x, y, s, z) => plane(G, s, s * .8, `translate3d(${x}px,${-s * .8 - y}px,${d / 2 + z}px)`, svgBox(s, s * .8, `<rect width="${s}" height="${s * .8}" rx="1" style="fill:#b78f63"/><path d="M0 ${s * .22}H${s}" style="stroke:#8d6b48;stroke-width:2"/><rect width="${s}" height="${s * .8}" fill="url(#grain)" style="opacity:var(--grain-op)"/>`), 'box');
      bx(-w / 2 - 22, 0, 18, 24); bx(-w / 2 - 18, 14, 14, 24); bx(-w / 2 - 2, 0, 15, 30);
    },
  });
  place('school', 735, 'School', {
    shape: 'gable', w: 104, h: 76, d: 64, rise: 34, color: '--school', side: '--school-side', roof: '--roof-a', roofSide: '--roof-a-side',
    holes: [['a', 10, 18, 20, 32], ['a', 42, 18, 20, 32], ['a', 74, 18, 20, 32], ['r', 40, 56, 24, 20]], door: 40,
    over: `<circle cx="52" cy="22" r="8" style="fill:var(--tag)"/><path d="M52 22V17M52 22h3.5" style="stroke:var(--tag-ink);stroke-width:1.4;stroke-linecap:round"/>`,
    extra(G, w, H, d) {
      // bell cupola on the ridge
      plane(G, 18, 22, `translate3d(-9px,${-H - 18}px,${d / 2 - 18}px)`, svgBox(18, 22, `<path d="M0 22V6L9 0L18 6V22Z" style="fill:var(--school-side)"/><path d="M5 22V11a4 4 0 0 1 8 0V22Z" style="fill:var(--interior)"/><circle cx="9" cy="15" r="2.6" style="fill:var(--lamp)"/>`), '');
    },
  });
  place('office', 854, 'Taxes', {
    shape: 'flat', w: 90, h: 72, d: 56, rise: 12, color: '--office', side: '--office-side', roof: '--roof-c', roofSide: '--roof-c',
    holes: [['r', 8, 14, 50, 32], ['r', 64, 22, 18, 50]], door: 64,
    over: `<rect x="14" y="3" width="44" height="9" rx="1" style="fill:var(--roof-c)"/><path d="M8 ${14 + 12 + 32}H58" style="stroke:var(--office-side);stroke-width:3"/>`,
    inner(G, w, h, d) {
      // a desk with papers and a desk lamp, seen through the window
      const D = obj(G, -w / 2 + 33, -18, d / 2 - 10, '');
      plane(D, 40, 4, 'translate3d(-20px,-4px,0)', '', '', 'background:#6a4e3d');
      plane(D, 3, 14, 'translate3d(-18px,0,0)', '', '', 'background:#4b372b');
      plane(D, 3, 14, 'translate3d(15px,0,0)', '', '', 'background:#4b372b');
      plane(D, 14, 3, 'translate3d(-12px,-7px,0) rotateZ(-4deg)', '', '', 'background:var(--tag)');
      plane(D, 12, 3, 'translate3d(-10px,-9px,0) rotateZ(3deg)', '', '', 'background:var(--tag)');
      plane(D, 16, 18, 'translate3d(4px,-22px,0)', svgBox(16, 18, `<path d="M8 18V7L3 3" style="fill:none;stroke:var(--roof-c);stroke-width:1.6"/><path d="M0 1L7 0L6 6Z" style="fill:var(--roof-c)"/>`), '');
      plane(D, 6, 6, 'translate3d(2px,-18px,.5px)', '', 'lit-fade', 'background:var(--lamp);border-radius:50%');
      plane(D, 50, 40, 'translate3d(-20px,-34px,1px)', '', 'lit-fade glow', 'background:radial-gradient(closest-side,var(--glow),transparent)');
      // Ledger's receipt edge, resting on the desk
      plane(D, 12, 15, 'translate3d(-17px,-19px,-.5px)', svgBox(12, 15, `<path d="M0 0H12V15L10 13.5L8 15L6 13.5L4 15L2 13.5L0 15Z" style="fill:var(--crew)"/><rect x="3" y="4" width="2" height="4" rx="1" style="fill:var(--k-hole)"/><rect x="7" y="4" width="2" height="4" rx="1" style="fill:var(--k-hole)"/>`), '');
    },
  });

  /* folded paper boats riding at anchor, the way things go out on the tide */
  const boat = (z, x, w, flip, dur) => {
    const h = w * .62, yb = gy(z) + 3;
    const d = `M0 ${f1(h * .55)}L${f1(w)} ${f1(h * .55)}L${f1(w * .8)} ${f1(h)}L${f1(w * .2)} ${f1(h)}Z`;
    const sail = `M${f1(w * .22)} ${f1(h * .55)}L${f1(w * .5)} 0L${f1(w * .78)} ${f1(h * .55)}Z`;
    const inner = `<g transform="${flip ? `translate(${w} 0) scale(-1 1)` : ''}">`
      + paper(sail, { fill: 'var(--letter)', hi: 'var(--sun-core)', rim: 'var(--letter-edge)', th: 1.5, hiDy: 1, sh: .3, shDy: 4, blur: 'b3' })
      + `<path d="M${f1(w * .5)} 0V${f1(h * .55)}" style="stroke:var(--letter-edge);stroke-width:1.2"/>`
      + paper(d, { fill: 'var(--letter-edge)', hi: 'var(--letter)', rim: 'var(--tower-rim)', th: 1.5, hiDy: 1.2, sh: 0 })
      + `<path d="M${f1(w * .5)} ${f1(h * .55)}L${f1(w * .5)} ${f1(h)}" style="stroke:var(--tower-rim);stroke-width:1;opacity:.6"/></g>`;
    const f = flat(cam, z, x - w / 2, f1(yb - h), w, h + 6, inner, 'boat');
    f.firstChild.style.cssText += `;animation:bob ${dur}s ease-in-out infinite;transform-origin:50% 100%`;
    return f;
  };
  W.boats = [boat(120, 292, 40, false, 3.6), boat(-620, 38, 22, true, 4.4), boat(-260, 520, 26, false, 4)];

  /* foreground: mooring posts and a rope, very near */
  {
    const fg = obj(cam, 0, 0, 0, 'fg');
    // wooden mooring posts: a rounded cap, a rope turn, and the low sun catching the right edge
    for (const [x, z, hgt] of [[-30, 330, 120], [430, 300, 104], [672, 330, 120], [1030, 330, 110]]) {
      const wv = 18;
      plane(fg, wv, hgt, `translate3d(${x}px,${GY - hgt + 50}px,${z}px)`, svgBox(wv, hgt, `<path d="M0 6Q0 0 ${wv / 2} 0Q${wv} 0 ${wv} 6V${hgt}H0Z" style="fill:var(--post)"/>`
        + `<rect x="${wv - 4}" y="4" width="3" height="${hgt}" style="fill:var(--land-hi);opacity:.55"/><rect x="2" y="4" width="3" height="${hgt}" style="fill:var(--plank-hi);opacity:.14"/>`
        + `<path d="M0 6Q0 0 ${wv / 2} 0Q${wv} 0 ${wv} 6V${hgt}H0Z" fill="url(#grain)" style="opacity:var(--grain-op)"/>`
        + `<path d="M-2 22q11 5 22 0M-2 27q11 5 22 0M-2 32q11 5 22 0" style="fill:none;stroke:var(--plank-hi);stroke-width:3;stroke-linecap:round;opacity:.75"/>`), 'fgpost');
    }
  }

  return W;
}

export { P, OX, OY, GY, gy, el, obj, plane, flat, svgBox, rr };
