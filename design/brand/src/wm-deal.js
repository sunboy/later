/* <wm-deal> The hand. The letters are cards held in one hand, like Keep.
   idle: every 10 s the hand fans open a few degrees and squares up again.
   working: the hand stays slightly open and the cards riffle one after another, card faces showing.
   done: the hand squares up with a tap on the table and a citrus card slides up behind it and tucks away.
   hover: the hand fans open and the card under the pointer lifts.  tap: the word is dealt again from the L. */
(function () {
  const { el, ease, spring, clamp, out, bump, lerp, Base } = window.LaterWM;

  class WmDeal extends Base {
    build() {
      this.w = this.word([110, 90, 110, 90], {
        parent: (i, root) => el('g', {}, root),
      });
      const { svg, root, letters, W, H } = this.w;
      this.pivot = [W / 2, H + 2400];
      // a card face behind each letter, visible only while the hand is in motion
      for (const o of letters) {
        o.card = el('rect', { x: -44, y: -70, width: o.w + 88, height: H + 140, rx: 70, fill: 'var(--wm-card)', stroke: 'var(--wm-line)', 'stroke-width': 6 }, o.g);
        o.g.insertBefore(o.card, o.inner);
        o.g.removeAttribute('transform');
        o.g.setAttribute('class', 'ltr');
      }
      this.pop = el('rect', { x: W * 0.62, y: -60, width: 560, height: H + 120, rx: 70, fill: 'var(--wm-done)' }, svg);
      svg.insertBefore(this.pop, root);
      this.dealAt = -1e9;
      this.addEventListener('click', () => { this.dealAt = LaterWM.now(); });
      this.doneMs = 2400;
    }
    render(t, T) {
      const { letters: L, W, H } = this.w, n = L.length, st = this.state;
      const [cx, cy] = this.pivot;
      let fan = 0, faces = 0, popY = 0, popO = 0, tap = 0;
      if (st === 'idle') {
        const p = T % 10000 - 5600;
        fan = 1.7 * bump(p / 1900) ** 1.4;
        faces = fan / 1.7 * 0.0;
      } else if (st === 'working') {
        fan = 1.15 + 0.25 * Math.sin(T / 900);
        faces = 1;
      } else if (st === 'done') {
        fan = 1.3 * (1 - out(t / 260));
        tap = 22 * bump((t - 220) / 260);
        faces = clamp(1 - t / 500);
        popY = -190 * out((t - 260) / 500) * (1 - ease((t - 1500) / 700));
        popO = clamp((t - 200) / 200) * (1 - clamp((t - 2000) / 300));
      }
      fan += 1.6 * this.hover;
      faces = Math.max(faces, this.hover * 0.85);
      const d = LaterWM.now() - this.dealAt;
      const dealing = d < 2000 && !this.still;
      if (dealing) faces = Math.max(faces, 1 - clamp((d - 1350) / 500));
      for (const o of L) {
        const mid = (n - 1) / 2;
        let ang = (o.i - mid) * fan, dx = o.x, dy = tap, lift = 0;
        if (st === 'working') lift = -60 * bump(((T / 1700) % 1.6) - o.i * 0.16);
        if (this.hover > 0.01) {
          const hx = this.px * (W + 180) - 90;
          const near = Math.max(0, 1 - Math.abs(hx - (o.x + o.w / 2)) / (o.w * 0.9));
          lift -= 70 * near * this.hover;
        }
        if (dealing) {
          const u = clamp((d - o.i * 170) / 480);
          const e = out(u);
          dx = lerp(0, o.x, e) + 0;
          ang = lerp(-9 + o.i * 1.5, ang, e) + 5 * spring(u * 1.4, 10, 0.45) * (u > 0 ? 0 : 0);
          lift += -140 * bump(u) + (u < 1 ? 0 : 0);
          if (u >= 1) ang += -2.5 * spring(clamp((d - o.i * 170 - 480) / 500), 10, 0.4) * (d - o.i * 170 - 480 < 500 ? 1 : 0);
        }
        o.g.setAttribute('transform', `rotate(${ang.toFixed(3)} ${cx} ${cy}) translate(${dx.toFixed(1)} ${(dy + lift).toFixed(1)})`);
        o.card.style.opacity = faces.toFixed(3);
      }
      this.pop.setAttribute('transform', `translate(${(-popY * 0.5).toFixed(1)} ${popY.toFixed(1)}) rotate(${(-popY / 150 * 9).toFixed(2)} ${W * 0.62 + 280} ${H + 60})`);
      this.pop.style.opacity = popO;
    }
  }
  customElements.define('wm-deal', WmDeal);
})();
