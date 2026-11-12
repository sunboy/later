/* The spec beside the view: what the agent sent, block by block, and what the client changed. */
import { useEffect, useRef } from 'react';
import type { Clamp, Issue } from './spec/types';

/** JSON, pretty where it helps: short objects and arrays of plain values stay on one line. */
function oneLine(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(oneLine).join(', ') + ']';
  if (v && typeof v === 'object') {
    const e = Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== undefined);
    return e.length ? '{ ' + e.map(([k, x]) => `${JSON.stringify(k)}: ${oneLine(x)}`).join(', ') + ' }' : '{}';
  }
  return JSON.stringify(v) ?? 'null';
}
function pretty(v: unknown, pad = ''): string {
  const flat = oneLine(v);
  const nested = v && typeof v === 'object' && Object.values(v as object).some(x => x && typeof x === 'object' && Object.keys(x).length > 1);
  if (!v || typeof v !== 'object' || (flat.length + pad.length <= 66 && !nested)) return flat;
  const inner = pad + '  ';
  if (Array.isArray(v)) return '[\n' + v.map(x => inner + pretty(x, inner)).join(',\n') + '\n' + pad + ']';
  return '{\n' + Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== undefined).map(([k, x]) => `${inner}${JSON.stringify(k)}: ${pretty(x, inner)}`).join(',\n') + '\n' + pad + '}';
}

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
  const head = pretty(rest).replace(/\n}$/, ',');
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
              onMouseEnter={() => onHot(id)}>{'    ' + pretty(b, '    ')}{i < list.length - 1 ? ',' : ''}</pre>
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
