/** The wordmark recedes letter by letter: wide and heavy (now) to narrow and light (later). */
const STEPS: [string, number, number][] = [['L', 125, 860], ['a', 112, 700], ['t', 100, 560], ['e', 88, 420], ['r', 75, 300]];
export function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <h1 className="mark" aria-label="Later" style={{ fontSize: size }}>
      {STEPS.map(([ch, w, g]) => (
        <span key={ch} aria-hidden="true" style={{ fontVariationSettings: `'wdth' ${w}`, fontWeight: g }}>{ch}</span>
      ))}
    </h1>
  );
}
