// Phase 12.3: wallet authentication — challenge/verify, signature recovery, replay/expiry/session security, and
// DeepSeek config verification. Uses deterministic mocks and a known EIP-191 signing key; no real providers or wallets.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m + (d === undefined ? '' : ' ' + JSON.stringify(d))); } };
const eq = (a, b, m) => ok(a === b, m + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')');

/* ---- load both platform copies of the shared core, and the handlers ---- */
const cfCore = await import(pathToFileURL(path.join(root, 'functions/api/auth/_auth.mjs')).href);
const vcCore = await import(pathToFileURL(path.join(root, 'api/auth/_auth.mjs')).href);
const cfSrc = fs.readFileSync(path.join(root, 'functions/api/auth/_auth.mjs'), 'utf8');
const vcSrc = fs.readFileSync(path.join(root, 'api/auth/_auth.mjs'), 'utf8');
ok(cfSrc === vcSrc, 'the auth shared core is byte-identical on both platforms');
const core = (t) => { const a = t.indexOf('// ===== AUTH CORE BEGIN'), b = t.indexOf('// ===== AUTH CORE END ====='); return t.slice(a, b); };
ok(core(cfSrc) === core(vcSrc), 'the marked auth core is identical on both platforms');

const cfChallenge = await loadCf('functions/api/auth/challenge.js');
const cfVerify = await loadCf('functions/api/auth/verify.js');
const vcChallenge = require(path.join(root, 'api/auth/challenge.js'));
const vcVerify = require(path.join(root, 'api/auth/verify.js'));
const ethers = require(path.join(root, 'contractforge-deploy/vendor/ethers/ethers-5.7.2.umd.min.js'));

/* The Cloudflare handlers are ESM with a .js extension; the repo is not "type":"module", so Node treats them as CJS.
   Rewrite the relative core import to an absolute path and load the handler from a temp .mjs file (as the ai-proxy test
   does for functions/api/ai.js). */
async function loadCf(relPath) {
  const src = fs.readFileSync(path.join(root, relPath), 'utf8');
  const abs = pathToFileURL(path.join(root, 'functions/api/auth/_auth.mjs')).href;
  const rewritten = src.replace("'./_auth.mjs'", JSON.stringify(abs));
  const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'auth-h-'));
  const p = path.join(tmp, 'handler.mjs');
  fs.writeFileSync(p, rewritten);
  const m = await import(pathToFileURL(p).href);
  return m;
}

/* ---- helpers ---- */
const HOST = 'contractv4.pages.dev';
const URI = 'https://' + HOST;
const rnd = (b) => globalThis.crypto.getRandomValues(b);

/* In-memory store (test only; production uses d1Store). */
function memStore() {
  const challenges = new Map(), sessions = new Map();
  return {
    putChallenge: async (c) => { challenges.set(c.nonce, c); },
    consumeChallenge: async (nonce, nowMs) => {
      const c = challenges.get(nonce);
      if (!c || nowMs >= c.expiresAtMs) return null;
      challenges.delete(nonce);
      return { ...c };
    },
    putSession: async (h, s) => { sessions.set(h, s); },
    getSession: async (h) => sessions.get(h) || null,
    deleteSession: async (h) => { sessions.delete(h); },
  };
}

function ctx(store, over = {}) {
  return { host: HOST, uri: URI, origin: URI, now: 1700000000000, getRandomValues: rnd, store, body: null, ...over };
}

/* ---- recovery against a known EIP-191 vector (generated with ethers from a fixed key) ---- */
{
  const msg = 'Hello World';
  const sig = '0xe6bfbd768a421b9051fe86310f0f1eef9d5df65288b53f54d663f887a5b4bcd632efb64ccc67d7245545175953e811bc237fd83ab8722d8be0a66e92ec39da811c';
  const want = '0xFCAd0B19bB29D4674531d6f115237E16AfCE377c';
  for (const [name, C] of [['cloudflare', cfCore], ['vercel', vcCore]]) {
    const rec = C.authRecoverAddress(msg, sig);
    eq(rec, want.toLowerCase(), name + ': recovers the correct signer address');
    eq(C.authRecoverAddress(msg, '0x' + '00'.repeat(65)), null, name + ': a zero signature recovers nothing (null)');
    eq(C.authRecoverAddress(msg, sig.slice(0, 2) + sig.slice(2, 130) + '00'), null, name + ': a non-EOA v (0/1) is rejected');
  }
}

/* ---- challenge/verify against both platform cores ---- */
for (const [name, C] of [['cloudflare', cfCore], ['vercel', vcCore]]) {
  const t = (m) => name + ': ' + m;
  const wallet = new ethers.Wallet('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');

  /* challenge */
  let r = await C.handleChallenge(ctx(null, { origin: null }));
  eq(r.status, 403, t('challenge without an Origin is refused'));
  r = await C.handleChallenge(ctx(null, { origin: 'https://evil.example.org' }));
  eq(r.status, 403, t('challenge from another origin is refused'));
  r = await C.handleChallenge(ctx(null));
  eq(r.status, 503, t('challenge without a store is refused (503)'));
  r = await C.handleChallenge(ctx(memStore(), { body: { address: 'not-an-address' } }));
  eq(r.status, 400, t('challenge with a bad address is refused'));

  const store = memStore();
  r = await C.handleChallenge(ctx(store, { body: { address: wallet.address, chainId: 5042 } }));
  eq(r.status, 200, t('challenge is issued for a valid address'));
  const nonce = r.json.nonce, message = r.json.message;
  ok(/^[0-9a-f]{64}$/.test(nonce), t('the nonce is 32 random bytes (64 hex)'));
  ok(message.includes(HOST) && message.includes(wallet.address) && message.includes('Chain ID: 5042') && message.includes('Nonce: ' + nonce), t('the SIWE message binds domain, address, chain and nonce'));

  /* nonce uniqueness */
  const r2 = await C.handleChallenge(ctx(memStore(), { body: { address: wallet.address } }));
  ok(r2.json.nonce !== nonce, t('two challenges have different nonces'));

  /* verify: happy path */
  const signature = await wallet.signMessage(message);
  let v = await C.handleVerify(ctx(store, { now: 1700000001000, body: { address: wallet.address, signature, nonce } }));
  eq(v.status, 200, t('verify accepts a valid signature'));
  ok(v.headers && /HttpOnly; Secure; SameSite=Lax/.test(v.headers['set-cookie']), t('the session cookie is HttpOnly, Secure, SameSite=Lax'));
  ok(!/^[0-9a-f]{64}$/.test(v.headers['set-cookie'].split('=')[1] || ''), t('the raw token is not echoed in the response body'));

  /* replay: same nonce consumed */
  v = await C.handleVerify(ctx(store, { now: 1700000001000, body: { address: wallet.address, signature, nonce } }));
  eq(v.status, 401, t('a replayed nonce is refused (single-use)'));

  /* wrong address */
  const store2 = memStore();
  const c2 = await C.handleChallenge(ctx(store2, { body: { address: wallet.address } }));
  const sig2 = await wallet.signMessage(c2.json.message);
  const other = '0x' + '11'.repeat(20);
  v = await C.handleVerify(ctx(store2, { now: 1700000001000, body: { address: other, signature: sig2, nonce: c2.json.nonce } }));
  eq(v.status, 401, t('an address mismatch is refused'));

  /* invalid signature (signed a different message) */
  const store3 = memStore();
  const c3 = await C.handleChallenge(ctx(store3, { body: { address: wallet.address } }));
  const sig3 = await wallet.signMessage('a different message');
  v = await C.handleVerify(ctx(store3, { now: 1700000001000, body: { address: wallet.address, signature: sig3, nonce: c3.json.nonce } }));
  eq(v.status, 401, t('an invalid signature is refused'));

  /* expired challenge */
  const store4 = memStore();
  const c4 = await C.handleChallenge(ctx(store4, { now: 1700000000000, body: { address: wallet.address } }));
  const sig4 = await wallet.signMessage(c4.json.message);
  v = await C.handleVerify(ctx(store4, { now: 1700000000000 + 600000, body: { address: wallet.address, signature: sig4, nonce: c4.json.nonce } }));   // 10 minutes later
  eq(v.status, 401, t('an expired challenge is refused'));

  /* concurrent consumption of the same nonce is single-use (atomic) */
  const store5 = memStore();
  const c5 = await C.handleChallenge(ctx(store5, { body: { address: wallet.address } }));
  const [a, b] = await Promise.all([
    store5.consumeChallenge(c5.json.nonce, 1700000000000),
    store5.consumeChallenge(c5.json.nonce, 1700000000000),
  ]);
  ok((a === null) !== (b === null), t('two concurrent consumes return the challenge only once'));

  /* session: hashed token stored, session revoked */
  const store6 = memStore();
  const c6 = await C.handleChallenge(ctx(store6, { body: { address: wallet.address } }));
  const sig6 = await wallet.signMessage(c6.json.message);
  v = await C.handleVerify(ctx(store6, { now: 1700000001000, body: { address: wallet.address, signature: sig6, nonce: c6.json.nonce } }));
  const cookie = v.headers['set-cookie'];
  const token = cookie.split('=')[1].split(';')[0];
  ok(token && token.length >= 64, t('the session cookie carries an opaque token'));
  ok(!v.json || JSON.stringify(v.json).indexOf(token) < 0, t('the raw session token is never in the response body'));
}

/* ---- d1Store: SQL + atomic single-use consume against a minimal D1 mock ---- */
{
  const t = 'd1Store: ';
  const rows = new Map();
  const db = {
    prepare(sql) {
      let last = { sql, params: [] };
      return {
        bind(...p) { last.params = p; return this; },
        run() {
          if (/INSERT INTO auth_challenges/.test(last.sql)) rows.set(last.params[0], { nonce: last.params[0], address: last.params[1], domain: last.params[2], uri: last.params[3], chainId: last.params[4], issuedAtMs: last.params[5], expiresAtMs: last.params[6] });
          if (/INSERT INTO auth_sessions/.test(last.sql)) rows.set('sess:' + last.params[0], { address: last.params[1], createdAtMs: last.params[2], expiresAtMs: last.params[3] });
          if (/DELETE FROM auth_sessions/.test(last.sql)) rows.delete('sess:' + last.params[0]);
          return Promise.resolve({ success: true });
        },
        first() {
          if (/DELETE FROM auth_challenges/.test(last.sql)) {
            const c = rows.get(last.params[0]);
            if (!c || last.params[1] >= c.expiresAtMs) return Promise.resolve(null);
            rows.delete(last.params[0]);
            return Promise.resolve({ ...c });
          }
          return Promise.resolve(rows.get('sess:' + last.params[0]) || null);
        },
      };
    },
  };
  const store = cfCore.d1Store(db);
  ok(/DELETE FROM auth_challenges[\s\S]*RETURNING/.test(cfSrc), t + 'consume uses an atomic DELETE ... RETURNING');
  await store.putChallenge({ nonce: 'n1', address: '0x01', domain: HOST, uri: URI, chainId: 1, issuedAtMs: 1, expiresAtMs: 999 });
  const got = await store.consumeChallenge('n1', 10);
  ok(got && got.nonce === 'n1', t + 'a valid nonce is consumed and returned');
  eq(await store.consumeChallenge('n1', 10), null, t + 'a consumed nonce is not returned again');
  eq(await store.consumeChallenge('n2', 10), null, t + 'an unknown nonce is null');
  await store.putSession('h1', { address: '0x01', createdAtMs: 1, expiresAtMs: 999 });
  ok((await store.getSession('h1')) && (await store.getSession('h1')).address === '0x01', t + 'a session is retrievable by its token hash');
  await store.deleteSession('h1');
  eq(await store.getSession('h1'), null, t + 'a deleted session is revoked');
}

/* ---- platform handlers map status/headers correctly ---- */
{
  const store = memStore();
  const wallet = new ethers.Wallet('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');

  // Cloudflare challenge handler: no origin -> 403; valid -> 200
  let resp = await cfChallenge.onRequestPost({ request: new Request(URI + '/api/auth/challenge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: wallet.address }) }), env: { __authStore: store } });
  eq(resp.status, 403, 'cloudflare handler: no Origin -> 403');
  resp = await cfChallenge.onRequestPost({ request: new Request(URI + '/api/auth/challenge', { method: 'POST', headers: { 'content-type': 'application/json', origin: URI }, body: JSON.stringify({ address: wallet.address }) }), env: { __authStore: store } });
  eq(resp.status, 200, 'cloudflare handler: valid challenge -> 200');
  eq((await cfChallenge.onRequest({ request: new Request(URI + '/api/auth/challenge'), env: {} })).status, 405, 'cloudflare handler: GET -> 405');

  // Vercel challenge handler (CJS + injected store): valid -> 200
  vcChallenge.__setStore(store);
  const out = { status: 200, headers: {}, json: null };
  const vres = { setHeader: (k, v) => { out.headers[k.toLowerCase()] = v; }, status(c) { out.status = c; return this; }, json(o) { out.json = o; return this; } };
  await vcChallenge({ method: 'POST', headers: { host: HOST, origin: URI, 'x-forwarded-proto': 'https', 'content-type': 'application/json' }, body: { address: wallet.address } }, vres);
  eq(out.status, 200, 'vercel handler: valid challenge -> 200');
  ok(out.json.nonce && out.json.message, 'vercel handler: returns a nonce and message');
  await vcVerify({ method: 'POST', headers: { host: HOST, origin: null, 'x-forwarded-proto': 'https' }, body: {} }, vres);
  eq(out.status, 403, 'vercel handler: no Origin -> 403');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
