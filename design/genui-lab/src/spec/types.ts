/* The view contract for the lab. An agent writes a ViewSpec as plain JSON; the client validates it, clamps the hints,
   lays it out and animates between revisions. Nothing in a spec is markup, a colour, a position or a component. */

export type Size = 'small' | 'medium' | 'large';
export type Emphasis = 'quiet' | 'normal' | 'loud';
export type AgentId = 'keep' | 'wren' | 'scout' | 'juno' | 'ledger';

/** Money is integer minor units (pence). Never floats. */
export interface Money { minor: number; currency: 'GBP' }
export interface SourceRef { name: string; kind: 'email' | 'web' | 'calendar' | 'memory' | 'bank' | 'document'; trust: 'user' | 'external'; when?: string }

export interface HeadlineData { title: string; line?: string; crew?: AgentId }
export interface ProseData { text: string; sources: SourceRef[] }
export interface StatData {
  value: number;
  format: 'money' | 'count' | 'days' | 'percent';
  label: string;
  /** a trend is drawn only when it was measured; basis says against what */
  trend?: { delta: number; basis: string };
  of?: number;
}
export interface SeriesData {
  kind: 'line' | 'bars';
  format: 'money' | 'count';
  label: string;
  points: { x: string; y: number }[];
  /** a second, paler series drawn behind (for example last month) */
  compare?: { label: string; points: { x: string; y: number }[] };
  mark?: { x: string; label: string };
  source: SourceRef;
}
export interface ComparisonOption { id: string; name: string; price: Money; facts: { k: string; v: string }[]; note?: string; thumb?: Thumb }
export interface ComparisonData { question: string; form: 'columns' | 'table'; options: ComparisonOption[]; recommended?: string; reason?: string; source: SourceRef }
export interface TimelineData { steps: { id: string; date: string; label: string; detail?: string; state: 'done' | 'now' | 'next' }[] }
export interface ChecklistData { items: { id: string; text: string; owner: 'me' | 'crew'; crew?: AgentId; done: boolean; due?: string }[] }
export interface PeopleData { people: { id: string; name: string; role: string; note: string; initials: string }[] }
export interface RouteData { stops: { id: string; name: string; time: string; kind: 'home' | 'stop' | 'end' }[]; legs: { mode: 'walk' | 'train' | 'car' | 'bus'; minutes: number }[]; showTimes: boolean }
export type Thumb = 'mill' | 'boathouse' | 'garden' | 'ryokan' | 'flat' | 'van';
export interface MediaData { items: { id: string; title: string; caption: string; thumb: Thumb }[] }
export interface QuoteData { text: string; by: string; source: SourceRef }
export interface ChoiceData { question: string; options: { id: string; label: string; detail?: string }[]; selected?: string }
export interface InputData { label: string; kind: 'date' | 'money' | 'text'; value?: string; placeholder: string; help: string }
/** Fixed form. The client owns every word on it; the spec carries only the exact arguments and their hash. */
export interface ConsentData { action: 'send'; to: { name: string; address: string }; subject: string; body: string; argsHash: string }
/** Fixed form. Later never moves money: this opens the bank with the details filled in. */
export interface PayData { payee: string; amount: Money; reference: string; account: string; due: string; opens: string }

export interface BlockMap {
  headline: HeadlineData; prose: ProseData; stat: StatData; series: SeriesData; comparison: ComparisonData;
  timeline: TimelineData; checklist: ChecklistData; people: PeopleData; route: RouteData; media: MediaData;
  quote: QuoteData; choice: ChoiceData; input: InputData; consent: ConsentData; pay: PayData;
}
export type BlockType = keyof BlockMap;
export const BLOCK_TYPES = ['headline', 'prose', 'stat', 'series', 'comparison', 'timeline', 'checklist', 'people', 'route', 'media', 'quote', 'choice', 'input', 'consent', 'pay'] as const;
/** Blocks with one fixed form: no hints are read, and the client writes all of their wording. */
export const FIXED: readonly BlockType[] = ['consent', 'pay'];

export type Block = { [K in BlockType]: { id: string; type: K; size?: Size; emphasis?: Emphasis; group?: string; data: BlockMap[K] } }[BlockType];

export interface ViewSpec {
  v: 1;
  surface: 'space' | 'answer';
  space: string;
  asOf: string;
  composedBy: AgentId;
  groups?: { id: string; label: string }[];
  blocks: Block[];
}

/** After validation and clamping: every block has resolved hints and a column span chosen by the client. */
export type Placed = Block & { size: Size; emphasis: Emphasis; span: 1 | 2 };
export interface Clamp { path: string; message: string }
export interface Issue { path: string; code: string; message: string }
export type Result<T> = { ok: true; value: T; clamps: Clamp[] } | { ok: false; issues: Issue[] };
