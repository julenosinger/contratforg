// Phase 9.6: the Contract Wizard (section 14). The wizard is a router, not a generator: it picks a goal and a contract, switches the app's active
// network, and wizardGenerate() opens the right builder (Swap, Vault, Treasury or Crosschain open their own; every other choice opens Simple
// contracts with that template selected). Its functions and markup are unchanged; the new overview only reads wizardState, activeNetwork and the
// Deployment Mode. The constructor facts it states are checked against the real generators, on every network, in the single and portable modes.
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root, fillAddresses, addrFor } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
const SUBS = { token: ['erc20', 'erc721'], payment: ['escrow', 'vesting', 'paywall'], defi: ['swap', 'vault', 'staking'], org: ['dao', 'treasury'], bridge: ['crosschain'], wallet: ['smartwallet'] };
const ALL = Object.values(SUBS).flat();
const ROUTE = { swap: 'swap', vault: 'vault', treasury: 'treasury', crosschain: 'crosschain' };   // everything else opens Simple contracts
const CTOR = { erc20: '', erc721: 'usdc_', escrow: 'token_', vesting: 'token_', paywall: 'token_', staking: 'stakingToken_', dao: 'token_,votingPeriod_', smartwallet: 'dailyLimit_', swap: 'tokenA_,tokenB_', vault: 'asset_', treasury: 'gasTokenAlias_', crosschain: 'tokenMessenger_,messageTransmitter_,usdc_' };
const OPENS = { erc20: 'Simple contracts: ERC-20 Token', erc721: 'Simple contracts: NFT Collection', escrow: 'Simple contracts: Buyer/Seller Escrow', vesting: 'Simple contracts: Linear Vesting', paywall: 'Simple contracts: Paywall / Subscription', staking: 'Simple contracts: Staking Rewards', dao: 'Simple contracts: DAO Governance', smartwallet: 'Simple contracts: Smart Wallet', swap: 'Swap / AMM', vault: 'Vault (ERC-4626)', treasury: 'Treasury', crosschain: 'Crosschain (CCTP)' };
const A = addrFor('a1'), B = addrFor('b2'), C = addrFor('c3');

function fresh(opts) {
  const a = loadApp(opts); const d = a.w.document;
  const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
  const alerts = []; a.w.alert = (m) => alerts.push(m);
  const rows = () => Object.fromEntries([...d.querySelectorAll('#wzSummaryList .bld-row')].map((r) => [r.querySelector('dt').textContent, { text: r.querySelector('dd').childNodes[0] ? r.querySelector('dd').childNodes[0].textContent : '', state: r.dataset.state, flag: (r.querySelector('.bld-flag') || { textContent: '' }).textContent }]));
  const notes = () => [...d.querySelectorAll('#wzNotes li')].map((l) => l.textContent);
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await tick(); };
  const pickCat = async (cat) => { d.querySelector(`#wp-0 .tcard[data-onclick^="wizardPick('${cat}'"]`).click(); await tick(); await tick(); };
  const pickSub = async (id) => { const name = a.ev(`WIZARD_SUBTYPES[wizardState.category].find((s) => s.id === '${id}').name`); const card = [...d.querySelectorAll('#wz-subtypes .tcard')].find((c) => c.querySelector('h3').textContent === name); card.click(); await tick(); await tick(); };
  const click = async (sel) => { d.querySelector(sel).click(); await tick(); await tick(); };
  const choose = async (id) => { const cat = Object.entries(SUBS).find(([, v]) => v.includes(id))[0]; await go('wizard'); a.ev('wizardState.step = 0; renderWizardStep();'); await pickCat(cat); await pickSub(id); };
  const net = async (k) => { a.ev(`activeNetwork = '${k}'; updateSideNet();`); await tick(); };
  return { ...a, d, rows, notes, go, pickCat, pickSub, click, choose, net, alerts };
}

/* 1. nothing that other code relies on was renamed or moved away */
{
  const a = fresh(); const { d } = a;
  for (const id of ['wizardSteps', 'wp-0', 'wp-1', 'wp-2', 'wp-3', 'wz-subprompt', 'wz-subtypes', 'wz-netbar', 'wizardSummary', 'wz-summary-title', 'wz-summary-sub', 'wz-back', 'wz-next']) ok(!!d.getElementById(id), 'ids: #' + id + ' exists');
  eq([...d.querySelectorAll('#wizardSteps .wstep .label')].map((l) => l.textContent), ['What to build', 'Configure', 'Network', 'Review & generate'], 'the four steps keep their labels');
  eq([...d.querySelectorAll('#wp-0 .tcard')].map((c) => [/wizardPick\('(\w+)'/.exec(c.getAttribute('data-onclick'))[1], c.querySelector('h3').textContent]), [['token', 'Launch a token'], ['payment', 'Handle payments'], ['defi', 'Build DeFi'], ['org', 'Govern an org'], ['bridge', 'Move value cross-chain'], ['wallet', 'Smart wallet']], 'six goals, same handlers and titles');
  eq(Object.fromEntries(Object.entries(a.ev('JSON.parse(JSON.stringify(WIZARD_SUBTYPES))')).map(([k, v]) => [k, v.map((s) => s.id)])), SUBS, 'twelve contracts in six goals; MultiSend is not offered by the wizard');
  eq([...d.querySelectorAll('#sec-wizard [data-onclick]')].map((e) => e.getAttribute('data-onclick')).filter((h) => !/^dmToggle|^wizardPick/.test(h)), ['wizardGenerate()', 'wizardBack()', 'wizardNext()'], 'navigation and generate handlers are unchanged');
  eq(d.querySelector('#sec-wizard .btnrow button').textContent, 'Open the builder →', 'the button says what it does: it opens the builder (it generates nothing)');
  ok(/does not generate or deploy anything/.test(d.querySelector('#wp-3 .bld-actnote').textContent), 'and the page says so');
  eq(d.querySelector('#sec-wizard .section-head h2').textContent, 'Contract Wizard', 'the heading');
  ok(d.getElementById('sec-wizard').classList.contains('bld'), 'the section carries the shared builder class');
  eq(d.querySelectorAll('#sec-wizard .section-head .dm-mount .dm-trigger').length, 1, 'mode: the Deployment Mode control is in the header');
  eq([...d.getElementById('sec-wizard').outerHTML.matchAll(/\s(on[a-z]+)=\"[^\"]*\"/gi)].map((m) => m[0].trim()), [], 'csp: no inline handler attribute');
  eq(a.w.getComputedStyle(d.querySelector('#sec-wizard .bld-grid')).display, 'grid', 'computed: the grid is a grid');
  eq(a.pageErrors.length, 0, 'no page errors on load');
  eq([JSON.parse(a.ev('JSON.stringify(CFBuilder.keys())')).includes('wizard'), JSON.parse(a.ev('JSON.stringify(CFBuilder.viewKeys())'))], [false, ['wizard']], 'engine: the wizard is a view, not a builder with a code panel');
}

/* 2. the flow and what the overview says at each step */
{
  const a = fresh(); const { d, ev } = a;
  await a.go('wizard');
  let r = a.rows();
  eq([r.Step.text, r.Goal.state, r.Contract.state, r.Opens.state], ['1 of 4: What to build', 'missing', 'missing', 'missing'], 'start: nothing is chosen and the overview says so');
  ok(/Choose what you want to build/.test(a.notes()[0]), 'start: the note says what to do');
  await a.click('#wz-next'); eq(ev('wizardState.step'), 0, 'Next does nothing before a goal is chosen (hidden at step 1 as before)');
  await a.pickCat('defi');
  r = a.rows(); eq([ev('wizardState.step'), r.Step.text, r.Goal.text], [1, '2 of 4: Configure', 'Build DeFi'], 'choosing a goal moves to step 2 and the overview follows');
  eq([...d.querySelectorAll('#wz-subtypes .tcard h3')].map((h) => h.textContent), ['AMM Swap', 'Vault ERC-4626', 'Staking'], 'the contracts of that goal');
  await a.click('#wz-next'); eq(ev('wizardState.step'), 1, 'Next is blocked until a contract is chosen');
  await a.pickSub('vault'); r = a.rows(); eq([r.Contract.text, r.Opens.text], ['Vault ERC-4626', 'Vault (ERC-4626)'], 'choosing a contract fills the overview');
  await a.click('#wz-next'); eq([ev('wizardState.step'), a.rows().Step.text], [2, '3 of 4: Network'], 'Next goes to the network step');
  ok(/switches the app's active network at once/.test(a.notes().join(' ')), 'the network step says that choosing switches the active network');
  await a.click('#wz-next'); eq([ev('wizardState.step'), a.rows().Step.text], [3, '4 of 4: Review & generate'], 'and to the review step');
  eq([d.getElementById('wz-summary-title').textContent, /Arc Testnet/.test(d.getElementById('wz-summary-sub').textContent)], ['Vault ERC-4626', true], 'the existing review text is still filled');
  await a.click('#wz-back'); await a.click('#wz-back'); await a.click('#wz-back');
  eq([ev('wizardState.step'), ev('wizardState.category'), ev('wizardState.subtype')], [0, 'defi', 'vault'], 'Back goes to the first step and keeps the choices');
  await a.pickCat('token');
  eq([a.rows().Goal.text, a.rows().Contract.state, ev("wizardState.subtype")], ['Launch a token', 'missing', ''], 'changing the goal clears the contract chosen under the old goal (it used to survive and be routed to anyway)');
  await a.click('#wz-next'); eq(ev('wizardState.step'), 1, 'so Next is blocked again until a contract of the new goal is picked');
  await a.pickCat('token'); await a.pickSub('erc20'); await a.click('#wz-back'); await a.pickCat('token'); eq(ev('wizardState.subtype'), 'erc20', 'picking the same goal again keeps the contract');
}

/* 3. where each choice opens: the wizard routes, it never generates */
{
  const a = fresh(); const { d, ev, w } = a;
  ev("window.__calls = []; ['compileAndDeploy','compileSource','compilePending','deployCompiled','genSimple','genSwap','genVault','genTreasury','genCrosschain','genMultisend'].forEach((n) => { window[n] = () => { window.__calls.push(n); }; });");
  let rpc = 0; w.ethereum = { request: async () => { rpc++; return null; }, on() {} };
  const mode0 = ev('multichainMode'), net0 = ev('activeNetwork');
  for (const id of ALL) {
    await a.choose(id);
    const before = ev('JSON.stringify(pendingSource)');
    eq(a.rows().Opens.text, OPENS[id], `${id}: the overview says where it opens`);
    ev('wizardState.step = 3; renderWizardStep();');
    await a.click('#sec-wizard .btnrow button');
    await wait(160);
    const target = ROUTE[id] || 'simple';
    eq(d.getElementById('sec-' + target).style.display, 'block', `${id}: opens ${target}`);
    ok(d.querySelector(`.nav-item[data-section="${target}"]`).classList.contains('active') && [...d.querySelectorAll('main section.section')].filter((s) => s.style.display === 'block').length === 1, `${id}: the menu follows and only that section is shown`);
    if (!ROUTE[id]) eq([d.querySelector('#simpleGrid .tcard.selected').dataset.id, /genSimple\('(\w+)'\)/.exec(d.querySelector('#simpleForm button[data-onclick^="genSimple"]').getAttribute('data-onclick'))[1]], [id, id], `${id}: the template is selected and its form is on screen`);
    eq(ev('JSON.stringify(pendingSource)'), before, `${id}: the deploy buffer is untouched`);
    await a.go('wizard');
  }
  eq([ev('JSON.stringify(window.__calls)'), rpc, alerts_len(a), ev('multichainMode') === mode0, ev('activeNetwork') === net0], ['[]', 0, 0, true, true], 'the wizard never generated, compiled, deployed, asked the wallet, alerted, or changed the mode or the network on its own');
  eq(a.pageErrors.length, 0, 'no page errors');
}
function alerts_len(a) { return a.alerts.length; }

/* 4. what the overview says about the constructor is what the real generators produce, in both modes */
{
  const a = fresh(); const { d, ev } = a;
  const INFO = JSON.parse(ev('JSON.stringify(WZ_INFO)'));
  eq(Object.fromEntries(Object.entries(INFO).map(([k, v]) => [k, v.ctor.join(',')])), CTOR, 'the overview lists the constructor arguments of all twelve contracts');
  const runGen = async (id) => {
    ev("pendingSource = { name: '', code: '', template: '' }; pendingCtorArgs = [];");
    const t = ROUTE[id] || 'simple'; await a.go(t);
    if (!ROUTE[id]) { d.querySelector(`#simpleGrid .tcard[data-id="${id}"]`).click(); await tick(); await tick(); for (const [k, v] of Object.entries({ erc20: {}, erc721: {}, escrow: { s_buyer: A, s_seller: B, s_arbiter: C }, vesting: { s_beneficiary: A }, paywall: { s_beneficiary: A }, dao: { s_token: A }, smartwallet: { s_guardian: A }, staking: {} }[id])) d.getElementById(k).value = v; ev(`genSimple('${id}')`); }
    else if (id === 'swap') ev('genSwap()'); else if (id === 'vault') ev('genVault()'); else if (id === 'crosschain') ev('genCrosschain()');
    else { d.getElementById('tre_signers').value = [A, B, C].join('\n'); ev('genTreasury()'); }
    return ev("pendingCtorArgs.map((x) => x.param).join()");
  };
  for (const dm of ['single', 'portable', 'multi', 'cross']) {
    ev(`setMultichainMode('${dm}')`); await a.go('wizard');
    for (const id of ALL) {
      await a.choose(id);
      const r = a.rows();
      const want = dm === 'single' ? '' : CTOR[id];
      eq(r['Deployment Mode'].flag, want ? 'Constructor arguments: ' + want.split(',').join(', ') : 'No constructor arguments', `${dm}/${id}: the overview states the constructor`);
      eq(await runGen(id), want, `${dm}/${id}: and the real generator produces exactly that`);
    }
  }
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 5. the network step, on all 16 networks, with the mainnet confirmation */
{
  const a = fresh(); const { d, ev } = a;
  const nets = JSON.parse(ev('JSON.stringify(Object.keys(NETWORKS))'));
  await a.choose('crosschain'); ev('wizardState.step = 2; renderWizardStep();'); await tick();
  const btns = [...d.querySelectorAll('#wz-netbar .netbtn')];
  eq(btns.length, 16, 'the network step offers all 16 networks');
  eq(btns.filter((b) => /LIVE/.test(b.textContent)).length, 9, 'and marks the 9 mainnets LIVE (7 testnets)');
  let asked = 0, answer = false; ev('window.confirmMainnet = null;'); a.w.eval('confirmMainnet = async (label) => { window.__asked = (window.__asked || 0) + 1; window.__label = label; return window.__answer; }');
  for (const k of nets) {
    const N = JSON.parse(ev(`JSON.stringify(NETWORKS['${k}'])`));
    const b = [...d.querySelectorAll('#wz-netbar .netbtn')].find((x) => x.textContent.replace(/\s*LIVE\s*$/, '').trim() === N.label);
    ok(!!b, `${k}: has its button`);
    a.w.__answer = true; b.click(); await tick(); await tick(); await tick();
    eq(ev('activeNetwork'), k, `${k}: choosing it switches the active network`);
    const r = a.rows();
    eq([r.Network.text, /^Mainnet: real funds/.test(r.Network.flag), r.Opens.text], [`${N.label} (${N.chainIdDec})`, !!N.isMainnet, 'Crosschain (CCTP)'], `${k}: the overview names the chain and flags mainnets`);
    const v1 = !!(N.cctp.tokenMessenger && N.cctp.messageTransmitter), v2 = ev(`!!cctpV2('${k}')`);
    ok(a.notes().some((t) => /not in the CCTP V1 address table/.test(t)) === !v1, `${k}: the Single-mode note about the CCTP V1 table appears exactly when it is missing`);
    ev("setMultichainMode('portable')"); await tick();
    ok(a.notes().some((t) => /has no CCTP V2 deployment/.test(t)) === !v2, `${k}: the portable-mode note about CCTP V2 appears exactly when it is missing`);
    ev("setMultichainMode('single')"); await tick();
  }
  // a refused mainnet leaves the network as it was
  ev("activeNetwork = 'arc'; updateSideNet();"); ev('wizardState.step = 2; renderWizardStep();'); await tick();
  a.w.__answer = false; const live = [...d.querySelectorAll('#wz-netbar .netbtn')].find((x) => /Base/.test(x.textContent) && /LIVE/.test(x.textContent));
  const askedBefore = a.w.__asked; live.click(); await tick(); await tick(); await tick();
  eq([ev('activeNetwork'), a.w.__asked - askedBefore, a.w.__label], ['arc', 1, 'Base'], 'a mainnet is only switched to after the confirmation: when it is refused, the network stays');
  eq(a.rows().Network.text, 'Arc Testnet (5042002)', 'and the overview still shows the real network');
  // the network changing elsewhere (the sidebar, the wallet) is followed too
  ev("activeNetwork = 'polygon'; updateSideNet();"); await tick(); await tick();
  eq(a.rows().Network.text, 'Polygon (137)', 'a network change made elsewhere updates the overview');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 6. the mode, the state across navigation, text safety, the other screens */
{
  const a = fresh(); const { d, ev } = a;
  await a.choose('dao'); eq(a.rows()['Deployment Mode'].flag, 'No constructor arguments', 'dao (single): no constructor arguments');
  ev("setMultichainMode('portable')"); eq(a.rows()['Deployment Mode'].flag, 'Constructor arguments: token_, votingPeriod_', 'the overview follows the Deployment Mode control at once');
  ok(a.notes().some((t) => /block times differ/.test(t)) && a.notes().some((t) => /governance token in Single network mode/.test(t)), 'dao: the notes carry its particularities');
  ev("setMultichainMode('single')");
  await a.choose('smartwallet'); ok(a.notes().some((t) => /not the account that deploys the wallet/.test(t) && /refuses to generate/.test(t)), 'smartwallet: the note says it refuses to generate without a guardian');
  await a.choose('treasury'); ok(a.notes().some((t) => /DRAFT with a placeholder signer/.test(t)), 'treasury: the note says what a missing signer does');
  await a.choose('vault'); ok(a.notes().some((t) => /Robinhood Chain and Robinhood Testnet have none/.test(t)), 'vault: the note names the networks with no default asset');
  await a.choose('swap'); ok(a.notes().some((t) => /order-book swap is a choice inside the builder/.test(t)), 'swap: the note says the order book is chosen inside the builder');
  // state across navigation
  await a.choose('escrow'); ev('wizardState.step = 1; renderWizardStep();');
  for (let i = 0; i < 3; i++) for (const s of ['home', 'swap', 'wizard', 'deploy', 'treasury', 'wizard']) await a.go(s);
  eq([ev('wizardState.step'), ev('wizardState.subtype'), a.rows().Contract.text, d.querySelectorAll('#wzSummaryList .bld-row').length], [1, 'escrow', 'Escrow', 6], 'repeated navigation keeps the wizard state and does not duplicate rows');
  // values are shown as text
  ev("NETWORKS[activeNetwork].label = '<img src=x onerror=window.__xss=1>'"); ev('CFBuilder.renderAll()');
  ok(!d.querySelector('#wzSummaryList img, #wzNotes img') && a.w.__xss === undefined && /<img/.test(a.rows().Network.text), 'xss: a hostile label is shown as text, never as markup');
  ok(['sec-treasury', 'sec-vault', 'sec-multisend', 'sec-crosschain', 'sec-simple'].every((id) => d.getElementById(id).classList.contains('bld')) && !!d.querySelector('#sec-swap .swb-grid, #sec-swap .swb'), 'the six builders are untouched and keep their shell');
  ok(JSON.parse(ev('JSON.stringify(CFBuilder.keys())')).length === 6, 'engine: still six builders');
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
