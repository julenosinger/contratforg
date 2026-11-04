// Lint: every dynamic innerHTML / outerHTML / insertAdjacentHTML / document.write in contractforge-deploy/ must be on the approved list
// (tests/innerhtml-approved.json) with a category and a written reason. A statement counts as dynamic when the markup it receives is built from
// anything but a plain string literal. The approval is pinned to a hash of the statement itself, so editing the statement
// (a new interpolation, say) needs a new review. lab-evm.js is a generated bundle (tools/lab-evm) and is checked to be free of these sinks.
//
//   node innerhtml-lint.mjs            check
//   node innerhtml-lint.mjs --list     print every sink with its category (no failure)
//   node innerhtml-lint.mjs --suggest  print the JSON skeleton for sinks that are not approved yet
// Categories: S static markup; C interpolates only constants of the program (NETWORKS, template tables, numbers it computed);
// E every untrusted value goes through escapeHtml (or is passed as a text node / textContent); N a number or a value validated as an address / hex.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dirArg = process.argv.indexOf('--dir');
const dir = path.resolve(dirArg >= 0 ? process.argv[dirArg + 1] : path.join(here, '../contractforge-deploy'));
const approvedPath = path.join(here, 'innerhtml-approved.json');
const approved = fs.existsSync(approvedPath) ? JSON.parse(fs.readFileSync(approvedPath, 'utf8')) : { entries: [] };
const SINK = /\b(innerHTML|outerHTML)\s*=(?!=)|\binsertAdjacentHTML\s*\(|\bdocument\.write(ln)?\s*\(/g;

/* read one JS expression/statement starting at i: a string / template literal with nesting, or up to ; at depth 0 */
function readStatement(src, i) {
  let depth = 0, j = i;
  const stack = [];                         // inside a template: remember we may leave `${ }`
  for (; j < src.length; j++) {
    const c = src[j];
    if (c === '\\') { j++; continue; }
    if (stack.length && stack[stack.length - 1] === 'tpl') {
      if (c === '`') stack.pop();
      else if (c === '$' && src[j + 1] === '{') { stack.push('expr'); j++; }
      continue;
    }
    if (stack.length && stack[stack.length - 1] === 'str') { if (c === stack.str) stack.pop(); continue; }
    if (c === '`') { stack.push('tpl'); continue; }
    if (c === '"' || c === "'") { stack.push('str'); stack.str = c; continue; }
    if (stack.length && stack[stack.length - 1] === 'expr') {
      if (c === '{') stack.push('expr');
      else if (c === '}') stack.pop();
      continue;
    }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) { if (depth === 0) break; depth--; }
    else if ((c === ';' || c === '\n') && depth === 0 && !stack.length) {
      // a statement may continue on the next line (a long string concatenation): stop at ; or at a newline that ends a complete expression
      if (c === ';') break;
      const rest = src.slice(j + 1).match(/^\s*([+.?:|&])/);
      if (!rest) break;
    }
  }
  return src.slice(i, j + 1);
}
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const hashOf = (s) => crypto.createHash('sha256').update(norm(s)).digest('hex').slice(0, 12);

const sinks = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js')).sort()) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  if (f === 'lab-evm.js') { if (SINK.test(src)) sinks.push({ file: f, line: 0, kind: 'bundle', stmt: 'sink found in the generated bundle', dynamic: true }); SINK.lastIndex = 0; continue; }
  SINK.lastIndex = 0;
  let m;
  while ((m = SINK.exec(src))) {
    const startOfSink = m.index;
    const lineNo = src.slice(0, startOfSink).split('\n').length;
    const isCall = /\($/.test(m[0]);
    const after = isCall ? src.slice(startOfSink) : src.slice(startOfSink + m[0].length);
    const stmt = norm(readStatement(after, 0)).slice(0, 4000);
    // static: a plain literal (no ${ and no + / variable parts), or an empty string
    const lit = stmt.match(/^(?:'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"|`([^`$]*)`)\s*;?$/);
    sinks.push({ file: f, line: lineNo, kind: m[1] || (isCall ? 'call' : 'sink'), stmt, dynamic: !lit, hash: hashOf(f + '|' + stmt) });
  }
}

const byHash = new Map(approved.entries.map((e) => [e.hash, e]));
const bad = [];
let nStatic = 0, nApproved = 0;
for (const s of sinks) {
  if (!s.dynamic) { nStatic++; continue; }
  const e = byHash.get(s.hash);
  if (e && e.file === s.file && ['S', 'C', 'E', 'N'].includes(e.category) && e.why && e.why.length >= 15) nApproved++;
  else bad.push(s);
}
const seenHashes = new Set(sinks.map((s) => s.hash));
const stale = approved.entries.filter((e) => !seenHashes.has(e.hash));

if (process.argv.includes('--list')) { for (const s of sinks) console.log(`${s.file}:${s.line}  ${s.dynamic ? (byHash.get(s.hash)?.category || '??') : 'S(literal)'}  ${s.stmt.slice(0, 110)}`); process.exit(0); }
if (process.argv.includes('--suggest')) { console.log(JSON.stringify(bad.map((s) => ({ file: s.file, hash: s.hash, category: '?', why: '', excerpt: s.stmt.slice(0, 160) })), null, 2)); process.exit(0); }

console.log(`innerHTML-style sinks: ${sinks.length} (${nStatic} plain literals, ${nApproved} approved dynamic, ${bad.length} not approved)`);
if (stale.length) console.log(`note: ${stale.length} approved entr${stale.length === 1 ? 'y' : 'ies'} no longer match any statement (remove them): ` + stale.map((e) => e.file + ':' + e.hash).join(', '));
if (bad.length) {
  console.error('\nFAIL: dynamic markup that is not on the approved list. Build it with textContent / createElement, or run it through escapeHtml and add an entry\nto tests/innerhtml-approved.json (category, written reason). Not approved:');
  for (const s of bad) console.error(`  ${s.file}:${s.line}  [${s.hash}]  ${s.stmt.slice(0, 150)}`);
  process.exit(1);
}
console.log('OK');
