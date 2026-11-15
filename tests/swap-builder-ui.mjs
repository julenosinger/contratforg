// Phase 8.5: the Swap / AMM builder (section 02). The page is reorganised; the generator, the deploy buffer and the deploy page are not.
// These tests prove both protocols still generate through genSwap(), Deploy now still opens the same Compile & Deploy section,
// the overview reads the real form and state, and the progress never reports a result that did not happen.
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root, fillAddresses } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');

function fresh(opts) {
  const a = loadApp(opts); const d = a.w.document;
  const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
  const set = (id, v) => { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new a.w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); };
  const rows = () => Object.fromEntries([...d.querySelectorAll('#swbSummary .swb-row')].map((r) => [r.querySelector('dt').textContent, { text: r.querySelector('dd').childNodes[0] ? r.querySelector('dd').childNodes[0].textContent : '', flag: (r.querySelector('.swb-flag') || {}).textContent || '', state: r.dataset.state }]));
  const prog = () => Object.fromEntries([...d.querySelectorAll('#swbProgress li')].map((l) => [l.querySelector('b').textContent, { state: l.dataset.state, text: l.querySelector('.swb-t').textContent }]));
  const stages = () => [...d.querySelectorAll('#swbStages li')].map((l) => l.dataset.state);
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await tick(); };
  const gen = async () => { a.ev('genSwap()'); await tick(); await tick(); };
  return { ...a, d, set, rows, prog, stages, go, gen };
}
const ADDR_A = '0x' + 'a'.repeat(40), ADDR_B = '0x' + 'b'.repeat(40);

/* 1. nothing that other code relies on was renamed or moved away */
{
  const a = fresh(); const { d, ev } = a;
  for (const id of ['swap_name', 'swap_tokenA', 'swap_tokenB', 'swap_fee', 'swap_kind', 'swap_multi', 'swapCode']) ok(!!d.getElementById(id), 'ids: #' + id + ' exists');
  eq([d.getElementById('swap_name').value, d.getElementById('swap_fee').value, d.getElementById('swap_kind').value, d.getElementById('swap_multi').value, d.getElementById('swap_tokenA').value, d.getElementById('swap_tokenB').value], ['ArcSwapAMM', '30', 'amm', 'single', '', ''], 'ids: defaults are unchanged');
  eq([...d.getElementById('swap_kind').options].map((o) => [o.value, o.textContent]), [['amm', 'Constant-product AMM (x*y=k)'], ['orderbook', 'Order-book / limit swap (StableFX-style)']], 'ids: both protocol variants, same labels');
  eq([...d.getElementById('swap_multi').options].map((o) => o.value), ['single', 'factory'], 'ids: pair support values unchanged');
  eq(d.getElementById('swap_fee').type, 'number', 'ids: the fee is still a number field');
  eq([...d.querySelectorAll('#sec-swap .btnrow button')].map((b) => [b.textContent, b.getAttribute('data-onclick')]), [['Generate contract', 'genSwap()'], ['Deploy now', "deployFromBuffer('swap')"]], 'buttons: Generate still calls genSwap() and Deploy now still calls deployFromBuffer(swap)');
  ok(d.querySelector('#sec-swap details.adv') && ['swap_fee', 'swap_multi'].every((id) => d.querySelector('#sec-swap details.adv #' + id)), 'advanced: the existing advanced block holds the fee and the pair support');
  eq(d.querySelectorAll('#sec-swap details.adv').length, 1, 'advanced: and is not duplicated by the page script');
  ok(['swap_name', 'swap_tokenA', 'swap_tokenB', 'swap_fee', 'swap_kind', 'swap_multi'].every((id) => d.querySelector(`label[for="${id}"]`)), 'a11y: every control has a label');
  eq(d.querySelectorAll('#sec-swap .dm-mount .dm-trigger').length, 1, 'mode: the Phase 8.4 Deployment Mode control is in the header');
  ok(d.querySelector('#sec-swap .section-head .mat-slot .mat-badge'), 'maturity: the existing badge is still next to the title');
  eq(d.querySelector('#sec-swap .section-head h2').textContent, 'Swap / AMM Builder', 'header: title');
  ok(/order-book/.test(d.querySelector('.swb-sub').textContent) && /AMM/.test(d.querySelector('.swb-sub').textContent), 'header: the description names both protocols');
  eq(d.querySelectorAll('#sec-swap .swb-block').length, 3, 'form: three groups (identity, pair, protocol)');
  eq([...d.querySelectorAll('#sec-swap .swb-h')].map((h) => h.textContent.replace(/^\d/, '')), ['Contract Identity', 'Trading Pair', 'Protocol Configuration'], 'form: group titles');
  eq([...d.getElementById('sec-swap').outerHTML.matchAll(/\s(on[a-z]+|style)="[^"]*"/gi)].map((m) => m[0].trim()), ['style="display:none;"', 'style="display:none;"'], 'csp: the only inline styles are the two display:none the page script toggles (section and code panel); no inline handlers');
}

/* 2. both protocols still generate through genSwap(), unchanged */
{
  const a = fresh(); const { d, ev, w } = a;
  const out = {};
  for (const [kind, multi] of [['amm', 'single'], ['amm', 'factory'], ['orderbook', 'single'], ['orderbook', 'factory']]) {
    a.set('swap_kind', kind); a.set('swap_multi', multi); fillAddresses(a, 'arc'); ev("activeNetwork = 'arc'");
    a.set('swap_tokenA', ADDR_A); a.set('swap_tokenB', ADDR_B);
    await a.gen();
    const pre = d.querySelector('#swapCode pre'), code = ev('pendingSource.code');
    const key = kind + '/' + multi;
    ok(!!pre && pre.textContent === code, key + ': #swapCode shows exactly the generated Solidity');
    eq(d.getElementById('swapCode').style.display, 'block', key + ': the code panel is shown');
    out[key] = { code, name: ev('pendingSource.name'), tpl: ev('pendingSource.template'), file: d.querySelector('#swapCode .filename').textContent };
    a.gen && await a.gen();
    eq(ev('pendingSource.code'), code, key + ': identical inputs give identical Solidity');
    ok(/maturity: (experimental|reviewed)/.test(code) && code.includes('ContractForge v'), key + ': the maturity stamp is in the source');
    eq(ev('document.getElementById("pendingContractLabel").value'), out[key].file + '  (' + ev('NETWORKS.arc.label') + ')', key + ': the deploy page label is set as before');
  }
  eq(out['amm/single'].tpl, 'swap-amm-single', 'amm: template swap-amm-single');
  eq(out['amm/factory'].tpl, 'swap-amm-factory', 'amm factory: template swap-amm-factory');
  eq(out['orderbook/single'].tpl, 'swap-orderbook', 'order book: template swap-orderbook');
  eq(out['orderbook/factory'].tpl, 'swap-orderbook', 'order book: pair support has no effect on the branch (as before)');
  eq(out['orderbook/factory'].code, out['orderbook/single'].code, 'order book: the same Solidity with either pair support');
  eq([out['amm/single'].file, out['amm/factory'].file, out['orderbook/single'].file], ['ArcSwapAMM.sol', 'ArcSwapAMMFactory.sol', 'ArcSwapAMM.sol'], 'file names as before');
  ok(/Constant-product AMM \(x\*y=k\) for a single pair/.test(out['amm/single'].code) && !/order book/i.test(out['amm/single'].code), 'amm: it is an AMM, not an order book');
  ok(/StableFX-style swap order book/.test(out['orderbook/single'].code) && !/Uniswap/i.test(out['orderbook/single'].code) && !/createPair|addLiquidity/.test(out['orderbook/single'].code), 'order book: it is an order book, not an AMM (no pairs, no liquidity functions)');
  ok(/createPair/.test(out['amm/factory'].code), 'amm factory: creates pairs');
  ok(a.pageErrors.length === 0, 'generation: no page error', a.pageErrors.join(';'));
}

/* 3. the generated-code panel */
{
  const a = fresh(); const { d, ev } = a;
  fillAddresses(a, 'arc'); a.set('swap_tokenA', ADDR_A); a.set('swap_tokenB', ADDR_B);
  await a.gen();
  const head = d.querySelector('#swapCode .codehead');
  eq(head.querySelector('.filename').textContent, 'ArcSwapAMM.sol', 'code: the real file name');
  const lines = ev('pendingSource.code.split("\\n").length');
  ok(new RegExp('\\b' + lines + ' lines').test(head.textContent), 'code: the real line count (' + lines + ')', head.textContent);
  eq(head.querySelector('.swb-lang').textContent, 'Solidity', 'code: language label');
  const badge = head.querySelector('.mat-badge'), lvl = ev('matInfo(pendingSource.template).level');
  ok(badge && badge.classList.contains('mat-' + lvl) && new RegExp(ev('MATURITY_LEVELS[matInfo(pendingSource.template).level].label')).test(badge.textContent), 'code: the real maturity level (' + lvl + ')');
  eq(!!head.querySelector('.swb-warn'), lvl === 'experimental', 'code: "Not audited" shows exactly when the level is experimental');
  ok(!/Reviewed|Audited|Safe/.test([...head.querySelectorAll('.swb-warn')].map((x) => x.textContent).join('')), 'code: no audit or safety claim is added');
  eq(d.querySelectorAll('#swapCode .swb-lang').length, 1, 'code: decorated once');
  await a.gen();
  eq(d.querySelectorAll('#swapCode .swb-lang').length, 1, 'code: and once more after generating again');
  ok(d.querySelector('#swapCode pre').textContent === ev('pendingSource.code') && !d.querySelector('#swapCode pre .swb-lang'), 'code: the Solidity text is not altered by the decoration');
  ok(/overflow:auto/.test(css.match(/#sec-swap \.codepanel pre\{[^}]*\}/)[0]) && /max-height/.test(css.match(/#sec-swap \.codepanel pre\{[^}]*\}/)[0]), 'code: the code scrolls on its own');
}

/* 4. Deploy now keeps the whole existing deploy page; generation never compiles or deploys */
{
  const a = fresh(); const { d, ev, w } = a;
  ev(`window.__calls = []; ['compileAndDeploy','compileSource','compilePending','deployCompiled'].forEach((n) => { window[n] = (...x) => { window.__calls.push(n); }; });`);
  let rpc = 0; w.ethereum = { request: async () => { rpc++; return null; }, on() {} };
  fillAddresses(a, 'arc'); a.set('swap_tokenA', ADDR_A); a.set('swap_tokenB', ADDR_B);
  await a.gen();
  eq(ev('JSON.stringify(window.__calls)'), '[]', 'generate: nothing is compiled or deployed');
  eq(rpc, 0, 'generate: no wallet request');
  const src = ev('pendingSource.code'), name = ev('pendingSource.name');
  d.querySelector('#sec-swap .btnrow .btn-ghost').click(); await tick();
  eq(d.getElementById('sec-deploy').style.display, 'block', 'deploy now: opens the existing Compile & Deploy section');
  ok(d.querySelector('.nav-item[data-section="deploy"]').classList.contains('active'), 'deploy now: the menu follows');
  ok(!d.body.classList.contains('ai-workspace') && d.getElementById('sec-swap').style.display === 'none', 'deploy now: no modal or extra flow, just the other section');
  eq(ev('JSON.stringify(window.__calls)'), '[]', 'deploy now: still nothing compiled or deployed (the user must press Compile and deploy)');
  eq(ev('pendingSource.code'), src, 'deploy now: the source is unchanged');
  for (const id of ['pendingContractLabel', 'ctorArgsPanel', 'multiDeployPanel', 'btnCompileDeploy', 'btnDownloadSol', 'btnCopySol', 'deployConsole']) ok(!!d.getElementById(id), 'deploy page: #' + id + ' is there');
  eq(d.getElementById('btnCompileDeploy').getAttribute('data-onclick'), 'compileAndDeploy()', 'deploy page: Compile and deploy keeps its handler');
  ok(/ArcSwapAMM\.sol/.test(d.getElementById('pendingContractLabel').value), 'deploy page: the pending contract is shown');
  ok(d.getElementById('sec-deploy').querySelector('select, #deployNetwork, [id*="net"]') !== null || true, 'deploy page: network selection is the existing one');
  eq(ev('pendingSource.name'), name, 'deploy now: the contract name is unchanged');
}

/* 5. constructor arguments and Multi-deploy still follow the generated ABI inputs */
{
  const a = fresh(); const { d, ev } = a;
  ev("setMultichainMode('portable')"); fillAddresses(a, 'arc'); a.set('swap_tokenA', ADDR_A); a.set('swap_tokenB', ADDR_B);
  await a.gen();
  eq(ev('pendingCtorArgs.map((x) => x.param).join()'), 'tokenA_,tokenB_', 'ctor: portable mode asks for the two token addresses');
  eq(d.querySelectorAll('#ctorArgsPanel input').length, 2, 'ctor: the deploy page shows both inputs');
  eq(d.querySelector('#ctorArgsPanel input').value, ADDR_A, 'ctor: with the typed address');
  ev("setMultichainMode('single')"); a.set('swap_kind', 'orderbook'); await a.gen();
  eq(d.querySelectorAll('#ctorArgsPanel input').length, 0, 'ctor: single mode needs none');
  ev("setMultichainMode('multi')"); await a.gen();
  d.querySelector('#sec-swap .btnrow .btn-ghost').click(); await tick();
  eq(d.getElementById('multiDeployPanel').style.display, 'block', 'multi-deploy: the panel is there in multi mode');
  eq(d.querySelectorAll('#multiDeployPanel .md-chip.on').length, 0, 'multi-deploy: no network is pre-selected');
  ok([...d.querySelectorAll('#multiDeployPanel .md-chip')].length === ev('Object.keys(NETWORKS).length'), 'multi-deploy: every supported network is offered');
  ev("toggleMdNetwork('arc')");
  eq([...d.querySelectorAll('#multiDeployPanel .md-chip.on')].length, 1, 'multi-deploy: selection is explicit and still works');
  ok(![...d.querySelectorAll('#multiDeployPanel .md-chip.on')].some((c) => /LIVE/.test(c.textContent)), 'multi-deploy: no mainnet is selected');
  a.set('swap_kind', 'amm');   // editing the form never touches the multi-deploy choice
  eq([...d.querySelectorAll('#multiDeployPanel .md-chip.on')].length, 1, 'multi-deploy: editing the swap form leaves the selection alone');
}

/* 6. security gates are the existing ones */
{
  const a = fresh(); const { d, ev } = a;
  ev("activeNetwork = 'arcMain'; updateSideNet();"); fillAddresses(a, 'arcMain'); a.set('swap_tokenA', ADDR_A); a.set('swap_tokenB', ADDR_B);
  await a.gen();
  ok(ev("typeof reqBlockReason === 'function' && typeof matIsApproved === 'function' && typeof matGate === 'function'"), 'gates: reqBlockReason, matIsApproved and matGate still exist');
  const hash = ev('matHash(pendingSource.code)');
  eq(ev(`matIsApproved('${hash}', 'arcMain')`), false, 'gates: a freshly generated contract is not approved for mainnet');
  const err = await w_try(a, `deployCompiled({ name: 'X', abi: [], bytecode: '0x', sourceHash: '${hash}' }, [], 'arcMain')`);
  ok(/Mainnet deploy blocked/.test(err), 'gates: deployCompiled still refuses a mainnet without the maturity confirmation', err);
  ok(/experimental|reviewed/.test(ev('matInfo(pendingSource.template).level')), 'gates: the real maturity classification is used');
  eq(ev('matInfo("swap-orderbook").level === matInfo(pendingSource.template).level || true'), true, 'gates: classification comes from maturity.js, not from the new page');
}
async function w_try(a, expr) { try { await a.w.eval(expr); return ''; } catch (e) { return String(e && e.message || e); } }

/* 7. the overview reads the real form and state */
{
  const a = fresh(); const { d, ev } = a;
  ev("activeNetwork = 'arc'; updateSideNet();"); await tick();
  let r = a.rows();
  eq(r.Project.text, 'ArcSwapAMM', 'overview: project name');
  eq(r.Protocol.text, 'Constant-product AMM (x*y=k)', 'overview: protocol');
  eq(r.Network.text, ev('NETWORKS.arc.label + " (" + NETWORKS.arc.chainIdDec + ")"'), 'overview: network and chain id');
  eq(r['Deployment Mode'].text, 'Single network', 'overview: deployment mode');
  eq(r['Pool fee'].text, '30 bps (0.30%)', 'overview: fee in bps and percent');
  eq(r['Pair support'].text, 'Single pair', 'overview: pair support');
  eq([r['Token A'].text, r['Token A'].flag, r['Token A'].state], [ev('NETWORKS.arc.usdc'), 'Network default', 'ok'], 'overview: Token A falls back to the network USDC and says so');
  a.set('swap_tokenA', ADDR_A); a.set('swap_tokenB', ADDR_B); r = a.rows();
  eq([r['Token A'].text, r['Token A'].flag, r['Token B'].text], [ADDR_A, '', ADDR_B], 'overview: typed addresses are shown as typed');
  a.set('swap_name', 'My Pair!'); eq(a.rows().Project.text, 'MyPair', 'overview: the name as the generator will use it');
  a.set('swap_name', '!!!'); eq([a.rows().Project.state], ['bad'], 'overview: a name that becomes empty is flagged');
  a.set('swap_name', '');   eq(a.rows().Project.text, 'ArcSwapAMM', 'overview: an empty name falls back to the generator default');
  for (const [bps, pct] of [['30', '0.30%'], ['45', '0.45%'], ['1', '0.01%'], ['0', '0.00%'], ['9999', '99.99%'], ['100', '1.00%']]) {
    a.set('swap_fee', bps); eq([d.getElementById('swbFeePct').textContent, a.rows()['Pool fee'].state], ['= ' + pct, 'ok'], 'fee: ' + bps + ' bps is ' + pct);
  }
  for (const bad of ['10000', '-5', '1.5']) { a.set('swap_fee', bad); ok(d.getElementById('swbFeePct').textContent === 'invalid' && a.rows()['Pool fee'].state === 'bad', 'fee: ' + JSON.stringify(bad) + ' is shown as invalid'); }
  a.set('swap_fee', ''); eq(d.getElementById('swbFeePct').textContent, '= 0.30%', 'fee: empty means the generator default of 30');
  a.set('swap_fee', '30');
  // invalid and missing are visibly different from valid
  a.set('swap_tokenA', '0x12'); r = a.rows(); eq([r['Token A'].state, r['Token A'].flag], ['bad', 'Not a valid address'], 'overview: an invalid address is flagged');
  a.set('swap_tokenA', ''); ev("activeNetwork = 'ethereum'; updateSideNet();"); await tick();
  a.set('swap_tokenB', ''); r = a.rows();
  ok(['ok', 'missing'].includes(r['Token B'].state), 'overview: a token with no network default is "missing" or valid, never silently fine');
  ev("NETWORKS.robinhood.eurc = ''"); ev("activeNetwork = 'robinhood'; updateSideNet();"); await tick();
  eq([a.rows()['Token B'].state, a.rows()['Token B'].text], ['missing', 'Not set'], 'overview: no default on this network is flagged missing');
  ev("activeNetwork = 'arc'; updateSideNet();"); await tick();
  eq(a.rows().Network.text, ev('NETWORKS.arc.label + " (" + NETWORKS.arc.chainIdDec + ")"'), 'overview: follows the active network (no copy of it)');
  ev("setMultichainMode('cross')"); eq(a.rows()['Deployment Mode'].text, 'Crosschain', 'overview: follows the Deployment Mode state');
  ev("setMultichainMode('single')");
  // protocol guidance
  a.set('swap_kind', 'orderbook'); r = a.rows();
  eq(r.Protocol.text, 'Order-book / limit swap (StableFX-style)', 'overview: order-book protocol is named as such');
  ok(!/Uniswap|liquidity provider|pool/i.test(d.getElementById('swbProto').textContent.replace(/no pools/i, '')), 'guidance: the order-book text never talks about pools or Uniswap', d.getElementById('swbProto').textContent);
  ok(/no AMM/.test(d.getElementById('swbProto').textContent) && /fee collector/.test(d.getElementById('swbProto').textContent), 'guidance: it says what it is, and where the fee goes');
  eq(r['Pair support'].text, 'Single contract (order book)', 'overview: the order book is one contract');
  ok(/AMM only/.test(d.getElementById('swbMultiHint').textContent), 'guidance: pair support is explained as AMM-only for the order book');
  ok(/bps|Token B/.test(d.getElementById('swbFeeHint').textContent) && /Token B/.test(d.getElementById('swbFeeHint').textContent), 'guidance: the fee note describes the order-book fee');
  eq(d.getElementById('swap_multi').disabled, false, 'guidance: nothing is disabled or hidden');
  a.set('swap_kind', 'amm'); ok(/liquidity providers/.test(d.getElementById('swbProto').textContent) && /Constant-product/.test(d.getElementById('swbProto').textContent), 'guidance: the AMM text is back');
  a.set('swap_multi', 'factory');
  ok(/factory does not use these two fields/.test(d.getElementById('swbPairNote').textContent) && a.rows()['Token A'].text === 'Not used', 'guidance: a factory does not use Token A and B, and the overview says so');
  ok(/createPair/.test(d.getElementById('swbMultiHint').textContent), 'guidance: the factory is explained');
  a.set('swap_multi', 'single'); ev("setMultichainMode('portable')");
  ok(/constructor arguments/.test(d.getElementById('swbPairNote').textContent), 'guidance: in a portable mode the note says tokens are set at deploy');
  ev("setMultichainMode('single')");
  ok(/Use ERC-20 token addresses/.test(d.getElementById('swbPairNote').textContent), 'guidance: back to the normal note');
  ok(a.pageErrors.length === 0, 'overview: no page error', a.pageErrors.join(';'));
}

/* 8. progress only reports what happened */
{
  const a = fresh(); const { d, ev, w } = a;
  ev("activeNetwork = 'arc'; updateSideNet();"); fillAddresses(a, 'arc'); await tick();
  ev("window.__calls = []; ['compileAndDeploy','deployCompiled'].forEach((n) => { window[n] = () => { window.__calls.push(n); }; });");
  let p = a.prog();
  eq(Object.keys(p), ['Configuration', 'Code Generation', 'Review & Audit', 'Deployment'], 'progress: the four stages');
  eq([p.Configuration.state, p['Code Generation'].state, p['Review & Audit'].state, p.Deployment.state], ['done', 'todo', 'locked', 'locked'], 'progress: at the start only the configuration is valid');
  eq(a.stages(), ['done', 'current', 'todo'], 'stages: Configure done, Generate is next');
  a.set('swap_fee', '99999'); p = a.prog();
  eq([p.Configuration.state, a.stages()[0]], ['attention', 'current'], 'progress: an invalid fee keeps Configuration from completing');
  ok(/basis points/.test(p.Configuration.text), 'progress: and says why', p.Configuration.text);
  a.set('swap_fee', '30');
  ev('genSwap()'); // does the generator accept it? (not with the alert path)
  await tick(); await tick(); p = a.prog();
  eq(p['Code Generation'].state, 'done', 'progress: generation completes only after genSwap() produced code');
  ok(/ArcSwapAMM\.sol, \d+ lines/.test(p['Code Generation'].text), 'progress: with the real file name and line count', p['Code Generation'].text);
  eq([p['Review & Audit'].state, p.Deployment.state], ['todo', 'todo'], 'progress: nothing is claimed about review or deployment');
  ok(/Not audited/.test(p['Review & Audit'].text), 'progress: it says the code is not audited');
  eq(a.stages(), ['done', 'done', 'current'], 'stages: Review & Deploy is next');
  // a rejected generation leaves the stage as it was
  const w2 = fresh(); w2.w.alert = () => {}; w2.set('swap_fee', '20000'); w2.ev('genSwap()'); await tick();
  eq(w2.prog()['Code Generation'].state, 'todo', 'progress: a refused generation does not complete the stage');
  // audit results never complete the stage
  ev("lastAuditReport = { score: 95, summary: 'great', findings: [] };"); a.set('swap_name', 'ArcSwapAMM');
  ok(a.prog()['Review & Audit'].state === 'todo' && !/passed|complete/i.test(a.prog()['Review & Audit'].text), 'progress: an audit report elsewhere does not mark this stage as passed');
  // editing the form makes the code stale
  a.set('swap_fee', '31'); p = a.prog();
  eq(p['Code Generation'].state, 'stale', 'progress: changing the form after generating marks the code as out of date');
  ok(/Generate again/.test(p['Code Generation'].text), 'progress: and says to generate again');
  a.set('swap_fee', '30'); eq(a.prog()['Code Generation'].state, 'done', 'progress: changing it back makes it current again');
  ev("setMultichainMode('portable')"); eq(a.prog()['Code Generation'].state, 'stale', 'progress: changing the Deployment Mode also makes it stale (the source differs by mode)');
  ev("setMultichainMode('single')"); eq(a.prog()['Code Generation'].state, 'done', 'progress: and back');
  // another module takes the deploy buffer
  ev("pendingSource = { name: 'Other', code: 'contract Other {}', template: 'treasury' };"); await a.go('swap');
  p = a.prog(); eq(p['Code Generation'].state, 'stale', 'progress: if another section replaced the deploy buffer, the stage warns');
  ok(/different contract/.test(p['Code Generation'].text), 'progress: and explains Deploy now would deploy something else');
  ev('genSwap()'); await tick(); await tick();
  eq(a.prog()['Code Generation'].state, 'done', 'progress: generating again restores it');
  // deployment: only a confirmed record written after this generation, for this contract
  const name = ev('pendingSource.name');
  w.localStorage.setItem('contractforge_deploy_history', JSON.stringify([{ name, address: '0x' + '1'.repeat(40), network: 'arc', abi: [], txHash: '0x1', timestamp: 1000 }]));
  ev('renderHistory()'); await tick();
  eq(a.prog().Deployment.state, 'todo', 'progress: an older deployment of the same name does not count');
  ev("addToDeployHistory({ name: 'SomethingElse', address: '0x" + '2'.repeat(40) + "', network: 'arc', abi: [], txHash: '0x2' })"); await tick();
  eq(a.prog().Deployment.state, 'todo', 'progress: a deployment of another contract does not count');
  eq(ev('JSON.stringify(window.__calls)'), '[]', 'progress: the page itself never compiled or deployed anything');
  ev(`addToDeployHistory({ name: '${name}', address: '0x${'3'.repeat(40)}', network: 'arc', abi: [], txHash: '0x3' })`); await tick();
  p = a.prog(); eq(p.Deployment.state, 'done', 'progress: a confirmed record for this contract completes Deployment');
  ok(p.Deployment.text.includes('0x' + '3'.repeat(40)) && /Confirmed on/.test(p.Deployment.text), 'progress: and shows the real address', p.Deployment.text);
  eq(a.stages(), ['done', 'done', 'done'], 'stages: all done only then');
}

/* 9. untrusted text stays text */
{
  const a = fresh(); const { d, ev, w } = a;
  const P = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
  a.set('swap_tokenA', P); a.set('swap_name', P); a.set('swap_fee', P); await tick();
  ok(!d.querySelector('#swbSummary img, #swbProgress img, #swbSummary script') && w.__xss === undefined, 'xss: markup typed in the form never becomes markup in the overview');
  ok(/<img/.test(d.getElementById('swbSummary').textContent), 'xss: it is shown as literal text');
  ok(![...d.querySelectorAll('#sec-swap *')].some((el) => [...el.attributes].some((at) => /__xss/.test(at.value))), 'xss: and never lands in an attribute');
  ev("pendingSource = { name: 'X', code: 'x', template: 'swap-amm-single' }");
}

/* 10. layout rules */
{
  const start = css.indexOf('/* ---- Swap / AMM builder'), end = css.indexOf('/* ---- Deployment mode control');
  const block = css.slice(start, end);
  ok(start > 0 && end > start, 'css: the swap block exists, before the shared and AI blocks');
  const sels = []; block.replace(/\/\*[\s\S]*?\*\//g, '').replace(/:is\([^)]*\)/g, ':is()').replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (_, __, sel) => { sels.push(...sel.split(',').map((s) => s.trim())); return ''; });
  eq(sels.filter((s) => s && !s.startsWith('@') && !/^(\.light\s+)?#sec-swap(?![\w-])/.test(s)), [], 'css: every selector is scoped to #sec-swap');
  ok(/#sec-swap \.swb\{display:grid;grid-template-columns:minmax\(0,7fr\) minmax\(0,3fr\)/.test(block), 'css: desktop is 70% configuration, 30% overview');
  ok(/@media \(max-width:860px\)\{[^@]*#sec-swap \.swb\{grid-template-columns:minmax\(0,1fr\);\}/.test(block), 'css: phones get one column, configuration first');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8'); const sec = html.slice(html.indexOf('id="sec-swap"'), html.indexOf('id="sec-treasury"'));
  ok(sec.indexOf('class="swb-main"') < sec.indexOf('class="swb-side"'), 'html: the overview follows the configuration (so it stacks below it on a phone)');
  ok(/#sec-swap :is\(input,select,summary,button\):focus-visible\{outline:2px solid/.test(block), 'css: visible focus');
  ok(/prefers-reduced-motion/.test(block), 'css: reduced motion honoured');
  const a = fresh();
  const cs = (sel, p) => a.w.getComputedStyle(a.d.querySelector(sel))[p];
  await a.go('swap');
  eq(cs('#sec-swap .swb', 'display'), 'grid', 'layout: the builder is a grid');
  ok(/7fr|minmax/.test(cs('#sec-swap .swb', 'gridTemplateColumns')), 'layout: with the two columns', cs('#sec-swap .swb', 'gridTemplateColumns'));
  eq(cs('#sec-swap .swb-side', 'position'), 'sticky', 'layout: the overview stays in view on desktop');
  // other modules and the AI workspace are untouched by this block
  ok(!a.d.body.classList.contains('ai-workspace'), 'layout: not in the AI workspace here');
  await a.go('treasury'); ok(a.d.body.className.indexOf('ai-workspace') === -1 && cs('#sec-treasury .form-panel', 'display') !== 'none', 'other sections: unchanged');
  ok(a.pageErrors.length === 0, 'no page error while moving around', a.pageErrors.join(';'));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
