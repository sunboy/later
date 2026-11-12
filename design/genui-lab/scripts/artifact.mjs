// Turns the single-file build into an Artifact page: the host supplies doctype, html, head and body.
import { readFileSync, writeFileSync } from 'node:fs';
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const head = html.match(/<head>([\s\S]*)<\/head>/)[1]
  .replace(/<meta charset[^>]*>\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '');
const body = html.match(/<body>([\s\S]*)<\/body>/)[1];
const title = head.match(/<title>[\s\S]*?<\/title>/)[0];
const rest = head.replace(title, '');
writeFileSync(new URL('../dist/later-genui-lab.html', import.meta.url), `${title}\n${rest.trim()}\n${body.trim()}\n`);
console.log('wrote dist/later-genui-lab.html');
