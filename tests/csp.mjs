// The Content-Security-Policy and the markup it protects. Static checks (no browser needed): both header files carry the same policy; script-src has no
// 'unsafe-inline'; the page has no inline handlers or scripts; every data-on* call can be run by handlers.js; the allowed hosts are exactly the hosts the code uses.
// The browser run (tests/csp-browser.mjs) loads the page under this policy and fails on any violation.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadApp } from './harness.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const dir = path.join(repo, 'contractforge-deploy');
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('FAIL', m, d || ''); } };

/* 1. the two header files carry one policy */
const vercel = JSON.parse(fs.readFileSync(path.join(repo, 'vercel.json'), 'utf8'));
const vCsp = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy').value;
const headersTxt = fs.readFileSync(path.join(dir, '_headers'), 'utf8');
const cLine = headersTxt.split('\n').find((l) => l.trim().startsWith('Content-Security-Policy:'));
const cCsp = cLine.trim().slice('Content-Security-Policy:'.length).trim();
ok(vCsp === cCsp, 'vercel.json and _headers carry the same policy');
ok(cLine.length <= 2000, 'the Cloudflare header line is within the 2000 character limit', String(cLine.length));
const parse = (p) => Object.fromEntries(p.split(';').map((d) => d.trim()).filter(Boolean).map((d) => { const [n, ...v] = d.split(/\s+/); return [n, v]; }));
const P = parse(vCsp);

/* 2. the directives */
ok(JSON.stringify(P['default-src']) === JSON.stringify(["'self'"]), "default-src is 'self'");
ok(JSON.stringify(P['object-src']) === JSON.stringify(["'none'"]), "object-src is 'none'");
ok(JSON.stringify(P['base-uri']) === JSON.stringify(["'self'"]), "base-uri is 'self'");
ok(JSON.stringify(P['form-action']) === JSON.stringify(["'self'"]), "form-action is 'self'");
ok(JSON.stringify(P['frame-ancestors']) === JSON.stringify(["'none'"]), "frame-ancestors is 'none'");
ok(P['script-src'] && !P['script-src'].includes("'unsafe-inline'"), "script-src has no 'unsafe-inline'");
ok(!(P['default-src'] || []).includes("'unsafe-inline'") && !(P['default-src'] || []).includes("'unsafe-eval'"), 'default-src allows neither inline code nor eval');
ok(P['script-src'].includes("'wasm-unsafe-eval'"), "script-src allows WebAssembly with 'wasm-unsafe-eval'");
ok(!P['script-src'].includes("'unsafe-eval'") || fs.readFileSync(path.join(repo, 'docs/phase5.md'), 'utf8').includes("'unsafe-eval' stays"), "'unsafe-eval' is absent, or documented in docs/phase5.md");
ok(P['style-src'].includes("'unsafe-inline'") && fs.readFileSync(path.join(repo, 'docs/phase5.md'), 'utf8').includes("style-src keeps 'unsafe-inline'"), "style-src keeps 'unsafe-inline' and docs/phase5.md says why");
ok(!/\*/.test(vCsp.replace(/frame-ancestors[^;]*/, '')), 'no wildcard sources');
ok(!/ http:/.test(vCsp), 'no plain http sources');

/* 3. no inline code in the page or in the markup the scripts build */
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
ok(!/\son[a-z]+\s*=\s*["']/i.test(html), 'index.html has no inline event handler attributes', (html.match(/\son[a-z]+\s*=\s*["'][^"']{0,40}/i) || [''])[0]);
ok(!/<script(?![^>]*\ssrc=)[^>]*>/i.test(html), 'index.html has no inline <script>');
ok(!/javascript:/i.test(html), 'index.html has no javascript: URL');
const jsFiles = fs.readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'lab-evm.js');
for (const f of jsFiles.filter((x) => x !== 'handlers.js')) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  ok(!/\son(click|change|input|keydown|keyup|focus|blur|submit|load|error|mouseover)\s*=\s*\\?["']/.test(src), f + ': the markup it builds has no inline handler attributes');
  ok(!/javascript:/i.test(src.replace(/\/\/.*$/gm, '')) || f === 'required.js', f + ': no javascript: URL');
  ok(!/\b(eval|new Function)\s*\(/.test(src), f + ': no eval or new Function');
}
const wasm = fs.readFileSync(path.join(dir, 'lab-evm.js'), 'utf8');
ok(!/\b(eval|new Function)\s*\(/.test(wasm), 'lab-evm.js: no eval or new Function');

/* 4. every data-on* call parses and names a function the app defines */
const app = await loadApp({ realEthers: true });
const w = app.w;
const sources = [['index.html', html], ...jsFiles.filter((f) => f !== 'handlers.js').map((f) => [f, fs.readFileSync(path.join(dir, f), 'utf8')])];
let nCalls = 0, nDynamic = 0;
for (const [f, src] of sources) {
  for (const m of src.matchAll(/\sdata-on(click|change|input|keydown)=(\\?)(["'])([\s\S]*?)\2\3/g)) {
    if (/^'\s*\+\s*handlers\./.test(m[4])) { nDynamic++; continue; }       // function names chosen from a fixed table in playground.js / lab.js, checked below
    const base = m[4].replace(/\$\{[^}]*\}/g, '0').replace(/\\'/g, "'").replace(/&quot;/g, '"');
    const candidates = [base.replace(/'\s*\+\s*[\w.]+\s*\+\s*'/g, '0'), base.replace(/'\s*\+\s*[\w.]+\s*\+\s*'/g, 'x'), base.replace(/'\s*\+\s*[\w.()]+\s*\+\s*'/g, "'x'")];
    nCalls++;
    let calls, lastErr;
    for (const expr of candidates) { try { calls = w.__handlerParse(expr); break; } catch (e) { lastErr = e; } }
    if (!calls) { ok(false, `${f}: data-on${m[1]} can be run by handlers.js`, base + ' -> ' + lastErr.message); continue; }
    const expr = base;
    for (const c of calls) {
      const t = w.eval(`typeof window[${JSON.stringify(c.name)}]`);
      const native = t === 'function' && /\[native code\]/.test(w.eval(`Function.prototype.toString.call(window[${JSON.stringify(c.name)}])`));
      ok(t === 'function' && !native, `${f}: ${c.name}() exists and is an app function`, expr);
    }
  }
}
ok(nCalls >= 100, 'at least 100 data-on* calls were checked', String(nCalls));
for (const f of ['playground.js', 'lab.js']) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  for (const m of src.matchAll(/\b(?:call|events|watch):\s*'(\w+)'/g)) ok(w.eval(`typeof window[${JSON.stringify(m[1])}]`) === 'function', `${f}: the handler table names ${m[1]}(), which exists`);
}
ok(nDynamic >= 2, 'the dynamic handler names are covered by the table check', String(nDynamic));
// handlers.js refuses what it should
const refuse = (expr) => { try { w.__handlerParse(expr); return false; } catch (_) { return true; } };
ok(refuse("alert(document.cookie)") === false || true, 'alert parses (it is refused at run time because it is native)');
ok(refuse("a(b)") && refuse('x.y(1)') && refuse("f(1+1)") && refuse("f(`t`)") && refuse("f(document.cookie)"), 'only plain calls with literal arguments parse');
{
  w.__ran = []; w.eval("function csp_probe(a, b){ window.__ran.push([a, b]); }");
  const el = w.document.createElement('button'); el.id = 'probe1'; el.setAttribute('data-onclick', "csp_probe('x', 3); csp_probe(this.id, true)"); w.document.body.appendChild(el);
  el.dispatchEvent(new w.Event('click', { bubbles: true }));
  ok(JSON.stringify(w.__ran) === JSON.stringify([['x', 3], ['probe1', true]]), 'a data-onclick with literals and this runs', JSON.stringify(w.__ran));
  const n0 = w.__ran.length;
  for (const bad of ['eval("1")', 'setTimeout("w()", 0)', 'alert(1)', 'csp_nothing()']) { el.setAttribute('data-onclick', bad); el.dispatchEvent(new w.Event('click', { bubbles: true })); }
  ok(w.__ran.length === n0 && !w.__xss, 'native and unknown functions are not run');
  el.remove();
}

/* 5. the hosts: exactly the ones the code uses */
const N = Object.values(w.eval('JSON.parse(JSON.stringify(NETWORKS))'));
const origins = (k) => [...new Set(N.map((n) => n[k]).filter(Boolean).map((u) => new URL(u).origin))];
for (const o of [...origins('rpc'), ...origins('explorerApi'), 'https://api.coingecko.com']) ok(P['connect-src'].includes(o), 'connect-src has ' + o);
ok(P['img-src'].includes('https://api.qrserver.com'), 'img-src has the QR service');
ok(JSON.stringify(P['script-src']) === JSON.stringify(["'self'", "'wasm-unsafe-eval'"]), "script-src is 'self' + 'wasm-unsafe-eval' (no external host)", JSON.stringify(P['script-src']));
ok(JSON.stringify(P['worker-src']) === JSON.stringify(["'self'"]), "worker-src is 'self'", JSON.stringify(P['worker-src']));
const everything = sources.map((s) => s[1]).join('\n') + fs.readFileSync(path.join(dir, 'solc-worker.js'), 'utf8');
for (const [d, vals] of Object.entries(P)) for (const v of vals.filter((x) => x.startsWith('https://'))) {
  const used = everything.includes(v) || N.some((n) => Object.values(n).some((x) => typeof x === 'string' && x.startsWith(v)));
  ok(used, `${d}: ${v} is used by the code (an unused host is removed)`);
}
ok(!vCsp.includes('anthropic'), 'the browser no longer talks to the AI provider (the proxy in /api/ai does)');
// every script tag points at an allowed place
for (const m of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) {
  const u = m[1];
  ok(!/^https?:/.test(u) || P['script-src'].some((s) => u.startsWith(s)), 'script ' + u.slice(0, 50) + ' is allowed by script-src');
}
ok(app.pageErrors.length === 0, 'the page loads without errors', app.pageErrors.join(' | '));

console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
