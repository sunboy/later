/* The client's gate for views. Pure: spec in, Result out. Strict at every level (unknown keys are refused), no markup in
   any string, fixed forms cannot be restyled or reworded, and hints are clamped by code whatever the agent asked for. */
import { BLOCK_TYPES, FIXED, type BlockType, type Clamp, type Emphasis, type Issue, type Placed, type Result, type Size, type ViewSpec } from './types';
import { consentArgs } from './sha256';

type Check = (v: unknown, path: string, out: Issue[]) => void;
const issue = (out: Issue[], path: string, code: string, message: string) => { out.push({ path, code, message }); };

const MARKUP = /<\s*\/?\s*[a-z!?][^>]*>?|&(?:[a-z]+|#\d+|#x[0-9a-f]+);|javascript:|data:text\/html/i;
const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f]/;

const str = (max: number, min = 1): Check => (v, p, out) => {
  if (typeof v !== 'string') return issue(out, p, 'invalid_type', 'Expected text.');
  if (v.length < min) return issue(out, p, 'too_small', min === 1 ? 'Must not be empty.' : `At least ${min} characters.`);
  if (v.length > max) return issue(out, p, 'too_big', `At most ${max} characters.`);
  if (CONTROL.test(v)) return issue(out, p, 'control_char', 'Control characters are not allowed.');
  if (MARKUP.test(v)) return issue(out, p, 'markup', 'Text contains markup. A view carries plain text only; the app draws every pixel.');
};
const int = (min: number, max: number): Check => (v, p, out) => {
  if (typeof v !== 'number' || !Number.isInteger(v)) return issue(out, p, 'invalid_type', 'Expected a whole number.');
  if (v < min || v > max) issue(out, p, 'out_of_range', `Must be between ${min} and ${max}.`);
};
const num = (min: number, max: number): Check => (v, p, out) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return issue(out, p, 'invalid_type', 'Expected a number.');
  if (v < min || v > max) issue(out, p, 'out_of_range', `Must be between ${min} and ${max}.`);
};
const bool: Check = (v, p, out) => { if (typeof v !== 'boolean') issue(out, p, 'invalid_type', 'Expected true or false.'); };
const oneOf = (vals: readonly string[]): Check => (v, p, out) => {
  if (typeof v !== 'string' || !vals.includes(v)) issue(out, p, 'invalid_enum', `Must be one of: ${vals.join(', ')}.`);
};
const ID = /^[a-z0-9][a-z0-9-]{0,47}$/;
const id: Check = (v, p, out) => { if (typeof v !== 'string' || !ID.test(v)) issue(out, p, 'invalid_id', 'Ids are short lowercase slugs.'); };
const arr = (of: Check, min: number, max: number): Check => (v, p, out) => {
  if (!Array.isArray(v)) return issue(out, p, 'invalid_type', 'Expected a list.');
  if (v.length < min) return issue(out, p, 'too_small', `At least ${min} item${min === 1 ? '' : 's'}.`);
  if (v.length > max) return issue(out, p, 'too_big', `At most ${max} items.`);
  v.forEach((x, i) => of(x, `${p}[${i}]`, out));
};
type Shape = Record<string, Check>;
const opt = (c: Check): Check => Object.assign((v: unknown, p: string, out: Issue[]) => c(v, p, out), { optional: true });
const isOpt = (c: Check) => (c as Check & { optional?: boolean }).optional === true;
const obj = (shape: Shape, unknownCode = 'unrecognized_keys', unknownMsg?: (k: string) => string): Check => (v, p, out) => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return issue(out, p, 'invalid_type', 'Expected an object.');
  const o = v as Record<string, unknown>;
  for (const k of Object.keys(o)) if (!(k in shape)) issue(out, `${p}.${k}`, unknownCode, unknownMsg ? unknownMsg(k) : `Unknown key "${k}". Views are strict; unknown keys are refused.`);
  for (const [k, c] of Object.entries(shape)) {
    if (o[k] === undefined) { if (!isOpt(c)) issue(out, `${p}.${k}`, 'required', `"${k}" is required.`); continue; }
    c(o[k], `${p}.${k}`, out);
  }
};

const money = obj({ minor: int(0, 10_000_000_00), currency: oneOf(['GBP']) });
const source = obj({ name: str(80), kind: oneOf(['email', 'web', 'calendar', 'memory', 'bank', 'document']), trust: oneOf(['user', 'external']), when: opt(str(40)) });
const crew = oneOf(['keep', 'wren', 'scout', 'juno', 'ledger']);
const point = obj({ x: str(12), y: num(-1e9, 1e9) });
const thumb = oneOf(['mill', 'boathouse', 'garden', 'ryokan', 'flat', 'van']);

const fixedKey = (block: string) => (k: string) =>
  `"${k}" would change the ${block} form. Its wording, layout and control belong to the app; a view sends only the exact arguments.`;

const DATA: Record<BlockType, Check> = {
  headline: obj({ title: str(80), line: opt(str(200, 0)), crew: opt(crew) }),
  prose: obj({ text: str(480), sources: arr(source, 1, 6) }),
  stat: (v, p, out) => {
    const o = v as Record<string, unknown> | null;
    if (o && typeof o === 'object' && o.trend && typeof o.trend === 'object' && !('basis' in (o.trend as object)))
      return issue(out, `${p}.trend`, 'unmeasured_trend', 'A trend needs the measurement it came from. Without a basis the app shows no arrow.');
    obj({ value: num(-1e12, 1e12), format: oneOf(['money', 'count', 'days', 'percent']), label: str(80), trend: opt(obj({ delta: num(-1e12, 1e12), basis: str(80) })), of: opt(num(0, 1e12)) })(v, p, out);
  },
  series: obj({ kind: oneOf(['line', 'bars']), format: oneOf(['money', 'count']), label: str(80), points: arr(point, 2, 24),
    compare: opt(obj({ label: str(60), points: arr(point, 2, 24) })), mark: opt(obj({ x: str(12), label: str(60) })), source }),
  comparison: obj({ question: str(120), form: oneOf(['columns', 'table']), options: arr(obj({ id, name: str(60), price: money, facts: arr(obj({ k: str(30), v: str(60) }), 0, 6), note: opt(str(120)), thumb: opt(thumb) }), 1, 4),
    recommended: opt(id), reason: opt(str(200)), source }),
  timeline: obj({ steps: arr(obj({ id, date: str(24), label: str(80), detail: opt(str(160)), state: oneOf(['done', 'now', 'next']) }), 1, 10) }),
  checklist: obj({ items: arr(obj({ id, text: str(120), owner: oneOf(['me', 'crew']), crew: opt(crew), done: bool, due: opt(str(30)) }), 1, 12) }),
  people: obj({ people: arr(obj({ id, name: str(60), role: str(60), note: str(200), initials: str(3) }), 1, 6) }),
  route: obj({ stops: arr(obj({ id, name: str(60), time: str(12), kind: oneOf(['home', 'stop', 'end']) }), 2, 6), legs: arr(obj({ mode: oneOf(['walk', 'train', 'car', 'bus']), minutes: int(1, 600) }), 1, 5), showTimes: bool }),
  media: obj({ items: arr(obj({ id, title: str(60), caption: str(120), thumb }), 1, 4) }),
  quote: obj({ text: str(400), by: str(80), source }),
  choice: obj({ question: str(120), options: arr(obj({ id, label: str(60), detail: opt(str(120)) }), 2, 5), selected: opt(id) }),
  input: obj({ label: str(80), kind: oneOf(['date', 'money', 'text']), value: opt(str(60, 0)), placeholder: str(60), help: str(200) }),
  consent: obj({ action: oneOf(['send']), to: obj({ name: str(80, 0), address: str(120, 0) }, 'fixed_form', fixedKey('consent')), subject: str(160), body: str(2000), argsHash: (v, p, out) => {
    if (typeof v !== 'string' || !/^[0-9a-f]{64}$/.test(v)) issue(out, p, 'invalid_hash', 'argsHash is a 64-character SHA-256 of the exact arguments.');
  } }, 'fixed_form', fixedKey('consent')),
  pay: obj({ payee: str(80), amount: money, reference: str(40), account: str(60), due: str(60), opens: str(60) }, 'fixed_form', fixedKey('ready-to-pay')),
};

const HINT_KEYS = ['size', 'emphasis'] as const;
const SIZE: Size[] = ['small', 'medium', 'large'];
const EMPH: Emphasis[] = ['quiet', 'normal', 'loud'];
/** Blocks that need the full width at any size; the client widens them. */
const WIDE: BlockType[] = ['headline', 'comparison', 'timeline', 'route', 'media', 'consent', 'pay', 'checklist', 'people'];
const MAX_BLOCKS = 12;

export function validateView(input: unknown): Result<Placed[]> & { spec?: ViewSpec } {
  const out: Issue[] = [];
  obj({
    v: (v, p, o) => { if (v !== 1) issue(o, p, 'invalid_version', 'Only view version 1 is understood.'); },
    surface: oneOf(['space', 'answer']), space: id, asOf: str(40), composedBy: crew,
    groups: opt(arr(obj({ id, label: str(60) }), 0, 6)),
    blocks: (v, p, o) => {
      if (!Array.isArray(v)) return issue(o, p, 'invalid_type', 'Expected a list of blocks.');
      if (v.length === 0) return issue(o, p, 'too_small', 'A view has at least one block.');
      if (v.length > MAX_BLOCKS) return issue(o, p, 'too_big', `At most ${MAX_BLOCKS} blocks in a view.`);
      v.forEach((b, i) => {
        const bp = `${p}[${i}]`;
        if (!b || typeof b !== 'object') return issue(o, bp, 'invalid_type', 'Expected a block.');
        const t = (b as { type?: unknown }).type;
        if (typeof t !== 'string' || !(BLOCK_TYPES as readonly string[]).includes(t))
          return issue(o, `${bp}.type`, 'unknown_block', `"${String(t)}" is not in the block vocabulary. The app draws only the ${BLOCK_TYPES.length} blocks it ships.`);
        const fixed = FIXED.includes(t as BlockType);
        const rec = b as Record<string, unknown>;
        for (const k of Object.keys(rec)) {
          if (['id', 'type', 'data', 'group', ...HINT_KEYS].includes(k)) continue;
          issue(o, `${bp}.${k}`, fixed ? 'fixed_form' : 'unrecognized_keys', fixed ? fixedKey(t)(k) : `Unknown key "${k}". There is no style, colour, position or markup in a view.`);
        }
        if (fixed) for (const k of HINT_KEYS) if (k in rec) issue(o, `${bp}.${k}`, 'fixed_form', `The ${t} form takes no hints. It always looks the same so you can trust it.`);
        id(rec.id, `${bp}.id`, o);
        if ('size' in rec) oneOf(SIZE)(rec.size, `${bp}.size`, o);
        if ('emphasis' in rec) oneOf(EMPH)(rec.emphasis, `${bp}.emphasis`, o);
        if ('group' in rec) id(rec.group, `${bp}.group`, o);
        if (rec.data === undefined) return issue(o, `${bp}.data`, 'required', '"data" is required.');
        DATA[t as BlockType](rec.data, `${bp}.data`, o);
      });
    },
  })(input, 'view', out);
  if (out.length) return { ok: false, issues: out };

  const spec = input as ViewSpec;
  // relations the schema alone cannot express
  const ids = new Set<string>();
  const groups = new Set((spec.groups ?? []).map(g => g.id));
  const seenGroups: string[] = [];
  spec.blocks.forEach((b, i) => {
    const p = `view.blocks[${i}]`;
    if (ids.has(b.id)) issue(out, `${p}.id`, 'duplicate_id', `Block id "${b.id}" is used twice.`);
    ids.add(b.id);
    if (b.group) {
      if (!groups.has(b.group)) issue(out, `${p}.group`, 'unknown_group', `Group "${b.group}" is not declared.`);
      const last = seenGroups[seenGroups.length - 1];
      if (b.group !== last && seenGroups.includes(b.group)) issue(out, `${p}.group`, 'split_group', 'Blocks in a group must sit together.');
      if (b.group !== last) seenGroups.push(b.group);
    } else seenGroups.push('');
    if (b.type === 'consent') {
      const d = b.data;
      if (!d.to.name.trim() || !d.to.address.trim() || !/@|^\+?[0-9 ]{7,}/.test(d.to.address))
        issue(out, `${p}.data.to`, 'hidden_recipient', 'The exact recipient must be shown in full: a name and a real address.');
      else if (consentArgs(d) !== d.argsHash)
        issue(out, `${p}.data.argsHash`, 'args_mismatch', 'The words or recipient differ from what the approval was made for. Approvals bind to exact arguments.');
    }
    if (b.type === 'choice' && b.data.selected && !b.data.options.some(o => o.id === b.data.selected)) issue(out, `${p}.data.selected`, 'unknown_option', 'Selected option is not in the list.');
    if (b.type === 'comparison' && b.data.recommended && !b.data.options.some(o => o.id === b.data.recommended)) issue(out, `${p}.data.recommended`, 'unknown_option', 'Recommended option is not in the list.');
    if (b.type === 'series') {
      if (b.data.mark && !b.data.points.some(pt => pt.x === b.data.mark!.x)) issue(out, `${p}.data.mark`, 'unknown_point', 'The mark must sit on a point in the series.');
      if (b.data.compare && b.data.compare.points.length !== b.data.points.length) issue(out, `${p}.data.compare`, 'length_mismatch', 'The comparison series needs one value per point.');
    }
  });
  if (out.length) return { ok: false, issues: out };

  // clamps: the agent suggests, code decides
  const clamps: Clamp[] = [];
  let loud = 0, large = 0;
  const placed = spec.blocks.map((b, i): Placed => {
    const p = `view.blocks[${i}]`;
    let size: Size = b.size ?? 'medium';
    let emphasis: Emphasis = b.emphasis ?? 'normal';
    if (FIXED.includes(b.type)) { size = 'medium'; emphasis = 'normal'; }
    const untrusted = (b.type === 'prose' && b.data.sources.every(s => s.trust === 'external')) || (b.type === 'quote' && b.data.source.trust === 'external');
    if (emphasis === 'loud' && untrusted) { emphasis = 'normal'; clamps.push({ path: `${p}.emphasis`, message: 'Text from outside your control cannot be made loud. Shown as normal.' }); }
    if (emphasis === 'loud' && ++loud > 1) { emphasis = 'normal'; clamps.push({ path: `${p}.emphasis`, message: 'One loud block per view. This one is shown as normal.' }); }
    if (size === 'large' && ++large > 2) { size = 'medium'; clamps.push({ path: `${p}.size`, message: 'At most two large blocks per view. Shown as medium.' }); }
    return { ...b, size, emphasis, span: 2 } as Placed;
  });
  // layout is the client's: small blocks pair up side by side; a small block with no partner, or one that needs width, spans the row
  for (let i = 0; i < placed.length; i++) {
    const b = placed[i];
    if (b.size !== 'small' || WIDE.includes(b.type)) continue;
    const n = placed[i + 1];
    if (n && n.size === 'small' && !WIDE.includes(n.type) && n.group === b.group) { b.span = 1; n.span = 1; i++; }
  }
  return { ok: true, value: placed, clamps, spec };
}
