// Phase 10.2: Verify on Explorer (section 12). verifyContract() and checkVerificationStatus() are unchanged: same fields, same request. The page now shows
// an overview and real progress beside the form. These tests prove: the request is exactly the one the page always sent, nothing is sent until you press
// Submit, the API key is never shown, stored or logged by the new code, the explorer support and compiler facts come from the application's own tables on
// all 16 networks, "same code as your deployment" is only claimed for the exact source this page deployed, and the progress follows the explorer's real answers.
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root, addrFor } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
const A = addrFor('a1'), B = addrFor('b2');
const KEY = 'SECRETKEY1234567890abcdef';

function fresh() {
  const a = loadApp(); const d = a.w.document;
  const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
  a.w.alert = () => {};
  const calls = []; let answer = { status: '1', result: 'GUID-1' }, fail = null;
  a.w.fetch = async (url, opts) => { calls.push({ url: String(url), opts: opts || {} }); if (fail) throw new Error(fail); const r = typeof answer === 'function' ? answer(url, opts) : answer; return { json: async () => r }; };
  const ctl = { set: (x) => { answer = x; }, fail: (m) => { fail = m; } };
  const settle = async () => { await tick(); await tick(); await tick(); };
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await settle(); };
  const net = async (k) => { a.ev(`activeNetwork = '${k}'; updateSideNet();`); await settle(); };
  const setv = async (id, v) => { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new a.w.Event('input', { bubbles: true })); await settle(); };
  const rows = () => Object.fromEntries([...d.querySelectorAll('#verSummary .bld-row')].map((r) => [r.querySelector('dt').textContent, { text: r.querySelector('dd').childNodes[0] ? r.querySelector('dd').childNodes[0].textContent : '', flag: (r.querySelector('.bld-flag') || {}).textContent || '', state: r.dataset.state }]));
  const prog = () => Object.fromEntries([...d.querySelectorAll('#verProgress li')].map((l) => [l.querySelector('b').textContent, { state: l.dataset.state, text: l.querySelector('.bld-t').textContent }]));
  const log = () => [...d.querySelectorAll('#verifyLog .line .msg')].map((m) => m.textContent);
  const gen = () => a.ev("renderSimpleForm('erc20'); genSimple('erc20')");
  const click = async (sel) => { d.querySelector(sel).click(); await settle(); await settle(); };
  return { ...a, d, calls, ctl, go, net, setv, rows, prog, log, gen, click, settle };
}
const NETS = (a) => JSON.parse(a.ev('JSON.stringify(Object.entries(NETWORKS).map(([k, n]) => [k, n.label, !!n.isMainnet, n.explorerApi || ""]))'));

/* 1. the page: ids, handlers, defaults and the log are as they were */
{
  const a = fresh(); const { d } = a;
  for (const id of ['ver_address', 'ver_apikey', 'ver_compiler', 'ver_runs', 'ver_constructor', 'verifyLog']) ok(!!d.getElementById(id), 'id: ' + id);
  eq([d.getElementById('ver_apikey').type, d.getElementById('ver_apikey').getAttribute('autocomplete'), d.getElementById('ver_compiler').value, d.getElementById('ver_runs').value, d.getElementById('ver_runs').type, d.getElementById('ver_address').placeholder], ['password', 'off', 'v0.8.24+commit.e11b9ed9', '200', 'number', '0x...'], 'the fields keep their types and defaults (the key is a password field, never autofilled)');
  eq([...d.querySelectorAll('#sec-verify .bld-actions [data-onclick]')].map((b) => b.textContent + ':' + b.getAttribute('data-onclick')), ['Submit Verification:verifyContract()', 'Check Status:checkVerificationStatus()'], 'Submit and Check Status keep their handlers');
  eq(d.querySelector('#verifyLog .line .msg').textContent, 'Deploy a contract first, then submit verification.', 'the log keeps its first line');
  ok(['ver_address', 'ver_apikey', 'ver_compiler', 'ver_runs', 'ver_constructor'].every((id) => !!d.querySelector(`label[for="${id}"]`)), 'every field has a label');
  eq([...d.getElementById('sec-verify').outerHTML.matchAll(/\son[a-z]+="/gi)].length, 0, 'csp: no inline handler');
  eq(d.querySelector('#sec-verify .section-head h2').textContent, 'Verify on Explorer', 'the heading is unchanged');
  const vs = css.slice(css.indexOf('/* ---- Verify on Explorer (section 12)'), css.indexOf('/* ---- Compile & Deploy workspace (Phase 9.8)'));
  const sels = []; vs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (_, __, s) => { sels.push(...s.split(',').map((x) => x.trim())); return ''; });
  eq(sels.filter((s) => s && !s.startsWith('@') && !/^\.bld#sec-verify(?![\w-])/.test(s)), [], 'css: every new rule is scoped to #sec-verify');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 2. explorer support, mainnet and the compiler facts on all 16 networks */
{
  const a = fresh(); const { d } = a; a.gen(); await a.go('verify');
  const nets = NETS(a), supported = nets.filter((n) => n[3]).map((n) => n[1]);
  eq([nets.length, supported.length], [16, 12], '16 networks, 12 with an explorer API (7 mainnets and 5 testnets)');
  eq(nets.filter((n) => !n[3]).map((n) => n[0]).sort(), ['arc', 'arcMain', 'robinhood', 'robinhoodMain'], 'the four without one are the Arc and Robinhood networks');
  for (const [k, label, main, api] of nets) {
    await a.net(k); const r = a.rows();
    eq([r.Network.text, !!r.Network.flag], [label + ' (' + a.ev(`NETWORKS.${k}.chainIdDec`) + ')', main], `${k}: the network and the mainnet warning`);
    if (api) eq([r['Explorer API'].state, r['Explorer API'].text, r['Explorer API'].flag], ['ok', new URL(api).host, 'Etherscan-style verification'], `${k}: the explorer API host`);
    else eq([r['Explorer API'].state, r['Explorer API'].text, r['Explorer API'].flag], ['bad', 'Not available here', 'Available on: ' + supported.join(', ')], `${k}: not available, and the real list of networks that are`);
    eq(/has no explorer API here/.test(a.prog()['Ready to submit'].text), !api, `${k}: "ready" names the missing API only where it is missing`);
  }
  // the page's own refusal now names the real list
  await a.net('arc'); await a.setv('ver_address', A); await a.setv('ver_apikey', KEY);
  await a.click('[data-onclick="verifyContract()"]');
  const msg = a.log().find((m) => /not yet available/.test(m));
  eq(msg, 'Source verification is not yet available for Arc Testnet. Supported: ' + supported.join(', ') + '.', 'the page\'s refusal on an unsupported network lists the networks that really are supported');
  eq(a.calls.length, 0, 'and sends nothing');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 3. the form: what is checked and what is said, from the application's own facts */
{
  const a = fresh(); const { d } = a; a.gen(); await a.net('sepolia'); await a.go('verify');
  eq([a.rows().Contract.text, a.rows().Compiler.state, a.rows().Optimizer.state, a.rows()['API key'].state, a.rows().Address.state, a.rows().Constructor.text], [a.ev('pendingSource.name') + '.sol', 'ok', 'ok', 'missing', 'missing', 'None entered'], 'start: the contract, the default compiler and optimizer are fine; the address and the key are missing');
  eq([a.prog()['Ready to submit'].state, a.prog()['Ready to submit'].text], ['todo', 'Still needed: enter the deployed address; enter the explorer API key.'], 'ready lists exactly what is missing');
  await a.setv('ver_address', '0x123'); eq([a.rows().Address.state, a.rows().Address.flag, d.getElementById('verAddrNote').hidden], ['bad', 'Not a valid address', false], 'a bad address is said so');
  await a.setv('ver_address', A); await a.setv('ver_apikey', KEY);
  eq([a.prog()['Ready to submit'].state, a.rows()['API key'].text, a.rows().Address.flag], ['done', 'Entered', 'Not in this browser\'s records'], 'everything filled: ready; an address the browser has no record of is just said so');
  await a.setv('ver_compiler', 'v0.8.20+commit.a1b79de6'); eq([a.rows().Compiler.state, /another version will not match/.test(a.rows().Compiler.flag), d.getElementById('verCompilerNote').hidden], ['bad', true, false], 'another compiler version: flagged against solc ' + a.ev('SOLC_VERSION'));
  await a.setv('ver_compiler', 'v0.8.24+commit.e11b9ed9');
  await a.setv('ver_runs', '1000'); eq([a.rows().Optimizer.state, a.rows().Optimizer.text, d.getElementById('verRunsNote').hidden], ['bad', 'On, 1000 runs', false], 'other optimizer runs: flagged (the app compiles with 200)');
  await a.setv('ver_runs', '200');
  await a.setv('ver_constructor', '0xabc'); eq([a.rows().Constructor.state, a.rows().Constructor.text], ['bad', 'Not valid hex'], 'an odd number of hex digits: not valid');
  await a.setv('ver_constructor', '0x' + '00'.repeat(32)); eq([a.rows().Constructor.state, a.rows().Constructor.text], ['ok', '32 bytes'], 'valid hex is counted in bytes');
  await a.setv('ver_constructor', '');
  // a contract that takes constructor arguments
  a.ev("setMultichainMode('portable'); renderSimpleForm('escrow')"); d.getElementById('s_buyer').value = A; d.getElementById('s_seller').value = B; d.getElementById('s_arbiter').value = addrFor('c3'); a.ev("genSimple('escrow')"); await a.go('home'); await a.go('verify');
  eq([a.rows().Constructor.state, /takes 1 argument/.test(a.rows().Constructor.flag)], ['missing', true], 'a contract with a constructor argument and none pasted: said so');
  await a.setv('ver_address', ''); await a.setv('ver_apikey', '');
  eq(a.rows().Contract.text, a.ev('pendingSource.name') + '.sol', 'the contract row follows the buffer');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 4. "same code as your deployment" is claimed only for the exact source this page deployed */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); a.gen(); await a.go('verify');
  const name = a.ev('pendingSource.name');
  await a.setv('ver_address', A);
  eq([a.rows().Source.state, /cannot tell/.test(a.rows().Source.flag)], ['missing', true], 'an address with no record: "not confirmed", the page cannot tell');
  a.ev(`addToDeployHistory({ name: '${name}', address: '${A}', network: 'sepolia', abi: [], txHash: '0x1' })`); await a.settle();
  eq([a.rows().Address.flag, a.rows().Source.state], ['Found in the deploy history on Ethereum Sepolia', 'missing'], 'a history record makes the address known but not the source exact (history keeps no source)');
  a.ev('uiResetDeployResults()'); await a.settle();                                   // the page does this at the start of a run
  a.ev(`uiAddDeployResult({ name: '${name}', network: 'sepolia', address: '${A}', txHash: '0x2' })`); await a.settle();
  eq([a.rows().Address.flag, a.rows().Source.state, a.rows().Source.text], ['Deployed from this page on Ethereum Sepolia', 'ok', 'Same code as your deployment'], 'a run this page saw, with this source and this address: exact');
  await a.go('home'); a.ev("document.getElementById('s_supply').value = '7'; genSimple('erc20')"); await a.go('verify');
  eq([a.rows().Source.state, /not the one this page deployed/.test(a.rows().Source.flag)], ['missing', true], 'the same name with different code: not confirmed, and it says why');
  await a.go('home'); a.ev("document.getElementById('s_supply').value = '1000000'; genSimple('erc20')"); await a.go('verify');
  eq(a.rows().Source.state, 'ok', 'the identical source again: exact again');
  await a.setv('ver_address', B); eq(a.rows().Source.state, 'missing', 'another address: not confirmed');
  await a.net('base'); await a.setv('ver_address', A); eq(a.rows().Address.flag.startsWith('Not in this browser'), true, 'the same address on another network is a different contract here');
}

/* 5. "Use the latest deployment": an explicit action that never replaces what you typed */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); a.gen(); await a.go('verify');
  eq(d.getElementById('verUseLatest').hidden, true, 'no deployment on this network: the button is hidden');
  a.ev(`addToDeployHistory({ name: 'H', address: '${A}', network: 'sepolia', abi: [], txHash: '0x1' })`); await a.go('home'); await a.go('verify');
  eq([d.getElementById('verUseLatest').hidden, /from the deploy history/.test(d.getElementById('verLatestNote').textContent)], [false, true], 'a history record on this network: offered, and it says where it comes from');
  eq(d.getElementById('ver_address').value, '', 'nothing is filled in by itself');
  await a.click('#verUseLatest'); eq(d.getElementById('ver_address').value, A, 'clicking fills the empty field');
  await a.setv('ver_address', B); await a.click('#verUseLatest'); eq(d.getElementById('ver_address').value, B, 'a different address you typed is not replaced');
  a.ev('uiResetDeployResults()'); a.ev(`uiAddDeployResult({ name: 'X', network: 'sepolia', address: '${addrFor('d4')}', txHash: '0x3' })`); await a.settle(); await a.setv('ver_address', '');
  await a.click('#verUseLatest'); eq(d.getElementById('ver_address').value, addrFor('d4'), 'a deployment made on this page is preferred');
  await a.net('base'); eq(d.getElementById('verUseLatest').hidden, true, 'another network: nothing to offer');
  eq(a.calls.length, 0, 'and none of this sent anything');
}

/* 6. the request is the one the page always sent, and nothing is sent before Submit */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); a.gen(); await a.go('verify');
  await a.setv('ver_address', A); await a.setv('ver_apikey', KEY); await a.setv('ver_constructor', '0xdead'); await a.setv('ver_compiler', 'v0.8.24+commit.e11b9ed9');
  for (const s of ['home', 'swap', 'history', 'verify']) await a.go(s);
  eq(a.calls.length, 0, 'typing, navigating and redrawing sent nothing');
  const name = a.ev('pendingSource.name'), code = a.ev('pendingSource.code');
  await a.click('[data-onclick="verifyContract()"]');
  eq(a.calls.length, 1, 'Submit sends exactly one request');
  const c = a.calls[0], p = new URLSearchParams(String(c.opts.body));
  eq([c.url, c.opts.method, c.opts.headers['Content-Type']], [a.ev('NETWORKS.sepolia.explorerApi'), 'POST', 'application/x-www-form-urlencoded'], 'to the network\'s explorer API, as a form POST');
  eq([...p.keys()].sort(), ['apikey', 'codeformat', 'compilerversion', 'constructorArguements', 'contractaddress', 'contractname', 'module', 'action', 'optimizationUsed', 'runs', 'sourceCode'].sort(), 'with the same parameters as before');
  eq([p.get('contractaddress'), p.get('contractname'), p.get('sourceCode') === code, p.get('runs'), p.get('optimizationUsed'), p.get('constructorArguements'), p.get('action'), p.get('codeformat')], [A, name, true, '200', '1', 'dead', 'verifysourcecode', 'solidity-single-file'], 'and the same values (the leading 0x is removed from the constructor arguments, as before)');
  // the key left the page only inside that request
  const everything = d.body.innerHTML + a.log().join('\n') + JSON.stringify({ ...a.w.localStorage }) + [...d.querySelectorAll('#verSummary, #verProgress')].map((e) => e.textContent).join('\n');
  eq([everything.includes(KEY), JSON.stringify(a.w.localStorage).includes(KEY)], [false, false], 'the key is not in the page, the log, the overview or the browser storage');
  eq([a.log().some((m) => /Submitting source to https:\/\//.test(m)), a.prog().Submitted.state], [true, 'done'], 'the page logs the submission as before');
}

/* 7. progress follows the explorer's real answers */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); a.gen(); await a.go('verify');
  eq([a.prog().Submitted.state, a.prog().Verified.state], ['locked', 'locked'], 'before Submit: both locked, nothing is claimed');
  await a.setv('ver_address', A); await a.setv('ver_apikey', KEY);
  a.ctl.set({ status: '0', result: 'Invalid API Key' }); await a.click('[data-onclick="verifyContract()"]');
  eq([a.prog().Submitted.state, a.prog().Submitted.text, a.prog().Verified.state], ['attention', 'Submission failed: Invalid API Key', 'locked'], 'the explorer refuses: the answer is shown and nothing after it is claimed');
  a.ctl.fail('network down'); await a.click('[data-onclick="verifyContract()"]');
  ok(a.prog().Submitted.state === 'attention' && /^Request error: network down/.test(a.prog().Submitted.text), 'a request error is shown as one');
  a.ctl.fail(null); a.ctl.set({ status: '1', result: 'GUID-77' });
  const pending = a.click('[data-onclick="verifyContract()"]');
  await a.setv('ver_address', B);                                                       // changed while the request is in flight
  await pending;
  ok(a.prog().Submitted.state === 'done' && a.prog().Submitted.text.includes(A.slice(0, 10)) && !a.prog().Submitted.text.includes(B.slice(0, 10)) && a.prog().Submitted.text.includes('GUID-77') && a.prog().Submitted.text.includes('Ethereum Sepolia'), 'accepted: the address and network are those at the click, with the GUID');
  eq([a.prog().Verified.state, /Check Status/.test(a.prog().Verified.text)], ['todo', true], 'accepted is not verified: it asks you to check');
  a.ctl.set({ status: '1', result: 'Pending in queue' }); await a.click('[data-onclick="checkVerificationStatus()"]');
  eq([a.prog().Verified.state, a.prog().Verified.text], ['todo', 'Last answer from the explorer: Pending in queue'], 'a pending answer is shown as it is, not as success');
  a.ctl.set({ status: '1', result: 'Pass - Verified' }); await a.click('[data-onclick="checkVerificationStatus()"]');
  eq([a.prog().Verified.state, /verified on Ethereum Sepolia/.test(a.prog().Verified.text)], ['done', true], 'only the explorer\'s own "Pass - Verified" makes it verified');
  const statusCall = a.calls[a.calls.length - 1];
  ok(statusCall.url.startsWith(a.ev('NETWORKS.sepolia.explorerApi') + '?') && new URL(statusCall.url).searchParams.get('guid') === 'GUID-77', 'Check Status asks with the GUID, as before');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 8. hostile text from the explorer and from the fields stays text */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); a.gen(); await a.go('verify');
  const evil = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
  await a.setv('ver_address', A); await a.setv('ver_apikey', KEY); await a.setv('ver_compiler', evil); await a.setv('ver_constructor', evil);
  a.ctl.set({ status: '0', result: evil }); await a.click('[data-onclick="verifyContract()"]');
  eq([d.querySelectorAll('#sec-verify img, #sec-verify script').length, a.w.__xss], [0, undefined], 'no element came out of the payload and nothing ran');
  ok(d.getElementById('verProgress').textContent.includes('onerror'), 'the explorer\'s answer is visible as text');
  const attrs = [...d.querySelectorAll('#sec-verify *')].flatMap((e) => e.tagName === 'INPUT' ? [] : [...e.attributes].map((x) => x.name + '=' + x.value));
  eq(attrs.filter((x) => /__xss|onerror|<img|<script/.test(x)), [], 'no attribute holds any of it');
}

/* 9. navigation, the other tabs, and the history tab's records */
{
  const a = fresh(); const { d } = a; a.gen(); await a.go('verify');
  for (let k = 0; k < 8; k++) await a.go(['home', 'swap', 'deploy', 'history', 'verify'][k % 5]);
  await a.go('verify');
  eq([d.querySelectorAll('#verSummary .bld-row').length, d.querySelectorAll('#verProgress li').length], [8, 3], 'repeated navigation leaves no duplicated rows');
  for (const id of ['sec-history', 'sec-deploy', 'sec-share']) ok(!d.getElementById(id).querySelector('#verSummary, #verProgress'), `${id} is untouched`);
  eq(JSON.parse(a.ev('JSON.stringify(CFBuilder.viewKeys())')).includes('verify'), true, 'the overview redraws with the other views when the network or mode changes');
  eq(a.calls.length, 0, 'nothing was sent');
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
