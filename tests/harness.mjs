// Shared test harness: loads the real app (index.html + app.js) in a simulated browser.
import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../contractforge-deploy');

export function loadApp({ alerts, storage, realEthers } = {}) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/<script[^>]*src=[^>]*><\/script>/g, '');
  const order = ['handlers.js', 'app.js', 'multichain.js', 'multideploy.js', 'maturity.js', 'required.js', 'playground.js', 'lab.js', 'ui.js'].filter((f) => fs.existsSync(path.join(root, f)));
  const files = order.map((f) => fs.readFileSync(path.join(root, f), 'utf8'));
  const pageErrors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => pageErrors.push(e.detail?.message || e.message));
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/' });
  const w = dom.window;
  for (const [k, v] of Object.entries(storage || {})) w.localStorage.setItem(k, v);
  w.alert = (m) => { if (alerts) alerts.push(String(m)); };
  w.confirm = () => true;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.scrollTo = () => {};
  if (realEthers) {
    w.fetch = (url, init = {}) => { const { method, headers, body } = init; return fetch(url, { method, headers, body }); }; w.Headers = Headers; w.Request = Request; w.Response = Response; // jsdom has no fetch; a real browser does
    w.eval(fs.readFileSync(path.resolve(root, '../tests/node_modules/ethers/dist/ethers.umd.min.js'), 'utf8'));
  } else {
    w.ethers = { utils: {}, providers: {}, Contract: class {}, ContractFactory: class {} };
  }
  for (const src of files) { // separate classic scripts, in page order: top-level let/const stay global like in a browser
    const el = w.document.createElement('script');
    el.textContent = src;
    w.document.body.appendChild(el);
  }
  return { w, ev: (c) => w.eval(c), set: (id, v) => { w.document.getElementById(id).value = v; }, pageErrors };
}

// Deterministic digits-only address per field id (letters would need a valid checksum),
// so the same field gets the same address on every network and in every run.
export function resetFakeAddr() { /* kept for callers; addresses no longer depend on call order */ }
export function addrFor(key) {
  let h = 2166136261;
  for (const ch of String(key)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  let out = '';
  while (out.length < 40) { h = (Math.imul(h, 1103515245) + 12345) >>> 0; out += String(h).padStart(10, '0'); }
  return '0x' + out.slice(0, 40);
}

// Address fields have no default (empty = placeholder that intentionally does not compile).
export function fillAddresses({ w, ev }, net) {
  const doc = w.document;
  doc.querySelectorAll('input, textarea').forEach((el) => {
    if (el.value) return;
    const isCctp = /^cc_(tokenmessenger|msgtransmitter)$/.test(el.id);
    if (isCctp) { if (!ev(`NETWORKS['${net}'].cctp.tokenMessenger`)) el.value = addrFor(el.id); return; }
    if ((el.getAttribute('placeholder') || '').includes('0x') && !/^cc_/.test(el.id)) el.value = addrFor(el.id);
  });
  const signers = doc.getElementById('tre_signers');
  if (signers) signers.value = [0, 1, 2].map((i) => addrFor('tre_signers' + i)).join('\n');
}

export const SIMPLE = ['erc20', 'erc721', 'escrow', 'vesting', 'paywall', 'dao', 'smartwallet', 'staking'];
export const ADVANCED = ['genTreasury', 'genVault', 'genMultisend', 'genCrosschain'];
export const SWAP_VARIANTS = [['amm', 'single'], ['amm', 'factory'], ['orderbook', 'single'], ['orderbook', 'factory']];

// Runs every generator once on the active network; yields { label, name, code } (or { label, error }).
export function* generateAll(app, net) {
  const { ev, set } = app;
  ev(`activeNetwork = '${net}';`);
  const run = (label, fn) => {
    try {
      ev("pendingSource = { name:'', code:'' };");
      fn();
      const { name, code } = JSON.parse(ev('JSON.stringify(pendingSource)'));
      return code ? { label, name, code } : { label, error: 'generator produced no code' };
    } catch (e) { return { label, error: e.message }; }
  };
  for (const id of SIMPLE) yield run(`simple-${id}`, () => { ev(`renderSimpleForm('${id}');`); fillAddresses(app, net); ev(`genSimple('${id}');`); });
  for (const fn of ADVANCED) yield run(fn, () => { fillAddresses(app, net); ev(`${fn}();`); });
  for (const m of ['native', 'both']) {   // the default (tokens only) is covered above
    yield run(`genMultisend-${m}`, () => { fillAddresses(app, net); set('ms_mode', m); ev('genMultisend();'); set('ms_mode', 'erc20'); });
  }
  for (const [kind, multi] of SWAP_VARIANTS) {
    yield run(`swap-${kind}-${multi}`, () => { set('swap_kind', kind); set('swap_multi', multi); fillAddresses(app, net); ev('genSwap();'); });
  }
}
