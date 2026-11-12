import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Palette = 'harbour' | 'allotment' | 'lido' | 'pencil';
export type Theme = 'light' | 'dark';
export const PALETTES: { id: Palette; name: string; line: string }[] = [
  { id: 'harbour', name: 'Harbour', line: 'Clay for you, ink navy for the agents, citrus when it lands' },
  { id: 'allotment', name: 'Allotment', line: 'Forest for you, sand for the agents, coral when it lands' },
  { id: 'lido', name: 'Lido', line: 'Blue for you, bone for the agents, amber when it lands' },
  { id: 'pencil', name: 'Pencil', line: 'Butter for you, graphite for the agents, vermilion when it lands' },
];

interface ThemeApi { palette: Palette; theme: Theme; /** ink for effects drawn on the B surface */ onB: Theme; setPalette: (p: Palette) => void; setTheme: (t: Theme) => void; version: number }
const Ctx = createContext<ThemeApi>({ palette: 'harbour', theme: 'light', onB: 'dark', setPalette: () => {}, setTheme: () => {}, version: 0 });
export const useTheme = () => useContext(Ctx);

const read = <T extends string>(k: string, ok: readonly T[], d: T): T => {
  try { const v = localStorage.getItem(k) as T | null; return v && ok.includes(v) ? v : d; } catch { return d; }
};
const save = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage may be blocked */ } };

export function ThemeProvider({ children }: { children: ReactNode }) {
  // light is the default; the viewer's choice is remembered on this device only
  const [palette, setPalette] = useState<Palette>(() => read('later-palette', ['harbour', 'allotment', 'lido', 'pencil'] as const, 'harbour'));
  const [theme, setTheme] = useState<Theme>(() => read('later-theme', ['light', 'dark'] as const, 'light'));
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const r = document.documentElement;
    r.dataset.palette = palette; r.dataset.theme = theme;
    save('later-palette', palette); save('later-theme', theme);
    setVersion(v => v + 1);
  }, [palette, theme]);
  // Harbour and Pencil keep a dark B in both themes; Allotment and Lido have a pale B in light
  const onB: Theme = palette === 'harbour' || palette === 'pencil' ? 'dark' : theme;
  return <Ctx.Provider value={{ palette, theme, onB, setPalette, setTheme, version }}>{children}</Ctx.Provider>;
}

/** Read a colour token after the palette or theme changes (for props that need a literal colour). */
export function useToken(name: string) {
  const { version } = useTheme();
  const [v, setV] = useState('');
  useEffect(() => { setV(getComputedStyle(document.documentElement).getPropertyValue(name).trim()); }, [name, version]);
  return v;
}
