/* Later wordmark core: glyphs, one shared clock, helpers. Every wordmark component is a custom element
   that reads `state` (idle | working | done) and `variant` (lower | upper), draws the custom letterforms
   from LATER_GLYPHS, and renders from a single time value so any frame can be reproduced.
   Colours come from CSS custom properties on the host: color (the letters), --wm-ground (the surface
   behind), --wm-done (citrus, used only for the done moment), --wm-line (quiet rules), --wm-card. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const G = window.LATER_GLYPHS;
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  const live = new Set();
  let offset = 0, frozen = null;

  const now = () => (frozen !== null ? frozen : performance.now() - offset);
  function tick() {
    const T = now();
    for (const c of live) if (c.visible) c.frame(T);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const out = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const bump = (x) => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x));
  /* damped spring from 1 to 0 over normalised time x (one or two small overshoots) */
  const spring = (x, k = 9, z = 0.42) => (x <= 0 ? 1 : Math.exp(-z * k * x) * Math.cos(k * x * Math.sqrt(1 - z * z)));
  const lerp = (a, b, t) => a + (b - a) * t;

  class Base extends HTMLElement {
    static get observedAttributes() { return ['state', 'variant', 'still']; }
    constructor() {
      super();
      this.visible = true;
      this.t0 = now();
      this.hover = 0; this.hoverT = 0; this.px = 0.5; this.py = 0.5;
    }
    get still() { return rm.matches || this.hasAttribute('still'); }
    get state() { return this.getAttribute('state') || 'idle'; }
    get set() { return G[this.getAttribute('variant') === 'upper' ? 'upper' : 'lower']; }
    connectedCallback() {
      if (!this.built) {
        this.built = true;
        this.setAttribute('role', 'img');
        if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Later');
        this.build();
        this.addEventListener('pointerenter', () => { this.hoverT = 1; });
        this.addEventListener('pointerleave', () => { this.hoverT = 0; });
        this.addEventListener('pointermove', (e) => {
          const r = this.getBoundingClientRect();
          this.px = (e.clientX - r.left) / r.width; this.py = (e.clientY - r.top) / r.height;
        });
        if ('IntersectionObserver' in window) {
          new IntersectionObserver((es) => { for (const e of es) this.visible = e.isIntersecting; }).observe(this);
        }
      }
      live.add(this);
      this.frame(now());
    }
    disconnectedCallback() { live.delete(this); }
    attributeChangedCallback(n, a, b) {
      if (!this.built) return;
      if (n === 'variant') { this.textContent = ''; this.build(); }
      this.t0 = now();
      if (n === 'state' && b === 'done') {
        clearTimeout(this._d);
        this._d = setTimeout(() => this.setAttribute('state', this.dataset.after || 'idle'), this.doneMs || 2800);
      }
      this.frame(now());
    }
    /* replay the current state from its start */
    replay(st) { if (st && st !== this.state) this.setAttribute('state', st); else { this.t0 = now(); if (this.state === 'done') this.attributeChangedCallback('state', 'done', 'done'); } }
    frame(T) {
      const dt = Math.min(64, T - (this._last || T)); this._last = T;
      const k = this.still ? 1 : 1 - Math.exp(-dt / 140);
      this.hover += (this.hoverT - this.hover) * k;
      this.render(this.still ? 0 : T - this.t0, this.still ? 0 : T, dt);
    }
    /* svg holding the word: returns { svg, letters: [{ g, ch, x, w, ... }] } */
    word(pad = [60, 60, 60, 60], opts = {}) {
      const S = this.set;
      const [pt, pr, pb, pl] = pad;
      const svg = el('svg', { viewBox: `${-pl} ${-pt} ${S.width + pl + pr} ${S.height + pt + pb}`, 'aria-hidden': 'true', focusable: 'false' });
      svg.style.cssText = 'display:block;height:100%;width:auto;overflow:visible';
      const root = el('g', {}, svg);
      const letters = S.letters.map((L, i) => {
        const g = el('g', { class: 'ltr' }, opts.parent ? opts.parent(i, root) : root);
        const inner = el('g', {}, g);
        const o = { g, inner, i, ch: L.ch, x: L.x, w: L.w, pivot: L.pivot };
        if (opts.splitT && L.stem) {
          o.stem = el('path', { d: L.stem, fill: 'currentColor' }, inner);
          o.bar = el('path', { d: L.bar, fill: 'currentColor' }, inner);
        } else {
          o.path = el('path', { d: L.d, fill: 'currentColor' }, inner);
        }
        g.setAttribute('transform', `translate(${L.x} 0)`);
        return o;
      });
      this.appendChild(svg);
      return { svg, root, letters, W: S.width, H: S.height };
    }
  }

  window.LaterWM = {
    NS, el, clamp, ease, out, bump, spring, lerp, Base, now,
    reduced: rm,
    /* verification hooks: freeze the shared clock at a time, or let it run again */
    freeze(ms) { frozen = ms; for (const c of live) c.frame(ms); },
    run() { if (frozen !== null) { offset = performance.now() - frozen; frozen = null; } },
    all: live,
  };
})();
