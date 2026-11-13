/// <reference types="vite/client" />
/** The type switcher. Display and text are two CSS tokens (--f-display, --f-text); a pairing sets both.
    If design/brand/type-options.json exists when the prototype is built, its pairings are used instead of these. */
export interface Pairing { id: string; name: string; display: string; text: string; href: string; note?: string; face?: { family: string; weight: number; src: string } }

const g = (fam: string, axes = 'wght@400..800') => `family=${fam.replace(/ /g, '+')}:${axes}`;
const css = (...f: string[]) => `https://fonts.googleapis.com/css2?${f.join('&')}&display=swap`;
const SERIF = ['Fraunces', 'Young Serif'];
const stack = (f: string) => SERIF.includes(f) ? `'${f}', Georgia, serif` : `'${f}', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif`;

export const DEFAULT_PAIRINGS: Pairing[] = [
  { id: 'mona', name: 'Mona Sans', display: 'Mona Sans', text: 'Mona Sans', href: '', note: 'current' },
  { id: 'schibsted', name: 'Schibsted Grotesk', display: 'Schibsted Grotesk', text: 'Schibsted Grotesk', href: css(g('Schibsted Grotesk', 'wght@400..900')) },
  { id: 'familjen', name: 'Familjen + Hanken', display: 'Familjen Grotesk', text: 'Hanken Grotesk', href: css(g('Familjen Grotesk', 'wght@400..700'), g('Hanken Grotesk', 'wght@300..900')) },
  { id: 'fraunces', name: 'Fraunces + Albert Sans', display: 'Fraunces', text: 'Albert Sans', href: css(g('Fraunces', 'opsz,wght@9..144,300..900'), g('Albert Sans', 'wght@300..900')) },
  { id: 'gabarito', name: 'Gabarito + Wix Madefor', display: 'Gabarito', text: 'Wix Madefor Text', href: css(g('Gabarito', 'wght@400..900'), g('Wix Madefor Text', 'wght@400..800')) },
  { id: 'unbounded', name: 'Unbounded + Instrument', display: 'Unbounded', text: 'Instrument Sans', href: css(g('Unbounded', 'wght@300..900'), g('Instrument Sans', 'wght@400..700')) },
];

/* type-options.json from the designer, read at build time if present. Shape is accepted loosely:
   an array, or { pairings | options: [...] }, each with name and display/text as a family name or { family }.
   The file's own stylesheet address is used when it gives one (googleFontsUrl, href, url), so single-weight
   families such as Young Serif load. A pairing with a local woff2 (Later Display) gets an @font-face from the file. */
const found = import.meta.glob('../../brand/type-options.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const woffs = import.meta.glob('../../brand/*.woff2', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const fam = (v: unknown): string => typeof v === 'string' ? v : v && typeof v === 'object' && 'family' in v ? String((v as { family: unknown }).family) : '';
const str = (...v: unknown[]) => v.find(x => typeof x === 'string' && x) as string | undefined;
export interface FileFace { family: string; weight: number; src: string }
function fromFile(): { list: Pairing[]; recommended?: string } | null {
  const raw = Object.values(found)[0] as unknown;
  if (!raw) return null;
  const list = Array.isArray(raw) ? raw : (raw as { pairings?: unknown[]; options?: unknown[] }).pairings ?? (raw as { options?: unknown[] }).options;
  if (!Array.isArray(list)) return null;
  let recommended: string | undefined;
  const out = list.map((o, i) => {
    const r = o as Record<string, unknown>;
    const display = fam(r.display ?? r.heading ?? r.displayFamily), text = fam(r.text ?? r.body ?? r.textFamily) || display;
    if (!display) return null;
    const href = str(r.googleFontsUrl, r.href, r.googleFonts, r.url) ?? css(...[...new Set([display, text])].map(f => g(f, 'wght@400..700')));
    const id = String(r.id ?? 'opt' + i);
    if (r.recommended === true && !recommended) recommended = id;
    const w = str(r.woff2);
    const file = w ? Object.entries(woffs).find(([k]) => k.endsWith('/' + w.split('/').pop()))?.[1] : undefined;
    const ff = r.fontFace as { family?: string; weight?: number } | undefined;
    const face: FileFace | undefined = file ? { family: ff?.family ?? display, weight: ff?.weight ?? 700, src: file } : undefined;
    const label = String(r.name ?? r.label ?? `${display} + ${text}`).replace(/ \((added|current)\)$/, '').replace(' with ', ' + ').replace(' throughout', '');
    return { id, name: label, display, text, href, note: typeof r.note === 'string' ? r.note : undefined, face };
  }).filter(Boolean) as Pairing[];
  return out.length ? { list: out, recommended } : null;
}
const file = fromFile();
export const PAIRINGS: Pairing[] = file?.list ?? DEFAULT_PAIRINGS;
export const FROM_FILE = !!file;
/** The founder's pick: Familjen Grotesk for display with Hanken Grotesk for text (the file marks it recommended). */
export const DEFAULT_PAIRING: Pairing = PAIRINGS.find(p => p.display === 'Familjen Grotesk' && p.text === 'Hanken Grotesk')
  ?? PAIRINGS.find(p => p.id === file?.recommended) ?? PAIRINGS[0];

export function applyPairing(p: Pairing) {
  if (p.href && !document.querySelector(`link[data-type="${p.id}"]`)) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = p.href; l.dataset.type = p.id; document.head.appendChild(l);
  }
  if (p.face && !document.querySelector(`style[data-face="${p.id}"]`)) {
    const st = document.createElement('style'); st.dataset.face = p.id;
    st.textContent = `@font-face { font-family: '${p.face.family}'; src: url(${p.face.src}) format('woff2'); font-weight: 100 900; font-display: swap; }`;
    document.head.appendChild(st);
  }
  const r = document.documentElement.style;
  r.setProperty('--f-display', stack(p.display));
  r.setProperty('--f-text', stack(p.text));
  document.documentElement.dataset.type = p.id;
}
