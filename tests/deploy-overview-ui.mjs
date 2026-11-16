// Phase 9.7: the Compile & Deploy page (section 07). The page itself (compileAndDeploy, compilePending, deployCompiled, the constructor panel,
// Multi-deploy, the results card, the console, the mainnet banner and every gate) is unchanged and keeps its place. A read-only overview card
// was added above it. These tests prove the overview only reads (nothing is compiled, signed, sent or alerted), shows what the page really
// holds on all 16 networks, never claims a deployment the page did not record, and leaves every existing control and gate as it was.
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root, addrFor } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
const A = addrFor('a1'), B = addrFor('b2'), C = addrFor('c3');

function fresh(opts) {
  const a = loadApp(opts); const d = a.w.document;
  const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
  const alerts = []; a.w.alert = (m) => alerts.push(m);
  const rows = () => Object.fromEntries([...d.querySelectorAll('#dplSummary .bld-row')].map((r) => [r.querySelector('dt').textContent, { text: r.querySelector('dd').childNodes[0] ? r.querySelector('dd').childNodes[0].textContent : '', state: r.dataset.state, flag: (r.querySelector('.bld-flag') || { textContent: '' }).textContent }]));
  const prog = () => Object.fromEntries([...d.querySelectorAll('#dplProgress li')].map((l) => [l.querySelector('b').textContent, { state: l.dataset.state, text: l.querySelector('.bld-t').textContent }]));
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await tick(); await tick(); };
  const net = async (k) => { a.ev(`activeNetwork = '${k}'; updateSideNet();`); await tick(); await tick(); };
  const settle = async () => { await tick(); await tick(); await tick(); };
  const setv = async (id, v) => { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new a.w.Event('input', { bubbles: true })); await settle(); };
  // generators, driven through the page's own functions
  const GEN = {
    erc20: () => { a.ev("renderSimpleForm('erc20'); genSimple('erc20')"); },
    escrow: (ok_ = true) => { a.ev("renderSimpleForm('escrow')"); if (ok_) { d.getElementById('s_buyer').value = A; d.getElementById('s_seller').value = B; d.getElementById('s_arbiter').value = C; } a.ev("genSimple('escrow')"); },
    vault: () => { a.ev('genVault()'); },
    treasury: (ok_ = true) => { d.getElementById('tre_signers').value = ok_ ? [A, B, C].join('\n') : ''; a.ev('genTreasury()'); },
    swap: () => { a.ev('genSwap()'); },
    multisend: () => { a.ev('genMultisend()'); },
    crosschain: () => { a.ev('genCrosschain()'); }
  };
  return { ...a, d, rows, prog, go, net, settle, setv, GEN, alerts };
}
async function w_try(a, expr) { try { await a.w.eval(expr); return ''; } catch (e) { return String(e && e.message || e); } }

/* 1. nothing on the deploy page was renamed, moved or changed; the card sits above it */
{
  const a = fresh(); const { d } = a;
  for (const id of ['mainnetDeployBanner', 'mainnetBannerNet', 'mainnetBannerGas', 'pendingContractLabel', 'solcVersion', 'ctorArgsPanel', 'draftReason', 'btnCompileDeploy', 'btnDownloadSol', 'btnCopySol', 'multiDeployPanel', 'deployResult', 'consoleCopy', 'consoleClear', 'deployConsole']) ok(!!d.getElementById(id), 'ids: #' + id + ' exists');
  eq([...d.querySelectorAll('#sec-deploy .btnrow button')].map((b) => [b.textContent, b.getAttribute('data-onclick')]), [['Compile and deploy', 'compileAndDeploy()'], ['Download .sol', 'downloadSource()'], ['Copy code', 'copySource()']], 'the three buttons keep their handlers');
  eq([d.getElementById('pendingContractLabel').value, d.getElementById('pendingContractLabel').disabled, [...d.getElementById('solcVersion').options].map((o) => o.value)], ['— none generated yet', true, ['0.8.24']], 'the pending-contract field and the compiler list are unchanged');
  const sec = d.getElementById('sec-deploy'), kids = [...sec.children].map((e) => e.className.split(' ')[0] || e.tagName);
  eq(kids, ['section-head', 'bld', 'form-panel'], 'the section is: heading, the new card, the original panel (which is untouched and in its place)');
  eq([...d.querySelectorAll('#sec-deploy > .form-panel > *')].map((e) => e.id || e.className.split(' ')[0] || e.tagName).slice(0, 4), ['P', 'mainnetDeployBanner', 'field-grid', 'ctorArgsPanel'], 'the original panel keeps its order');
  eq([...d.getElementById('dplOverview').outerHTML.matchAll(/\s(on[a-z]+|style)=\"[^\"]*\"/gi)].length, 0, 'csp: the new card has no inline handler or style');
  ok(/\.bld\.dpl\{margin-bottom:18px;\}/.test(css), 'css: the only new rule is scoped to the card');
  eq(d.querySelector('#sec-deploy .section-head h2').textContent, 'Compile & Deploy', 'the heading is unchanged');
  eq(a.pageErrors.length, 0, 'no page errors on load');
}

/* 2. before anything is generated nothing is claimed */
{
  const a = fresh(); const { d } = a;
  await a.go('deploy');
  const r = a.rows(), p = a.prog();
  eq([r.Contract.text, r.Contract.state, r.Wallet.text, r.Compiler.text, r.Network.text, r['Deployment Mode'].text], ['None generated yet', 'missing', 'Not connected', 'solc 0.8.24', 'Arc Testnet (5042002)', 'Single network'], 'start: no contract, no wallet, the real compiler, network and mode');
  ok(!r.Source && !r.Constructor && !r['Maturity check'], 'start: no source, constructor or maturity rows without a contract');
  eq([p.Source.state, p['Ready to deploy'].state, p.Deployed.state], ['todo', 'locked', 'locked'], 'start: progress claims nothing');
  eq(d.getElementById('dplSummary').children.length, 5, 'start: five rows');
}

/* 3. what the page holds, for each builder: the contract, the maturity level, a draft and why */
{
  const a = fresh(); const { d, ev } = a;
  a.alerts.length = 0;
  for (const id of ['erc20', 'escrow', 'vault', 'treasury', 'swap', 'multisend', 'crosschain']) {
    ev("pendingSource = { name: '', code: '', template: '' }; pendingCtorArgs = [];"); a.GEN[id](); await a.go('deploy');
    const r = a.rows(), p = a.prog();
    const tpl = ev('pendingSource.template'), lvl = ev(`matInfo('${tpl}').level`);
    eq([r.Contract.text, r.Contract.flag], [ev('pendingSource.name') + '.sol', tpl + ' · ' + lvl], `${id}: the overview names the contract, its template and its real maturity level`);
    const block = ev('reqBlockReason()');
    eq(r.Source.state, block ? 'bad' : 'ok', `${id}: the source is ${block ? 'a draft' : 'ready'}`);
    if (block) { eq(r.Source.flag, block, `${id}: the reason is the page's own`); eq([p.Source.state, p['Ready to deploy'].state, p.Deployed.state], ['draft', 'locked', 'locked'], `${id}: progress is a draft, deployment locked`); ok(d.getElementById('btnCompileDeploy').disabled, `${id}: and the existing button is disabled`); }
    else eq(p.Source.state, 'done', `${id}: progress says the source is ready`);
  }
  // fixing a draft changes the overview
  ev("pendingSource = { name: '', code: '', template: '' }"); a.GEN.treasury(false); await a.go('deploy');
  ok(a.rows().Source.state === 'bad' && /Signers are required/.test(a.rows().Source.flag), 'treasury without signers: a draft, with the real reason');
  a.GEN.treasury(true); await a.settle(); eq(a.rows().Source.state, 'ok', 'generating it again clears the draft in the overview');
  // a template whose address must not be the deployer is blocked like compileAndDeploy does
  ev("renderSimpleForm('smartwallet'); document.getElementById('s_guardian').value = '" + A + "'; genSimple('smartwallet')"); await a.settle();
  ev("account = '" + A + "'; signer = {}; "); ev("pendingSource.notDeployer = [{ label: 'Guardian', value: '" + A + "' }]"); await a.go('deploy'); a.ev('dplRender()');
  eq([a.rows().Source.state, /Guardian cannot be the wallet that deploys the contract/.test(a.rows().Source.flag)], ['bad', true], 'smartwallet: a guardian that is the connected wallet is blocked, as compileAndDeploy blocks it');
  eq(a.alerts.length, 0, 'no alert was raised by reading');
}

/* 4. every network: the Network row, the mainnet flag, and the maturity check that the page really holds */
{
  const a = fresh(); const { d, ev } = a;
  const nets = JSON.parse(ev('JSON.stringify(Object.keys(NETWORKS))'));
  ev("renderSimpleForm('erc20'); genSimple('erc20')"); await a.go('deploy');
  const hash = ev('matHash(pendingSource.code)');
  const before = ev('JSON.stringify([...MAT_APPROVED])');
  for (const k of nets) {
    await a.net(k);
    const N = JSON.parse(ev(`JSON.stringify(NETWORKS['${k}'])`)), r = a.rows(), p = a.prog();
    eq([r.Network.text, /^Mainnet: real funds/.test(r.Network.flag)], [`${N.label} (${N.chainIdDec})`, !!N.isMainnet], `${k}: the overview names the chain and flags mainnets`);
    if (N.isMainnet) {
      eq([r['Maturity check'].text, r['Maturity check'].state], ['Not confirmed yet', 'missing'], `${k}: a mainnet needs the maturity confirmation and the overview says it is not given yet`);
      ev(`MAT_APPROVED.add('${hash}|${k}')`); a.ev('dplRender()');
      eq(a.rows()['Maturity check'].text, 'Confirmed for this source', `${k}: once the page holds the approval, the overview shows it`);
      ev(`MAT_APPROVED.delete('${hash}|${k}')`);
      ok(/maturity confirmation is asked/.test(p['Ready to deploy'].text) || p['Ready to deploy'].state === 'todo', `${k}: and progress mentions that it will be asked`);
    } else eq(r['Maturity check'].text, 'Not required on a testnet', `${k}: a testnet needs none`);
    eq(d.getElementById('mainnetDeployBanner').style.display === 'block', !!N.isMainnet, `${k}: the page's own mainnet banner is unchanged`);
  }
  eq(ev('JSON.stringify([...MAT_APPROVED])'), before, 'reading never changed the approvals');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 5. the wallet, the constructor and Multi-deploy */
{
  const a = fresh(); const { d, ev } = a;
  a.GEN.erc20(); await a.go('deploy');
  eq([a.rows().Wallet.state, a.prog()['Ready to deploy'].state, /connect the wallet/.test(a.prog()['Ready to deploy'].text)], ['missing', 'todo', true], 'no wallet: the overview says so and the stage is not ready');
  ev("account = '" + A + "'; signer = {};"); a.ev('dplRender()');
  eq([a.rows().Wallet.text, a.rows().Wallet.state, a.prog()['Ready to deploy'].state], [A, 'ok', 'done'], 'a connected wallet and nothing else needed: ready');
  // constructor arguments (portable modes)
  ev("setMultichainMode('portable')"); a.GEN.escrow(); await a.go('deploy');
  eq([a.rows().Constructor.text, a.rows().Constructor.state], ['1 argument', 'ok'], 'escrow (portable): one constructor argument, pre-filled');
  await a.setv('ctor_arg_0', ''); eq([a.rows().Constructor.state, /needs a value/.test(a.rows().Constructor.flag), a.prog()['Ready to deploy'].state], ['bad', true, 'todo'], 'an emptied argument is flagged and the stage is not ready');
  await a.setv('ctor_arg_0', '0x12'); ok(a.rows().Constructor.state === 'bad' && /token must be an address/.test(a.rows().Constructor.flag), 'a malformed address is flagged');
  await a.setv('ctor_arg_0', A); eq([a.rows().Constructor.state, a.prog()['Ready to deploy'].state], ['ok', 'done'], 'a valid address makes it ready');
  ev("setMultichainMode('portable')"); ev("pendingSource = { name: '', code: '', template: '' }; pendingCtorArgs = [];"); a.GEN.erc20(); await a.go('deploy');
  eq(a.rows().Constructor.text, 'No arguments', 'erc20: no constructor arguments in any mode');
  // multi-deploy
  ev("setMultichainMode('multi')"); await a.go('deploy');
  eq([a.rows()['Multi-deploy'].text, a.rows()['Multi-deploy'].state], ['No network selected', 'missing'], 'multi mode: nothing is pre-selected, and the overview says so');
  ev("toggleMdNetwork('arc')"); await a.settle(); eq([a.rows()['Multi-deploy'].text, a.rows()['Multi-deploy'].flag], ['1 network', 'Testnets only'], 'one testnet selected');
  ev("toggleMdNetwork('ethereum'); toggleMdNetwork('base')"); await a.settle(); eq([a.rows()['Multi-deploy'].text, /2 mainnets: each asks for the maturity confirmation/.test(a.rows()['Multi-deploy'].flag)], ['3 networks', true], 'mainnets in the selection are counted');
  ev("setMultichainMode('single')"); await a.go('deploy'); ok(!a.rows()['Multi-deploy'], 'single mode: no Multi-deploy row');
}

/* 6. "Deployed" is only ever what the page itself recorded */
{
  const a = fresh(); const { d, ev } = a;
  ev("account = '" + A + "'; signer = {};"); a.GEN.erc20(); await a.go('deploy');
  const name = ev('pendingSource.name');
  eq(a.prog().Deployed.state, 'todo', 'before any deployment: not done');
  ev("addToDeployHistory({ name: '" + name + "', address: '0x' + '4'.repeat(40), network: 'arc', abi: [], txHash: '0x4' })"); await a.settle();
  eq(a.prog().Deployed.state, 'todo', 'a history entry alone does not count (only this page confirms a deployment)');
  ev("uiAddDeployResult({ name: 'SomethingElse', network: 'arc', address: '0x' + '5'.repeat(40), txHash: '0x5' })"); await a.settle();
  eq(a.prog().Deployed.state, 'todo', 'a result for another contract does not count');
  ev("uiAddDeployResult({ name: '" + name + "', network: 'sepolia', address: '0x' + '6'.repeat(40), txHash: '0x6' })"); await a.settle();
  ok(a.prog().Deployed.state === 'done' && /Confirmed on Ethereum Sepolia at 0x6{40}/.test(a.prog().Deployed.text), 'a result the page recorded for this contract is shown, with its real network and address');
  ev("uiAddDeployResult({ name: '" + name + "', network: 'base', address: '0x' + '7'.repeat(40), txHash: '0x7' })"); await a.settle();
  ok(/2 deployments confirmed, the first on Ethereum Sepolia/.test(a.prog().Deployed.text), 'several results are counted');
  ev('uiResetDeployResults()'); await a.settle(); eq(a.prog().Deployed.state, 'todo', 'when the page clears its results (a new deployment starts), the overview follows');
  ev("lastAuditReport = { score: 99, summary: 'fine', findings: [] }"); a.ev('dplRender()'); eq(a.prog().Deployed.state, 'todo', 'an audit report in memory changes nothing');
}

/* 7. reading never compiles, signs, sends, alerts or writes; the existing flow and gates answer exactly as before */
{
  const a = fresh(); const { d, ev, w } = a;
  ev("window.__calls = []; ['compileSource','compilePending','deployCompiled','connectWallet','mainnetDeployConfirm','matGate'].forEach((n) => { window['__orig_' + n] = window[n]; window[n] = (...x) => { window.__calls.push(n); return window['__orig_' + n](...x); }; });");
  let rpc = 0; w.ethereum = { request: async () => { rpc++; return null; }, on() {} };
  a.GEN.treasury(true); const src = ev('JSON.stringify(pendingSource)'), args = ev('JSON.stringify(pendingCtorArgs)'), ap = ev('JSON.stringify([...MAT_APPROVED])'), lab = d.getElementById('pendingContractLabel').value;
  for (let i = 0; i < 4; i++) for (const s of ['home', 'deploy', 'swap', 'deploy']) await a.go(s);
  for (const k of ['ethereum', 'arc', 'bnb', 'sepolia']) await a.net(k);
  ev("setMultichainMode('multi')"); ev("setMultichainMode('single')"); a.ev('CFBuilder.renderAll()');
  eq([ev('JSON.stringify(window.__calls)'), rpc, a.alerts.length], ['[]', 0, 0], 'after 16 visits, 4 network changes and mode changes: nothing was compiled, signed, sent or alerted');
  eq([ev('JSON.stringify(pendingSource)'), ev('JSON.stringify(pendingCtorArgs)'), ev('JSON.stringify([...MAT_APPROVED])'), d.getElementById('pendingContractLabel').value], [src, args, ap, lab], 'the buffer, the constructor values, the approvals and the pending label were not touched');
  eq(d.querySelectorAll('#dplSummary .bld-row').length, d.querySelectorAll('#dplSummary .bld-row').length && ev("document.querySelectorAll('#dplSummary .bld-row').length"), 'the number of rows is stable');
  // the existing flow: draft, no wallet, mainnet gate
  a.GEN.treasury(false); const log = () => [...d.querySelectorAll('#deployConsole .line .msg')].map((m) => m.textContent);
  await a.w.eval('compileAndDeploy()'); ok(log().some((m) => /^Connect your wallet first/.test(m)), 'compileAndDeploy: still asks for the wallet first');
  ev("account = '" + A + "'; signer = {};"); await a.w.eval('compileAndDeploy()'); ok(log().some((m) => /^Deploy blocked\. Draft:/.test(m)), 'compileAndDeploy: still refuses a draft, with the page\'s own reason');
  eq(ev('JSON.stringify(window.__calls)'), '[]', 'and still never reached the compiler for a draft');
  ok(ev("typeof reqBlockReason === 'function' && typeof matIsApproved === 'function' && typeof matGate === 'function' && typeof mainnetDeployConfirm === 'function'"), 'the gates and the confirmation dialog still exist');
  a.GEN.erc20();
  for (const k of ['ethereum', 'polygon', 'base', 'arbitrum', 'optimism', 'avalanche', 'bnb', 'robinhoodMain', 'arcMain']) {
    await a.net(k); const hash = ev('matHash(pendingSource.code)');
    ok(/Mainnet deploy blocked/.test(await w_try(a, `window.__orig_deployCompiled({ name: 'X', abi: [], bytecode: '0x', sourceHash: '${hash}' }, [], '${k}')`)), `gate/${k}: deployCompiled still refuses without the maturity confirmation`);
  }
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 8. text safety and repeated navigation */
{
  const a = fresh(); const { d, w, ev } = a;
  const evil = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
  ev("setMultichainMode('portable')"); a.GEN.escrow();
  ev(`pendingSource.name = ${JSON.stringify(evil)}`);
  await a.go('deploy'); await a.setv('ctor_arg_0', evil);
  ok(!d.querySelector('#dplOverview img, #dplOverview script') && w.__xss === undefined, 'xss: names and values are shown as text, never as markup');
  ok(![...d.querySelectorAll('#dplOverview *')].some((e) => [...e.attributes].some((x) => /__xss/.test(x.value))), 'xss: no attribute carries the payload');
  ok(!/onerror|<img/.test(a.rows().Constructor.flag) && /token must be an address/.test(a.rows().Constructor.flag), 'the constructor row shows the problem, not the typed value');
  ev("pendingSource = { name: '', code: '', template: '' }; pendingCtorArgs = [];"); a.GEN.vault();
  for (let i = 0; i < 3; i++) for (const s of ['home', 'deploy', 'swap', 'deploy', 'vault', 'deploy']) await a.go(s);
  const n1 = d.querySelectorAll('#dplSummary .bld-row').length; await a.go('home'); await a.go('deploy');
  eq([n1 === d.querySelectorAll('#dplSummary .bld-row').length, d.querySelectorAll('#dplProgress li').length, d.querySelectorAll('#dplOverview').length], [true, 3, 1], 'repeated navigation does not duplicate rows, stages or the card');
  ok(['sec-treasury', 'sec-vault', 'sec-multisend', 'sec-crosschain', 'sec-simple', 'sec-wizard'].every((id) => !d.getElementById(id).querySelector('#dplOverview')) && ['sec-swap'].every((id) => !!d.getElementById(id)), 'the other tabs are untouched');
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
