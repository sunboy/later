/* <wm-horizon> Below the line. The word stands on a horizon; what can wait sinks under it.
   idle: every 11 s the r sinks (the word reads "Late"), waits, and comes back on time.
   working: the letters ride a slow swell, feet in the water.  done: the word lifts clear and the
   horizon turns citrus.  drag down: push the word to later; let go and it springs back.
   tap: the whole word sinks and returns a moment later, as promised. */
(function () {
  const { el, ease, spring, clamp, out, bump, Base } = window.LaterWM;
  let uid = 0;

  class WmHorizon extends Base {
    build() {
      const id = 'hz' + ++uid;
      this.w = this.word([60, 70, 150, 70]);
      const { svg, root, W, H } = this.w;
      const defs = el('defs', {}, svg);
      const grad = el('linearGradient', { id: id + 'g', x1: 0, y1: 0, x2: 0, y2: 1, gradientUnits: 'userSpaceOnUse' }, defs);
      grad.setAttribute('y1', H + 8); grad.setAttribute('y2', H + 120);
      el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 1 }, grad);
      el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 }, grad);
      const mask = el('mask', { id: id + 'm', maskUnits: 'userSpaceOnUse', x: -400, y: -400, width: W + 800, height: H + 800 }, defs);
      el('rect', { x: -400, y: -400, width: W + 800, height: H + 408, fill: '#fff' }, mask);
      el('rect', { x: -400, y: H + 8, width: W + 800, height: 112, fill: `url(#${id}g)` }, mask);
      root.setAttribute('mask', `url(#${id}m)`);
      this.line = el('rect', { x: -40, y: H + 24, width: W + 80, height: 20, rx: 10, fill: 'currentColor' }, svg);
      this.sinkAt = -1e9; this.drag = null; this.dragY = 0; this.rel = -1e9; this.relFrom = 0;
      this.style.touchAction = 'pan-x';
      this.addEventListener('pointerdown', (e) => {
        this.drag = { y: e.clientY, moved: false }; this.setPointerCapture(e.pointerId);
      });
      this.addEventListener('pointermove', (e) => {
        if (!this.drag) return;
        const h = this.getBoundingClientRect().height;
        const d = (e.clientY - this.drag.y) / h;
        if (Math.abs(d) > 0.04) this.drag.moved = true;
        this.dragY = clamp(d * 1.4, -0.08, 1.05) * H;
      });
      const up = () => {
        if (!this.drag) return;
        if (!this.drag.moved) this.sinkAt = LaterWM.now();
        else { this.rel = LaterWM.now(); this.relFrom = this.dragY; }
        this.drag = null; this.dragY = 0;
      };
      this.addEventListener('pointerup', up);
      this.addEventListener('pointercancel', up);
      this.doneMs = 2600;
    }
    render(t, T) {
      const { letters: L, H, W } = this.w, n = L.length, st = this.state;
      const N = LaterWM.now();
      let lineCol = 'currentColor', lineO = 0.42 + 0.25 * this.hover, ext = 60 + 50 * this.hover, lineH = 20;
      for (const o of L) {
        let dy = 0;
        if (st === 'idle' && o.i === n - 1) {
          const p = T % 11000 - 5200;
          dy = p < 0 ? 0 : p < 1500 ? H * 1.02 * ease(p / 1500) : p < 3900 ? H * 1.02 : H * 1.02 * (1 - out((p - 3900) / 1100)) - 26 * bump((p - 4700) / 700);
        } else if (st === 'working') {
          dy = 70 + 46 * Math.sin((T / 2800) * Math.PI * 2 - o.i * 0.62);
        } else if (st === 'done') {
          dy = -90 * out(t / 500) * (1 - ease((t - 1800) / 700)) + 0;
          lineCol = 'var(--wm-done)'; lineO = 1; const k = out(t / 700) * (1 - ease((t - 1900) / 600)); ext = 60 + 160 * k; lineH = 20 + 26 * k;
        }
        // tap: the word sinks and comes back
        const s = N - this.sinkAt;
        if (s < 3200 && !this.still) {
          const d = o.i * 70;
          dy += s < 900 + d ? H * 1.05 * ease((s) / (900 + d)) : s < 1700 ? H * 1.05 : H * 1.05 * (1 - out((s - 1700 - d * 0.5) / 900));
        }
        // drag and release
        if (this.drag) dy += this.dragY * (1 - o.i * 0.04);
        else if (N - this.rel < 1600 && !this.still) dy += this.relFrom * spring((N - this.rel - o.i * 30) / 900, 9, 0.38);
        o.inner.setAttribute('transform', `translate(0 ${dy.toFixed(1)})`);
      }
      this.line.setAttribute('fill', lineCol);
      this.line.style.opacity = lineO;
      this.line.setAttribute('x', -ext); this.line.setAttribute('height', lineH); this.line.setAttribute('width', W + 2 * ext);
    }
  }
  customElements.define('wm-horizon', WmHorizon);
})();
