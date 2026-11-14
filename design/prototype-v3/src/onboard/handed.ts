import type { AgentId } from '../data';
import type { Found, Kind } from './rules';

/* What the user handed Keep in the front door, kept on this device only (browser storage).
   It survives a reload so a card can come back at its time. Storage can be blocked, so every access is wrapped.
   The app reads the same list: the first card leads the first deck, and Spaces flicked away stay gone. */

export interface Item {
  id: string;
  text: string;
  kind: Kind;
  who: AgentId | null;
  plan: string[];
  found: Found;
  back: number; // when it comes back, epoch ms (0 = not set yet)
  shown?: boolean; // already brought back on a welcome-back
}

const K_ITEMS = 'later-items', K_NAME = 'later-name', K_GONE = 'later-gone-spaces', K_HOME = 'later-home';
const get = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const put = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage may be blocked */ } };

export const loadItems = () => get<Item[]>(K_ITEMS, []);
export const saveItems = (items: Item[]) => put(K_ITEMS, items);
export const loadName = () => get<string>(K_NAME, '');
export const saveName = (n: string) => put(K_NAME, n);
export const loadGone = () => get<string[]>(K_GONE, []);
export const saveGone = (ids: string[]) => put(K_GONE, ids);
/** Whether Keep has a home yet (set-up reached mail). Before that, nothing returns with legwork done. */
export const loadHome = () => get<boolean>(K_HOME, false);
export const saveHome = (v: boolean) => put(K_HOME, v);
export function clearHanded() { try { [K_ITEMS, K_NAME, K_GONE, K_HOME].forEach(k => localStorage.removeItem(k)); } catch { /* storage may be blocked */ } }

/** Spaces flicked away in "What I found". The app filters them out everywhere. */
export const goneSpaces = () => new Set(loadGone());
/** Items whose time has come and that have not been shown yet. */
export const dueItems = (now: number) => loadItems().filter(i => i.back > 0 && i.back <= now && !i.shown);
