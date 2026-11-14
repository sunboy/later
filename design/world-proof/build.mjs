// Inline the CSS and the four modules into one self-contained index.html. No dependencies.
import { readFileSync, writeFileSync } from 'node:fs';
const r = f => readFileSync(new URL('./src/' + f, import.meta.url), 'utf8');
const strip = s => s.replace(/^import .*$/gm, '').replace(/^export \{[^}]*\};?$/gm, '').replace(/^export (function|const|let)/gm, '$1');
const js = ['world.js', 'keep.js', 'audio.js', 'main.js'].map(f => `/* ---- ${f} ---- */\n` + strip(r(f))).join('\n');
const html = r('index.tpl.html').replace('/*STYLE*/', () => r('style.css')).replace('/*SCRIPT*/', () => js);
writeFileSync(new URL('./index.html', import.meta.url), html);
console.log('index.html', (html.length / 1024).toFixed(1), 'KB');
