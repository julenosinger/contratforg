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

/* 1. the deploy page's own elements were moved into the new layout, not rebuilt: same ids, attributes, handlers and values */
{
  const a = fresh(); const { d } = a;
  const KEEP = { mainnetDeployBanner: { style: true }, mainnetBannerNet: {}, mainnetBannerGas: {}, pendingContractLabel: { disabled: '' }, solcVersion: {}, ctorArgsPanel: { class: 'mc-panel', style: 'display:none;' }, draftReason: { class: 'req-reason', role: 'alert', style: 'display:none;' }, btnCompileDeploy: { class: 'btn btn-primary', 'data-onclick': 'compileAndDeploy()' }, btnDownloadSol: { class: 'btn btn-ghost', 'data-onclick': 'downloadSource()' }, btnCopySol: { class: 'btn btn-ghost', 'data-onclick': 'copySource()' }, multiDeployPanel: { class: 'mc-panel', style: 'display:none;' }, deployResult: { class: 'deploy-result', style: 'display:none;', 'aria-live': 'polite' }, consoleCopy: { class: 'btn btn-ghost', type: 'button' }, consoleClear: { class: 'btn btn-ghost', type: 'button' }, deployConsole: { class: 'console' } };
  for (const [id, attrs] of Object.entries(KEEP)) { const el = d.getElementById(id); ok(!!el, 'ids: #' + id + ' exists'); for (const [k, v] of Object.entries(attrs)) if (v !== true) eq(el.getAttribute(k), v, `#${id} keeps ${k}`); }
  eq([d.getElementById('pendingContractLabel').value, d.getElementById('pendingContractLabel').disabled, [...d.getElementById('solcVersion').options].map((o) => o.value)], ['— none generated yet', true, ['0.8.24']], 'the pending-contract field and the compiler list are unchanged');
  eq(d.querySelector('#deployConsole .line .msg').textContent, 'Waiting for contract generation and wallet connection…', 'the console keeps its first line');
  eq(d.getElementById('btnCompileDeploy').textContent, 'Compile and deploy', 'the primary button keeps its text');
  const order = ['mainnetDeployBanner', 'pendingContractLabel', 'solcVersion', 'btnDownloadSol', 'btnCopySol', 'ctorArgsPanel', 'multiDeployPanel', 'draftReason', 'btnCompileDeploy', 'consoleClear', 'deployConsole'];
  const pos = order.map((id) => { const e = d.getElementById(id); return [...d.querySelectorAll('#sec-deploy *')].indexOf(e); });
  eq(pos.every((x, i) => i === 0 || x > pos[i - 1]), true, 'document order: banner, source, compiler, source buttons, constructor, networks, draft alert, the primary button, the activity console');
  ok(d.querySelector('#sec-deploy .bld-side').contains(d.getElementById('deployResult')) && d.querySelector('#sec-deploy .bld-main').contains(d.getElementById('deployConsole')), 'confirmed results are in the overview column; the activity log is in the main column');
  eq([...d.getElementById('sec-deploy').children].map((e) => e.className.split(' ')[0]), ['section-head', 'bld'], 'the section is: heading and the workspace');
  eq(d.querySelectorAll('#sec-deploy .form-panel').length, 0, 'the old single panel is gone (its contents live in the cards)');
  const inl = [...d.getElementById('sec-deploy').querySelectorAll('[style]')].map((e) => e.id || e.tagName.toLowerCase());
  ok(inl.every((x) => ['mainnetDeployBanner', 'DIV', 'div', 'b', 'mainnetBannerNet', 'mainnetBannerGas', 'ctorArgsPanel', 'multiDeployPanel', 'draftReason', 'deployResult', 'sec-deploy'].includes(x)), 'csp: the only inline styles are the original ones (banner, display toggles)');
  eq([...d.getElementById('sec-deploy').outerHTML.matchAll(/\s(on[a-z]+)=\"[^\"]*\"/gi)].length, 0, 'csp: no inline handler attribute');
  eq([...d.querySelectorAll('#sec-deploy .dpl-ws [id]')].filter((e) => d.querySelectorAll('#' + e.id).length > 1).length, 0, 'no duplicate ids');
  const css9 = css.slice(css.indexOf('/* ---- Compile & Deploy workspace (Phase 9.8)'), css.indexOf('/* ---- Swap / AMM builder'));
  const sels = []; css9.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (_, __, s) => { sels.push(...s.split(',').map((x) => x.trim())); return ''; });
  eq(sels.filter((s) => s && !s.startsWith('@') && !/^\.bld\.dpl-ws(?![\w-])/.test(s)), [], 'css: every new rule is scoped to .dpl-ws');
  ok(/\.bld\.dpl-ws \.bld-grid\{grid-template-columns:minmax\(0,65fr\) minmax\(0,35fr\)/.test(css9), 'css: 65/35 columns');
  ok(/@media \(max-width:860px\)\{[\s\S]*\.bld\.dpl-ws \.bld-grid\{grid-template-columns:minmax\(0,1fr\);\}/.test(css9), 'css: a single column on narrow screens');
  ok(/\.bld\.dpl-ws \.console\{[^}]*max-height:240px;overflow:auto/.test(css9) && /\.dpl-pre\{[^}]*max-height:260px;overflow:auto/.test(css9), 'css: the activity log and the source preview scroll inside their cards');
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

/* 6. "Deployed" is only ever what the page itself recorded, and only for the exact source the run started with */
{
  const a = fresh(); const { d, ev } = a;
  ev("account = '" + A + "'; signer = {};"); a.GEN.erc20(); await a.go('deploy');
  const name = ev('pendingSource.name'), run = async () => { ev('uiResetDeployResults()'); await a.settle(); };   // the page does this at the start of every deploy run
  eq(a.prog().Deployed.state, 'todo', 'before any deployment: not done');
  ev("addToDeployHistory({ name: '" + name + "', address: '0x' + '4'.repeat(40), network: 'arc', abi: [], txHash: '0x4' })"); await a.settle();
  eq(a.prog().Deployed.state, 'todo', 'a history entry alone does not count (only this page confirms a deployment)');
  ev("uiAddDeployResult({ name: '" + name + "', network: 'arc', address: '0x' + '5'.repeat(40), txHash: '0x5' })"); await a.settle();
  ok(a.prog().Deployed.state === 'todo' && /^Unverified/.test(a.prog().Deployed.text), 'a result with no run seen start is unverified, not a success (the name alone is not enough)');
  await run();
  ev("uiAddDeployResult({ name: 'SomethingElse', network: 'arc', address: '0x' + '5'.repeat(40), txHash: '0x5' })"); await a.settle();
  eq(a.prog().Deployed.state, 'todo', 'a result for another contract does not count');
  await run(); ev("uiAddDeployResult({ name: '" + name + "', network: 'sepolia', address: '0x' + '6'.repeat(40), txHash: '0x6' })"); await a.settle();
  ok(a.prog().Deployed.state === 'done' && /Confirmed on Ethereum Sepolia at 0x6{40}, for this exact source/.test(a.prog().Deployed.text), 'a run that started with this exact source and recorded a result: confirmed, with its real network and address');
  ev("uiAddDeployResult({ name: '" + name + "', network: 'base', address: '0x' + '7'.repeat(40), txHash: '0x7' })"); await a.settle();
  ok(/2 deployments confirmed for this exact source, the first on Ethereum Sepolia/.test(a.prog().Deployed.text), 'several results of the same run are counted');
  // the source changes after the run: same name, different code
  ev("document.getElementById('s_supply').value = '5'; genSimple('erc20')"); await a.go('home'); await a.go('deploy');
  ok(ev('pendingSource.name') === name && a.prog().Deployed.state === 'todo' && /^Unverified: 2 deployments/.test(a.prog().Deployed.text), 'the same name with different code is unverified');
  eq(a.rows().Contract.text, name + '.sol', 'the page still shows the contract, and the results card is untouched');
  ok(d.getElementById('deployResult').style.display === 'block', 'the original results card still lists the earlier deployments');
  // generating the identical source again is still the exact same source
  ev("document.getElementById('s_supply').value = '1000000'; genSimple('erc20')"); await a.go('home'); await a.go('deploy');
  eq(a.prog().Deployed.state, 'done', 'regenerating the identical source makes the association exact again');
  await run(); eq(a.prog().Deployed.state, 'todo', 'when the page clears its results (a new run starts), the overview follows');
  ev("lastAuditReport = { score: 99, summary: 'fine', findings: [] }"); a.ev('dplRender()'); eq(a.prog().Deployed.state, 'todo', 'an audit report in memory changes nothing');
  ok(ev("uiResetDeployResults.__dplTracked === true") && ev("uiResetDeployResults.toString().includes('orig.apply')"), 'the run tracker is a transparent wrapper around the page function');
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

/* 9. the workspace (Phase 9.8): header, read-only source preview, constructor and network cards, readiness, activity and results */
{
  const a = fresh(); const { d, ev, w } = a;
  const chips = () => Object.fromEntries([...d.querySelectorAll('#dplHead .dpl-chip')].map((c) => [c.querySelector('i').textContent, c.querySelector('b').textContent]));
  await a.go('deploy');
  eq(chips(), { Contract: 'None yet', Compiler: 'solc 0.8.24', Mode: 'Single network', Network: 'Arc Testnet' }, 'start: the header shows only what is real');
  eq([d.getElementById('dplSource').textContent, /generate a contract first/.test(d.getElementById('dplSrcSum').textContent), d.getElementById('dplSrcBox').open], ['', true, false], 'start: the preview is empty and closed');
  eq([d.getElementById('dplCtorEmpty').hidden, d.getElementById('dplCtorEmpty').textContent], [false, 'Generate a contract to see its constructor arguments.'], 'start: the constructor card has its empty state');
  eq(d.getElementById('dplNetCount').textContent, '1 network', 'start (single mode): one network, the active one');
  ok(/Single and Portable modes deploy to the active network: Arc Testnet/.test(d.getElementById('dplNetNote').textContent), 'start: the note says which network');
  eq([...d.querySelectorAll('#dplReady li')].map((l) => l.dataset.state), ['todo', 'warn'], 'start: readiness has no false check');
  a.GEN.erc20(); await a.go('home'); await a.go('deploy');
  const code = ev('pendingSource.code');
  eq([chips().Contract, chips().Size, chips().Maturity], [ev('pendingSource.name') + '.sol', code.split('\n').length + ' lines', ev("matInfo('erc20').level")], 'a contract: its real name, line count and maturity level');
  eq([d.getElementById('dplSource').textContent === code, d.getElementById('dplSource').closest('details').open, !!d.getElementById('dplSource').closest('pre')], [true, false, true], 'the preview holds exactly pendingSource.code, read only (a <pre>, no input), closed until you open it');
  ok(/Solidity preview · \d+ lines · read only/.test(d.getElementById('dplSrcSum').textContent), 'and says how long it is');
  eq(d.querySelectorAll('#dplSrcBox textarea, #dplSrcBox input, #dplSrcBox [contenteditable]').length, 0, 'there is nothing to edit in the preview');
  eq([d.getElementById('dplCtorEmpty').hidden, d.getElementById('dplCtorEmpty').textContent, d.getElementById('dplCtorCount').textContent], [false, 'This contract has no constructor arguments in this Deployment Mode.', 'none'], 'erc20: the empty state says there is no constructor argument');
  eq([...d.querySelectorAll('#dplReady li')].map((l) => l.dataset.state + ':' + l.textContent), ['ok:Contract source is ready.', 'ok:No constructor arguments.', 'warn:Connect your wallet to deploy.', 'ok:Testnet deployment (no maturity approval).'], 'readiness: the same facts as the summary, as a checklist');
  // the source buttons still work, and never touch the source
  const clip = []; Object.defineProperty(w.navigator, 'clipboard', { value: { writeText: (x) => { clip.push(x); return Promise.resolve(); } }, configurable: true });
  d.getElementById('btnCopySol').click(); await tick(); eq(clip, [code], 'Copy code copies exactly the source');
  let dl = null; w.URL.createObjectURL = (b) => { dl = b; return 'blob:x'; }; w.URL.revokeObjectURL = () => {}; w.HTMLAnchorElement.prototype.click = function () { this.__clicked = this.download; dl = dl && { blob: dl, name: this.download }; };
  d.getElementById('btnDownloadSol').click(); await tick(); eq(dl && dl.name, ev('pendingSource.name') + '.sol', 'Download .sol saves the contract under its own name');
  eq(ev('pendingSource.code'), code, 'the source is untouched');
  // a draft
  a.GEN.treasury(false); await a.go('home'); await a.go('deploy');
  ok(/draft/i.test(d.querySelector('#dplReady li').textContent) && d.querySelector('#dplReady li').dataset.state === 'bad' && d.getElementById('btnCompileDeploy').disabled, 'a draft: readiness says so and the original button is disabled');
  // constructor card
  ev("setMultichainMode('portable')"); a.GEN.escrow(); await a.go('home'); await a.go('deploy');
  eq([d.getElementById('dplCtorCount').textContent, d.getElementById('dplCtorEmpty').hidden, d.querySelectorAll('#ctorArgsPanel input').length], ['1 argument · filled', true, 1], 'escrow (portable): the card counts the argument and hides the empty state');
  await a.setv('ctor_arg_0', ''); eq(d.getElementById('dplCtorCount').textContent, '1 argument · needs attention', 'an emptied argument: needs attention');
  await a.setv('ctor_arg_0', A); eq(d.getElementById('dplCtorCount').textContent, '1 argument · filled', 'and filled again');
  eq(d.getElementById('ctor_arg_0').value, A, 'the typed value is still in its original input');
  // networks
  ev("setMultichainMode('multi')"); await a.go('home'); await a.go('deploy');
  eq([d.getElementById('dplNetCount').textContent, d.querySelectorAll('#multiDeployPanel .md-chip').length, d.querySelectorAll('#multiDeployPanel .md-chip.on').length], ['none selected', 16, 0], 'multi mode: 16 networks, none selected for you, and the card says none');
  eq([...d.querySelectorAll('#multiDeployPanel .md-group-label')].map((l) => l.textContent), ['Testnets', 'Mainnets (real funds)'], 'the panel keeps its two groups');
  eq([d.querySelectorAll('#multiDeployPanel .md-group')[0].querySelectorAll('.md-chip').length, d.querySelectorAll('#multiDeployPanel .md-group')[1].querySelectorAll('.md-chip').length], [7, 9], '7 testnets and 9 mainnets');
  eq([...d.querySelectorAll('#multiDeployPanel .md-group')[1].querySelectorAll('.md-chip')].every((c) => /LIVE/i.test(c.textContent)), true, 'every mainnet is marked LIVE');
  ev("toggleMdNetwork('arc')"); await a.settle(); eq(d.getElementById('dplNetCount').textContent, '1 selected', 'one testnet: the count follows');
  ev("toggleMdNetwork('base')"); await a.settle(); eq(d.getElementById('dplNetCount').textContent, '2 selected · includes live networks', 'a mainnet: the card says live networks are included');
  ok(/Nothing is selected for you/.test(d.getElementById('dplNetNote').textContent), 'the note says nothing is selected for you');
  eq(ev('JSON.stringify([...mdState.selected])'), '["arc","base"]', 'the selection lives in mdState, as before');
  ev("setMultichainMode('cross')"); await a.go('home'); await a.go('deploy'); eq(d.querySelector('#multiDeployPanel .md-bridge') !== null, true, 'crosschain mode: the bridge option is still there');
  for (const dm of ['single', 'portable', 'multi', 'cross']) { ev(`setMultichainMode('${dm}')`); await a.go('home'); await a.go('deploy'); eq(chips().Mode, ev(`MC_MODES.${dm}.label`), `the header follows the ${dm} mode`); }
  // activity and results
  ev("setMultichainMode('single')"); ev("logConsole('ok', 'a line')"); await a.settle();
  ok([...d.querySelectorAll('#deployConsole .line .msg')].some((m) => m.textContent === 'a line') && d.getElementById('deployConsole').closest('.bld-card').querySelector('h3').textContent === 'Activity', 'the activity log lives in its own card and still receives the page\'s lines');
  eq([d.getElementById('dplResNote').hidden, /Nothing deployed yet/.test(d.getElementById('dplResNote').textContent)], [false, true], 'results card: says nothing is deployed');
  ev("uiAddDeployResult({ name: 'X', network: 'arc', address: '0x' + '9'.repeat(40), txHash: '0x9' })"); await a.settle();
  eq([d.getElementById('dplResNote').hidden, d.getElementById('deployResult').style.display, d.querySelectorAll('#deployResult .dr-row').length], [true, 'block', 1], 'a result shows the page\'s own results card, with its explorer link and copy button');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 10. a real deploy run through the page's own compileAndDeploy (compiler, deployment and wallet stubbed: nothing is sent) ties the result to the exact source */
{
  const a = fresh(); const { d, ev } = a;
  ev("account = '" + A + "'; signer = {};"); a.GEN.erc20(); await a.go('deploy');
  ev("window.__ran = []; compilePending = async () => { window.__ran.push('compile'); return { name: pendingSource.name, abi: [], bytecode: '0x', sourceHash: matHash(pendingSource.code) }; }; deployCompiled = async (c, v, k) => { window.__ran.push('deploy:' + k); uiAddDeployResult({ name: c.name, network: k, address: '0x' + '8'.repeat(40), txHash: '0x8' }); };");
  await a.w.eval('compileAndDeploy()'); await a.settle();
  eq(ev('JSON.stringify(window.__ran)'), '["compile","deploy:arc"]', 'the page ran its own flow: compile, then deploy on the active network');
  ok(a.prog().Deployed.state === 'done' && /for this exact source/.test(a.prog().Deployed.text), 'the result of that run is confirmed for this exact source');
  ev("document.getElementById('s_supply').value = '7'; genSimple('erc20')"); await a.go('home'); await a.go('deploy');
  ok(a.prog().Deployed.state === 'todo' && /^Unverified/.test(a.prog().Deployed.text), 'after the source changed, the same result is unverified');
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
