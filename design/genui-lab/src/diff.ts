/* Says in words what changed between two compositions, so a recomposition explains itself. */
import type { Placed, Size } from './spec/types';

const NAME: Record<Placed['type'], string> = {
  headline: 'the headline', prose: 'a note', stat: 'a figure', series: 'the chart', comparison: 'the comparison', timeline: 'the timeline',
  checklist: 'the checklist', people: 'people', route: 'the route', media: 'pictures', quote: 'a quote', choice: 'a choice',
  input: 'a question', consent: 'a draft to send', pay: 'a payment to make',
};
const RANK: Record<Size, number> = { small: 0, medium: 1, large: 2 };
const list = (xs: string[]) => xs.length > 3 ? `${xs.slice(0, 2).join(', ')} and ${xs.length - 2} more` : xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
const uniq = (xs: string[]) => [...new Set(xs)];

export function describeChange(prev: Placed[], next: Placed[]): string | null {
  const before = new Map(prev.map(b => [b.id, b]));
  const after = new Set(next.map(b => b.id));
  const added: string[] = [], grew: string[] = [], shrank: string[] = [], raised: string[] = [], quieted: string[] = [], updated: string[] = [];
  for (const b of next) {
    const o = before.get(b.id);
    if (!o) { added.push(NAME[b.type]); continue; }
    if (b.type === 'headline') continue;
    // one verb per block, the most telling one
    if (b.emphasis === 'loud' && o.emphasis !== 'loud') raised.push(NAME[b.type]);
    else if (RANK[b.size] > RANK[o.size]) grew.push(NAME[b.type]);
    else if (b.emphasis === 'quiet' && o.emphasis !== 'quiet') quieted.push(NAME[b.type]);
    else if (RANK[b.size] < RANK[o.size]) shrank.push(NAME[b.type]);
    else if (JSON.stringify(b.data) !== JSON.stringify(o.data) && b.emphasis === o.emphasis) updated.push(NAME[b.type]);
  }
  const removed = prev.filter(b => !after.has(b.id) && b.type !== 'headline').map(b => NAME[b.type]);
  const parts = [
    added.length && `added ${list(uniq(added))}`,
    raised.length && `raised ${list(uniq(raised))}`,
    grew.length && `grew ${list(uniq(grew))}`,
    shrank.length && `shrank ${list(uniq(shrank))}`,
    quieted.length && `quietened ${list(uniq(quieted))}`,
    updated.length && `updated ${list(uniq(updated))}`,
    removed.length && `took away ${list(uniq(removed))}`,
  ].filter(Boolean) as string[];
  if (!parts.length) return null;
  const s = list(parts.slice(0, 3));
  return s.charAt(0).toUpperCase() + s.slice(1) + '.';
}
