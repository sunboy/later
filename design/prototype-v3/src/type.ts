/// <reference types="vite/client" />
/** The type switcher. Display and text are two CSS tokens (--f-display, --f-text); a pairing sets both.
    If design/brand/type-options.json exists when the prototype is built, its pairings are used instead of these. */
export interface Pairing { id: string; name: string; display: string; text: string; href: string; note?: string }

const g = (fam: string, axes = 'wght@400..800') => `family=${fam.replace(/ /g, '+')}:${axes}`;
const css = (...f: string[]) => `https://fonts.googleapis.com/css2?${f.join('&')}&display=swap`;
const stack = (f: string) => `'${f}', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif`;

export const DEFAULT_PAIRINGS: Pairing[] = [
  { id: 'mona', name: 'Mona Sans', display: 'Mona Sans', text: 'Mona Sans', href: '', note: 'current' },
  { id: 'schibsted', name: 'Schibsted Grotesk', display: 'Schibsted Grotesk', text: 'Schibsted Grotesk', href: css(g('Schibsted Grotesk', 'wght@400..900')) },
  { id: 'familjen', name: 'Familjen + Hanken', display: 'Familjen Grotesk', text: 'Hanken Grotesk', href: css(g('Familjen Grotesk', 'wght@400..700'), g('Hanken Grotesk', 'wght@300..900')) },
  { id: 'fraunces', name: 'Fraunces + Albert Sans', display: 'Fraunces', text: 'Albert Sans', href: css(g('Fraunces', 'opsz,wght@9..144,300..900'), g('Albert Sans', 'wght@300..900')) },
  { id: 'gabarito', name: 'Gabarito + Wix Madefor', display: 'Gabarito', text: 'Wix Madefor Text', href: css(g('Gabarito', 'wght@400..900'), g('Wix Madefor Text', 'wght@400..800')) },
  { id: 'unbounded', name: 'Unbounded + Instrument', display: 'Unbounded', text: 'Instrument Sans', href: css(g('Unbounded', 'wght@300..900'), g('Instrument Sans', 'wght@400..700')) },
];

/* type-options.json from the designer, read at build time if present. Shape is accepted loosely:
   an array, or { pairings | options: [...] }, each with name and display/text as a family name or { family }. */
const found = import.meta.glob('../../brand/type-options.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const fam = (v: unknown): string => typeof v === 'string' ? v : v && typeof v === 'object' && 'family' in v ? String((v as { family: unknown }).family) : '';
function fromFile(): Pairing[] | null {
  const raw = Object.values(found)[0] as unknown;
  if (!raw) return null;
  const list = Array.isArray(raw) ? raw : (raw as { pairings?: unknown[]; options?: unknown[] }).pairings ?? (raw as { options?: unknown[] }).options;
  if (!Array.isArray(list)) return null;
  const out = list.map((o, i) => {
    const r = o as Record<string, unknown>;
    const display = fam(r.display ?? r.heading ?? r.displayFamily), text = fam(r.text ?? r.body ?? r.textFamily) || display;
    if (!display) return null;
    const href = typeof r.href === 'string' ? r.href : typeof r.googleFonts === 'string' ? r.googleFonts : typeof r.url === 'string' ? r.url
      : css(...[...new Set([display, text])].map(f => g(f, 'wght@400..700')));
    return { id: String(r.id ?? 'opt' + i), name: String(r.name ?? r.label ?? `${display} + ${text}`), display, text, href, note: typeof r.note === 'string' ? r.note : undefined };
  }).filter(Boolean) as Pairing[];
  return out.length ? [DEFAULT_PAIRINGS[0], ...out.filter(p => p.display !== 'Mona Sans')] : null;
}
export const PAIRINGS: Pairing[] = fromFile() ?? DEFAULT_PAIRINGS;
export const FROM_FILE = PAIRINGS !== DEFAULT_PAIRINGS;

export function applyPairing(p: Pairing) {
  if (p.href && !document.querySelector(`link[data-type="${p.id}"]`)) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = p.href; l.dataset.type = p.id; document.head.appendChild(l);
  }
  const r = document.documentElement.style;
  r.setProperty('--f-display', stack(p.display));
  r.setProperty('--f-text', stack(p.text));
  document.documentElement.dataset.type = p.id;
}
