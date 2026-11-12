/* Charts and schematics, drawn here in SVG. Every mark is placed by one scale; text takes the block's own tokens. */
import type { Placed, RouteData, SeriesData, Size, Thumb } from '../spec/types';
import { fmt, useWidth } from '../format';
import { Icon } from '../icons';

const H: Record<Size, number> = { small: 64, medium: 132, large: 188 };

function niceStep(range: number, count: number) {
  const raw = range / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
}
const short = (v: number, f: SeriesData['format']) => {
  if (f === 'money') { const p = v / 100; return p >= 1000 ? `£${(p / 1000).toFixed(p % 1000 === 0 ? 0 : 1)}k` : `£${Math.round(p)}`; }
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v));
};

export function SeriesChart({ b }: { b: Placed & { type: 'series' } }) {
  const d = b.data;
  const [ref, w] = useWidth<HTMLDivElement>();
  const spark = b.size === 'small';
  const h = H[b.size];
  const padL = spark ? 0 : 36, padR = spark ? 4 : 10, padT = spark ? 6 : 14, padB = spark ? 4 : 22;
  const all = [...d.points.map(p => p.y), ...(d.compare?.points.map(p => p.y) ?? [])];
  const lo0 = d.kind === 'bars' ? 0 : Math.min(...all), hi0 = Math.max(...all);
  const step = niceStep(Math.max(1, hi0 - lo0), spark ? 2 : 3);
  const lo = d.kind === 'bars' ? 0 : Math.floor(lo0 / step) * step;
  const hi = Math.max(lo + step, Math.ceil(hi0 / step) * step);
  const iw = Math.max(10, w - padL - padR), ih = h - padT - padB;
  const n = d.points.length;
  const bw = d.kind === 'bars' ? Math.min(28, (iw / n) * 0.62) : 0;
  const X = (i: number) => d.kind === 'bars' ? padL + (iw / n) * (i + 0.5) : padL + (n === 1 ? iw / 2 : (iw * i) / (n - 1));
  const Y = (v: number) => padT + ih - ((v - lo) / (hi - lo)) * ih;
  const line = (pts: { y: number }[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
  const area = (pts: { y: number }[]) => `${line(pts)} L${X(n - 1).toFixed(1)} ${(padT + ih).toFixed(1)} L${X(0).toFixed(1)} ${(padT + ih).toFixed(1)} Z`;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(v);
  const last = d.points[n - 1];
  const mi = d.mark ? d.points.findIndex(p => p.x === d.mark!.x) : -1;
  const gap = n > 1 ? iw / (d.kind === 'bars' ? n : n - 1) : iw;
  const stride = Math.max(1, Math.ceil(52 / gap));
  const showX = spark ? [] : d.points.map((_, i) => i).filter(i => d.kind === 'bars' ? i % stride === 0 : (n - 1 - i) % stride === 0);
  const sig = `${n}-${d.kind}`;
  return (
    <div ref={ref} className={`chart ${spark ? 'spark' : ''}`}>
      {w > 0 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${d.label}: ${d.points.map(p => `${p.x} ${fmt(p.y, d.format)}`).join(', ')}`}>
          {!spark && ticks.map(t => (
            <g key={t} className="tick">
              <line x1={padL} x2={w - padR} y1={Y(t)} y2={Y(t)} />
              <text x={padL - 8} y={Y(t) + 3.5} textAnchor="end">{short(t, d.format)}</text>
            </g>
          ))}
          {d.kind === 'line' ? (
            <g key={sig}>
              {d.compare && <path className="cmp" style={{ d: `path("${line(d.compare.points)}")` }} />}
              <path className="area" style={{ d: `path("${area(d.points)}")` }} />
              <path className="ln" style={{ d: `path("${line(d.points)}")` }} />
              {!spark && d.points.map((p, i) => i === n - 1 || i === mi ? null : <circle key={i} className="pt" style={{ cx: X(i), cy: Y(p.y) }} r={2.2} />)}
              <circle className="end" style={{ cx: X(n - 1), cy: Y(last.y) }} r={spark ? 3 : 4.5} />
            </g>
          ) : (
            <g key={sig}>
              {d.points.map((p, i) => {
                const c = d.compare?.points[i];
                return (
                  <g key={p.x}>
                    {c && <rect className="bar cmp" x={X(i) - bw / 2 - 3} width={bw} rx={3} style={{ y: Y(c.y), height: Math.max(0, padT + ih - Y(c.y)) }} />}
                    <rect className={`bar ${i === n - 1 ? 'hot' : ''} ${i === mi ? 'marked' : ''}`} x={X(i) - bw / 2 + (c ? 3 : 0)} width={bw} rx={3} style={{ y: Y(p.y), height: Math.max(0, padT + ih - Y(p.y)) }} />
                  </g>
                );
              })}
            </g>
          )}
          {mi >= 0 && !spark && (
            <g className="mark">
              <line x1={X(mi)} x2={X(mi)} y1={padT - 4} y2={padT + ih} />
              <text x={Math.min(Math.max(X(mi), padL + 40), w - padR - 40)} y={padT - 5} textAnchor="middle">{d.mark!.label}</text>
            </g>
          )}
          {showX.map(i => (
            <text key={i} className="xl" x={X(i)} y={h - 6} textAnchor={d.kind === 'bars' ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>{d.points[i].x}</text>
          ))}
        </svg>
      )}
    </div>
  );
}

/* A route as a schematic: stops on a drawn line, legs labelled with how and how long. No tiles, no third party. */
export function RouteMap({ d, size }: { d: RouteData; size: Size }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const h = size === 'large' ? 172 : size === 'medium' ? 150 : 112;
  const n = d.stops.length;
  const pad = 14;
  const mid = h * 0.5;
  // stops sit on a gently winding line; labels alternate above and below so neighbours never collide
  const P = d.stops.map((_, i) => ({ x: pad + ((w - pad * 2) * i) / Math.max(1, n - 1), y: mid + (i % 2 ? -1 : 1) * h * 0.06 }));
  let path = '';
  P.forEach((p, i) => {
    if (!i) { path = `M${p.x} ${p.y}`; return; }
    const a = P[i - 1], mx = (a.x + p.x) / 2;
    path += ` C${mx} ${a.y} ${mx} ${p.y} ${p.x} ${p.y}`;
  });
  const total = d.legs.reduce((s, l) => s + l.minutes, 0);
  return (
    <div ref={ref} className="route">
      {w > 0 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Route: ${d.stops.map(s => `${s.name} ${s.time}`).join(', then ')}. ${d.showTimes ? `${total} minutes travelling.` : ''}`}>
          <g className="streets">
            {[0.16, 0.84].map(f => <line key={f} x1={0} x2={w} y1={h * f} y2={h * f + 10} />)}
            {[0.2, 0.45, 0.7, 0.93].map(f => <line key={f} x1={w * f} x2={w * f - 16} y1={0} y2={h} />)}
          </g>
          <path className="rt-under" d={path} />
          <path className="rt" d={path} />
          {d.stops.map((s, i) => {
            const p = P[i], up = i % 2 === 1;
            const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
            const dx = i === 0 ? -6 : i === n - 1 ? 6 : 0;
            return (
              <g key={s.id} className={`stop k-${s.kind}`}>
                <circle cx={p.x} cy={p.y} r={s.kind === 'stop' ? 6 : 7} />
                <text x={p.x + dx} y={up ? p.y - 30 : p.y + 26} textAnchor={anchor} className="t">{s.time}</text>
                <text x={p.x + dx} y={up ? p.y - 16 : p.y + 40} textAnchor={anchor}>{s.name}</text>
              </g>
            );
          })}
          {d.legs.map((l, i) => {
            const a = P[i], b = P[i + 1]; if (!a || !b) return null;
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            return (
              <g key={i} className={`leg ${d.showTimes ? 'on' : ''}`} transform={`translate(${mx} ${my})`}>
                <rect x={-23} y={-10} width={46} height={20} rx={10} />
                <foreignObject x={-19} y={-7} width={14} height={14}><Icon name={l.mode} size={14} stroke={2} /></foreignObject>
                <text x={6} y={4} textAnchor="middle">{l.minutes}′</text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/* Thumbnails are drawn, not fetched: illustrations stand in for photos in this prototype. */
export function ThumbArt({ kind }: { kind: Thumb }) {
  const common = { viewBox: '0 0 120 80', preserveAspectRatio: 'xMidYMid slice', className: `thumb th-${kind}`, 'aria-hidden': true } as const;
  switch (kind) {
    case 'mill': return (<svg {...common}><rect className="sky" width="120" height="80" /><path className="hill" d="M0 58 Q40 46 70 54 T120 50 V80 H0Z" /><path className="bld" d="M30 60 V34 L48 22 L66 34 V60Z" /><rect className="win" x="40" y="38" width="6" height="8" rx="1" /><rect className="win" x="51" y="38" width="6" height="8" rx="1" /><circle className="wheel" cx="74" cy="56" r="11" /><path className="spoke" d="M74 45 V67 M63 56 H85 M66 48 L82 64 M82 48 L66 64" /><path className="water" d="M0 70 Q15 67 30 70 T60 70 T90 70 T120 70" /></svg>);
    case 'boathouse': return (<svg {...common}><rect className="sky" width="120" height="80" /><path className="bld" d="M28 52 V34 L52 20 L76 34 V52Z" /><rect className="door" x="44" y="38" width="16" height="14" rx="1" /><rect className="deck" x="20" y="52" width="80" height="4" /><path className="water" d="M0 62 Q15 59 30 62 T60 62 T90 62 T120 62" /><path className="water" d="M0 71 Q15 68 30 71 T60 71 T90 71 T120 71" /><path className="boat" d="M84 58 H108 L102 64 H90Z" /></svg>);
    case 'garden': return (<svg {...common}><rect className="sky" width="120" height="80" /><path className="hill" d="M0 60 Q60 48 120 60 V80 H0Z" /><circle className="tree" cx="26" cy="40" r="13" /><rect className="trunk" x="24" y="50" width="4" height="12" /><circle className="tree" cx="96" cy="36" r="15" /><rect className="trunk" x="94" y="48" width="4" height="14" /><path className="bld" d="M48 60 V42 L60 34 L72 42 V60Z" /><path className="lights" d="M14 24 Q60 36 106 22" /></svg>);
    case 'ryokan': return (<svg {...common}><rect className="sky" width="120" height="80" /><path className="hill" d="M0 50 L30 30 L55 46 L80 26 L120 52 V80 H0Z" /><path className="roof" d="M24 46 Q60 34 96 46 L88 50 H32Z" /><rect className="bld" x="34" y="50" width="52" height="16" /><rect className="win" x="40" y="54" width="10" height="8" /><rect className="win" x="70" y="54" width="10" height="8" /></svg>);
    case 'flat': return (<svg {...common}><rect className="sky" width="120" height="80" /><rect className="bld" x="36" y="16" width="48" height="56" /><g className="win">{[0, 1, 2, 3].map(r => [0, 1, 2].map(c => <rect key={`${r}${c}`} x={42 + c * 14} y={22 + r * 12} width="8" height="7" />))}</g><rect className="hill" y="70" width="120" height="10" /></svg>);
    case 'van': return (<svg {...common}><rect className="sky" width="120" height="80" /><rect className="hill" y="62" width="120" height="18" /><path className="bld" d="M18 34 H74 V60 H18Z" /><path className="door" d="M74 40 H90 L100 50 V60 H74Z" /><circle className="wheel" cx="34" cy="62" r="7" /><circle className="wheel" cx="86" cy="62" r="7" /></svg>);
  }
}
