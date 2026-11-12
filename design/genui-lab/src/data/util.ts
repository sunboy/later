import type { AgentId, Block, BlockMap, BlockType, ConsentData, Emphasis, Size, SourceRef, ViewSpec } from '../spec/types';
import { consentArgs } from '../spec/sha256';

type Hints = { size?: Size; emphasis?: Emphasis; group?: string };
export function blk<T extends BlockType>(type: T, id: string, data: BlockMap[T], h: Hints = {}): Block {
  return { id, type, ...h, data } as Block;
}
export const src = (name: string, kind: SourceRef['kind'], when?: string, trust?: SourceRef['trust']): SourceRef =>
  ({ name, kind, trust: trust ?? (kind === 'memory' || kind === 'bank' || kind === 'document' ? 'user' : 'external'), ...(when ? { when } : {}) });
export const gbpm = (pounds: number) => ({ minor: Math.round(pounds * 100), currency: 'GBP' as const });

/** A consent block is sealed with the hash of its exact arguments, as an approval would be. */
export function consent(id: string, to: ConsentData['to'], subject: string, body: string, group?: string): Block {
  const d = { action: 'send' as const, to, subject, body };
  return { id, type: 'consent', ...(group ? { group } : {}), data: { ...d, argsHash: consentArgs(d) } };
}

export const view = (space: string, asOf: string, composedBy: AgentId, blocks: Block[], groups?: ViewSpec['groups'], surface: ViewSpec['surface'] = 'space'): ViewSpec =>
  ({ v: 1, surface, space, asOf, composedBy, ...(groups ? { groups } : {}), blocks });
