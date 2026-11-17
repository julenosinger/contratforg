// Phase 12.3: Gas Estimator (section 11). estimateGas() and logGas() are unchanged: same checks, same questions to the node, same numbers, same log lines. The tab now
// has an overview and a progress beside the form. These tests (the wallet's node, the wallet and CoinGecko are simulated with the real ethers library; nothing real is called) prove:
// nothing is asked until Estimate Gas is pressed, the overview says where every number comes from (the node or the formula; the price yours, fixed, or CoinGecko), whether the
// estimate still matches the contract, network and overrides on screen, that the constructor arguments are not in it, the wallet-chain mismatch, and the known wrong dollar
// price for Avalanche and BNB Chain, on all 16 networks.
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root, addrFor } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
const BC = (bytes) => '0x' + '60'.repeat(bytes);

function fresh() {
  const a = loadApp({ realEthers: true }); const d = a.w.document;
  const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
  a.alerts = []; a.w.alert = (m) => a.alerts.push(String(m));
  a.fetches = []; a.w.fetch = async (u) => { a.fetches.push(String(u)); return { json: async () => ({ ethereum: { usd: 2000 }, 'matic-network': { usd: 0.5 } }) }; };
  const settle = async () => { await tick(); await tick(); await tick(); };
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await settle(); };
  const net = async (k) => { a.ev(`activeNetwork = '${k}'; updateSideNet();`); await settle(); };
  const setv = async (id, v) => { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new a.w.Event('input', { bubbles: true })); await settle(); };
  const rows = () => Object.fromEntries([...d.querySelectorAll('#gasSummary .bld-row')].map((r) => [r.querySelector('dt').textContent, { text: r.querySelector('dd').childNodes[0] ? r.querySelector('dd').childNodes[0].textContent : '', flag: (r.querySelector('.bld-flag') || {}).textContent || '', state: r.dataset.state }]));
  const prog = () => Object.fromEntries([...d.querySelectorAll('#gasProgress li')].map((l) => [l.querySelector('b').textContent, { state: l.dataset.state, text: l.querySelector('.bld-t').textContent }]));
  const gen = (name) => a.ev(`renderSimpleForm('erc20'); ${name ? `document.getElementById('s_name').value = '${name}';` : ''} genSimple('erc20')`);
  // the wallet's node: counts what it is asked, can be held, made to fail, or to have no estimateGas
  const node = (o = {}) => {
    a.w.__n = { price: 0, est: 0, tx: [] }; a.w.__hold = null; a.w.__fail = ''; a.w.__noEst = !!o.noEst;
    a.ev(`provider = { getGasPrice: async () => { window.__n.price++; if (window.__fail) throw new Error(window.__fail); return ethers.BigNumber.from('1000000000'); }, estimateGas: async (tx) => { window.__n.est++; window.__n.tx.push(tx); if (window.__hold) await window.__hold; if (window.__noEst) throw new Error('no estimateGas'); return ethers.BigNumber.from(500000); } }; signer = ${o.wallet === false ? 'null' : '{}'};`);
    if (o.bytecode !== null) a.ev(`window.__lastCompiledBytecode = '${o.bytecode || BC(100)}'; window.__lastCompiledABI = [{ type: 'function', name: 'f', inputs: [], outputs: [], stateMutability: 'view' }];`);
  };
  const press = async () => { d.querySelector('#estimateGasBtn').click(); await settle(); await settle(); await settle(); };
  return { ...a, d, go, net, setv, rows, prog, gen, node, press, settle };
}
const NETS = (a) => JSON.parse(a.ev('JSON.stringify(Object.entries(NETWORKS).map(([k, n]) => [k, n.label, !!n.isMainnet, n.gasSymbol, n.chainIdDec]))'));

/* 1. the page: ids, handlers, defaults */
{
  const a = fresh(); const { d } = a;
  for (const id of ['gas_ethprice', 'gas_gweioverride', 'estimateGasBtn', 'gasMeter', 'g_units', 'g_unitssub', 'g_gwei', 'g_gweisub', 'g_native', 'g_nativesub', 'g_usd', 'g_usdsub', 'g_bytecode', 'g_functions', 'gasLog']) ok(!!d.getElementById(id), 'id: ' + id);
  eq([...d.querySelectorAll('#sec-gas [data-onclick]')].map((b) => b.textContent + ':' + b.getAttribute('data-onclick')), ['Estimate Gas:estimateGas()'], 'Estimate Gas keeps its handler');
  eq([d.getElementById('gas_ethprice').value, d.getElementById('gas_ethprice').type, d.getElementById('gas_gweioverride').value, d.getElementById('gasMeter').style.display, d.querySelector('#gasLog .msg').textContent], ['0', 'number', '0', 'none', 'Generate and compile a contract, then estimate its deployment cost.'], 'defaults, the hidden meter and the boot line are unchanged');
  ok(['gas_ethprice', 'gas_gweioverride'].every((id) => !!d.querySelector(`label[for="${id}"]`)), 'every field has a label');
  eq([...d.getElementById('sec-gas').outerHTML.matchAll(/\son[a-z]+="/gi)].length, 0, 'csp: no inline handler');
  eq([d.querySelector('#sec-gas .section-head .n').textContent, d.querySelector('#sec-gas .section-head h2').textContent, d.getElementById('sec-gas').classList.contains('bld')], ['11', 'Gas Estimator', true], 'number and heading are unchanged');
  const cs = css.slice(css.indexOf('/* ---- Gas Estimator (section 11)'), css.indexOf('/* ---- AI Security Auditor (section 08)'));
  const sels = []; cs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (_, __, s) => { sels.push(...s.split(',').map((x) => x.trim())); return ''; });
  const real = sels.filter((s) => !s.startsWith('@'));
  ok(real.length >= 4 && real.every((s) => /^(\.light\s+)?\.bld#sec-gas/.test(s)), 'css: every rule of this tab is scoped to #sec-gas', JSON.stringify(real.filter((s) => !/^(\.light\s+)?\.bld#sec-gas/.test(s))));
  ok(d.getElementById('gasSummary').children.length >= 6 && d.querySelectorAll('#gasProgress li').length === 3 && d.querySelectorAll('#gasNotes li').length === 4, 'overview: rows, three steps and four notes');
  eq(a.ev("CFBuilder.viewKeys().includes('gas')"), true, 'registered with the shared engine');
  eq([a.ev('GAS_MAX_BYTES'), a.ev('GAS_WARN_BYTES')], [24576, 20000], 'the size limits are the ones the page itself uses');
}

/* 2. nothing is asked until Estimate Gas is pressed */
{
  const a = fresh(); const { d } = a; a.gen(); a.node(); await a.go('gas');
  await a.setv('gas_ethprice', '2000'); await a.setv('gas_gweioverride', '3'); await a.setv('gas_ethprice', '0'); await a.go('home'); await a.go('gas');
  for (const k of ['sepolia', 'arc', 'avalanche']) await a.net(k);
  for (let i = 0; i < 6; i++) a.ev('gasRender()');
  eq([a.ev('JSON.stringify(window.__n)'), a.fetches, a.alerts], [JSON.stringify({ price: 0, est: 0, tx: [] }), [], []], 'opening the tab, typing, changing networks and drawing the overview ask neither the node nor CoinGecko, and alert nothing');
  eq(d.getElementById('gasMeter').style.display, 'none', 'and no meter was drawn');
}

/* 3. the request and the numbers are what they always were (the facts also locked by analysis-tabs-audit) */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); a.gen(); a.node(); await a.go('gas'); await a.setv('gas_ethprice', '2000');
  await a.press();
  eq([a.ev('window.__n.price'), a.ev('window.__n.est'), Object.keys(a.ev('window.__n.tx[0]')), a.ev('window.__n.tx[0].data') === a.ev('window.__lastCompiledBytecode')], [1, 1, ['data'], true], 'one question each to the node, about the creation bytecode only');
  const t = (id) => d.getElementById(id).textContent;
  eq([t('g_units'), t('g_gwei'), t('g_native'), t('g_usd'), t('g_usdsub'), t('g_bytecode'), t('g_functions'), d.getElementById('gasMeter').style.display, a.fetches], ['500,000', '1.000', '0.000500', '$1.0000', 'at $2000/ETH', '100', '1', 'grid', []], 'the meter is as before');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 4. the overview before and after: readiness, bytecode, constructor, price sources */
{
  const a = fresh(); const { d } = a; await a.net('sepolia');
  a.node({ wallet: false, bytecode: null }); await a.go('gas');
  let r = a.rows(), p = a.prog();
  eq([r.Contract.text, r.Wallet.text, r['Compiled bytecode'].text, p['Ready to estimate'].text, p.Estimate.state, p['Before you deploy'].state], ['None', 'Not connected', 'None yet', 'Needs: a contract, a connected wallet, compiled bytecode.', 'locked', 'locked'], 'nothing there: the page says what is needed');
  ok(!('Bytecode size' in r) && !('Gas units from' in r), 'no size and no source of the units before there is bytecode or an estimate');
  a.gen(); a.node({ wallet: true, bytecode: null }); await a.go('home'); await a.go('gas');
  eq(a.prog()['Ready to estimate'].text, 'Needs: compiled bytecode.', 'a contract and a wallet: still needs the bytecode (nothing is compiled on this tab)');
  a.node(); await a.go('home'); await a.go('gas'); r = a.rows(); p = a.prog();
  eq([p['Ready to estimate'].state, r.Wallet.text, r['Compiled bytecode'].text, r['Compiled bytecode'].state, r['Compiled bytecode'].flag, r['Bytecode size'].text, r.Constructor.text, r['Gas price'].text, r.Estimate.text], ['done', 'Connected', 'From the last compile', 'missing', 'This page cannot tell it is from the contract on screen', '100 of 24,576 bytes', 'No arguments', 'From the network', 'Not made yet'], 'ready to estimate: the compiled bytecode is only "from the last compile" unless a deployment proves otherwise');
  // an exact association, proven by a deployment made on this page
  await a.go('deploy');
  a.ev(`uiResetDeployResults(); uiAddDeployResult({ name: pendingSource.name, network: 'sepolia', address: '${addrFor('d1')}', txHash: '0x${'1'.repeat(64)}', bytecodeKeccak256: ethers.utils.keccak256(window.__lastCompiledBytecode) })`); await a.settle();
  await a.go('gas'); r = a.rows();
  eq([r['Compiled bytecode'].text, r['Compiled bytecode'].state], ['From this exact source', 'ok'], 'with a deployment from this page for this source and this bytecode: "from this exact source"');
  // sizes
  for (const [bytes, text, state] of [[20001, '20,001 of 24,576 bytes', 'missing'], [24577, '24,577 of 24,576 bytes', 'bad'], [20000, '20,000 of 24,576 bytes', 'ok']]) { a.node({ bytecode: BC(bytes) }); await a.go('home'); await a.go('gas'); eq([a.rows()['Bytecode size'].text, a.rows()['Bytecode size'].state], [text, state], `${bytes} bytes: ${state}`); }
  // constructor arguments are not in the estimate
  a.ev("setMultichainMode('portable')"); a.ev("renderSimpleForm('escrow'); genSimple('escrow')"); a.node(); await a.go('home'); await a.go('gas');
  eq([a.rows().Constructor.text, a.rows().Constructor.flag], ['1 argument', 'Not included: the node is asked about the creation bytecode only'], 'a contract with a constructor argument: the page says the estimate leaves it out');
  // prices and overrides
  await a.setv('gas_gweioverride', '2.5'); eq([a.rows()['Gas price'].text, a.rows()['Gas price'].flag], ['2.5 gwei (your override)', ''], 'a gwei override is shown as yours');
  await a.setv('gas_ethprice', '3200'); eq([a.rows()['Dollar price'].text, d.getElementById('gasPriceNote').textContent], ['$3200 per ETH (yours)', ''], 'a manual price is shown as yours');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 5. what happened: working, current, outdated, rough, failed, blocked */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); a.gen(); a.node(); await a.go('gas'); await a.setv('gas_ethprice', '2000');
  let release; a.w.__hold = new Promise((r) => { release = r; });
  d.querySelector('#estimateGasBtn').click(); await a.settle();
  eq([a.rows().Estimate.text, a.prog().Estimate], ['Working…', { state: 'todo', text: 'Working…' }], 'while the node is thinking it says so');
  a.w.__hold = null; release(); await a.settle(); await a.settle(); await a.settle();
  let r = a.rows(), p = a.prog();
  eq([r.Estimate.text, r.Estimate.state, p.Estimate.state, p.Estimate.text, r['Gas units from'].text, r['Cost in dollars'].text, r['Cost in dollars'].flag, p['Before you deploy'].state], ['500,000 gas × 1.000 gwei = 0.000500 ETH', 'ok', 'done', 'Made for this source, on this network, with these settings.', 'The node', '$1.0000', 'At the price you set', 'todo'], 'an estimate for this source, network and settings');
  eq(p['Before you deploy'].text, 'Not tracked here: gas prices move, so estimate again right before deploying, and add what the constructor arguments cost.', 'the last step is never done: it says what is left to you');
  await a.setv('gas_gweioverride', '2');
  eq([a.rows().Estimate.flag, a.prog().Estimate.state, a.prog().Estimate.text], ['An override changed since', 'stale', 'An override changed after this estimate.'], 'an override changed after: outdated');
  await a.setv('gas_gweioverride', '0'); eq(a.prog().Estimate.state, 'done', 'set back: current again');
  await a.net('base'); eq([a.rows().Estimate.flag, a.prog().Estimate.state], ['The network changed since', 'stale'], 'the network changed after: outdated');
  await a.net('sepolia'); a.gen('OtherToken'); a.node(); await a.go('home'); await a.go('gas');
  eq([a.rows().Estimate.flag, a.prog().Estimate.state], ['The contract on screen is not the one estimated', 'stale'], 'the contract changed after: outdated');
  // the formula
  a.node({ noEst: true }); await a.press();
  r = a.rows();
  eq([r['Gas units from'].text, r['Gas units from'].state, r['Gas units from'].flag, a.prog().Estimate.text], ['A formula', 'missing', 'The node could not estimate, so the page used 32,000 + 200 per non-zero byte + 4 per byte: a rough number', 'Made for this source, but with the formula: a rough number.'], 'without estimateGas the page says the number is a formula');
  // a failure keeps the earlier meter
  a.w.__fail = 'node unreachable'; await a.press();
  r = a.rows();
  eq([r.Estimate.text, r.Estimate.state, r.Estimate.flag.startsWith('node unreachable · The meter still shows the earlier estimate (')], ['Failed', 'bad', true], 'a failure is shown with its message, and the overview says the meter still shows the earlier estimate');
  eq(a.prog().Estimate.state, 'attention', 'and the step needs attention');
  // blocked by the page's own checks
  a.node({ wallet: false }); await a.press();
  eq([a.rows().Estimate.text, a.rows().Estimate.flag], ['Not made', 'Connect your wallet first.'], 'the page\'s own check is shown as the reason');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 6. where the dollar price comes from, on all 16 networks (and the known wrong price for AVAX and BNB) */
{
  const nets = NETS(fresh());
  eq(nets.length, 16, '16 networks');
  for (const [k, label, main, sym, chain] of nets) {
    const a = fresh(); const { d } = a; await a.net(k); a.gen(); a.node(); await a.go('gas');
    let r = a.rows();
    eq([r.Network.text, r.Network.flag.startsWith('Mainnet'), a.fetches.length], [`${label} (${chain})`, main, 0], `${k}: network ${main ? 'with the mainnet warning' : 'without it'}; nothing fetched before the click`);
    const want = sym === 'USDC' ? ['Fixed at $1', 'ok', 'The gas token here is USDC'] : (sym === 'AVAX' || sym === 'BNB') ? ['The Ethereum price', 'bad', `This page asks CoinGecko for the Ethereum price for ${sym} (KNOWN): set your own price above`] : ['CoinGecko', 'ok', 'An outside service, asked when you press Estimate and no price is set'];
    eq([r['Dollar price'].text, r['Dollar price'].state, r['Dollar price'].flag], want, `${k} (${sym}): the dollar price source is described truthfully`);
    await a.press(); r = a.rows();
    const id = sym === 'POL' ? 'matic-network' : 'ethereum';
    if(sym === 'USDC') eq([a.fetches.length, r['Cost in dollars'].flag, d.getElementById('g_usdsub').textContent], [0, 'At $1: the gas token is USDC', 'at $1/USDC'], `${k}: no request, a fixed $1`);
    else eq([a.fetches, r['Cost in dollars'].flag, d.getElementById('g_usdsub').textContent], [[`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`], 'At the CoinGecko price', `at $${sym === 'POL' ? '1' : '2000'}/${sym}`], `${k}: one request to CoinGecko for ${id}${sym === 'AVAX' || sym === 'BNB' ? ' (KNOWN: the Ethereum price is applied to ' + sym + ')' : ''}`);
    eq([r.Estimate.text.endsWith(' ' + sym), a.prog().Estimate.state], [true, 'done'], `${k}: the estimate is in ${sym}`);
    if(sym === 'AVAX' || sym === 'BNB') eq(d.getElementById('gasPriceNote').textContent, `Set a price for ${sym}: the live price asked for is the Ethereum one.`, `${k}: the field note warns`);
    if(sym === 'USDC') eq(d.getElementById('gasPriceNote').textContent, 'Not needed here: the gas token is USDC ($1).', `${k}: the field note says it is not needed`);
    eq(a.pageErrors.length, 0, `${k}: no page errors`);
  }
}

/* 7. the price service unreachable, and the wallet's chain */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); a.gen(); a.node(); await a.go('gas');
  a.w.fetch = async () => { throw new Error('offline'); }; await a.press();
  const r = a.rows();
  eq([r['Cost in dollars'].text, r['Cost in dollars'].state, r['Cost in dollars'].flag, d.getElementById('g_usd').textContent], ['—', 'missing', 'The price service could not be reached: nothing is invented', '—'], 'an unreachable price service: the dollar figure is withheld');
  eq([r.Estimate.state, a.prog().Estimate.state], ['ok', 'done'], 'and the estimate itself still stands');
  ok(!('Wallet chain' in a.rows()), 'no wallet chain row when the wallet does not say');
  const chain = a.ev("NETWORKS['sepolia'].chainIdDec");
  a.w.ethereum = { chainId: '0x' + chain.toString(16) }; await a.go('home'); await a.go('gas');
  eq([a.rows()['Wallet chain'].text, a.rows()['Wallet chain'].state], ['The same chain', 'ok'], 'a wallet on the same chain');
  a.w.ethereum = { chainId: '0x' + a.ev("NETWORKS['base'].chainIdDec").toString(16) }; await a.go('home'); await a.go('gas');
  eq([a.rows()['Wallet chain'].text, a.rows()['Wallet chain'].state, a.rows()['Wallet chain'].flag], ['Chain 8453 (Base)', 'bad', 'The numbers come from your wallet\'s chain, but this page labels them with Ethereum Sepolia'], 'a wallet on another known chain: the numbers belong to that chain, and the page says so');
  a.w.ethereum = { chainId: '0x539' }; await a.go('home'); await a.go('gas');
  eq([a.rows()['Wallet chain'].text, a.rows()['Wallet chain'].state], ['Chain 1337', 'bad'], 'a wallet on an unknown chain');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 8. every mode, hostile text, navigation, and the other tabs */
{
  const a = fresh(); const { d } = a; const EVIL = '<img src=x onerror=window.__xss=1>';
  await a.net('sepolia'); a.node(); a.ev(`pendingSource = { name: ${JSON.stringify('X' + EVIL)}, code: 'contract X {}', template: 'erc20' }`); await a.go('gas');
  await a.press();
  eq([a.w.__xss, d.querySelectorAll('#sec-gas img').length], [undefined, 0], 'nothing in the contract name or the overview becomes markup');
  ok(d.getElementById('gasSummary').textContent.includes('<img'), 'the name is shown as text');
  ok(![...d.querySelectorAll('#sec-gas *')].some((el) => [...el.attributes].some((at) => /__xss|onerror/.test(at.value) && at.name !== 'id')), 'no attribute carries the payload');
  for (const m of ['portable', 'multi', 'cross', 'single']) { a.ev(`setMultichainMode('${m}')`); await a.settle(); eq(a.rows()['Deployment Mode'].text, a.ev(`MC_MODES['${m}'].label`), `mode ${m}`); }
  const shot = () => JSON.stringify([a.rows(), a.prog()]);
  const s0 = shot();
  for (const s of ['home', 'wizard', 'swap', 'gas', 'deploy', 'gas', 'auditor', 'gas', 'lab', 'gas']) await a.go(s);
  eq(shot(), s0, 'after ten navigations the overview is the same');
  eq([d.querySelectorAll('#gasProgress li').length, d.querySelectorAll('#gasNotes li').length, a.ev('window.__n.price'), a.ev('window.__n.est')], [3, 4, 1, 1], 'no duplicated rows; the node was asked once, by the one click');
  
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
