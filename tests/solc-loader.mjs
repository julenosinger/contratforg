/* The self-hosted compiler: the worker loads the vendored file same-origin, checks its sha256 against
   vendor/MANIFEST.json before running it, refuses on a mismatch, and never falls back to a remote host.
   It also proves the app only accepts the pinned version. */
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadApp } from './harness.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m); } };

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const workerSrc = fs.readFileSync(path.join(repo, 'contractforge-deploy/solc-worker.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(repo, 'contractforge-deploy/vendor/MANIFEST.json'), 'utf8'));
const soljson = fs.readFileSync(path.join(repo, 'contractforge-deploy/vendor', manifest.solc.file));           // Buffer

const toArrayBuffer = (buf) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

function makeWorker(fetchImpl) {
  const out = [], fetched = [];
  const ctx = vm.createContext({
    self: null, postMessage: (m) => out.push(m), location: { href: 'http://x/solc-worker.js' },
    importScripts: (u) => { fetched.push(u); vm.runInContext(soljson.toString('utf8'), ctx); },
    fetch: async (u) => { fetched.push(u); return fetchImpl(u); },
    crypto: { subtle: { digest: async (_alg, buf) => toArrayBuffer(crypto.createHash('sha256').update(new Uint8Array(buf)).digest()) } },
    WebAssembly, TextDecoder, TextEncoder, atob, btoa, setTimeout, clearTimeout, console, URL,
    URLSearchParams, Uint8Array, ArrayBuffer, Math, Date, Promise, Error, process: undefined,
  });
  ctx.self = ctx; ctx.global = ctx;
  vm.runInContext(workerSrc, ctx);
  const send = async (m) => { await ctx.onmessage({ data: m }); };
  const waitFor = async (id) => { for (let i = 0; i < 4000 && !out.find((o) => o.id === id); i++) await new Promise((r) => setTimeout(r, 5)); return out.find((o) => o.id === id); };
  return { send, waitFor, fetched };
}

const fetchVendor = (manifestOverride) => async (u) => {
  const s = String(u);
  if (s.includes('MANIFEST.json')) return { json: async () => manifestOverride || manifest };
  if (s.includes(manifest.solc.file.split('/').pop())) return { ok: true, arrayBuffer: async () => toArrayBuffer(soljson) };
  throw new Error('unexpected fetch: ' + s);
};

{
  const w = makeWorker(fetchVendor());
  await w.send({ id: 1, type: 'load' });
  const r = await w.waitFor(1);
  ok(r && r.ok, 'worker loads the self-hosted compiler: ' + JSON.stringify(r && r.error));
  ok(w.fetched.every((u) => !/^https?:/.test(u)), 'the worker only fetched same-origin paths: ' + w.fetched.join(', '));
  await w.send({ id: 2, type: 'compile', input: JSON.stringify({ language: 'Solidity', sources: { 'A.sol': { content: 'pragma solidity ^0.8.24; contract A { function f() external pure returns (uint) { return 7; } }' } }, settings: { outputSelection: { '*': { '*': ['abi'] } } } }) });
  const c = await w.waitFor(2);
  ok(c && c.ok && JSON.parse(c.output).contracts['A.sol'].A.abi.length === 1, 'it compiles after the integrity check');
}

{
  const bad = { ...manifest, solc: { ...manifest.solc, sha256: '0'.repeat(64) } };
  const w = makeWorker(fetchVendor(bad));
  await w.send({ id: 1, type: 'load' });
  const r = await w.waitFor(1);
  ok(r && !r.ok && /integrity check failed/i.test(r.error), 'a sha256 mismatch is refused: ' + (r && r.error));
}

{
  const w = makeWorker(fetchVendor());
  await w.send({ id: 1, type: 'compile', input: '{}' });
  const r = await w.waitFor(1);
  ok(r && !r.ok && /not loaded/.test(r.error), 'compiling before load is refused: ' + (r && r.error));
}

/* vendor integrity is checked in tests/vendor.mjs */

/* app: only the pinned version compiles */
{
  const app = loadApp();
  let msg = '';
  try { await app.ev("ensureSolcLoaded('0.8.20')"); } catch (e) { msg = e.message; }
  ok(/Only solc 0\.8\.24 is supported/.test(msg), 'a different version is refused with an explicit error: ' + msg);
  ok(app.pageErrors.length === 0, 'no page errors: ' + app.pageErrors.join('|'));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
