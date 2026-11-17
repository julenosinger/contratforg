// Phase 12.5: Contract Analytics (section 16). loadAnalytics(), refreshAnalytics(), setAnalyticsAddress() and the history pills are unchanged: same questions to the wallet's connection, same
// cards, same bars, same events. The tab now has an overview and a progress beside the form. These tests (the wallet's node is simulated with the real ethers library; nothing real is
// called) prove: nothing is asked until Load Analytics or Refresh is pressed, the overview says what the numbers were read through (the wallet's chain, not the network's own node),
// whether they still match the address, network and look-back on screen, that the "Transactions" card is the account's nonce, that a deployment from another network is reported,
// and that a failure keeps the earlier numbers (and says so), on all 16 networks.
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root, addrFor } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
const A = addrFor('a1'), B = addrFor('b2');
const LOGS = [{ blockNumber: 49999, topics: ['0x' + '1'.repeat(64)], data: '0x', transactionHash: '0x' + '1'.repeat(64) }, { blockNumber: 45000, topics: ['0x' + '2'.repeat(64)], data: '0x', transactionHash: '0x' + '2'.repeat(64) }];

function fresh() {
  const a = loadApp({ realEthers: true }); const d = a.w.document;
  const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
  a.alerts = []; a.w.alert = (m) => a.alerts.push(String(m));
  a.fetches = []; a.w.fetch = async (u) => { a.fetches.push(String(u)); return { json: async () => ({}) }; };
  const settle = async () => { await tick(); await tick(); await tick(); };
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await settle(); };
  const net = async (k) => { a.ev(`activeNetwork = '${k}'; updateSideNet();`); await settle(); };
  const setv = async (id, v) => { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new a.w.Event('input', { bubbles: true })); await settle(); };
  const rows = () => Object.fromEntries([...d.querySelectorAll('#anSummary .bld-row')].map((r) => [r.querySelector('dt').textContent, { text: r.querySelector('dd').childNodes[0] ? r.querySelector('dd').childNodes[0].textContent : '', flag: (r.querySelector('.bld-flag') || {}).textContent || '', state: r.dataset.state }]));
  const prog = () => Object.fromEntries([...d.querySelectorAll('#anProgress li')].map((l) => [l.querySelector('b').textContent, { state: l.dataset.state, text: l.querySelector('.bld-t').textContent }]));
  // the wallet's node: counts what it is asked, can be held or made to fail; the USDC contract is a stand-in that answers 2.50
  const node = (o = {}) => {
    a.w.ethers = Object.assign({}, a.w.ethers, { Contract: class { async decimals() { return 6; } async balanceOf() { return a.w.ethers.BigNumber.from('2500000'); } } });
    a.w.__n = { block: 0, nonce: 0, bal: 0, logs: 0, filter: null }; a.w.__hold = null; a.w.__fail = ''; a.w.__latest = o.latest || 50000; a.w.__logs = o.logs || LOGS;
    a.ev(`provider = ${o.wallet === false ? 'null' : `{ getBlockNumber: async () => { window.__n.block++; if (window.__hold) await window.__hold; return window.__latest; }, getTransactionCount: async () => { window.__n.nonce++; return 7; }, getBalance: async () => { window.__n.bal++; return ethers.BigNumber.from('1500000000000000000'); }, getLogs: async (f) => { window.__n.logs++; window.__n.filter = f; if (window.__fail) throw new Error(window.__fail); return window.__logs; } }`}`);
  };
  const press = async (sel = '[data-onclick="loadAnalytics()"]') => { d.querySelector(sel).click(); await settle(); await settle(); await settle(); };
  return { ...a, d, go, net, setv, rows, prog, node, press, settle };
}
const NETS = (a) => JSON.parse(a.ev('JSON.stringify(Object.entries(NETWORKS).map(([k, n]) => [k, n.label, !!n.isMainnet, n.gasSymbol, n.chainIdDec, !!n.usdc]))'));
const cards = (a) => [...a.d.querySelectorAll('#an_kpis .an-card')].map((c) => [c.querySelector('.anl').textContent, c.querySelector('.anv').textContent, c.querySelector('.ans').textContent]);

/* 1. the page: ids, handlers, defaults */
{
  const a = fresh(); const { d } = a;
  for (const id of ['an_address', 'an_blocks', 'an_history_pills', 'analyticsData', 'an_kpis', 'an_bars', 'an_barlabels', 'an_events']) ok(!!d.getElementById(id), 'id: ' + id);
  eq([...d.querySelectorAll('#sec-analytics [data-onclick]')].map((b) => b.textContent + ':' + b.getAttribute('data-onclick')), ['Load Analytics:loadAnalytics()', 'Refresh:refreshAnalytics()'], 'Load and Refresh keep their handlers');
  eq([d.getElementById('an_blocks').value, d.getElementById('an_blocks').type, d.getElementById('an_address').placeholder, d.getElementById('analyticsData').style.display], ['10000', 'number', '0x... or select from deploy history', 'none'], 'defaults and the hidden results are unchanged');
  ok(['an_address', 'an_blocks'].every((id) => !!d.querySelector(`label[for="${id}"]`)), 'every field has a label');
  eq([...d.getElementById('sec-analytics').outerHTML.matchAll(/\son[a-z]+="/gi)].length, 0, 'csp: no inline handler');
  eq([d.querySelector('#sec-analytics .section-head .n').textContent, d.querySelector('#sec-analytics .section-head h2').textContent, d.getElementById('sec-analytics').classList.contains('bld')], ['16', 'Contract Analytics', true], 'number and heading are unchanged');
  const cs = css.slice(css.indexOf('/* ---- Contract Analytics (section 16)'), css.indexOf('/* ---- ABI Playground (section 09)'));
  const sels = []; cs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (_, __, s) => { sels.push(...s.split(',').map((x) => x.trim())); return ''; });
  const real = sels.filter((s) => !s.startsWith('@'));
  ok(real.length >= 5 && real.every((s) => /^(\.light\s+)?\.bld#sec-analytics/.test(s)), 'css: every rule of this tab is scoped to #sec-analytics', JSON.stringify(real.filter((s) => !/^(\.light\s+)?\.bld#sec-analytics/.test(s))));
  ok(d.getElementById('anSummary').children.length >= 6 && d.querySelectorAll('#anProgress li').length === 3 && d.querySelectorAll('#anNotes li').length === 4, 'overview: rows, three steps and four notes');
  eq(a.ev("CFBuilder.viewKeys().includes('analytics')"), true, 'registered with the shared engine');
}

/* 2. nothing is asked until Load Analytics or Refresh is pressed */
{
  const a = fresh(); const { d } = a; a.node(); await a.go('analytics');
  await a.setv('an_address', A); await a.setv('an_blocks', '500'); await a.setv('an_blocks', '10000'); await a.go('home'); await a.go('analytics');
  for (const k of ['sepolia', 'arc', 'avalanche']) await a.net(k);
  a.w.localStorage.setItem('contractforge_deploy_history', JSON.stringify([{ name: 'X', address: B, network: 'base', abi: [], txHash: '0x1', timestamp: Date.now() }])); a.ev('renderAnalyticsHistoryPills()'); await a.settle();
  d.querySelector('#an_history_pills .pill').click(); await a.settle();
  for (let i = 0; i < 6; i++) a.ev('anRender()');
  eq([a.ev('JSON.stringify(window.__n)'), a.fetches, a.alerts, d.getElementById('an_address').value, a.ev('activeNetwork')], [JSON.stringify({ block: 0, nonce: 0, bal: 0, logs: 0, filter: null }), [], [], B, 'avalanche'], 'opening the tab, typing, changing networks, clicking a pill and drawing the overview ask the node nothing; the pill only fills the address, the network stays');
  eq(d.getElementById('analyticsData').style.display, 'none', 'and no result was drawn');
}

/* 3. the questions and the cards are what they always were (also locked by analysis-tabs-audit) */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); a.node(); await a.go('analytics'); await a.setv('an_address', A);
  await a.press();
  eq([a.ev('window.__n.block'), a.ev('window.__n.nonce'), a.ev('window.__n.bal'), a.ev('window.__n.logs'), a.ev('window.__n.filter')], [1, 1, 1, 1, { address: A, fromBlock: 40000, toBlock: 50000 }], 'one question each, and the log filter is the address from (latest - look-back) to latest');
  eq(cards(a).map((c) => c[0]), ['Transactions', 'Events (range)', 'Native balance', 'USDC balance', 'From block', 'Latest block'], 'the six cards');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 4. the overview follows what really happened */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); a.node({ wallet: false }); await a.go('analytics');
  let r = a.rows(), p = a.prog();
  eq([r.Address.text, r.Address.state, r.Wallet.text, r['Reads through'].text, r['Look-back'].text, r.Result.text, p['Ready to load'].text, p.Loaded.state, p['Reading the numbers'].state], ['None yet', 'missing', 'Not connected', 'Your wallet\'s connection', '10,000 blocks', 'Not loaded yet', 'Needs: an address, a connected wallet.', 'locked', 'locked'], 'nothing there: the page says what is needed');
  await a.setv('an_address', '0x12'); eq([a.rows().Address.state, a.rows().Address.flag, a.prog()['Ready to load'].text], ['bad', 'Not a valid address: the node will refuse it', 'Needs: a valid address, a connected wallet.'], 'an address that is not valid is marked');
  await a.setv('an_address', A);
  // the two checks the page makes first
  await a.press(); r = a.rows();
  eq([a.alerts, r.Result.text, r.Result.flag, a.prog().Loaded.state], [['Connect your wallet first.'], 'Not loaded', 'Connect your wallet first.', 'locked'], 'no wallet: the page\'s own alert, and the overview gives the same reason');
  a.node(); await a.setv('an_address', ''); await a.press(); eq([a.alerts[1], a.rows().Result.flag], ['Enter a contract address.', 'Enter a contract address.'], 'no address: the page\'s own alert, and the same reason');
  await a.setv('an_address', A); eq([a.prog()['Ready to load'].state], ['done'], 'ready');
  // working
  let release; a.w.__hold = new Promise((res) => { release = res; });
  d.querySelector('[data-onclick="loadAnalytics()"]').click(); await a.settle();
  eq([a.rows().Result.text, a.prog().Loaded], ['Working…', { state: 'todo', text: 'Working…' }], 'while the node is thinking it says so');
  a.w.__hold = null; release(); await a.settle(); await a.settle(); await a.settle();
  r = a.rows(); p = a.prog();
  eq([r.Result.text, r.Result.state, p.Loaded.state, p.Loaded.text, r['Events in range'].text, r['Native balance'].text, r['USDC balance'].text, r.Range.text], [`For ${A.slice(0, 8)}…${A.slice(-4)} on Ethereum Sepolia`, 'ok', 'done', 'Loaded for this address, network and look-back.', '2 (last 10,000 blocks)', '1.5000 ETH', '2.50 USDC', 'From block 40,000 to 50,000'], 'numbers for this address, network and look-back');
  eq([r['"Transactions" card'].text, r['"Transactions" card'].flag, p['Reading the numbers'].state], ['7', 'This is the account\'s nonce: for a contract it is not the number of transactions sent to it (KNOWN)', 'todo'], 'the "Transactions" card is described as the nonce, and the last step is never done');
  eq(p['Reading the numbers'].text, 'Not tracked here: a snapshot of the chain head when you pressed the button. Press Refresh for a new one.', 'it says what is left to you');
  // outdated
  await a.setv('an_blocks', '5000'); eq([a.rows().Result.flag, a.prog().Loaded.state], ['The look-back changed since', 'stale'], 'a look-back changed after: outdated');
  await a.setv('an_blocks', '10000'); eq(a.prog().Loaded.state, 'done', 'set back: current again');
  await a.net('base'); eq([a.rows().Result.flag, a.prog().Loaded.state], ['The network changed since', 'stale'], 'the network changed after: outdated');
  await a.net('sepolia'); await a.setv('an_address', B); eq([a.rows().Result.flag, a.prog().Loaded.state], ['The address on screen is another one', 'stale'], 'the address changed after: outdated');
  await a.setv('an_address', A);
  // Refresh does the same
  a.ev('window.__n.block = 0'); await a.press('[data-onclick="refreshAnalytics()"]'); eq([a.ev('window.__n.block'), a.prog().Loaded.state], [1, 'done'], 'Refresh asks once and is tracked the same way');
  // look-back values
  for (const [v, text, state, flag] of [['0', '0 blocks', 'ok', 'Only the latest block'], ['-5', '-5 blocks', 'bad', 'The range would start after the latest block: the node will answer with an error'], ['50000', '50,000 blocks', 'ok', 'Longer than the default: some nodes refuse big ranges and answer with their own limit'], ['', '10,000 blocks', 'ok', '']]) { await a.setv('an_blocks', v); eq([a.rows()['Look-back'].text, a.rows()['Look-back'].state, a.rows()['Look-back'].flag], [text, state, flag], `a look-back of "${v}"`); }
  eq(d.getElementById('anBlocksNote').textContent, 'Empty reads as the default, 10,000.', 'an empty look-back is explained');
  await a.setv('an_blocks', '10000');
  // failure keeps the earlier numbers
  a.w.__fail = 'query returned more than 10000 results'; await a.press();
  r = a.rows();
  eq([r.Result.text, r.Result.state, r.Result.flag.startsWith('query returned more than 10000 results · The cards still show the earlier result (for ')], ['Failed', 'bad', true], 'a node that refuses the range: its own message, and the overview says the cards still show the earlier result');
  eq([a.prog().Loaded.state, cards(a).length], ['attention', 6], 'the step needs attention and the cards are still the earlier ones');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 5. a deployment from another network, and what the pills do */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); a.node(); await a.go('analytics');
  const recs = [{ name: 'OnBase', address: A, network: 'base', abi: [], txHash: '0x1', timestamp: Date.now() }, { name: 'OnSepolia', address: B, network: 'sepolia', abi: [], txHash: '0x2', timestamp: Date.now() }];
  a.w.localStorage.setItem('contractforge_deploy_history', JSON.stringify(recs)); a.ev('renderAnalyticsHistoryPills()'); await a.settle();
  eq([...d.querySelectorAll('#an_history_pills .pill')].map((p) => p.textContent), ['OnBase (base)', 'OnSepolia (sepolia)'], 'the pills are the page\'s own');
  d.querySelectorAll('#an_history_pills .pill')[0].click(); await a.settle();
  let r = a.rows();
  eq([d.getElementById('an_address').value, a.ev('activeNetwork'), r['Known deployment'].text, r['Known deployment'].state, r['Known deployment'].flag, d.getElementById('anAddrNote').textContent], [A, 'sepolia', 'OnBase on Base', 'bad', 'Analytics reads from your wallet\'s chain and labels with Ethereum Sepolia, not with Base', 'This deployment lives on another network than the one selected.'], 'a pill fills the address only: the deployment is on Base but the app (and the reading) stay on Sepolia, and the overview says so');
  d.querySelectorAll('#an_history_pills .pill')[1].click(); await a.settle();
  r = a.rows(); eq([r['Known deployment'].text, r['Known deployment'].state, d.getElementById('anAddrNote').textContent], ['OnSepolia on Ethereum Sepolia', 'ok', ''], 'a deployment on the selected network: nothing to warn about');
  await a.setv('an_address', addrFor('zz')); eq(a.rows()['Known deployment'], { text: 'Not in this browser\'s history', flag: '', state: 'ok' }, 'an address with no record: said as such');
  a.w.localStorage.setItem('contractforge_deploy_history', JSON.stringify([{ name: 'Mystery', address: A, network: 'nowhere', abi: [], txHash: '0x1', timestamp: Date.now() }])); await a.setv('an_address', A);
  eq(a.rows()['Known deployment'].text, 'Mystery on an unknown network', 'a record on an unknown network is said to be unknown');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 6. the wallet's chain (a property the wallet already holds: nothing is requested) */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); a.node(); await a.go('analytics'); await a.setv('an_address', A);
  ok(!('Wallet chain' in a.rows()), 'no wallet chain row when the wallet does not say');
  a.w.__req = 0; const own = a.ev("NETWORKS['sepolia'].chainIdDec");
  a.w.ethereum = { chainId: '0x' + own.toString(16), request: async () => { a.w.__req++; } }; await a.go('home'); await a.go('analytics');
  eq([a.rows()['Wallet chain'].text, a.rows()['Wallet chain'].state], ['The same chain', 'ok'], 'the same chain');
  a.w.ethereum = { chainId: '0x' + a.ev("NETWORKS['base'].chainIdDec").toString(16), request: async () => { a.w.__req++; } }; await a.go('home'); await a.go('analytics');
  eq([a.rows()['Wallet chain'].text, a.rows()['Wallet chain'].state, a.rows()['Wallet chain'].flag], ['Chain 8453 (Base)', 'bad', 'Everything is read from your wallet\'s chain, but this page labels it with Ethereum Sepolia'], 'another known chain: the numbers belong to that chain, and the page says so');
  a.w.ethereum = { chainId: '0x539', request: async () => { a.w.__req++; } }; await a.go('home'); await a.go('analytics');
  eq([a.rows()['Wallet chain'].text, a.rows()['Wallet chain'].state], ['Chain 1337', 'bad'], 'an unknown chain');
  eq(a.w.__req, 0, 'and the wallet was never asked for anything');
}

/* 7. all 16 networks and every mode */
{
  const nets = NETS(fresh());
  eq(nets.length, 16, '16 networks');
  for (const [k, label, main, sym, chain, hasUsdc] of nets) {
    const a = fresh(); const { d } = a; await a.net(k); a.node(); await a.go('analytics'); await a.setv('an_address', A);
    let r = a.rows();
    eq([r.Network.text, r.Network.flag.startsWith('Mainnet'), a.ev('window.__n.block')], [`${label} (${chain})`, main, 0], `${k}: network ${main ? 'with the mainnet warning' : 'without it'}; nothing asked before the click`);
    await a.press(); r = a.rows();
    eq([r['Native balance'].text, r['USDC balance'].text, r['USDC balance'].flag === '' ? 'ok' : 'flag', r.Result.text.endsWith(' on ' + label)], [`1.5000 ${sym}`, hasUsdc ? '2.50 USDC' : '—', hasUsdc ? 'ok' : 'flag', true], `${k}: the native balance is in ${sym}; the USDC balance is ${hasUsdc ? 'read from the network\'s USDC' : 'not available, and the overview says why'}`);
    eq([a.prog().Loaded.state, a.pageErrors.length], ['done', 0], `${k}: loaded, no page errors`);
  }
  const a = fresh(); a.node(); await a.go('analytics'); await a.setv('an_address', A); await a.press();
  for (const m of ['portable', 'multi', 'cross', 'single']) { a.ev(`setMultichainMode('${m}')`); await a.settle(); eq(a.rows()['Deployment Mode'].text, a.ev(`MC_MODES['${m}'].label`), `mode ${m}`); }
  eq(a.ev('window.__n.block'), 1, 'four mode changes asked the node nothing more');
}

/* 8. hostile text, navigation and the other tabs */
{
  const a = fresh(); const { d } = a; const EVIL = '<img src=x onerror=window.__xss=1>';
  await a.net('sepolia'); a.node({ logs: [{ blockNumber: 49999, topics: [EVIL], data: '0x', transactionHash: EVIL }] }); await a.go('analytics');
  a.w.localStorage.setItem('contractforge_deploy_history', JSON.stringify([{ name: EVIL, address: A, network: EVIL, abi: [], txHash: '0x1', timestamp: Date.now() }]));
  await a.setv('an_address', A); await a.press();
  eq([a.w.__xss, d.querySelectorAll('#sec-analytics img').length], [undefined, 0], 'a hostile name, network and event data become no markup');
  ok(d.getElementById('anSummary').textContent.includes('<img'), 'the record\'s name is shown as text');
  ok(![...d.querySelectorAll('#sec-analytics *')].some((el) => [...el.attributes].some((at) => /__xss|onerror/.test(at.value) && at.name !== 'id')), 'no attribute carries the payload');
  await a.setv('an_address', EVIL); eq([a.rows().Address.state, d.querySelectorAll('#sec-analytics img').length], ['bad', 0], 'a hostile address is only a bad address');
  await a.setv('an_address', A);
  const shot = () => JSON.stringify([a.rows(), a.prog()]);
  const s0 = shot();
  for (const s of ['home', 'wizard', 'swap', 'analytics', 'deploy', 'analytics', 'gas', 'analytics', 'lab', 'analytics']) await a.go(s);
  eq(shot(), s0, 'after ten navigations the overview is the same');
  eq([d.querySelectorAll('#anProgress li').length, d.querySelectorAll('#anNotes li').length, a.ev('window.__n.block')], [3, 4, 1], 'no duplicated rows; the node was asked once, by the one click');
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
