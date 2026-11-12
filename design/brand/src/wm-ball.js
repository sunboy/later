/* <wm-ball> The word engraved around a ball that turns. Canvas, per-pixel shading.
   The word is rasterised once into a longitude/latitude texture as a height map (an inlaid groove
   with bevelled walls). Per pixel we precompute where the ray meets the tilted sphere and the
   light terms of its surface frame; each frame then only shifts longitude by the turn angle,
   reads the groove slope and shades: Lambert, Blinn specular (less in the groove), rim, edge AA.
   Large (height >= 64px): the whole ball. Header size: a wide slot across the ball's equator, so the
   word stays legible at 20px and still curves away at both ends.
   idle: a slow look to one side, rest, then the other.  working: the ball turns steadily, the word
   goes round the back and comes back.  done: one full turn and a citrus moment.  drag: turn it by
   hand; it springs back.  hover: it turns a little toward you.  tap: one turn. */
(function () {
  const { clamp, ease, out, bump, spring, lerp, Base } = window.LaterWM;
  const TAU = Math.PI * 2, D = Math.PI / 180;

  function rgb(s) {
    s = (s || '').trim();
    if (s[0] === '#') { const h = s.length === 4 ? s.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : s; return [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16) / 255); }
    const m = s.match(/[\d.]+/g); return m ? m.slice(0, 3).map((v) => +v / 255) : [0.5, 0.5, 0.5];
  }

  class WmBall extends Base {
    build() {
      this.cv = document.createElement('canvas');
      this.cv.style.cssText = 'display:block;height:100%;touch-action:pan-y';
      this.cv.setAttribute('aria-hidden', 'true');
      this.appendChild(this.cv);
      this.ctx = this.cv.getContext('2d');
      this.drag = null; this.dragA = 0; this.rel = -1e9; this.relFrom = 0; this.spinAt = -1e9; this.last = null;
      this.addEventListener('pointerdown', (e) => { this.drag = { x: e.clientX, moved: false }; this.setPointerCapture(e.pointerId); });
      this.addEventListener('pointermove', (e) => {
        if (!this.drag) return;
        const dx = e.clientX - this.drag.x; if (Math.abs(dx) > 4) this.drag.moved = true;
        this.dragA = -dx / (this.Rcss || 100);
      });
      const up = () => {
        if (!this.drag) return;
        if (!this.drag.moved) this.spinAt = LaterWM.now(); else { this.rel = LaterWM.now(); this.relFrom = this.dragA; }
        this.drag = null; this.dragA = 0;
      };
      this.addEventListener('pointerup', up); this.addEventListener('pointercancel', up);
      const re = () => { this.colors(); this.last = null; this.frame(LaterWM.now()); };
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', re);
      new MutationObserver(re).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      document.addEventListener('wm-theme', re);
      new ResizeObserver(() => { this.setup(); this.last = null; this.frame(LaterWM.now()); }).observe(this);
      this.doneMs = 2600;
      this.setup();
    }
    colors() {
      const cs = getComputedStyle(this), g = (n, f) => rgb(cs.getPropertyValue(n) || f);
      this.C = { ball: g('--ball', '#e9e5de'), cut: g('--ball-cut', '#1e2740'), spec: g('--ball-spec', '#ffffff'),
        dball: g('--ball-done-ball', '#e2ea94'), dcut: g('--ball-done-cut', '#1e2740'), rim: g('--ball-rim', '#ffffff'),
        gloss: parseFloat(cs.getPropertyValue('--ball-gloss')) || 0.5,
        limb: parseFloat(cs.getPropertyValue('--ball-limb')) || 0, rimK: parseFloat(cs.getPropertyValue('--ball-rim-k')) || 0, amb: parseFloat(cs.getPropertyValue('--ball-amb')) || 0.4 };
    }
    setup() {
      const hCss = this.clientHeight || 120;
      if (hCss < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const big = hCss >= 64;
      this.big = big;
      const S = this.set, aspect = S.width / S.height;
      let wCss, R, latSpan;
      if (big) { wCss = hCss; R = hCss * 0.46; latSpan = (this.getAttribute('variant') === 'upper' ? 26 : 34) * D; this.tilt = 11 * D; }
      else { R = hCss * 1.6; latSpan = (hCss * 0.62) / R; wCss = Math.ceil(2 * R * Math.sin(Math.min(1.4, (latSpan * aspect) / 2 + 0.1))); this.tilt = 4 * D; }
      this.Rcss = R;
      const W = Math.round(wCss * dpr), H = Math.round(hCss * dpr), Rp = R * dpr;
      this.cv.width = W; this.cv.height = H; this.cv.style.width = wCss + 'px';
      this.img = this.ctx.createImageData(W, H);
      // texture: longitude 0..2pi across, latitude +-latMax down
      const TW = Math.min(4096, Math.ceil(TAU * Rp * 1.15)), latMax = Math.min(80 * D, latSpan * 1.1 + 6 * D);
      const TH = Math.ceil((TW * 2 * latMax) / TAU);
      const tc = document.createElement('canvas'); tc.width = TW; tc.height = TH;
      const tx = tc.getContext('2d');
      const ppr = TW / TAU;                       // texels per radian
      const s = (latSpan * ppr) / S.height;       // texels per glyph unit
      const drawWord = (blur) => {
        tx.setTransform(1, 0, 0, 1, 0, 0); tx.clearRect(0, 0, TW, TH);
        tx.filter = blur ? `blur(${blur}px)` : 'none';
        tx.setTransform(s, 0, 0, s, TW / 2 - (S.width * s) / 2, TH / 2 - (S.height * s) / 2 + latSpan * 0.04 * ppr);
        tx.fillStyle = '#000';
        for (const L of S.letters) { tx.save(); tx.translate(L.x, 0); tx.fill(new Path2D(L.d)); tx.restore(); }
        return tx.getImageData(0, 0, TW, TH).data;
      };
      const bev = Math.max(0.8, 30 * s);
      const crisp = drawWord(0), soft = drawWord(bev);
      const n = TW * TH, hgt = new Float32Array(n), m = new Float32Array(n);
      for (let i = 0; i < n; i++) { hgt[i] = 1 - soft[i * 4 + 3] / 255; m[i] = crisp[i * 4 + 3] / 255; }
      const gx = new Float32Array(n), gy = new Float32Array(n);
      for (let y = 1; y < TH - 1; y++) for (let x = 0; x < TW; x++) {
        const i = y * TW + x, xl = y * TW + ((x + TW - 1) % TW), xr = y * TW + ((x + 1) % TW);
        gx[i] = (hgt[xr] - hgt[xl]) * 0.5 * bev; gy[i] = (hgt[i - TW] - hgt[i + TW]) * 0.5 * bev;
      }
      Object.assign(this, { TW, TH, gx, gy, m, ppr, latMax, W, H });
      // per-pixel sphere geometry and light terms
      const cx = W / 2, cy = H / 2 + (big ? -H * 0.02 : 0), ct = Math.cos(this.tilt), st = Math.sin(this.tilt);
      const Lv = norm([-0.52, 0.62, 0.6]), Hv = norm([Lv[0], Lv[1], Lv[2] + 1]);
      const idx = [], A = [];
      for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
        const sx = (px + 0.5 - cx) / Rp, sy = -(py + 0.5 - cy) / Rp, r2 = sx * sx + sy * sy;
        if (r2 >= 1) continue;
        const sz = Math.sqrt(1 - r2);
        const xt = sx, yt = sy * ct + sz * st, zt = -sy * st + sz * ct;
        const lon = Math.atan2(xt, zt), lat = Math.asin(clamp(yt, -1, 1));
        const ty = TH / 2 - lat * ppr;
        const E = view([Math.cos(lon), 0, -Math.sin(lon)], ct, st);
        const N = view([-Math.sin(lat) * Math.sin(lon), Math.cos(lat), -Math.sin(lat) * Math.cos(lon)], ct, st);
        const nn = [sx, sy, sz];
        let a = clamp((1 - Math.sqrt(r2)) * Rp + 0.35);
        if (!big) a *= clamp(sz / 0.45);
        idx.push(py * W + px);
        A.push(lon, ty, dot(nn, Lv), dot(E, Lv), dot(N, Lv), dot(nn, Hv), dot(E, Hv), dot(N, Hv), sz, a, sy);
      }
      this.idx = Int32Array.from(idx); this.A = Float32Array.from(A);
      this.colors();
    }
    angle(t, T) {
      const st = this.state, big = this.big, N = LaterWM.now();
      const amp = (big ? 30 : 9) * D;
      let a = 0, done = 0;
      if (st === 'idle') {
        const k = [[0, 0], [2600, 0], [5400, amp], [7000, amp], [11400, -amp], [13000, -amp], [15800, 0]], p = T % 15800;
        for (let i = 1; i < k.length; i++) if (p <= k[i][0]) { a = lerp(k[i - 1][1], k[i][1], ease((p - k[i - 1][0]) / (k[i][0] - k[i - 1][0]))); break; }
      } else if (st === 'working') {
        a = ((t / (big ? 9000 : 7000)) % 1) * TAU;
        a = a + 0.5 * (1 - out(t / 900)) * 0; // starts from rest
      } else if (st === 'done') {
        a = TAU * out(t / 1300);
        done = out((t - 300) / 500) * (1 - ease((t - 1800) / 700));
      }
      const sp = N - this.spinAt;
      if (sp < 1500 && !this.still) a += TAU * out(sp / 1400);
      a += -(this.px - 0.5) * 0.5 * this.hover * (big ? 1 : 0.4);
      if (this.drag) a += this.dragA;
      else if (N - this.rel < 1800 && !this.still) a += this.relFrom * spring((N - this.rel) / 1200, 8, 0.36);
      return [a, done];
    }
    render(t, T) {
      if (!this.A) return;
      const [a, done] = this.still ? [0, 0] : this.angle(t, T);
      const key = a.toFixed(4) + ':' + done.toFixed(3);
      if (key === this.last) return;
      this.last = key;
      const { A, idx, gx, gy, m, TW, TH, ppr, C } = this, d = this.img.data, nP = idx.length;
      const ball = mix(C.ball, C.dball, done), cut = mix(C.cut, C.dcut, done), spc = C.spec, rim = C.rim, gloss = C.gloss;
      const big = this.big, amb0 = big ? C.amb : 0.62, kd = big ? 1.08 - C.amb : 0.42, limbK = big ? C.limb : 0, ballA = big ? 1 : 0;
      for (let j = 0, k = 0; j < nP; j++, k += 11) {
        let u = (A[k] + a) * ppr; u = ((u % TW) + TW) % TW + TW / 2; if (u >= TW) u -= TW;
        const ty = A[k + 1];
        let G1 = 0, G2 = 0, mm = 0;
        if (ty > 0 && ty < TH - 2) {
          const x0 = u | 0, f = u - x0, x1 = (x0 + 1) % TW, y0 = ty | 0, g = ty - y0, r0 = y0 * TW, r1 = r0 + TW;
          const w00 = (1 - f) * (1 - g), w10 = f * (1 - g), w01 = (1 - f) * g, w11 = f * g;
          G1 = gx[r0 + x0] * w00 + gx[r0 + x1] * w10 + gx[r1 + x0] * w01 + gx[r1 + x1] * w11;
          G2 = gy[r0 + x0] * w00 + gy[r0 + x1] * w10 + gy[r1 + x0] * w01 + gy[r1 + x1] * w11;
          mm = m[r0 + x0] * w00 + m[r0 + x1] * w10 + m[r1 + x0] * w01 + m[r1 + x1] * w11;
        }
        const inv = 1 / Math.sqrt(1 + G1 * G1 + G2 * G2);
        const nl = (A[k + 2] - G1 * A[k + 3] - G2 * A[k + 4]) * inv;
        const dif = Math.max(0, (nl + 0.4) / 1.4);
        const hs = Math.max(0, (A[k + 5] - G1 * A[k + 6] - G2 * A[k + 7]) * inv);
        const sz = A[k + 8], f1 = 1 - sz, fres = f1 * f1 * f1;
        const spec = (Math.pow(hs, 90) * gloss + Math.pow(hs, 12) * 0.05) * (1 - mm * 0.8);
        const amb = amb0 + 0.1 * A[k + 10];
        const limb = 1 - limbK * f1 * f1;
        const wall = Math.min(1, Math.hypot(G1, G2));
        const o = idx[j] * 4;
        for (let c = 0; c < 3; c++) {
          const base = ball[c] + (cut[c] - ball[c]) * mm;
          const v = base * (amb + kd * dif) * limb * (1 - 0.32 * wall * (1 - Math.max(0, nl))) + spc[c] * spec + rim[c] * fres * C.rimK;
          d[o + c] = v * 255;
        }
        d[o + 3] = A[k + 9] * 255 * (ballA + (1 - ballA) * Math.max(mm, wall));
      }
      this.ctx.putImageData(this.img, 0, 0);
    }
  }
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const view = (v, ct, st) => [v[0], v[1] * ct - v[2] * st, v[1] * st + v[2] * ct];
  const mix = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
  customElements.define('wm-ball', WmBall);
})();
