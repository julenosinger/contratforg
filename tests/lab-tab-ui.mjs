// Phase 12.6: Test Lab (section 18). The simulator, the compile, the five accounts, the time, the test tokens and the calls are unchanged (lab.mjs, 73 checks with the same engine and a real
// compiler, passes on the new markup). The tab now has an overview and a progress beside the controls. These tests run the REAL simulator (lab-evm.js) and the real compiler: nothing else is
// simulated. They prove: drawing the overview starts nothing, the overview describes the simulation truthfully (a private chain, its chain id, its own time and block, the test tokens and
// the CCTP stand-ins), says which contract is in the lab and whether it is still the one on screen, reports a draft, a contract waiting for constructor arguments and a lab that could not
// start as they are, and warns about the one thing the lab cannot do: reach Circle's real CCTP address. It holds on all 16 networks.
import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';
import { JSDOM } from 'jsdom';
import { loadApp, root, addrFor } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
const engine = fs.readFileSync(path.join(root, 'lab-evm.js'), 'utf8');

function fresh({ withEngine = true } = {}) {
  const a = loadApp({ realEthers: true }); const { w, ev } = a; const d = w.document;
  const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
  w.TextEncoder ??= TextEncoder; w.TextDecoder ??= TextDecoder; w.crypto ??= globalThis.crypto; w.structuredClone ??= structuredClone;
  a.calls = { solcLoads: 0, fetches: [] };
  w.fetch = async (u) => { a.calls.fetches.push(String(u)); return { json: async () => ({}) }; };
  w.__solcCompile = (i) => solc.compile(i);
  ev("ensureSolcLoaded = async () => { window.__solcLoads = (window.__solcLoads || 0) + 1; }; solcCompile = async (i) => window.__solcCompile(i);");
  if (withEngine) w.eval(engine);   // what the browser does when the tab starts the lab
  a.alerts = []; w.alert = (m) => a.alerts.push(String(m));
  const settle = async () => { await tick(); await tick(); await tick(); };
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await settle(); };
  const net = async (k) => { ev(`activeNetwork = '${k}'; updateSideNet();`); await settle(); };
  const rows = () => Object.fromEntries([...d.querySelectorAll('#labSummary .bld-row')].map((r) => [r.querySelector('dt').textContent, { text: r.querySelector('dd').childNodes[0] ? r.querySelector('dd').childNodes[0].textContent : '', flag: (r.querySelector('.bld-flag') || {}).textContent || '', state: r.dataset.state }]));
  const prog = () => Object.fromEntries([...d.querySelectorAll('#labProgress li')].map((l) => [l.querySelector('b').textContent, { state: l.dataset.state, text: l.querySelector('.bld-t').textContent }]));
  const erc20 = (name) => ev(`renderSimpleForm('erc20'); ${name ? `document.getElementById('s_name').value = '${name}';` : ''} genSimple('erc20')`);
  const load = async () => { await ev('labLoadContract()'); await settle(); };
  const fn = (name) => ev(`LAB.contract.abi.findIndex(x => x.name === "${name}")`);
  return { ...a, d, go, net, rows, prog, erc20, load, fn, settle };
}
const NETS = (a) => JSON.parse(a.ev('JSON.stringify(Object.entries(NETWORKS).map(([k, n]) => [k, n.label, !!n.isMainnet, n.chainIdDec, n.usdcDecimals || 6]))'));

/* 1. the page: ids, handlers, defaults, and every original element exactly as it was */
{
  const a = fresh({ withEngine: false }); const { d } = a; await a.settle();
  for (const id of ['labStatus', 'labContract', 'labArgs', 'lab_acting', 'lab_acting_addr', 'lab_balances', 'lab_time', 'lab_time_n', 'lab_time_unit', 'lab_mine_n', 'lab_token', 'lab_token_amt', 'lab_approve_all', 'lab_filter', 'lab_search', 'lab_functions', 'lab_txs', 'lab_log']) ok(!!d.getElementById(id), 'id: ' + id);
  eq([...d.querySelectorAll('#sec-lab [data-onclick], #sec-lab [data-onchange]')].map((b) => b.getAttribute('data-onclick') || b.getAttribute('data-onchange')), ['labLoadContract()', 'labSmoke()', 'labSelectAccount()', 'labAdvance(3600)', 'labAdvance(86400)', 'labAdvance(604800)', 'labAdvance(2592000)', 'labAdvanceCustom()', 'labMine()', 'labMint()', 'labApprove()', "labFilter('all',this)", "labFilter('read',this)", "labFilter('write',this)", "labFilter('event',this)"], 'every handler is kept, in order');
  eq([d.getElementById('labStatus').textContent, d.getElementById('lab_time_n').value, d.getElementById('lab_time_unit').value, d.getElementById('lab_mine_n').value, d.getElementById('lab_token_amt').value, d.querySelector('#lab_log .msg').textContent, [...d.getElementById('lab_acting').options].map((o) => o.textContent)], ['Not started', '1', '86400', '10', '1000', 'Press "Load current contract" to start.', ['Alice', 'Bob', 'Carol', 'Dave', 'Eve']], 'defaults, the boot line and the five accounts are as before');
  eq([...d.getElementById('sec-lab').outerHTML.matchAll(/\son[a-z]+="/gi)].length, 0, 'csp: no inline handler');
  eq([d.querySelector('#sec-lab .section-head .n').textContent, d.querySelector('#sec-lab .section-head h2').textContent, d.getElementById('sec-lab').classList.contains('bld')], ['18', 'Test Lab', true], 'number and heading are unchanged');
  const cs = css.slice(css.indexOf('/* ---- Test Lab (section 18)'), css.indexOf('/* ---- Contract Analytics (section 16)'));
  const sels = []; cs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (_, __, s) => { sels.push(...s.split(',').map((x) => x.trim())); return ''; });
  const real = sels.filter((s) => !s.startsWith('@'));
  ok(real.length >= 5 && real.every((s) => /^(\.light\s+)?\.bld#sec-lab/.test(s)), 'css: every rule of this tab is scoped to #sec-lab', JSON.stringify(real.filter((s) => !/^(\.light\s+)?\.bld#sec-lab/.test(s))));
  ok(d.getElementById('labSummary').children.length >= 6 && d.querySelectorAll('#labProgress li').length === 4 && d.querySelectorAll('#labNotes li').length === 5, 'overview: rows, four steps and five notes');
  eq(a.ev("CFBuilder.viewKeys().includes('lab')"), true, 'registered with the shared engine');
  // the original elements, byte for byte, against the version before this phase (the static markup, before the page draws into it)
  const norm = (s) => s.replace(/\s+/g, ' ').replace(/> </g, '><').trim();
  const orig = JSON.parse(fs.readFileSync(path.join(root, '..', 'tests', 'fixtures', 'lab-original-markup.json'), 'utf8'));
  const stat = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8')).window.document;
  eq(Object.fromEntries(Object.keys(orig).map((k) => [k, norm(stat.querySelector(k).outerHTML)])), orig, 'the original elements of the tab are exactly as before this phase');
}

/* 2. drawing the overview starts nothing: no engine, no compile, no request */
{
  const a = fresh({ withEngine: false }); const { d } = a; a.erc20();
  await a.go('lab'); await a.net('arc'); await a.net('bnb'); await a.go('home'); await a.go('lab');
  for (let i = 0; i < 6; i++) a.ev('labOvRender()');
  eq([a.ev('typeof window.LabEVM'), a.ev('String(LAB.lab)'), d.querySelectorAll('script[src="lab-evm.js"]').length, a.ev('window.__solcLoads || 0'), a.calls.fetches, a.alerts], ['undefined', 'null', 0, 0, [], []], 'opening the tab, changing networks and drawing the overview never load the simulator, never touch the compiler, fetch nothing and alert nothing');
  const r = a.rows(), p = a.prog();
  eq([r.Simulation.text, r.Chain.text, r.Chain.flag, r['In the lab'].text, r['In the lab'].flag, p['Contract ready'].state, p['Loaded in the lab'].state, p['Loaded in the lab'].text, p['Try it'].state, p['Before you publish'].state], ['A private chain in this page', 'Not started', 'It will use the chain id of BNB Chain (56)', 'Nothing loaded', 'Press Load current contract', 'done', 'todo', 'Press Load current contract.', 'locked', 'locked'], 'before the lab starts: a contract is ready, nothing is loaded, and which chain id it will use');
  eq(r.Simulation.flag, 'No wallet, no network node and no real funds: nothing here can reach a real chain', 'the first row says what the lab is');
}

/* 3. no contract, then a draft: the page's own refusals are shown as they are */
{
  const a = fresh(); const { d } = a;
  await a.go('lab'); await a.load();
  let r = a.rows(), p = a.prog();
  eq([r['Contract on screen'].text, r['In the lab'].text, r['In the lab'].state, p['Contract ready'].state, [...d.querySelectorAll('#lab_log .msg')].map((m) => m.textContent).pop().slice(0, 30)], ['None', 'No contract yet', 'missing', 'todo', 'Generate a contract first (sec'], 'no contract: the page\'s own message, and the overview agrees');
  a.ev("document.getElementById('tre_signers').value = ''; genTreasury()"); await a.settle(); await a.go('home'); await a.go('lab');
  const why = a.ev('reqBlockReason()');
  await a.load(); r = a.rows(); p = a.prog();
  eq([r.Source.text, r.Source.state, r.Source.flag.endsWith(why), r['In the lab'].text, p['Contract ready'].state, p['Loaded in the lab'].state, a.ev('String(LAB.lab)')], ['Draft', 'bad', true, 'Draft: fix the required fields first', 'draft', 'locked', 'null'], 'a draft: refused by the page before the engine starts; shown as a draft with the reason');
}

/* 4. a contract with no constructor: the real simulator, time, calls, a changed contract */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); a.erc20(); await a.go('lab');
  await a.load();
  let r = a.rows(), p = a.prog();
  const chain = a.ev("NETWORKS['sepolia'].chainIdDec");
  eq([r.Chain.text, r.Chain.flag, r['In the lab'].state, r['In the lab'].text.startsWith('ArcDollar at 0x'), r.Constructor.text, r['Acting as'].text, r['Acting as'].flag, r.Calls.text, p['Loaded in the lab'].state, p['Try it'].state, p['Before you publish'].state], [`Chain id ${chain} (Ethereum Sepolia)`, 'Only the id the contract sees; it is not that network', 'ok', true, 'No arguments', 'Alice', 'Five test accounts, each with 1,000 native units', 'None', 'done', 'todo', 'todo'], 'the lab is running: the simulated chain id, the contract deployed in it, five accounts');
  eq(p['Before you publish'].text, 'Not tracked here: passing in the lab is a simulation, not a guarantee. Review the code, have it audited and try a testnet first.', 'the last step is never done: it says what is left to you');
  ok(/^20\d\d-\d\d-\d\d \d\d:\d\d:\d\d UTC · block \d+$/.test(r.Time.text) && r.Time.text === d.getElementById('lab_time').textContent, 'the time and block are the engine\'s own and equal the page\'s time line');
  eq([r['Test USDC and EURC'].flag, r['Test USDC and EURC'].text], ['At fixed fake addresses. Always 6 decimals', a.ev("pgShort(LAB.tokens.usdc) + ' · ' + pgShort(LAB.tokens.eurc)")], 'the test tokens: fixed fake addresses, 6 decimals');
  eq(r['Test CCTP'].state, 'ok', 'a contract that never names Circle\'s real CCTP address is not warned');
  // time and blocks move only when moved
  const t0 = a.ev('LAB.lab.timestamp'), b0 = a.ev('LAB.lab.number');
  a.ev('labAdvance(86400)'); await a.settle(); const r2 = a.rows();
  eq([a.ev('Number(LAB.lab.timestamp) - Number(' + t0 + ')'), r2.Time.text === d.getElementById('lab_time').textContent, r2.Time.text !== r.Time.text], [86400, true, true], 'moving time forward by a day moves the overview\'s time with it');
  a.ev("document.getElementById('lab_mine_n').value = '5'; labMine()"); await a.settle();
  eq(a.ev('LAB.lab.number') - b0 >= 5 && a.rows().Time.text.endsWith('block ' + a.ev('LAB.lab.number')), true, 'mining blocks moves the block');
  a.ev("document.getElementById('lab_acting').value = '2'; labSelectAccount()"); await a.settle(); eq(a.rows()['Acting as'].text, 'Carol', 'the acting account follows the page\'s selector');
  // calls: a read, and a transaction that fails (Alice-like account has no balance of an unminted token)
  const dec = a.fn('decimals'), tr = a.fn('transfer');
  await a.ev('labCall(' + dec + ')'); await a.settle();
  eq([a.rows().Calls.text, a.prog()['Try it'].state], ['1 (1 reads, 0 transactions)', 'done'], 'a read call is counted');
  d.getElementById('lab_arg_' + tr + '_0').value = a.ev('LAB.accounts[1].addr'); d.getElementById('lab_arg_' + tr + '_1').value = '999999999999999999999999';
  await a.ev('labCall(' + tr + ')'); await a.settle();
  eq([a.rows().Calls.text, a.prog()['Try it'].text], ['2 (1 reads, 1 transactions, 1 failed)', '2 call(s), 1 failed. Only the lab\'s own calls are listed.'], 'a failed transaction is counted as failed');
  // a changed contract
  a.erc20('OtherCoin'); await a.go('home'); await a.go('lab');
  r = a.rows(); p = a.prog();
  eq([r['In the lab'].state, r['In the lab'].flag, p['Loaded in the lab'].state, p['Loaded in the lab'].text, /changed since it was loaded/.test(d.getElementById('labContract').textContent)], ['missing', 'The contract changed since it was loaded: press Load current contract', 'stale', 'The contract changed after it was loaded. Press Load current contract.', true], 'the contract on screen changed: outdated, in agreement with the page\'s own header');
  await a.load(); eq([a.rows()['In the lab'].state, a.prog()['Loaded in the lab'].state, a.rows().Calls.text], ['ok', 'done', 'None'], 'loaded again: current, and the lab starts afresh (no calls)');
  // the file has no contract called like the one on screen
  a.ev("pendingSource.name = 'Ghost'"); await a.load();
  eq([a.rows()['In the lab'].flag, a.rows()['In the lab'].state], ['The file has no contract called Ghost, so the lab deployed OtherCoin', 'missing'], 'the lab deploys the last contract of the file when the name is not found, and says so');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 5. a contract that waits for constructor arguments, and one that hard-codes the real USDC */
{
  const a = fresh(); const { d } = a; await a.settle(); await a.go('lab');
  a.ev("setMultichainMode('portable'); activeNetwork = 'arcMain'; updateSideNet()");
  a.ev("renderSimpleForm('escrow')"); await a.settle();
  const ALICE = a.ev("labAddr('a11ce')"), BOB = a.ev("labAddr('b0b')"), CAROL = a.ev("labAddr('ca401')");
  for (const [id, v] of [['s_buyer', ALICE], ['s_seller', BOB], ['s_arbiter', CAROL]]) d.getElementById(id).value = v;
  a.ev("genSimple('escrow')"); await a.settle();
  await a.load();
  let r = a.rows(), p = a.prog();
  eq([r['In the lab'].text, r['In the lab'].state, r['In the lab'].flag, r.Constructor.text, r.Constructor.flag, p['Loaded in the lab'].state, p['Loaded in the lab'].text, p['Try it'].state], ['ArcEscrow: not deployed yet', 'missing', 'Waiting for constructor arguments', '1 argument', 'Filled with test values where the lab can supply them; the rest is yours to set', 'todo', 'Waiting for constructor arguments', 'locked'], 'a contract with a constructor argument is compiled but not deployed: the overview says it waits');
  eq(d.getElementById('lab_arg_ctor_0').value, a.ev('LAB.tokens.usdc'), 'the page filled the argument with the test USDC');
  await a.ev('labDeployWithArgs()'); await a.settle();
  eq([a.rows()['In the lab'].state, a.rows()['In the lab'].text.startsWith('ArcEscrow at 0x'), a.prog()['Loaded in the lab'].state, a.prog()['Try it'].state], ['ok', true, 'done', 'todo'], 'after the arguments: deployed');
  // single mode: the source holds the real USDC address of the network
  const b = fresh(); await b.settle(); await b.go('lab');
  b.ev("setMultichainMode('single'); activeNetwork = 'arc'; updateSideNet()"); b.ev("renderSimpleForm('escrow')"); await b.settle();
  for (const [id, v] of [['s_buyer', ALICE], ['s_seller', BOB], ['s_arbiter', CAROL]]) b.d.getElementById(id).value = v;
  b.ev("genSimple('escrow')"); await b.settle(); await b.load();
  const usdc = b.ev("NETWORKS['arc'].usdc");
  eq([b.ev('LAB.tokens.usdc').toLowerCase() === usdc.toLowerCase(), b.rows()['Test USDC and EURC'].flag.startsWith('At the real address the source hard-codes. Always 6 decimals')], [true, true], 'a source that hard-codes the network\'s USDC gets the test token at that very address, and the overview says so');
  eq(a.pageErrors.length + b.pageErrors.length, 0, 'no page errors');
}

/* 6. Circle's real CCTP address: the lab cannot reach it */
{
  const a = fresh(); const { d } = a; await a.settle(); await a.go('lab');
  a.ev("setMultichainMode('single'); activeNetwork = 'ethereum'; updateSideNet(); document.getElementById('cc_name').value = 'V1Bridge'; genCrosschain()"); await a.settle();
  await a.load();
  const real = a.ev("NETWORKS['ethereum'].cctp.tokenMessenger");
  let r = a.rows();
  eq([r['Test CCTP'].state, r['Test CCTP'].flag.startsWith('This contract calls Circle\'s real CCTP address (' + a.ev(`pgShort('${real.toLowerCase()}')`) + '), which does not exist in the lab')], ['bad', true], 'the crosschain payments contract of the Single mode names Circle\'s real TokenMessenger: the overview warns');
  const sc = a.fn('sendCrossChain');
  ['1000000', '6', '0x' + '11'.repeat(32)].forEach((v, k) => { d.getElementById('lab_arg_' + sc + '_' + k).value = v; });
  await a.ev('labApprove()'); await a.settle(); await a.ev('labCall(' + sc + ')'); await a.settle();
  eq(d.getElementById('lab_result_' + sc).textContent, 'reverted without a reason', 'and the warning is true: the call that reaches the real address reverts without a reason');
  eq(a.rows().Calls.text, '1 (0 reads, 1 transactions, 1 failed)', 'counted as a failed transaction');
  // the portable bridge takes the messenger as an argument: the stand-in
  a.ev("setMultichainMode('portable'); document.getElementById('cc_name').value = 'V2Bridge'; genCrosschain()"); await a.settle();
  await a.load();
  eq([a.rows()['Test CCTP'].state, a.rows().Constructor.text, a.rows()['In the lab'].state], ['ok', '3 arguments', 'missing'], 'the portable bridge takes the messenger as an argument (the stand-in): no warning, and it waits for them');
  eq(a.ev('document.getElementById("lab_arg_ctor_0").value'), a.ev('LAB_AUX.messenger'), 'the page fills the first argument with the stand-in messenger');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 7. all 16 networks: the simulated chain id, the token decimals, the lab on every one */
{
  const nets = NETS(fresh({ withEngine: false }));
  eq(nets.length, 16, '16 networks');
  const a = fresh(); const { d } = a; await a.settle(); a.erc20(); await a.go('lab');
  for (const [k, label, main, chain, dec] of nets) {
    await a.net(k);
    let r = a.rows();
    if (a.ev('String(LAB.lab)') !== 'null') eq(r.Chain.flag.startsWith('The app is now on ' + label) || r.Chain.flag === 'Only the id the contract sees; it is not that network', true, `${k}: the chain row follows the app`);
    await a.load(); r = a.rows();
    eq([r.Chain.text, r.Chain.flag, r['In the lab'].state, r['Test USDC and EURC'].flag, a.prog()['Loaded in the lab'].state], [`Chain id ${chain} (${label})`, 'Only the id the contract sees; it is not that network', 'ok', 'At fixed fake addresses. Always 6 decimals' + (dec !== 6 ? `: the real USDC on ${label} has ${dec}` : ''), 'done'], `${k}: the lab starts on chain id ${chain}${main ? ' (a mainnet: no real funds, and no mainnet wording)' : ''}${dec !== 6 ? ', and says the real USDC has ' + dec + ' decimals' : ''}`);
    ok(!/real funds|Mainnet/i.test(r.Chain.flag + r.Simulation.flag.replace('no real funds', '')), `${k}: no mainnet alarm in a simulation`);
  }
  eq([a.calls.fetches, a.alerts, a.pageErrors.length], [[], [], 0], 'sixteen loads fetched nothing, alerted nothing and raised no page error');
  // the app moves to another network after the lab started
  await a.net('base'); eq(a.rows().Chain.flag, 'The app is now on Base: press Load current contract to follow it', 'a network changed after the lab started: the overview says the lab is still on the other chain id');
}

/* 8. every mode, hostile text, navigation */
{
  const a = fresh(); const { d } = a; await a.settle(); const EVIL = '<img src=x onerror=window.__xss=1>';
  a.erc20(); await a.go('lab'); await a.load();
  a.ev(`pendingSource.name = ${JSON.stringify('X' + EVIL)}; labRecord({ fn: ${JSON.stringify(EVIL)}, kind: 'tx', by: ${JSON.stringify(EVIL)}, ok: false, args: '', result: ${JSON.stringify(EVIL)}, when: 't' })`); await a.settle();
  await a.go('home'); await a.go('lab');
  eq([a.w.__xss, d.querySelectorAll('#sec-lab img').length], [undefined, 0], 'a hostile contract name and a hostile record become no markup');
  ok(a.rows()['Contract on screen'].text.includes('<img'), 'the name is shown as text in the overview');
  ok(![...d.querySelectorAll('#labSummary *, #labProgress *, #labNotes *')].some((el) => [...el.attributes].some((at) => /__xss|onerror/.test(at.value) && at.name !== 'id')), 'no attribute of the overview carries the payload');
  a.erc20(); await a.go('home'); await a.go('lab'); await a.load();
  for (const m of ['portable', 'multi', 'cross', 'single']) { a.ev(`setMultichainMode('${m}')`); await a.settle(); eq(a.rows()['Deployment Mode'].text, a.ev(`MC_MODES['${m}'].label`), `mode ${m}`); }
  const shot = () => JSON.stringify([a.rows(), a.prog()]);
  const s0 = shot();
  for (const s of ['home', 'wizard', 'swap', 'lab', 'deploy', 'lab', 'playground', 'lab', 'analytics', 'lab']) await a.go(s);
  const s1 = JSON.parse(shot()), s0p = JSON.parse(s0);
  eq([s1[0].Time.text.slice(0, 11) === s0p[0].Time.text.slice(0, 11), JSON.stringify({ ...s1[0], Time: 0 }) === JSON.stringify({ ...s0p[0], Time: 0 }), JSON.stringify(s1[1]) === JSON.stringify(s0p[1])], [true, true, true], 'after ten navigations the overview is the same (the lab\'s own clock aside)');
  eq([d.querySelectorAll('#labProgress li').length, d.querySelectorAll('#labNotes li').length], [4, 5], 'no duplicated rows');
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
