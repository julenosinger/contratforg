/* The compiler download: official host first, a CDN mirror second, clear errors when both fail. */
import vm from 'node:vm';
import fs from 'node:fs';
import { loadApp } from './harness.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m); } };

/* ---- worker: falls back to the second address ---- */
const workerSrc = fs.readFileSync(new URL('../contractforge-deploy/solc-worker.js', import.meta.url), 'utf8');
const soljson = fs.readFileSync(new URL('./node_modules/solc/soljson.js', import.meta.url), 'utf8');

function makeWorker(importScripts) {
  const out = [];
  const ctx = vm.createContext({
    self: null, importScripts, postMessage: (m) => out.push(m), location: { href: 'http://x/solc-worker.js' },
    WebAssembly, TextDecoder, TextEncoder, atob, btoa, setTimeout, clearTimeout, console, URL,
    URLSearchParams, Uint8Array, ArrayBuffer, Math, Date, Promise, Error, process: undefined,
  });
  ctx.self = ctx; ctx.global = ctx;
  vm.runInContext(workerSrc, ctx);
  const send = async (m) => { await ctx.onmessage({ data: m }); };
  const waitFor = async (id) => { for (let i = 0; i < 4000 && !out.find((o) => o.id === id); i++) await new Promise((r) => setTimeout(r, 5)); return out.find((o) => o.id === id); };
  return { ctx, send, waitFor };
}

{
  const tried = [];
  const w = makeWorker((u) => { tried.push(u); if (u.includes('binaries')) throw new Error('NetworkError'); vm.runInContext(soljson, w.ctx); });
  await w.send({ id: 1, type: 'load', urls: ['https://binaries.soliditylang.org/x.js', 'https://cdn.jsdelivr.net/npm/solc@0.8.24/soljson.js'] });
  const r = await w.waitFor(1);
  ok(r && r.ok, 'worker loads from the mirror when the first address fails: ' + JSON.stringify(r));
  ok(tried.length === 2 && tried[0].includes('binaries') && tried[1].includes('jsdelivr'), 'the addresses were tried in order');
  await w.send({ id: 2, type: 'compile', input: JSON.stringify({ language: 'Solidity', sources: { 'A.sol': { content: 'pragma solidity ^0.8.24; contract A { function f() external pure returns (uint) { return 7; } }' } }, settings: { outputSelection: { '*': { '*': ['abi'] } } } }) });
  const c = await w.waitFor(2);
  ok(c && c.ok && !(JSON.parse(c.output).errors || []).some((e) => e.severity === 'error') && JSON.parse(c.output).contracts['A.sol'].A.abi.length === 1, 'it compiles after the fallback');
}
{
  const w = makeWorker(() => { throw new Error('NetworkError'); });
  await w.send({ id: 1, type: 'load', urls: ['https://binaries.soliditylang.org/x.js', 'https://cdn.jsdelivr.net/y.js'] });
  const r = await w.waitFor(1);
  ok(r && !r.ok && /binaries\.soliditylang\.org/.test(r.error) && /cdn\.jsdelivr\.net/.test(r.error), 'worker error names both hosts: ' + (r && r.error));
}
{
  const w = makeWorker((u) => { vm.runInContext(soljson, w.ctx); });
  await w.send({ id: 1, type: 'load', url: 'https://binaries.soliditylang.org/x.js' });   // old single-address message still works
  const r = await w.waitFor(1);
  ok(r && r.ok, 'a single url (old message shape) still works');
}

/* ---- app: urls, main-thread fallback, readable error ---- */
const app = loadApp ? await loadApp() : null;
const ev = app.ev;
const urls = await ev("resolveSolcUrls('0.8.24')");
ok(urls.length === 2 && urls[0].startsWith('https://binaries.soliditylang.org/') && urls[1] === 'https://cdn.jsdelivr.net/npm/solc@0.8.24/soljson.js', 'two addresses: official first, mirror second: ' + urls);
ev("window.__tried = []; loadSolcScript = (v,u)=>{ window.__tried.push(u); return u.includes('binaries') ? Promise.reject(new Error('blocked')) : Promise.resolve(); }");
const used = await ev("loadSolcMainThread('0.8.24', resolveSolcUrls ? ['https://binaries.soliditylang.org/a.js','https://cdn.jsdelivr.net/b.js'] : [])");
ok(used === 'https://cdn.jsdelivr.net/b.js' && ev("window.__tried").length === 2, 'main thread falls back to the mirror');
ev("loadSolcScript = (v,u)=>Promise.reject(new Error('blocked'))");
let msg = '';
try { await ev("loadSolcMainThread('0.8.24', ['https://binaries.soliditylang.org/a.js','https://cdn.jsdelivr.net/b.js'])"); } catch (e) { msg = e.message; }
ok(/binaries\.soliditylang\.org or cdn\.jsdelivr\.net/.test(msg) && /VPN|ad-blocker/.test(msg), 'readable error when nothing can be downloaded: ' + msg);
ok(app.pageErrors.length === 0, 'no page errors: ' + app.pageErrors.join('|'));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
