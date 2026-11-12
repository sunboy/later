/* The spec beside the view: what the agent sent, block by block, and what the client changed. */
import { useEffect, useRef } from 'react';
import type { Clamp, Issue } from './spec/types';

const ind = (s: string, n: number) => s.split('\n').map(l => ' '.repeat(n) + l).join('\n');

export function SpecJson({ spec, hot, onHot, clamps, issues, from }: {
  spec: unknown; hot: string | null; onHot: (id: string | null) => void; clamps: Clamp[]; issues?: Issue[]; from: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const b = box.current; if (!b || !hot) return;
    const el = b.querySelector<HTMLElement>(`[data-sid="${CSS.escape(hot)}"]`); if (!el) return;
    const top = el.offsetTop - b.offsetTop, bottom = top + el.offsetHeight;
    if (top < b.scrollTop + 8 || bottom > b.scrollTop + b.clientHeight - 8) b.scrollTo({ top: Math.max(0, top - 24), behavior: 'smooth' });
  }, [hot]);
  const s = (spec ?? {}) as Record<string, unknown>;
  const { blocks, ...rest } = s;
  const head = JSON.stringify(rest, null, 2).replace(/\n}$/, ',');
  const list = Array.isArray(blocks) ? blocks : [];
  const bad = new Set((issues ?? []).map(i => /^view\.blocks\[(\d+)\]/.exec(i.path)?.[1]).filter(Boolean).map(Number));
  const clamped = new Set(clamps.map(c => /^view\.blocks\[(\d+)\]/.exec(c.path)?.[1]).filter(Boolean).map(Number));
  return (
    <div className="spec">
      <p className="spec-from">{from}</p>
      <div className="spec-code" ref={box} onMouseLeave={() => onHot(null)}>
        <pre className="code">{head}{'\n  "blocks": ['}</pre>
        {list.map((b, i) => {
          const id = (b as { id?: string }).id ?? String(i);
          return (
            <pre key={i} data-sid={id} className={`code seg ${hot === id ? 'hot' : ''} ${bad.has(i) ? 'bad' : ''} ${clamped.has(i) ? 'clamped' : ''}`}
              onMouseEnter={() => onHot(id)}>{ind(JSON.stringify(b, null, 2), 4)}{i < list.length - 1 ? ',' : ''}</pre>
          );
        })}
        <pre className="code">{'  ]\n}'}</pre>
      </div>
      {issues && issues.length > 0 && (
        <div className="spec-notes bad">
          <p><b>Refused.</b> The view on screen did not change.</p>
          <ul>{issues.map((x, i) => <li key={i}><span className="code">{x.path.replace(/^view\./, '')}</span><em>{x.code}</em>{x.message}</li>)}</ul>
        </div>
      )}
      {clamps.length > 0 && (
        <div className="spec-notes">
          <p><b>Clamped by the app.</b> Accepted, with these hints overruled.</p>
          <ul>{clamps.map((c, i) => <li key={i}><span className="code">{c.path.replace(/^view\./, '')}</span>{c.message}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
