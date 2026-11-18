// Phase 9.2: the Vault builder (section 04). The page is reorganised; genVault(), the deploy buffer and the deploy page are not.
// The app is multichain and has mainnets, so the networks are part of the test: every network in NETWORKS, in the single and the portable modes.
// What the Phase 9.0 audit recorded stays true: a missing asset writes a DRAFT, a performance fee outside 0..9999 is refused, and the
// portable modes turn the asset into a constructor argument (the deposit cap is scaled by the asset's own decimals in every mode).
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root, addrFor } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
const ASSET = addrFor('vlt');

function fresh(opts) {
  const a = loadApp(opts); const d = a.w.document;
  const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
  const set = (id, v) => { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new a.w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); };
  const rows = () => Object.fromEntries([...d.querySelectorAll('#vltSummary .bld-row')].map((r) => [r.querySelector('dt').textContent, { text: r.querySelector('dd').childNodes[0] ? r.querySelector('dd').childNodes[0].textContent : '', state: r.dataset.state, flag: (r.querySelector('.bld-flag') || { textContent: '' }).textContent }]));
  const prog = () => Object.fromEntries([...d.querySelectorAll('#vltProgress li')].map((l) => [l.querySelector('b').textContent, { state: l.dataset.state, text: l.querySelector('.bld-t').textContent }]));
  const stages = () => [...d.querySelectorAll('#vltStages li')].map((l) => l.dataset.state);
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await tick(); };
  const net = (k) => { a.ev(`activeNetwork = '${k}'; updateSideNet();`); };
  const alerts = []; a.w.alert = (m) => alerts.push(m);
  const gen = async () => { alerts.length = 0; a.ev('genVault()'); await tick(); await tick(); };
  return { ...a, d, set, rows, prog, stages, go, gen, net, alerts };
}
async function w_try(a, expr) { try { await a.w.eval(expr); return ''; } catch (e) { return String(e && e.message || e); } }

/* 1. nothing that other code relies on was renamed or moved away */
{
  const a = fresh(); const { d } = a;
  for (const id of ['vault_name', 'vault_symbol', 'vault_asset', 'vault_perf', 'vault_strategy', 'vault_cap', 'vaultCode']) ok(!!d.getElementById(id), 'ids: #' + id + ' exists');
  eq(['vault_name', 'vault_symbol', 'vault_asset', 'vault_perf', 'vault_strategy', 'vault_cap'].map((i) => d.getElementById(i).value), ['ArcYieldVault', 'avUSDC', '', '1000', 'passthrough', '0'], 'defaults are unchanged');
  eq([d.getElementById('vault_perf').type, d.getElementById('vault_cap').type, d.getElementById('vault_asset').placeholder], ['number', 'number', '0x... USDC'], 'field types and placeholder are unchanged');
  eq([...d.getElementById('vault_strategy').options].map((o) => [o.value, o.textContent]), [['passthrough', 'Manual yield (assets sent to the vault raise the share price)']], 'strategy: the one real option, same value and text');
  eq([...d.querySelectorAll('#sec-vault .btnrow button')].map((b) => [b.textContent, b.getAttribute('data-onclick')]), [['Generate contract', 'genVault()'], ['Deploy now', "deployFromBuffer('vault')"]], 'buttons: Generate still calls genVault(), Deploy now still opens the buffer');
  ok(['vault_perf', 'vault_cap'].every((id) => d.querySelector('#sec-vault details.adv #' + id)) && d.querySelectorAll('#sec-vault details.adv').length === 1, 'advanced: one block holding the fee and the cap, as before');
  ok(['vault_name', 'vault_symbol', 'vault_asset', 'vault_strategy', 'vault_perf', 'vault_cap'].every((id) => d.querySelector(`#sec-vault .field label[for="${id}"]`)), 'a11y: every control has a label inside its field');
  eq(d.querySelectorAll('#sec-vault .section-head .dm-mount .dm-trigger').length, 1, 'mode: the Deployment Mode control is in the header');
  ok(d.querySelector('#sec-vault .section-head .mat-slot .mat-badge'), 'maturity: the existing badge is next to the title');
  eq(d.querySelector('#sec-vault .section-head h2').textContent, 'Vault Builder', 'the heading');
  ok(d.getElementById('sec-vault').classList.contains('bld'), 'the section carries the shared builder class');
  eq([...d.querySelectorAll('#sec-vault .bld-block h3')].map((h) => h.textContent), ['1Vault Identity', '2Underlying Asset', '3Strategy & Parameters'], 'the three configuration groups');
  eq([...d.querySelectorAll('#vltProgress li b')].map((b) => b.textContent), ['Configuration', 'Code Generation', 'Review & Audit', 'Deployment'], 'the four progress stages');
  eq([...d.getElementById('sec-vault').outerHTML.matchAll(/\s(on[a-z]+|style)=\"[^\"]*\"/gi)].map((m) => m[0].trim()), ['style="display:none;"', 'style="display:none;"'], 'csp: only the two display:none the page script toggles');
  ok(/\.bld \.bld-pair\{display:grid/.test(css) && /\.bld \.bld-signers,\.bld \.bld-pair\{grid-template-columns:minmax\(0,1fr\);\}/.test(css), 'css: the new pair row is scoped to .bld and collapses on narrow screens');
  eq(a.w.getComputedStyle(d.querySelector('#sec-vault .bld-grid')).display, 'grid', 'computed: the grid is a grid');
  eq(a.pageErrors.length, 0, 'no page errors on load');
}

/* 2. the generator is untouched, on every network and in both modes */
{
  const a = fresh(); const { d, ev } = a;
  const nets = JSON.parse(ev('JSON.stringify(Object.keys(NETWORKS))'));
  eq(nets.length, 16, 'there are 16 networks (8 mainnets, 8 testnets)');
  for (const mode of ['single', 'portable']) {
    ev(`setMultichainMode('${mode}')`);
    for (const k of nets) {
      a.net(k); await a.gen();
      const N = JSON.parse(ev(`JSON.stringify(NETWORKS['${k}'])`));
      const code = ev('pendingSource.code');
      const hasDefault = !!N.usdc;
      eq([ev('pendingSource.template'), a.alerts.length], ['vault', 0], `${mode}/${k}: a vault is generated, no alert`);
      eq(d.querySelector('#vaultCode pre').textContent, code, `${mode}/${k}: the code panel shows exactly the buffer`);
      if (mode === 'single') {
        ok(code.includes(`IERC20(${N.usdc || '0x0000000000000000000000000000000000000000'})`), `${mode}/${k}: the network's own USDC is the asset (or the zero address where there is none)`);
        eq(ev('pendingSource.problems.length'), hasDefault ? 0 : 1, `${mode}/${k}: ${hasDefault ? 'no problem' : 'a missing asset is recorded as a draft problem'}`);
        eq(a.rows().Asset.state, hasDefault ? 'ok' : 'missing', `${mode}/${k}: the overview agrees`);
      } else {
        ok(/IERC20\(asset_\)/.test(code) && ev('pendingCtorArgs.map((x) => x.param).join()') === 'asset_', `${mode}/${k}: the asset is the constructor argument asset_`);
        eq(ev('pendingSource.problems.length'), 0, `${mode}/${k}: nothing is missing at generation time`);
        eq(a.rows().Asset.state, 'ok', `${mode}/${k}: the overview agrees`);
      }
      const nr = a.rows().Network;
      eq(nr.text, `${N.label} (${N.chainIdDec})`, `${mode}/${k}: the Network row names the chain and its id`);
      eq(/^Mainnet: real funds/.test(nr.flag), !!N.isMainnet, `${mode}/${k}: ${N.isMainnet ? 'a mainnet is flagged' : 'a testnet is not flagged'}`);
    }
  }
  eq(a.pageErrors.length, 0, 'no page errors across 32 generations');
}

/* 3. the shared Network flag also reaches the two screens built earlier (Swap and Treasury) */
{
  const a = fresh(); const { d, ev } = a;
  const swapRow = () => [...d.querySelectorAll('#swbSummary .swb-row')].find((r) => r.querySelector('dt').textContent === 'Network');
  const treRow = () => [...d.querySelectorAll('#treSummary .bld-row')].find((r) => r.querySelector('dt').textContent === 'Network');
  a.net('ethereum'); ev('CFBuilder.renderAll()');
  ok(/Mainnet: real funds/.test(swapRow().textContent) && /Mainnet: real funds/.test(treRow().textContent), 'swap and treasury: a mainnet is flagged');
  a.net('sepolia'); ev('CFBuilder.renderAll()');
  ok(!/Mainnet/.test(swapRow().textContent) && !/Mainnet/.test(treRow().textContent), 'swap and treasury: a testnet is not');
}

/* 4. a missing asset writes a DRAFT, a bad fee is refused, and the page says which */
{
  const a = fresh(); const { d, ev } = a;
  ev("window.__calls = []; ['compileAndDeploy','compileSource','compilePending','deployCompiled'].forEach((n) => { window[n] = () => { window.__calls.push(n); }; });");
  a.net('robinhoodMain'); await a.gen();
  eq(a.alerts.length, 0, 'draft: no alert');
  eq(ev('pendingSource.problems.join("|")'), 'Asset is required: Robinhood Chain has no default for it', 'draft: the generator recorded its own problem');
  ok(/^Draft: /.test(ev('reqBlockReason()')) && d.getElementById('btnCompileDeploy').disabled, 'draft: the deploy page refuses it');
  let p = a.prog();
  eq([p['Code Generation'].state, p.Deployment.state], ['draft', 'locked'], 'progress: draft, deployment locked');
  ok(/DRAFT/.test(p['Code Generation'].text) && /Blocked until the draft is fixed: Asset is required/.test(p.Deployment.text), 'progress: and why');
  eq(a.rows().Asset.state, 'missing', 'summary: the asset is shown as missing');
  ok(/no default asset/.test(d.getElementById('vltAssetNote').textContent), 'guidance: says the network has no default asset');
  a.set('vault_asset', ASSET); await a.gen();
  eq([a.prog()['Code Generation'].state, ev('reqBlockReason()')], ['done', ''], 'typing the asset and generating again clears the draft');
  a.set('vault_asset', '0x123'); await a.gen();
  ok(a.rows().Asset.state === 'bad' && /Asset must be an address/.test(a.rows().Asset.flag), 'summary: a malformed asset is flagged');
  eq(ev('JSON.stringify(window.__calls)'), '[]', 'nothing was compiled or deployed');
  // a fee outside 0..9999 is refused by the generator (an alert, no new buffer) and the page says so before you press the button
  a.net('arc'); a.set('vault_asset', ''); await a.gen(); const before = ev('pendingSource.code');
  a.set('vault_perf', '10000'); await a.gen();
  eq([a.alerts.length, ev('pendingSource.code') === before], [1, true], 'refusal: the generator alerts and leaves the buffer alone');
  ok(a.rows()['Performance fee'].state === 'bad' && /generation is refused/.test(a.rows()['Performance fee'].flag), 'refusal: the summary flags it ahead of time');
  eq([d.getElementById('vltPct').textContent, d.getElementById('vltPct').getAttribute('data-bad')], ['invalid', '1'], 'refusal: the percent chip says invalid');
  ok(/^Performance fee must be a whole number/.test(a.prog().Configuration.text) && a.prog().Configuration.state === 'attention', 'refusal: configuration needs attention');
  for (const [bps, pct] of [['0', '0.00%'], ['1', '0.01%'], ['30', '0.30%'], ['1000', '10.00%'], ['9999', '99.99%']]) { a.set('vault_perf', bps); eq(d.getElementById('vltPct').textContent, '= ' + pct, `chip: ${bps} bps = ${pct}`); }
  a.set('vault_perf', ''); eq(a.rows()['Performance fee'].text, '0 bps (0.00%)', 'an empty fee means 0, as in the generator');
}

/* 5. the deposit cap and the symbol: what compiles and what does not */
{
  const a = fresh(); const { d, ev } = a;
  eq([a.rows()['Deposit cap'].text, d.getElementById('vltCapNote').textContent], ['Unlimited', 'Unlimited: no deposit cap.'], 'cap: 0 is unlimited');
  a.set('vault_cap', '500'); eq([a.rows()['Deposit cap'].text, a.rows()['Deposit cap'].flag], ['500 tokens', 'Scaled by the asset decimals at deploy'], 'cap (single): scaled by the asset decimals');
  ok(/decimals\(\) when the constructor runs/.test(d.getElementById('vltCapNote').textContent), 'cap (single): says how it is scaled');
  await a.gen(); ok(/depositCap = 500 \* 10\*\*_vltDec;/.test(ev('pendingSource.code')), 'cap (single): the Solidity says exactly that');
  for (const bad of ['-5', '1e3']) { a.set('vault_cap', bad); eq(a.rows()['Deposit cap'].state, 'bad', `cap (single): ${bad} would not compile and is flagged`); }
  a.set('vault_cap', '1.5'); eq(a.rows()['Deposit cap'].state, 'ok', 'cap (single): 1.5 compiles and is accepted');
  ev("setMultichainMode('portable')"); a.set('vault_cap', '500');
  ok(/Scaled by the asset decimals/.test(a.rows()['Deposit cap'].flag) && /decimals\(\) when the constructor runs/.test(d.getElementById('vltCapNote').textContent), 'cap (portable): scaled by the real decimals at deploy');
  await a.gen(); ok(/depositCap = 500 \* 10\*\*_vltDec;/.test(ev('pendingSource.code')), 'cap (portable): the Solidity says exactly that');
  for (const bad of ['1e3', '-5']) { a.set('vault_cap', bad); eq(a.rows()['Deposit cap'].state, 'bad', `cap (portable): ${bad} is flagged`); ok(/stops generation/.test(a.rows()['Deposit cap'].flag), 'cap (portable): and the flag says generation stops'); ok(/is not a number/.test(await w_try(a, 'genVault()')), `cap (portable): the generator really throws for ${bad}`); }
  ev("setMultichainMode('single')"); a.set('vault_cap', '0');
  for (const bad of ['a"b', 'a\\b']) { a.set('vault_symbol', bad); ok(a.rows()['Share symbol'].state === 'bad' && /quotes or backslashes/.test(a.prog().Configuration.text), `symbol ${bad} is flagged: the Solidity would not compile`); }
  a.set('vault_symbol', 'avUSDC'); eq(a.rows()['Share symbol'].state, 'ok', 'a normal symbol is fine');
}

/* 6. no decimal assumption is reported per network (the vault scales by the asset's own decimals) */
{
  const a = fresh(); const { d } = a;
  a.net('bnb'); a.set('vault_asset', ''); a.set('vault_name', 'V');
  ok(!/assumes 6/.test(a.rows().Asset.flag), 'bnb: the page no longer says the vault assumes 6 decimals');
  ok(!/6-decimal/.test(d.getElementById('vltAssetNote').textContent), 'every network: no share-pricing decimal assumption is stated');
  ok(!/Uniswap|AMM|signer/i.test(d.getElementById('sec-vault').textContent), 'no wording borrowed from another tab');
}

/* 7. Deploy now keeps the whole deploy page; constructor and Multi-deploy follow the generated ABI; the mainnet gates are the existing ones */
{
  const a = fresh(); const { d, ev, w } = a;
  ev("window.__calls = []; ['compileAndDeploy','compileSource','compilePending','deployCompiled'].forEach((n) => { window[n] = () => { window.__calls.push(n); }; });");
  let rpc = 0; w.ethereum = { request: async () => { rpc++; return null; }, on() {} };
  await a.gen();
  eq([ev('JSON.stringify(window.__calls)'), rpc], ['[]', 0], 'generate: nothing is compiled or deployed, no wallet request');
  const src = ev('pendingSource.code');
  d.querySelector('#sec-vault .btnrow .btn-ghost').click(); await tick();
  eq(d.getElementById('sec-deploy').style.display, 'block', 'deploy now: opens the existing Compile & Deploy section');
  ok(d.getElementById('sec-vault').style.display === 'none' && ev('pendingSource.code') === src && ev('JSON.stringify(window.__calls)') === '[]', 'deploy now: just the other section, the source unchanged, nothing compiled');
  for (const id of ['pendingContractLabel', 'ctorArgsPanel', 'multiDeployPanel', 'btnCompileDeploy', 'btnDownloadSol', 'btnCopySol', 'deployConsole']) ok(!!d.getElementById(id), 'deploy page: #' + id + ' is there');
  ok(/ArcYieldVault\.sol/.test(d.getElementById('pendingContractLabel').value), 'deploy page: the pending contract is shown');
  eq(d.querySelectorAll('#ctorArgsPanel input').length, 0, 'ctor: single mode needs none');
  ev("setMultichainMode('portable')"); a.set('vault_asset', ASSET); a.set('vault_cap', '25'); await a.gen();
  eq(ev('pendingCtorArgs.map((x) => x.param).join()'), 'asset_', 'ctor: portable mode asks for the asset');
  eq([d.querySelectorAll('#ctorArgsPanel input').length, d.querySelector('#ctorArgsPanel input').value], [1, ASSET], 'ctor: one input, with the typed address');
  ev("setMultichainMode('multi')"); await a.gen();
  d.querySelector('#sec-vault .btnrow .btn-ghost').click(); await tick();
  eq([d.getElementById('multiDeployPanel').style.display, d.querySelectorAll('#multiDeployPanel .md-chip.on').length], ['block', 0], 'multi-deploy: the panel is there and no network is pre-selected');
  eq(d.querySelectorAll('#multiDeployPanel .md-chip').length, 16, 'multi-deploy: every supported network is offered');
  ev("toggleMdNetwork('arc')"); a.set('vault_perf', '500');
  eq(d.querySelectorAll('#multiDeployPanel .md-chip.on').length, 1, 'multi-deploy: selection is explicit and editing the form leaves it alone');
  ok(![...d.querySelectorAll('#multiDeployPanel .md-chip.on')].some((c) => /LIVE/.test(c.textContent)), 'multi-deploy: no mainnet is selected');
}

/* 7b. the mainnet gates, on every mainnet, with the real (unstubbed) deploy path */
{
  const a = fresh(); const { ev } = a;
  ok(ev("typeof reqBlockReason === 'function' && typeof matIsApproved === 'function' && typeof matGate === 'function'"), 'gates: reqBlockReason, matIsApproved and matGate still exist');
  // the gates: every mainnet needs the maturity confirmation for this exact source
  for (const k of ['ethereum', 'polygon', 'base', 'arbitrum', 'optimism', 'avalanche', 'bnb', 'robinhoodMain', 'arcMain']) {
    a.net(k); a.set('vault_asset', ASSET); await a.gen();
    const hash = ev('matHash(pendingSource.code)');
    eq(ev(`matIsApproved('${hash}', '${k}')`), false, `gate/${k}: a fresh vault is not approved`);
    ok(/Mainnet deploy blocked/.test(await w_try(a, `deployCompiled({ name: 'X', abi: [], bytecode: '0x', sourceHash: '${hash}' }, [], '${k}')`)), `gate/${k}: deployCompiled still refuses without the maturity confirmation`);
  }
}

/* 8. the progress only reports what really happened */
{
  const a = fresh(); const { d, ev } = a;
  let p = a.prog();
  eq([p.Configuration.state, p['Code Generation'].state, p['Review & Audit'].state, p.Deployment.state], ['done', 'todo', 'locked', 'locked'], 'start: configuration valid, nothing else claimed');
  eq(a.stages(), ['done', 'current', 'todo'], 'start: the header points at Generate');
  await a.gen(); p = a.prog();
  eq([p['Code Generation'].state, p['Review & Audit'].state, p.Deployment.state], ['done', 'todo', 'todo'], 'after generation: only generation is done');
  ok(/ArcYieldVault\.sol, \d+ lines generated/.test(p['Code Generation'].text), 'with the real file name and line count');
  ev("lastAuditReport = { score: 99, summary: 'fine', findings: [] }"); a.set('vault_name', 'ArcYieldVault');
  eq(a.prog()['Review & Audit'].state, 'todo', 'an audit report in memory never turns Review & Audit green');
  a.set('vault_perf', '900'); eq(a.prog()['Code Generation'].state, 'stale', 'changing the form marks the code stale');
  a.set('vault_perf', '1000'); eq(a.prog()['Code Generation'].state, 'done', 'putting the value back makes it current');
  a.net('base'); await tick(); eq(a.prog()['Code Generation'].state, 'stale', 'changing the network marks the code stale (the asset and the chain id are in it)');
  a.net('arcMain'); await tick(); eq(a.prog()['Code Generation'].state, 'done', 'and back');
  ev("setMultichainMode('portable')"); eq(a.prog()['Code Generation'].state, 'stale', 'changing the Deployment Mode marks the code stale');
  ev("setMultichainMode('single')");
  ev("pendingSource = { name: 'Other', code: 'contract Other {}', template: 'treasury' }"); ev('CFBuilder.render("vault")');
  ok(a.prog()['Code Generation'].state === 'stale' && /different contract/.test(a.prog()['Code Generation'].text), 'another tab taking the deploy buffer is reported');
  await a.gen();
  d.defaultView.localStorage.setItem(ev('HISTORY_KEY'), JSON.stringify([{ name: 'ArcYieldVault', address: '0x' + '1'.repeat(40), network: 'arc', abi: [], txHash: '0x1', timestamp: Date.now() - 100000 }]));
  ev('CFBuilder.render("vault")'); eq(a.prog().Deployment.state, 'todo', 'an older deployment of the same name does not count');
  ev("addToDeployHistory({ name: 'Other', address: '0x' + '2'.repeat(40), network: 'arc', abi: [], txHash: '0x2' })"); await tick();
  eq(a.prog().Deployment.state, 'todo', 'a deployment of a different contract does not count');
  ev("addToDeployHistory({ name: 'ArcYieldVault', address: '0x' + '3'.repeat(40), network: 'arc', abi: [], txHash: '0x3' })"); await tick();
  ok(a.prog().Deployment.state === 'done' && /Confirmed on Arc Testnet at 0x3{40}/.test(a.prog().Deployment.text), 'a deployment recorded after this generation is shown, with its real network and address');
}

/* 9. the overview, the code head, text safety, and the other screens */
{
  const a = fresh(); const { d, w, ev } = a;
  let r = a.rows();
  eq([r.Project.text, r['Share symbol'].text, r.Asset.text, r['Performance fee'].text, r.Strategy.text, r['Deployment Mode'].text], ['ArcYieldVault', 'avUSDC', ev('NETWORKS.arc.usdc'), '1000 bps (10.00%)', 'Manual yield', 'Single network'], 'summary: starts from the real defaults and the real network asset');
  ev("setMultichainMode('multi')"); eq(a.rows()['Deployment Mode'].text, 'Multi-deploy', 'summary: follows the Deployment Mode control');
  ok(/Constructor argument/.test(a.rows().Asset.flag), 'summary: and the asset becomes a constructor argument');
  ev("setMultichainMode('single')");
  ok(/does not earn yield by itself/.test(d.getElementById('vltStrategy').textContent), 'guidance: the strategy card says what the code does');
  ok(!/audit score|\d+\s*gwei/i.test(d.getElementById('vltSummary').textContent), 'no invented gas estimate or audit score');
  await a.gen();
  const head = d.querySelector('#vaultCode .codehead'); const lvl = ev('matInfo("vault").level');
  ok(head.querySelector('.bld-lang') && head.querySelector('.mat-badge.mat-' + lvl), 'code head: language label and the real maturity badge (' + lvl + ')');
  eq(!!head.querySelector('.bld-warn'), lvl === 'experimental', 'code head: "Not audited" only when experimental');
  eq(d.querySelector('#vaultCode pre').textContent, ev('pendingSource.code'), 'code head: the Solidity is untouched');
  const evil = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
  a.set('vault_name', evil); a.set('vault_symbol', evil); a.set('vault_asset', evil);
  ok(!d.querySelector('#vltSummary img, #vltSummary script, #vltProgress img, #vltAssetNote img') && w.__xss === undefined, 'xss: values are shown as text, never as markup');
  ok(![...d.querySelectorAll('#vltSummary *, #vltProgress *, #vltAssetNote, #vltCapNote')].some((e) => [...e.attributes].some((x) => /__xss/.test(x.value))), 'xss: no attribute carries the payload');
  eq(JSON.parse(ev('JSON.stringify(CFBuilder.keys())')).filter((k) => ['swap', 'treasury', 'vault'].includes(k)), ['swap', 'treasury', 'vault'], 'engine: three screens registered');
  a.set('vault_name', 'ArcYieldVault'); a.set('vault_symbol', 'avUSDC'); a.set('vault_asset', ''); await a.gen();
  for (let i = 0; i < 3; i++) for (const s of ['home', 'swap', 'vault', 'deploy', 'treasury', 'vault']) await a.go(s);
  ok(a.prog()['Code Generation'].state === 'done' && d.querySelectorAll('#vltSummary .bld-row').length === 8, 'repeated navigation keeps the state and does not duplicate rows');
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
