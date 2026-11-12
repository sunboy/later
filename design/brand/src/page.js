/* Page wiring: theme, motion, per-concept state buttons, the pairing switcher. */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  // theme: system / light / dark
  const applyTheme = (v) => {
    if (v === 'light' || v === 'dark') document.documentElement.setAttribute('data-theme', v);
    else document.documentElement.removeAttribute('data-theme');
    $$('#theme button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    document.dispatchEvent(new Event('wm-theme'));
  };
  $$('#theme button').forEach((b) => b.addEventListener('click', () => { store.set('lt-theme', b.dataset.v); applyTheme(b.dataset.v); }));
  applyTheme(store.get('lt-theme') || 'system');

  // motion: on / still (the components also follow prefers-reduced-motion by themselves)
  const applyMotion = (still) => {
    $$('wm-ball,wm-late,wm-horizon,wm-deal,wm-clock').forEach((e) => {
      if (e.hasAttribute('data-fixed')) return;
      if (still) e.setAttribute('still', ''); else e.removeAttribute('still');
      e.frame && e.frame(LaterWM.now());
    });
    $$('#motion button').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.v === 'still') === still)));
  };
  $$('#motion button').forEach((b) => b.addEventListener('click', () => applyMotion(b.dataset.v === 'still')));
  if (LaterWM.reduced.matches) { $('#motion-note').hidden = false; }

  // concept state buttons drive every instance of that concept (stage, header, lockup)
  $$('.concept, .hero').forEach((c) => {
    const tag = c.dataset.tag, els = $$(tag, c);
    const seg = $('.seg', c);
    if (!seg) return;
    const set = (st) => {
      els.forEach((e) => { e.dataset.after = 'idle'; e.setAttribute('state', st); if (st !== 'done') e.replay(); });
      $$('button', seg).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.st === st)));
    };
    $$('button', seg).forEach((b) => b.addEventListener('click', () => set(b.dataset.st)));
    els.forEach((e) => e.addEventListener('wm-state', () => {}));
    const rp = $('.replay', c);
    if (rp) rp.addEventListener('click', () => {
      const cur = $('button[aria-pressed="true"]', seg).dataset.st;
      els.forEach((e) => { if (cur === 'done') { e.setAttribute('state', 'idle'); e.setAttribute('state', 'done'); } else e.replay(); });
    });
    // when done finishes, the buttons follow back to idle
    new MutationObserver(() => {
      const st = els[0].getAttribute('state') || 'idle';
      $$('button', seg).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.st === st)));
    }).observe(els[0], { attributes: true, attributeFilter: ['state'] });
  });

  // pairing switcher
  const P = JSON.parse($('#pairings').textContent);
  const show = (id) => {
    const p = P.find((x) => x.id === id) || P[0];
    $$('.duo .mock').forEach((m) => {
      m.style.setProperty('--mf-display', p.display_stack);
      m.style.setProperty('--mf-text', p.text_stack);
      m.style.setProperty('--mw-display', p.display_weight);
      m.style.setProperty('--mv-display', p.display_variation || 'normal');
      m.style.setProperty('--mt-display', p.display_tracking || '0');
    });
    $$('.pairs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === p.id)));
    $('#pair-name').textContent = p.id + '. ' + p.label;
    $('#pair-char').textContent = p.character;
    $('#pair-weak').textContent = p.weakness;
    store.set('lt-pair', p.id);
  };
  $$('.pairs button').forEach((b) => b.addEventListener('click', () => show(b.dataset.id)));
  $$('.pairlist article').forEach((a) => {
    a.addEventListener('click', () => { show(a.dataset.id); $('#pairing').scrollIntoView({ behavior: LaterWM.reduced.matches ? 'auto' : 'smooth', block: 'start' }); });
    a.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); a.click(); } });
  });
  show(store.get('lt-pair') || $('.pairs').dataset.default);
})();
