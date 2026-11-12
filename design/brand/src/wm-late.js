/* <wm-late> Late arrival. The letters settle one after another and the r is always a beat behind.
   idle: every 9 s the word nods left to right; the r follows late and wobbles as it lands.
   working: a slow ripple runs through the word; the r lags it.  done: for once the r is on time:
   all five land together and a citrus rule draws under them.  hover: the word leans in, the r catches
   up late.  tap: the word arrives again, letter by letter. */
(function () {
  const { el, bump, spring, clamp, out, Base } = window.LaterWM;
  const A = 46;                       // lift, in glyph units (cap height 690)
  const LATE = 420;                   // how far behind the r is, ms

  class WmLate extends Base {
    build() {
      this.w = this.word([90, 40, 120, 40]);
      const { W, H } = this.w;
      this.rule = el('rect', { x: 0, y: H + 46, height: 34, width: W, rx: 17, fill: 'var(--wm-done)' }, this.w.svg);
      this.w.svg.insertBefore(this.rule, this.w.root);
      this.arrive = -1e9;
      this.addEventListener('click', () => { this.arrive = LaterWM.now(); });
      this.doneMs = 2600;
    }
    render(t, T) {
      const L = this.w.letters, n = L.length, st = this.state;
      const sinceArrive = LaterWM.now() - this.arrive;
      let ruleW = 0, ruleO = 0;
      for (const o of L) {
        const late = o.i === n - 1;
        const lag = o.i * 95 + (late ? LATE : 0);
        let dy = 0, rot = 0, op = 1;
        if (st === 'idle') {
          const p = (T % 9000) - 5200 - lag;
          dy = -A * bump(p / 520);
          if (late && p > 520) dy += A * 0.5 * (spring((p - 520) / 700, 11, 0.35) * Math.sin(clamp((p - 520) / 700) * Math.PI));
          rot = late ? -2.2 * bump(p / 700) : 0;
        } else if (st === 'working') {
          const ph = (T / 1500) * Math.PI * 2 - o.i * 0.75 - (late ? 1.4 : 0);
          dy = -A * 0.55 * Math.max(0, Math.sin(ph)) ** 2;
        } else if (st === 'done') {
          const u = t / 560;
          dy = u < 0.45 ? -A * 1.3 * out(u / 0.45) : -A * 1.3 * (1 - out((u - 0.45) / 0.55)) + A * 0.25 * bump((u - 1) / 0.35);
          ruleW = out((t - 380) / 620); ruleO = clamp(1 - (t - 2000) / 500);
        }
        // hover: lean in; the r follows on a slower spring (see Base: hover is eased; we lag the r further)
        if (!this.hl) this.hl = new Array(n).fill(0);
        const k = late ? 0.05 : 0.22;
        this.hl[o.i] += (this.hover - this.hl[o.i]) * (this.still ? 1 : k);
        dy -= A * 0.42 * this.hl[o.i];
        rot -= 3 * this.hl[o.i];
        // tap: arrive again
        if (sinceArrive < 2200 && !this.still) {
          const u = (sinceArrive - lag * 1.25) / 520;
          if (u < 1) { dy += -A * 4 * (1 - out(u)); op = clamp(u * 2.2); }
          else dy += A * 0.35 * spring((u - 1) * 1.4, 10, 0.4) * (u < 2.6 ? 1 : 0) * Math.sin((u - 1) * 6);
        }
        o.inner.setAttribute('transform', `translate(0 ${dy.toFixed(1)}) rotate(${rot.toFixed(2)} ${o.w / 2} ${this.w.H})`);
        o.inner.style.opacity = op;
      }
      this.rule.setAttribute('width', (this.w.W * ruleW).toFixed(1));
      this.rule.style.opacity = st === 'done' ? ruleO : 0;
    }
  }
  customElements.define('wm-late', WmLate);
})();
