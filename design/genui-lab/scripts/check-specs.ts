/* Every example composition must pass the validator; every refused example must be refused for its stated reason. */
import { validateView } from '../src/spec/validate';
import { SPACES } from '../src/data/scenarios';
import { REQUESTS } from '../src/data/requests';
import { REJECTS, CLAMPED } from '../src/data/rejects';

let fail = 0;
const ok = (name: string, spec: unknown) => {
  const r = validateView(spec);
  if (!r.ok) { fail++; console.log('FAIL', name, JSON.stringify(r.issues)); }
  else console.log('ok  ', name.padEnd(28), r.value.map(b => `${b.type}:${b.size[0]}${b.emphasis[0]}${b.span}`).join(' '), r.clamps.length ? `clamps=${r.clamps.length}` : '');
};
for (const s of SPACES) for (const st of s.steps) ok(`${s.id}/${st.id}`, st.spec);
for (const q of REQUESTS) { ok(`ask/${q.id}`, q.spec); for (const f of q.refine) ok(`ask/${q.id}/${f.id}`, f.spec); }
const expect: Record<string, string> = { markup: 'markup', unknown: 'unknown_block', style: 'unrecognized_keys', wording: 'fixed_form', hidden: 'hidden_recipient', swap: 'args_mismatch', hinted: 'fixed_form', trend: 'unmeasured_trend' };
for (const r of REJECTS) {
  const v = validateView(r.spec);
  const codes = v.ok ? [] : v.issues.map(i => i.code);
  const good = !v.ok && codes.includes(expect[r.id]);
  if (!good) fail++;
  console.log(good ? 'ref ' : 'FAIL', r.id.padEnd(10), codes.join(','), v.ok ? '' : v.issues.map(i => i.path).join(' '));
}
const c = validateView(CLAMPED.spec);
console.log(c.ok && c.clamps.length === 2 ? 'clmp' : 'FAIL', c.ok ? c.clamps.map(x => x.path + ': ' + x.message).join(' | ') : 'refused');
if (!c.ok || c.clamps.length !== 2) fail++;
console.log(fail ? `${fail} failures` : 'all good');
process.exit(fail ? 1 : 0);
