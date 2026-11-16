// Phase 9.0: the audit of the creation tabs, written as a test. Every fact below was read from the code and checked by running the
// generators (see docs/phase9-0-audit.md). Later phases redesign these tabs one by one; this file must keep passing, unchanged, so a
// redesign cannot silently change a field id, a handler, the template a generator produces, or whether it blocks or makes a draft.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadApp } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const here = path.dirname(fileURLToPath(import.meta.url));

/* 1. what each tab is made of */
const TABS = {
  simple:     { ids: ['simpleGrid', 'simpleForm', 'simpleCode'], handlers: [], code: 'simpleCode', deploy: "deployFromBuffer('simple')" },
  swap:       { ids: ['swap_name', 'swap_tokenA', 'swap_tokenB', 'swap_fee', 'swap_kind', 'swap_multi', 'swapCode'], handlers: ['genSwap()', "deployFromBuffer('swap')"], code: 'swapCode' },
  treasury:   { ids: ['tre_name', 'tre_threshold', 'tre_signers', 'tre_streaming', 'tre_tokens', 'treasuryCode'], handlers: ['genTreasury()', "deployFromBuffer('treasury')"], code: 'treasuryCode' },
  vault:      { ids: ['vault_name', 'vault_symbol', 'vault_asset', 'vault_perf', 'vault_strategy', 'vault_cap', 'vaultCode'], handlers: ['genVault()', "deployFromBuffer('vault')"], code: 'vaultCode' },
  multisend:  { ids: ['ms_name', 'ms_mode', 'ms_max', 'ms_fee', 'ms_owner', 'multisendCode'], handlers: ['genMultisend()', "deployFromBuffer('multisend')"], code: 'multisendCode' },
  crosschain: { ids: ['cc_name', 'cc_tokenmessenger', 'cc_msgtransmitter', 'cc_usdc', 'cc_mode', 'cc_resume', 'crosschainCode'], handlers: ['genCrosschain()', "deployFromBuffer('crosschain')"], code: 'crosschainCode' }
};
{
  const { w } = loadApp(); const d = w.document;
  for (const [tab, t] of Object.entries(TABS)) {
    const sec = d.getElementById('sec-' + tab);
    ok(!!sec, `${tab}: section exists`);
    for (const id of t.ids) ok(!!sec.querySelector('#' + id), `${tab}: #${id} is inside its section`);
    const handlers = [...sec.querySelectorAll('[data-onclick]')].map((e) => e.getAttribute('data-onclick')).filter((h) => !/^setMultichainMode|^dmToggle/.test(h));
    eq(handlers, t.handlers, `${tab}: its own buttons call the same functions`);
    ok(sec.querySelectorAll('.dm-mount').length === 1, `${tab}: one Deployment Mode control (Phase 8.4)`);
    ok(sec.querySelector('.section-head .dm-mount'), `${tab}: the control sits in the section head`);
  }
  ok(!!d.getElementById('sec-wizard').querySelector('.section-head .dm-mount'), 'wizard: has the Deployment Mode control too');
  eq([...d.getElementById('sec-wizard').querySelectorAll('[data-onclick]')].map((e) => e.getAttribute('data-onclick')).filter((h) => !/^dmToggle/.test(h)).filter((h) => !/^wizardPick/.test(h)),
    ['wizardGenerate()', 'wizardBack()', 'wizardNext()'], 'wizard: navigation and generate handlers');
  eq([...d.getElementById('sec-wizard').querySelectorAll('[data-onclick^="wizardPick"]')].map((e) => /wizardPick\('(\w+)'/.exec(e.getAttribute('data-onclick'))[1]), ['token', 'payment', 'defi', 'org', 'bridge', 'wallet'], 'wizard: the six goals');
}

/* 2. the simple contracts: eight templates, one form that is redrawn for each */
{
  const app = loadApp(); const { ev, w } = app; const d = w.document;
  const FIELDS = {
    erc20: ['s_name', 's_symbol', 's_decimals', 's_supply', 's_cap', 's_burn'], erc721: ['s_name', 's_symbol', 's_supply', 's_price', 's_royalty', 's_baseuri'],
    escrow: ['s_name', 's_buyer', 's_seller', 's_arbiter', 's_token', 's_amount', 's_timeout'], vesting: ['s_name', 's_token', 's_beneficiary', 's_amount', 's_duration', 's_cliff'],
    paywall: ['s_name', 's_token', 's_amount', 's_duration', 's_beneficiary'], dao: ['s_name', 's_token', 's_quorum', 's_voting', 's_delay', 's_threshold'],
    smartwallet: ['s_name', 's_guardian', 's_session', 's_rdelay', 's_limit_unit', 's_spendlimit'], staking: ['s_name', 's_token', 's_reward', 's_apy', 's_lock', 's_exitfee']
  };
  eq(JSON.parse(ev('JSON.stringify(SIMPLE_TEMPLATES.map(t => t.id))')), Object.keys(FIELDS), 'simple: the eight templates, in this order');
  for (const [id, fields] of Object.entries(FIELDS)) {
    ev(`renderSimpleForm('${id}')`);
    eq([...d.querySelectorAll('#simpleForm [id]')].map((e) => e.id), fields, `simple/${id}: form fields`);
    eq([...d.querySelectorAll('#simpleForm [data-onclick]')].map((e) => e.getAttribute('data-onclick')), [`genSimple('${id}')`, "deployFromBuffer('simple')"], `simple/${id}: buttons`);
  }
  eq(JSON.parse(ev('JSON.stringify(UI_ADV_SIMPLE)')), { erc20: ['s_decimals', 's_cap', 's_burn'], erc721: ['s_royalty', 's_baseuri'], escrow: ['s_token', 's_timeout'], vesting: ['s_token', 's_cliff'], paywall: ['s_token'], dao: ['s_quorum', 's_voting', 's_delay', 's_threshold'], smartwallet: ['s_session', 's_rdelay'], staking: ['s_token', 's_reward', 's_exitfee'] }, 'simple: which fields are folded into Advanced options');
  eq(JSON.parse(ev('JSON.stringify(UI_ADV_STATIC)')), { 'sec-swap': ['swap_fee', 'swap_multi'], 'sec-treasury': ['tre_streaming', 'tre_tokens'], 'sec-vault': ['vault_perf', 'vault_cap'], 'sec-multisend': ['ms_max', 'ms_fee', 'ms_owner'], 'sec-crosschain': ['cc_tokenmessenger', 'cc_msgtransmitter', 'cc_usdc', 'cc_resume'] }, 'the other tabs: which fields are folded into Advanced options');
}

/* 3. what each generator produces from an empty form, in every Deployment Mode (the run order matters: each generator resets the constructor panel) */
const RUN = [
  ['treasury', 'genTreasury()'], ['vault', 'genVault()'], ['multisend', 'genMultisend()'], ['crosschain', 'genCrosschain()'],
  ['erc20', "genSimple('erc20')"], ['erc721', "genSimple('erc721')"], ['escrow', "genSimple('escrow')"], ['vesting', "genSimple('vesting')"],
  ['paywall', "genSimple('paywall')"], ['dao', "genSimple('dao')"], ['smartwallet', "genSimple('smartwallet')"], ['staking', "genSimple('staking')"], ['swap', 'genSwap()']
];
// [template, number of problems (null: the tab does not keep a list), constructor arguments]; 'blocked': an alert, nothing generated
const SINGLE = { treasury: ['treasury', 1, 0], vault: ['vault', 0, 0], multisend: ['multisend', 0, 0], crosschain: ['crosschain', 2, 0], erc20: ['erc20', 0, 0], erc721: ['erc721', 0, 0], escrow: ['escrow', 3, 0], vesting: ['vesting', 1, 0], paywall: ['paywall', 1, 0], dao: ['dao', 1, 0], smartwallet: 'blocked', staking: ['staking', 0, 0], swap: ['swap-amm-single', null, 0] };
const PORTABLE = { treasury: ['treasury', 1, 1], vault: ['vault', 0, 1], multisend: ['multisend', 0, 0], crosschain: ['bridge', 0, 3], erc20: ['erc20', 0, 0], erc721: ['erc721', 0, 1], escrow: ['escrow', 3, 1], vesting: ['vesting', 1, 1], paywall: ['paywall', 1, 1], dao: ['dao', 0, 2], smartwallet: 'blocked', staking: ['staking', 0, 1], swap: ['swap-amm-single', null, 2] };
for (const mode of ['single', 'portable', 'multi', 'cross']) {
  const app = loadApp(); const { ev, w } = app; const d = w.document; const alerts = [];
  w.alert = (m) => alerts.push(m);
  ev(`setMultichainMode('${mode}')`); ev("activeNetwork = 'arc'; updateSideNet()");
  const want = mode === 'single' ? SINGLE : PORTABLE;
  for (const [tab, call] of RUN) {
    const sm = /genSimple\('(\w+)'\)/.exec(call); if (sm) ev(`renderSimpleForm('${sm[1]}')`);
    ev("pendingSource = { name: '', code: '' }"); alerts.length = 0; ev(call);
    const got = JSON.parse(ev('JSON.stringify({ tpl: pendingSource.template || null, problems: pendingSource.problems ? pendingSource.problems.length : null, code: pendingSource.code.length > 0, ctor: pendingCtorArgs.length })'));
    const w1 = want[tab];
    if (w1 === 'blocked') ok(!got.code && alerts.length === 1, `${mode}/${tab}: empty form is refused with one alert and nothing is generated`, JSON.stringify(got));
    else {
      ok(got.code && alerts.length === 0, `${mode}/${tab}: empty form still generates (a draft), no alert`, JSON.stringify({ got, alerts }));
      eq([got.tpl, got.problems, got.ctor], w1, `${mode}/${tab}: template, problems, constructor arguments`);
    }
  }
}

/* 4. two ways of handling a bad form: a draft that cannot be deployed, or a refusal */
{
  const app = loadApp(); const { ev, w } = app; const d = w.document; const alerts = []; w.alert = (m) => alerts.push(m);
  ev("setMultichainMode('single'); activeNetwork = 'arc'; updateSideNet();");
  ev("pendingSource = { name: '', code: '' }"); ev('genTreasury()');
  ok(/^Draft: /.test(ev('reqBlockReason()')) && ev('pendingSource.problems.length') === 1, 'treasury: a form without signers makes a DRAFT, and the deploy page is blocked for it');
  ok(d.getElementById('btnCompileDeploy').disabled, 'the deploy button is disabled for a draft');
  ev("pendingSource = { name: '', code: '' }"); d.getElementById('vault_perf').value = '20000'; alerts.length = 0; ev('genVault()');
  ok(alerts.length === 1 && !ev('pendingSource.code'), 'vault: a performance fee above 9999 is REFUSED (alert, nothing generated)');
  d.getElementById('vault_perf').value = '0';
  ev("pendingSource = { name: '', code: '' }"); d.getElementById('swap_fee').value = '10000'; alerts.length = 0; ev('genSwap()');
  ok(alerts.length === 1 && !ev('pendingSource.code'), 'swap: a fee of 10000 or more is REFUSED (alert, nothing generated)');
}

/* 5. the deploy buffer, the deploy page and the maturity labels */
{
  const app = loadApp(); const { ev, w } = app; const d = w.document; w.alert = () => {};
  for (const [tab, call, tpl] of [['treasury', 'genTreasury()', 'treasury'], ['vault', 'genVault()', 'vault'], ['multisend', 'genMultisend()', 'multisend'], ['crosschain', 'genCrosschain()', 'crosschain'], ['swap', 'genSwap()', 'swap-amm-single']]) {
    ev("setMultichainMode('single'); activeNetwork = 'arc'"); ev(call);
    const before = ev('pendingSource.code');
    d.querySelectorAll('main section.section').forEach((s) => { s.style.display = 'none'; });
    ev(`deployFromBuffer('${tab}')`);
    ok(d.getElementById('sec-deploy').style.display === 'block', `${tab}: Deploy now opens the deploy page`);
    eq([ev('pendingSource.template'), ev('pendingSource.code') === before], [tpl, true], `${tab}: and leaves the generated source and template alone`);
  }
  eq(JSON.parse(ev('JSON.stringify(Object.keys(MAT_SECTION_TEMPLATE))')), ['treasury', 'vault', 'multisend', 'crosschain', 'swap'], 'maturity: the tabs that carry a badge in their head');
  eq([ev("MAT_SECTION_TEMPLATE.crosschain()"), (ev("setMultichainMode('portable')"), ev("MAT_SECTION_TEMPLATE.crosschain()"))], ['crosschain', 'bridge'], 'maturity: Crosschain is a different contract in portable modes');
  ev("setMultichainMode('single')");
  // the wizard hands over to the right tab
  for (const [sub, sec] of [['erc20', 'sec-simple'], ['vault', 'sec-vault'], ['treasury', 'sec-treasury'], ['multisend', 'sec-multisend'], ['crosschain', 'sec-crosschain'], ['swap', 'sec-swap']]) {
    ev(`wizardState.subtype = '${sub}'; wizardGenerate()`);
    ok(d.getElementById(sec).style.display === 'block', `wizard: "${sub}" opens ${sec}`);
  }
}

/* 6. the golden fixtures that guard each generator's Solidity */
{
  const names = fs.readdirSync(path.join(here, 'golden/arc')).sort();
  for (const f of ['genTreasury.sol', 'genVault.sol', 'genMultisend.sol', 'genMultisend-both.sol', 'genMultisend-native.sol', 'genCrosschain.sol', 'swap-amm-single.sol', 'swap-amm-factory.sol', 'swap-orderbook-single.sol', 'swap-orderbook-factory.sol',
    'simple-erc20.sol', 'simple-erc721.sol', 'simple-escrow.sol', 'simple-vesting.sol', 'simple-paywall.sol', 'simple-dao.sol', 'simple-smartwallet.sol', 'simple-staking.sol']) ok(names.includes(f), `golden fixture exists: ${f}`);
}

/* 7. Treasury particularities found by the Phase 9.1 audit (the page may explain them, it must not change them) */
{
  const app = loadApp(); const { ev, w } = app; const d = w.document; w.alert = () => {};
  const sg = [1, 2, 3].map((i) => '0x' + String(i).repeat(40)).join('\n');
  const gen = (o) => { ev("pendingSource = { name: '', code: '' }"); for (const [k, v] of Object.entries(o)) d.getElementById(k).value = v; ev('genTreasury()'); return ev('pendingSource.code'); };
  const base = { tre_name: 'T1', tre_threshold: '2', tre_signers: sg, tre_streaming: 'yes', tre_tokens: 'USDC, EURC' };
  const c1 = gen(base);
  ok(c1 === gen({ ...base, tre_tokens: 'DAI, WETH, FOO' }), 'treasury: "Accepted tokens" (tre_tokens) is not read by the generator');
  ok(c1 !== gen({ ...base, tre_streaming: 'no' }), 'treasury: streaming changes the contract');
  gen({ ...base, tre_threshold: '0' });
  ok(/constant threshold = 0;/.test(ev('pendingSource.code')) && ev('pendingSource.problems.length') === 0, 'treasury: a threshold of 0 is written into the Solidity and is not a generator problem');
  gen({ ...base, tre_threshold: '1.5' });
  ok(/constant threshold = 1\.5;/.test(ev('pendingSource.code')) && ev('pendingSource.problems.length') === 0, 'treasury: a fractional threshold is written into the Solidity too');
  gen({ ...base, tre_threshold: '5' });
  eq(ev('pendingSource.problems.length'), 1, 'treasury: a threshold above the number of signers is a generator problem');
  ev("setMultichainMode('portable')"); gen(base);
  eq(ev('pendingCtorArgs.map((a) => a.param).join()'), 'gasTokenAlias_', 'treasury: the portable modes add the gas-token alias as the only constructor argument');
}

/* 8. Vault particularities found by the Phase 9.2 audit, across the networks (the page may explain them, it must not change them) */
{
  const app = loadApp(); const { ev, w } = app; const d = w.document; let alerts = 0; w.alert = () => { alerts++; };
  const gen = (o = {}) => { alerts = 0; ev("pendingSource = { name: '', code: '', template: '' }"); const base = { vault_name: 'V', vault_symbol: 'avUSDC', vault_asset: '', vault_perf: '1000', vault_cap: '0' }; for (const [k, v] of Object.entries({ ...base, ...o })) d.getElementById(k).value = v; try { ev('genVault()'); return ''; } catch (e) { return String(e.message || e); } };
  for (const k of JSON.parse(ev('JSON.stringify(Object.keys(NETWORKS))'))) {
    ev(`activeNetwork = '${k}'; updateSideNet()`); gen();
    const usdc = ev(`NETWORKS['${k}'].usdc`);
    eq(ev('pendingSource.problems.length'), usdc ? 0 : 1, `vault/${k}: the default asset is the network USDC${usdc ? '' : ' (none here: a draft problem)'}`);
  }
  ev("activeNetwork = 'arc'; updateSideNet()");
  gen({ vault_perf: '10000' }); ok(alerts === 1 && ev('pendingSource.code') === '', 'vault: a fee above 9999 is refused with an alert and no buffer');
  gen({ vault_symbol: 'a"b' }); ok(/symbol = "a"b"/.test(ev('pendingSource.code')) && ev('pendingSource.problems.length') === 0, 'vault: the symbol is written raw into the Solidity');
  gen({ vault_cap: '500' }); ok(/depositCap = 500 \* 10\*\*6;/.test(ev('pendingSource.code')), 'vault (single): the cap is cap x 10**6');
  ev("setMultichainMode('portable')");
  ok(/is not a number/.test(gen({ vault_cap: '1e3' })), 'vault (portable): a cap that is not digits with an optional decimal part makes the generator throw');
  gen({ vault_cap: '500' }); ok(/IERC20\(asset_\)\.decimals\(\)/.test(ev('pendingSource.code')) && ev('pendingCtorArgs.map((a) => a.param).join()') === 'asset_', 'vault (portable): the asset is a constructor argument and the cap is scaled by its decimals');
  ok(/SHARE_OFFSET = 1e12/.test(ev('pendingSource.code')), 'vault: share pricing assumes a 6-decimal asset in every mode');
  eq(ev("NETWORKS.bnb.usdcDecimals"), 18, 'networks: the default USDC on BNB Chain has 18 decimals, every other default has 6');
  eq(JSON.parse(ev("JSON.stringify(Object.entries(NETWORKS).filter(([, n]) => n.usdc && n.usdcDecimals !== 6).map(([k]) => k))")), ['bnb'], 'networks: bnb is the only network whose default USDC is not 6-decimal');
}

/* 9. MultiSend particularities found by the Phase 9.3 audit, across the networks and the modes (the page may explain them, it must not change them) */
{
  const app = loadApp(); const { ev, w } = app; const d = w.document; w.alert = () => {};
  const gen = (o = {}) => { ev("pendingSource = { name: '', code: '', template: '' }; pendingCtorArgs = []"); const base = { ms_name: 'M', ms_mode: 'both', ms_max: '200', ms_fee: '0', ms_owner: '' }; for (const [k, v] of Object.entries({ ...base, ...o })) d.getElementById(k).value = v; ev('genMultisend()'); return ev('pendingSource.code'); };
  const bodies = new Set();
  for (const dm of ['single', 'portable', 'multi', 'cross']) for (const k of JSON.parse(ev('JSON.stringify(Object.keys(NETWORKS))'))) {
    ev(`setMultichainMode('${dm}'); activeNetwork = '${k}'; updateSideNet()`);
    bodies.add(gen().replace(/\/\/\/ @notice Generated by ContractForge for .*\n/, '').replace(/^\/\/ ContractForge v.*\n/m, ''));
    if (ev('pendingCtorArgs.length') !== 0) bodies.add('ctor:' + dm + k);
  }
  eq(bodies.size, 1, 'multisend: the same contract, with no constructor argument, in every network and every Deployment Mode');
  ev("setMultichainMode('single'); activeNetwork = 'arc'; updateSideNet()");
  ok(!/function set[A-Z]/.test(gen()), 'multisend: no setter, so the fee recipient is fixed at deploy time');
  ok(/feeRecipient = msg.sender;/.test(gen()) && /feeRecipient = 0x1{40};/.test(gen({ ms_owner: '0x' + '1'.repeat(40) })), 'multisend: an empty owner means the deployer');
  ok(/MAX_RECIPIENTS = 1\.5;/.test(gen({ ms_max: '1.5' })) && /FEE_BPS = -1;/.test(gen({ ms_fee: '-1' })) && ev('pendingSource.problems.length') === 0, 'multisend: the max and the fee are written into the Solidity unchecked, and are not generator problems');
  gen({ ms_owner: '0x12' }); eq(ev('pendingSource.problems.length'), 1, 'multisend: a fee recipient that is not an address is a generator problem (a draft)');
}

/* 10. Crosschain particularities found by the Phase 9.4 audit, across the networks and the modes (the page may explain them, it must not change them) */
{
  const app = loadApp(); const { ev, w } = app; const d = w.document; w.alert = () => {};
  const gen = (o = {}) => { ev("pendingSource = { name: '', code: '', template: '' }; pendingCtorArgs = []"); const base = { cc_name: 'C', cc_tokenmessenger: '', cc_msgtransmitter: '', cc_usdc: '', cc_mode: 'payment', cc_resume: 'yes' }; for (const [k, v] of Object.entries({ ...base, ...o })) d.getElementById(k).value = v; ev('genCrosschain()'); return ev('pendingSource.code'); };
  const nets = JSON.parse(ev('JSON.stringify(Object.keys(NETWORKS))'));
  const probs = {}, v2 = [];
  ev("setMultichainMode('single')");
  for (const k of nets) { ev(`activeNetwork = '${k}'; updateSideNet()`); gen(); probs[k] = ev('pendingSource.problems.length'); if (ev(`!!cctpV2('${k}')`)) v2.push(k); }
  eq(Object.entries(probs).filter(([, n]) => n > 0).map(([k, n]) => k + ':' + n), ['bnb:2', 'robinhoodMain:3', 'arcMain:2', 'arc:2', 'robinhood:3'], 'crosschain (single): the networks missing from the CCTP V1 table are drafts: BNB, Arc (both), Robinhood (both)');
  eq(v2.length, 13, 'crosschain: CCTP V2 data exists for 13 networks, including both Arc networks and excluding BNB and the Robinhood networks');
  ev("setMultichainMode('portable')");
  for (const k of nets) { ev(`activeNetwork = '${k}'; updateSideNet()`); gen(); if (ev('pendingSource.template') !== 'bridge' || ev('pendingSource.problems.length') !== 0 || ev('pendingCtorArgs.length') !== 3) { ok(false, 'crosschain (portable): ' + k + ' is a bridge with three constructor arguments and no problem'); } }
  ok(true, 'crosschain (portable): every network gives a bridge with three constructor arguments and no problem');
  ev("activeNetwork = 'sepolia'; updateSideNet()");
  const a1 = gen({ cc_mode: 'payment', cc_resume: 'yes' }), a2 = gen({ cc_mode: 'escrow', cc_resume: 'no' });
  ok(a1 === a2, 'crosschain (portable): the functionality and the resume choice change nothing');
  ev("setMultichainMode('single')");
  ok(/address burnToken\s*\)/.test(gen()) && !/destinationCaller/.test(ev('pendingSource.code')), 'crosschain (single): the payments contract uses the 4-argument depositForBurn, not the V2 signature');
}

/* 11. Simple contracts particularities found by the Phase 9.5 audit (the page may explain them, it must not change them) */
{
  const app = loadApp(); const { ev, w } = app; const d = w.document; let alerts = 0; w.alert = () => { alerts++; };
  const A = '0x' + '1'.repeat(40);
  const gen = (id, o = {}) => { alerts = 0; ev("pendingSource = { name: '', code: '', template: '' }; pendingCtorArgs = []"); ev(`renderSimpleForm('${id}')`); for (const [k, v] of Object.entries(o)) d.getElementById(k).value = v; try { ev(`genSimple('${id}')`); return ''; } catch (e) { return String(e.message || e); } };
  gen('erc20', { s_supply: '-5' });
  ok(/-5 \* 10\*\*/.test(ev('pendingSource.code')) && ev('(pendingSource.problems || []).length') === 0, 'simple: numeric fields are written into the Solidity unchecked (a negative supply is not a generator problem)');
  gen('dao', { s_token: A, s_voting: '0' }); ok(alerts === 1 && ev('pendingSource.code') === '', 'simple: the DAO voting period of 0 is refused with an alert');
  for (const o of [{ s_session: '721' }, { s_rdelay: '31' }, { s_spendlimit: '-1' }, { s_guardian: '' }]) { gen('smartwallet', { s_guardian: A, ...o }); ok(alerts === 1 && ev('pendingSource.code') === '', 'simple: the Smart Wallet refuses ' + JSON.stringify(o)); }
  gen('escrow'); eq(ev('pendingSource.problems.length'), 3, 'simple: an empty escrow is a draft with three problems');
  ev("setMultichainMode('portable')");
  ok(/is not a number/.test(gen('escrow', { s_amount: '-1' })), 'simple (portable): a scaled amount that is not digits makes the generator throw');
  const ctor = {};
  for (const id of ['erc20', 'erc721', 'escrow', 'vesting', 'paywall', 'dao', 'smartwallet', 'staking']) { gen(id, id === 'smartwallet' ? { s_guardian: A } : {}); ctor[id] = ev('pendingCtorArgs.map((x) => x.param).join()'); }
  eq(ctor, { erc20: '', erc721: 'usdc_', escrow: 'token_', vesting: 'token_', paywall: 'token_', dao: 'token_,votingPeriod_', smartwallet: 'dailyLimit_', staking: 'stakingToken_' }, 'simple (portable): the constructor arguments of each template');
  ev("setMultichainMode('single')");
  for (const id of ['erc20', 'erc721', 'escrow', 'vesting', 'paywall', 'dao', 'smartwallet', 'staking']) { gen(id, id === 'smartwallet' ? { s_guardian: A } : {}); if (ev('pendingCtorArgs.length') !== 0) ok(false, 'simple (single): ' + id + ' has no constructor argument'); }
  ok(true, 'simple (single): no template has a constructor argument');
}

/* 12. Wizard particularities found by the Phase 9.6 audit (the page may explain them, it must not change them) */
{
  const app = loadApp(); const { ev, w } = app; const d = w.document; w.alert = () => {};
  const ids = ev('Object.values(WIZARD_SUBTYPES).flat().map((s) => s.id)');
  eq(ids.length, 12, 'wizard: offers twelve contracts');
  ok(!ids.includes('multisend'), 'wizard: MultiSend is not offered (but the router would open it: it is in the advanced list)');
  const where = {};
  for (const id of ids) { ev(`wizardState.subtype = '${id}'; wizardGenerate()`); where[id] = [...d.querySelectorAll('main section.section')].filter((s) => s.style.display === 'block').map((s) => s.id.replace('sec-', ''))[0]; }
  eq(Object.entries(where).sort(), Object.entries({ erc20: 'simple', erc721: 'simple', escrow: 'simple', vesting: 'simple', paywall: 'simple', staking: 'simple', dao: 'simple', smartwallet: 'simple', swap: 'swap', vault: 'vault', treasury: 'treasury', crosschain: 'crosschain' }).sort(), 'wizard: swap, vault, treasury and crosschain open their own builder; the rest open Simple contracts');
  ev("wizardState.subtype = 'multisend'; wizardGenerate()"); eq(d.getElementById('sec-multisend').style.display, 'block', 'wizard: a multisend subtype would still be routed to its builder');
  ev("pendingSource = { name: '', code: '', template: '' }"); ev("wizardState = {step:3, category:'defi', subtype:'vault'}; wizardGenerate()");
  eq(ev('pendingSource.code'), '', 'wizard: wizardGenerate() generates nothing, it only routes');
  ev("wizardState = {step:0, category:'', subtype:''}; renderWizardStep()");
  d.querySelector('#wp-0 .tcard[data-onclick^="wizardPick(\'defi\'"]').click(); const card = [...d.querySelectorAll('#wz-subtypes .tcard')].find((c) => /Vault/.test(c.textContent)); card.click();
  eq(ev('wizardState.subtype'), 'vault', 'wizard: a contract is picked under its goal');
  d.querySelector('#wp-0 .tcard[data-onclick^="wizardPick(\'token\'"]').click();
  eq(ev('wizardState.subtype'), '', 'wizard: changing the goal clears the contract (before 9.6 it survived and was routed to anyway)');
}

/* 13. Compile & Deploy particularities found by the Phase 9.7 audit (the overview may read them, it must not change them) */
{
  const app = loadApp(); const { ev, w } = app; const d = w.document; w.alert = () => {};
  eq([...d.querySelectorAll('#sec-deploy .btnrow button')].map((b) => b.getAttribute('data-onclick')), ['compileAndDeploy()', 'downloadSource()', 'copySource()'], 'deploy: the three action handlers');
  ok(ev("typeof compileAndDeploy === 'function' && typeof compilePending === 'function' && typeof compileSource === 'function' && typeof deployCompiled === 'function' && typeof matGate === 'function' && typeof mainnetDeployConfirm === 'function'"), 'deploy: the compile, deploy and gate functions exist');
  ok(/matIsApproved\(compiled\.sourceHash, netKey\)/.test(ev('deployCompiled.toString()')) && /Mainnet deploy blocked/.test(ev('deployCompiled.toString()')), 'deploy: deployCompiled itself refuses a mainnet that was not confirmed (the last line of defence)');
  ok(/reqBlockReason\(\)/.test(ev('compileAndDeploy.toString()')) && /matGate\(/.test(ev('compileAndDeploy.toString()')), 'deploy: compileAndDeploy checks the draft reason and the maturity gate before compiling');
  ok(/uiAddDeployResult/.test(ev('deployCompiled.toString()')) && /deployed\(\)/.test(ev('deployCompiled.toString()')), 'deploy: a result is recorded only after the transaction is confirmed');
  eq(ev('uiDeployResults.length'), 0, 'deploy: no result before a deployment');
  ev("window.__c = 0; compileSource = async () => { window.__c++; return {}; }"); ev("pendingSource = { name: '', code: '', template: '' }"); ev('compileAndDeploy()');
  eq(ev('window.__c'), 0, 'deploy: with no contract, compileAndDeploy never reaches the compiler');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
