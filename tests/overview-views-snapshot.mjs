// Phase 12.0: the Deploy, Verify, Share and Wizard overviews drawn in 67 states (16-network samples, drafts, constructor arguments, Multi-deploy, exact and unverified
// deployments, a submitted verification, wizard choices in both modes). Each state's HTML is hashed and compared with fixtures/overview-views.json, so a change to
// the shared row/step writers (or to any of these four views) that alters even one character fails here. After an INTENDED change, run
//   node overview-views-snapshot.mjs --update
// and review the diff of the fixture.
import { loadApp, addrFor } from './harness.mjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(here, 'fixtures', 'overview-views.json');
const A = addrFor('a1'), B = addrFor('b2'), C = addrFor('c3');
const out = {};
const tick = () => new Promise((r) => setTimeout(r, 0));
function fresh() {
  const a = loadApp(); const d = a.w.document; a.w.alert = () => {};
  a.w.ethers.utils = { keccak256: (x) => '0x' + String(x).length };
  a.w.fetch = async () => ({ json: async () => ({ status: '1', result: 'GUID-9' }) });
  const settle = async () => { await tick(); await tick(); await tick(); };
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await settle(); };
  const net = async (k) => { a.ev(`activeNetwork = '${k}'; updateSideNet();`); await settle(); };
  return { ...a, d, settle, go, net };
}
const grab = (a, tag) => { out[tag] = ['dplSummary', 'dplProgress', 'dplReady', 'verSummary', 'verProgress', 'shrSummary', 'shrNotes', 'wzSummaryList', 'wzNotes'].map((id) => { const e = a.d.getElementById(id); return id + ':' + (e ? e.innerHTML : 'MISSING'); }).join('\n'); };
{
  const a = fresh(); await a.go('deploy'); grab(a, 'empty-deploy'); await a.go('verify'); grab(a, 'empty-verify'); await a.go('share'); grab(a, 'empty-share'); await a.go('wizard'); grab(a, 'empty-wizard');
}
for (const k of ['arc', 'arcMain', 'sepolia', 'ethereum', 'robinhood', 'bnb']) {
  const a = fresh(); await a.net(k); a.ev("renderSimpleForm('erc20'); genSimple('erc20')");
  for (const s of ['deploy', 'verify', 'share']) { await a.go(s); grab(a, `erc20-${k}-${s}`); }
  a.ev(`account = '${A}'; signer = {}`); await a.go('deploy'); grab(a, `erc20-${k}-deploy-wallet`);
  await a.go('verify'); a.d.getElementById('ver_address').value = A; a.d.getElementById('ver_address').dispatchEvent(new a.w.Event('input', { bubbles: true })); a.d.getElementById('ver_apikey').value = 'K'; a.d.getElementById('ver_apikey').dispatchEvent(new a.w.Event('input', { bubbles: true })); await a.settle(); grab(a, `erc20-${k}-verify-filled`);
}
{
  const a = fresh(); await a.net('sepolia'); a.d.getElementById('tre_signers').value = ''; a.ev('genTreasury()'); await a.go('deploy'); grab(a, 'draft-deploy'); await a.go('share'); grab(a, 'draft-share');
  a.ev("setMultichainMode('portable'); renderSimpleForm('escrow')"); a.d.getElementById('s_buyer').value = A; a.d.getElementById('s_seller').value = B; a.d.getElementById('s_arbiter').value = C; a.ev("genSimple('escrow')"); await a.go('deploy'); grab(a, 'ctor-deploy'); await a.go('verify'); grab(a, 'ctor-verify'); await a.go('share'); grab(a, 'ctor-share');
  a.ev("setMultichainMode('multi')"); await a.go('home'); await a.go('deploy'); a.ev("toggleMdNetwork('arc'); toggleMdNetwork('base')"); await a.settle(); grab(a, 'multi-deploy');
}
{
  const a = fresh(); await a.net('sepolia'); a.ev("renderSimpleForm('erc20'); genSimple('erc20')"); await a.go('deploy'); const name = a.ev('pendingSource.name');
  a.ev('uiResetDeployResults()'); a.ev(`uiAddDeployResult({ name: '${name}', network: 'sepolia', address: '${A}', txHash: '0x1', bytecodeKeccak256: '0x${'1'}' })`); await a.settle(); grab(a, 'deployed-exact');
  await a.go('verify'); a.d.getElementById('ver_address').value = A; a.d.getElementById('ver_apikey').value = 'K'; a.d.querySelector('[data-onclick="verifyContract()"]').click(); await a.settle(); await a.settle(); grab(a, 'verify-submitted');
  a.ev("window.__lastCompiledABI = [{type:'constructor',inputs:[]}]; window.__lastCompiledBytecode='0x00'"); await a.go('share'); a.ev('generateShareUrl()'); await a.settle(); grab(a, 'share-artifact');
}
for (const [cat, sub] of [['token', 'erc20'], ['defi', 'swap'], ['defi', 'vault'], ['org', 'dao'], ['bridge', 'crosschain'], ['wallet', 'smartwallet']]) {
  for (const k of ['arc', 'arcMain']) { for (const m of ['single', 'portable']) {
    const a = fresh(); await a.net(k); a.ev(`setMultichainMode('${m}')`); a.ev(`wizardState.category='${cat}'; wizardState.subtype='${sub}'; wizardState.step=2; renderWizardStep()`); await a.go('wizard'); a.ev('wzRender()'); grab(a, `wiz-${cat}-${sub}-${k}-${m}`);
  } }
}
const hash = (x) => crypto.createHash('sha256').update(x).digest('hex').slice(0, 16);
const now = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, hash(v)]));
if (process.argv.includes('--update')) { fs.writeFileSync(FIX, JSON.stringify(now, null, 1) + '\n'); console.log('fixture written:', Object.keys(now).length, 'states'); process.exit(0); }
const want = JSON.parse(fs.readFileSync(FIX, 'utf8'));
const bad = [...new Set([...Object.keys(now), ...Object.keys(want)])].filter((k) => now[k] !== want[k]);
if (bad.length) { console.log('FAIL  these states draw different HTML than the fixture:', bad.join(', ')); console.log(`\n${Object.keys(now).length - bad.length} passed, ${bad.length} failed`); process.exit(1); }
console.log(`\n${Object.keys(now).length} passed, 0 failed`);
