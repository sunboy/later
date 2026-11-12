/* <wm-clock> The t keeps time. The cross-bar of the t is a hand on a pivot at the stem.
   It points forward (three o'clock: later) at rest.
   idle: every 12 s the hand moves on one minute with a small mechanical tick, then eases home.
   working: the hand sweeps round, passing behind the a.  done: one quick turn, a citrus face
   shows behind the pivot, and the hand lands home with one overshoot.  hover: the hand points at you.
   The other letters carry a knockout edge in the surface colour, so the hand can pass behind them. */
(function () {
  const { el, ease, spring, clamp, out, bump, Base } = window.LaterWM;

  class WmClock extends Base {
    build() {
      this.w = this.word([170, 60, 90, 60], { splitT: true });
      const { svg, root, letters } = this.w;
      this.t = letters.find((o) => o.bar);
      const t = this.t;
      if (!t) return;
      this.cx = t.x + t.pivot[0]; this.cy = t.pivot[1];
      // move the bar to the back so it can pass behind the other letters
      const hand = el('g', {}, root);
      root.insertBefore(hand, root.firstChild);
      hand.appendChild(t.bar);
      t.bar.setAttribute('transform', `translate(${t.x} 0)`);
      this.hand = hand;
      this.face = el('circle', { cx: this.cx, cy: this.cy, r: 330, fill: 'var(--wm-done)' }, root);
      root.insertBefore(this.face, hand);
      for (const o of letters) if (o.path && o.ch !== 't') {
        o.path.setAttribute('stroke', 'var(--wm-ground)');
        o.path.setAttribute('stroke-width', 40);
        o.path.setAttribute('paint-order', 'stroke');
        o.path.setAttribute('stroke-linejoin', 'round');
      }
      this.ang = 0; this.doneMs = 2400;
    }
    render(t, T, dt) {
      if (!this.t) return;
      const st = this.state;
      let a = 0, faceS = 0;
      if (st === 'idle') {
        const p = T % 12000 - 6400;
        a = p < 0 ? 0 : p < 160 ? 6 * out(p / 160) + 2.2 * bump(p / 160) : p < 2200 ? 6 + 0.8 * spring((p - 160) / 400, 14, 0.3) * ((p - 160) < 400 ? 1 : 0) : 6 * (1 - ease((p - 2200) / 1400));
      } else if (st === 'working') {
        a = ((T / 3600) % 1) * 360;
      } else if (st === 'done') {
        const u = clamp(t / 760);
        a = 360 * out(u) - 9 * Math.sin(clamp((t - 760) / 500) * Math.PI) * (t > 760 && t < 1260 ? 1 : 0);
        faceS = out(t / 380) * (1 - ease((t - 1700) / 500));
      }
      // hover: point toward the pointer, clockwise angle from three o'clock
      if (this.hover > 0.02 && st !== 'done') {
        const r = this.w.svg.getBoundingClientRect();
        const vb = this.w.svg.viewBox.baseVal;
        const x = vb.x + this.px * vb.width, y = vb.y + this.py * vb.height;
        let target = (Math.atan2(y - this.cy, x - this.cx) * 180) / Math.PI;
        let cur = a % 360; if (cur > 180) cur -= 360;
        let diff = ((target - cur + 540) % 360) - 180;
        a = cur + diff * this.hover;
      }
      this.hand.setAttribute('transform', `rotate(${a.toFixed(2)} ${this.cx} ${this.cy})`);
      this.face.setAttribute('r', (300 * faceS).toFixed(1));
      this.face.style.opacity = faceS > 0.01 ? 1 : 0;
    }
  }
  customElements.define('wm-clock', WmClock);
})();
