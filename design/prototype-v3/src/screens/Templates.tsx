import { useState } from 'react';
import { BorderBeam } from 'border-beam';
import { BotAvatar } from 'bot-avatars';
import { MORE_TEMPLATES, TEMPLATE } from '../data';
import { Icon } from '../icons';
import { usePrefersReducedMotion } from '../motion';

export function Templates() {
  const reduced = usePrefersReducedMotion();
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(MORE_TEMPLATES);
  const [found, setFound] = useState<string | null>(null);
  const [started, setStarted] = useState<null | 'start' | 'remix'>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim().toLowerCase(); if (!term) return;
    setSearching(true); setFound(null);
    // a gallery search over git-hosted manifests takes a few seconds
    setTimeout(() => {
      const hit = MORE_TEMPLATES.filter(t => (t.name + t.now + t.next + t.later + t.by).toLowerCase().includes(term));
      setResults(hit.length ? hit : MORE_TEMPLATES);
      setFound(hit.length ? `${hit.length} ${hit.length === 1 ? 'setup matches' : 'setups match'} “${q.trim()}”.` : `Nothing for “${q.trim()}” yet. Here are the most used.`);
      setSearching(false);
    }, 3400);
  };

  return (
    <div className="screen">
      <div className="scroll">
        <div className="tp-head">
          <h1>Templates</h1>
          <p>Start a Space from someone else’s setup. Each one is described by its rhythm.</p>
        </div>
        <form className="search" onSubmit={submit} role="search">
          <BorderBeam size="line" colorVariant="colorful" theme="dark" active={searching && !reduced}>
            <label className="search-box" aria-busy={searching}>
              <Icon name="search" size={18} />
              <input id="tpl-q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Moving, a big birthday, tax" aria-label="Search templates" />
            </label>
          </BorderBeam>
          <p className="search-state" role="status">{searching ? 'Looking through the gallery' : found ?? ''}</p>
        </form>

        <article className="feature bezel" aria-labelledby="tpl-h">
          <div className="well">
            <span className="by">{TEMPLATE.byLine}</span>
            <h2 id="tpl-h">{TEMPLATE.name}</h2>
            <p className="strap">{TEMPLATE.strap}</p>
            <dl className="rhythm">
              <div><dt className="h-now">Now</dt><dd>{TEMPLATE.now}</dd></div>
              <div><dt className="h-next">Next</dt><dd>{TEMPLATE.next}</dd></div>
              <div><dt className="h-later">Later</dt><dd>{TEMPLATE.later}</dd></div>
            </dl>
            <div className="crew">
              {TEMPLATE.agents.map(a => (
                <div key={a.name}>
                  {/* not running yet: a still bot */}
                  <BotAvatar className="bot" type={a.avatar} size={32} paused aria-hidden="true" />
                  <span>{a.name}<small>{a.job}</small></span>
                </div>
              ))}
            </div>
            <dl className="facts">
              <dt>Reads</dt><dd>{TEMPLATE.reads}</dd>
              <dt>Spend cap</dt><dd>{TEMPLATE.cap}</dd>
              <dt>Starts</dt><dd>{TEMPLATE.starts}</dd>
            </dl>
            {started
              ? <p className="started" role="status"><Icon name="check" size={16} />{started === 'start' ? 'Moving house is set up, paused. Switch routines on when you are ready.' : 'A copy is open for you to change. Nothing runs yet.'}</p>
              : <div className="tp-acts">
                  <button className="btn primary" onClick={() => setStarted('start')}>Start a Space from this</button>
                  <button className="btn" onClick={() => setStarted('remix')}>Remix</button>
                </div>}
          </div>
        </article>

        <section className="more" aria-labelledby="more-h">
          <h3 id="more-h">More setups</h3>
          {results.map(t => (
            <div key={t.name} className="trow">
              <div style={{ minWidth: 0 }}>
                <b>{t.name}</b><small>by {t.by}</small>
                <div className="mini"><span>Now</span><span>{t.now}</span><span>Next</span><span>{t.next}</span><span>Later</span><span>{t.later}</span></div>
              </div>
              <button className="btn sm">Look</button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
