// Phase 11.1.3 — multichain gas integrity, crosschain signing safety and batch abort classification.
import { loadApp } from './harness.mjs';

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m + (d ? '  [' + d + ']' : '')); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m, 'got ' + JSON.stringify(a) + ' want ' + JSON.stringify(b));

/* ---- 1. NETWORKS registry: the configuration authority for native gas ---- */
{
  const a = loadApp(); const ev = a.ev;
  const gas = JSON.parse(ev('JSON.stringify(Object.fromEntries(Object.entries(NETWORKS).map(([k,n]) => [k, { g: n.gasSymbol, d: n.gasDecimals, u: n.usdcDecimals }])))'));
  const expected = {
    ethereum: { g: 'ETH', d: 18, u: 6 }, polygon: { g: 'POL', d: 18, u: 6 }, base: { g: 'ETH', d: 18, u: 6 },
    arbitrum: { g: 'ETH', d: 18, u: 6 }, optimism: { g: 'ETH', d: 18, u: 6 }, avalanche: { g: 'AVAX', d: 18, u: 6 },
    bnb: { g: 'BNB', d: 18, u: 18 }, robinhoodMain: { g: 'ETH', d: 18, u: 6 },
    arcMain: { g: 'USDC', d: 18, u: 6 }, arc: { g: 'USDC', d: 18, u: 6 }, robinhood: { g: 'ETH', d: 18, u: 6 },
    sepolia: { g: 'ETH', d: 18, u: 6 }, amoy: { g: 'POL', d: 18, u: 6 }, basesep: { g: 'ETH', d: 18, u: 6 },
    arbsep: { g: 'ETH', d: 18, u: 6 }, opsep: { g: 'ETH', d: 18, u: 6 },
  };
  ok(Object.keys(gas).length === 16, 'gas: exactly 16 networks in the registry', Object.keys(gas).length);
  let all = true, bad = [];
  for (const [k, e] of Object.entries(expected)) {
    if (!gas[k] || gas[k].g !== e.g || gas[k].d !== e.d || gas[k].u !== e.u) { all = false; bad.push(k + '=' + JSON.stringify(gas[k])); }
  }
  ok(all, 'gas: every network keeps its own native gas asset and decimals', bad.join(', '));
  eq([gas.arcMain.g, gas.arcMain.d, gas.arcMain.u], ['USDC', 18, 6], 'gas: Arc uses native USDC gas (18 dec) distinct from ERC-20 USDC (6 dec)');
  eq([gas.ethereum.g, gas.avalanche.g, gas.bnb.g, gas.polygon.g], ['ETH', 'AVAX', 'BNB', 'POL'], 'gas: ETH/AVAX/BNB/POL are never replaced by USDC');
}

/* ---- 2. refreshBalance: native gas decimals + Arc native-vs-ERC20 distinction ---- */
{
  const a = loadApp(); const ev = a.ev;
  ev(`
    ethers.utils.formatUnits = (bal, dec) => { (window.__decs = window.__decs || []).push(dec); return '1.00'; };
    ethers.Contract = class { constructor(addr) { this.addr = addr; } decimals = async () => 6; balanceOf = async () => 500000; };
    provider = { getBalance: async () => '1000000000000000000' };
    account = '0xabc'; activeNetwork = 'arc'; document.getElementById('balanceBadge').textContent = '';
  `);
  ev('window.__decs = [];');
  await ev('refreshBalance()');
  ok(ev('window.__decs[0]') === 18 && ev('window.__decs[1]') === 6, 'gas: native uses gasDecimals (18) and the ERC-20 USDC uses its own decimals (6)', ev('JSON.stringify(window.__decs)'));
  ok(/\(gas\)/.test(ev("document.getElementById('balanceBadge').textContent")) && /\(ERC-20\)/.test(ev("document.getElementById('balanceBadge').textContent")), 'gas: Arc shows native USDC gas and ERC-20 USDC distinctly', ev("document.getElementById('balanceBadge').textContent"));
  // on a non-Arc network the ERC-20 USDC and native gas are shown as two separate figures (never USDC-as-gas)
  ev("activeNetwork = 'ethereum'; document.getElementById('balanceBadge').textContent = '';");
  await ev('refreshBalance()');
  const ethText = ev("document.getElementById('balanceBadge').textContent");
  ok(/USDC  \//.test(ethText) && / ETH$/.test(ethText) && !/\(gas\)/.test(ethText), 'gas: a non-Arc network never presents ERC-20 USDC as the gas asset', ethText);
}

/* ---- 3. Fatal vs recoverable error classification ---- */
{
  const a = loadApp(); const ev = a.ev;
  ev("pendingSource = { code: 'contract A {}' }; account = '0xabc'; multichainMode = 'single'; activeNetwork = 'arc';");
  const op = ev('deployOpSnapshot()');
  ev("pendingSource = { code: 'contract B {}' };");
  const r = ev(`(() => { try { assertOpUnchanged(${JSON.stringify(op)}); return null; } catch (e) { return { m: e.message, fatal: !!e.fatal }; } })()`);
  ok(r.fatal === true && /source changed/.test(r.m), 'fatal: a source change is a fatal identity violation', JSON.stringify(r));
  // mdAssertReady: disconnect is fatal
  ev("pendingSource = { code: 'contract A {}' }; account = null; signer = null;");
  const r2 = ev(`mdAssertReady('arc', ${JSON.stringify(op)}).then(() => null).catch((e) => ({ m: e.message, fatal: !!e.fatal }))`);
  const d = await r2;
  ok(d.fatal === true && /disconnected/.test(d.m), 'fatal: a wallet disconnect is fatal', JSON.stringify(d));
  // mdAssertReady: wrong chain is recoverable (no fatal flag)
  ev("account = '0xabc'; signer = {}; provider = { getNetwork: async () => ({ chainId: 999999 }) };");
  const r3 = await ev(`mdAssertReady('arc', ${JSON.stringify(op)}).then(() => null).catch((e) => ({ m: e.message, fatal: !!e.fatal }))`);
  ok(r3.fatal !== true && /chainId 999999/.test(r3.m), 'recoverable: a wrong chain is not a fatal identity violation', JSON.stringify(r3));
}

/* ---- 4. multiDeploy: sequential order + recoverable partial failure ---- */
{
  const a = loadApp(); const ev = a.ev;
  ev("pendingSource = { name: 'A', code: 'contract A {}', template: 'simple' }; account = '0xabc'; signer = {}; multichainMode = 'multi'; activeNetwork = 'arc';");
  ev("mdState.selected = new Set(['arc', 'basesep']); mdState.includeBridge = false; mdState.running = false;");
  ev(`
    matGate = async () => true; reqBlockReason = () => ''; reqAddressProblem = () => null;
    compilePendingResolved = async () => ({ name: 'A', target: 'A', abi: [], bytecode: '0x', sourceHash: matHash(pendingSource.code) });
    switchWalletNetwork = async () => {}; mdWaitForChain = async () => true; mainnetDeployConfirm = async () => false;
    mdRowValues = () => []; renderNetBar = () => {}; updateSideNet = () => {}; renderMultiDeployPanel = () => {}; logConsole = () => {}; uiResetDeployResults = () => {}; uiAddDeployResult = () => {}; refreshBalance = async () => {};
    provider = { getNetwork: async () => ({ chainId: NETWORKS[activeNetwork].chainIdDec }) };
    window.__deploys = [];
    deployCompiled = async (compiled, values, key) => { window.__deploys.push(key); if (key === 'arc') throw new Error('tx rejected'); return { address: '0x' + '1'.repeat(40) }; };
  `);
  const results = await ev('multiDeploy()');
  ok(ev('JSON.stringify(window.__deploys)') === JSON.stringify(['arc', 'basesep']), 'batch: networks are attempted in the selected order', ev('JSON.stringify(window.__deploys)'));
  const labels = results.map((r) => r[0]);
  ok(labels.includes('Arc Testnet') && labels.includes('Base Sepolia'), 'batch: both networks appear in the results', JSON.stringify(results));
  ok(results.find((r) => r[0] === 'Arc Testnet')[1] === 'failed', 'batch: a rejected transaction is a recoverable per-network failure', JSON.stringify(results.find((r) => r[0] === 'Arc Testnet')));
  ok(/^0x/.test(results.find((r) => r[0] === 'Base Sepolia')[1]), 'batch: the later network still deploys after an earlier recoverable failure');
}

/* ---- 5. multiDeploy: a fatal identity violation aborts the whole batch ---- */
{
  const a = loadApp(); const ev = a.ev;
  ev("pendingSource = { name: 'A', code: 'contract A {}', template: 'simple' }; account = '0xabc'; signer = {}; multichainMode = 'multi'; activeNetwork = 'arc';");
  ev("mdState.selected = new Set(['arc', 'basesep']); mdState.includeBridge = false; mdState.running = false;");
  ev(`
    matGate = async () => true; reqBlockReason = () => ''; reqAddressProblem = () => null;
    compilePendingResolved = async () => ({ name: 'A', target: 'A', abi: [], bytecode: '0x', sourceHash: matHash(pendingSource.code) });
    switchWalletNetwork = async () => {}; mdWaitForChain = async () => true; mainnetDeployConfirm = async () => false;
    mdRowValues = () => []; renderNetBar = () => {}; updateSideNet = () => {}; renderMultiDeployPanel = () => {}; logConsole = () => {}; uiResetDeployResults = () => {}; uiAddDeployResult = () => {}; refreshBalance = async () => {};
    provider = { getNetwork: async () => ({ chainId: NETWORKS[activeNetwork].chainIdDec }) };
    window.__deploys = [];
    deployCompiled = async (compiled, values, key) => { window.__deploys.push(key); return { address: '0x' + '1'.repeat(40) }; };
    const __origSwitch = switchWalletNetwork;
    window.__sw = 0;
    switchWalletNetwork = async () => { if (++window.__sw === 2) account = '0xdef'; };   // unexpected account change before the second network
  `);
  const results = await ev('multiDeploy()');
  ok(ev('JSON.stringify(window.__deploys)') === JSON.stringify(['arc']), 'fatal: only the first network is deployed before the abort', ev('JSON.stringify(window.__deploys)'));
  ok(results.some((r) => r[0] === 'Arc Testnet' && /^0x/.test(r[1])), 'fatal: the confirmed primary result is preserved', JSON.stringify(results));
  ok(!results.some((r) => r[0] === 'Base Sepolia'), 'fatal: no further signing after an identity violation', JSON.stringify(results.map((r) => r[0])));
}

/* ---- 6. crosschain: main succeeds while the bridge fails (recoverable) — primary preserved ---- */
{
  const a = loadApp(); const ev = a.ev;
  ev("pendingSource = { name: 'A', code: 'contract A {}', template: 'simple' }; account = '0xabc'; signer = {}; multichainMode = 'cross'; activeNetwork = 'arc';");
  ev("mdState.selected = new Set(['arc']); mdState.includeBridge = true; mdState.running = false;");
  ev(`
    matGate = async () => true; reqBlockReason = () => ''; reqAddressProblem = () => null;
    compilePendingResolved = async () => ({ name: 'A', target: 'A', abi: [], bytecode: '0x', sourceHash: matHash(pendingSource.code) });
    compileSource = async (bname) => ({ name: bname, target: bname, abi: [{ type: 'constructor', inputs: [{ name: 'tokenMessenger_', type: 'address' }, { name: 'messageTransmitter_', type: 'address' }, { name: 'usdc_', type: 'address' }] }], bytecode: '0x', sourceHash: 'x' });
    switchWalletNetwork = async () => {}; mdWaitForChain = async () => true; mainnetDeployConfirm = async () => false;
    mdRowValues = () => []; renderNetBar = () => {}; updateSideNet = () => {}; renderMultiDeployPanel = () => {}; logConsole = () => {}; uiResetDeployResults = () => {}; uiAddDeployResult = () => {}; refreshBalance = async () => {};
    provider = { getNetwork: async () => ({ chainId: NETWORKS[activeNetwork].chainIdDec }) };
    window.__calls = [];
    deployCompiled = async (compiled, values, key) => { window.__calls.push(compiled.name); if (String(compiled.name).indexOf('Bridge') >= 0) throw new Error('bridge tx rejected'); return { address: '0x' + '1'.repeat(40) }; };
  `);
  const results = await ev('multiDeploy()');
  eq(ev('JSON.stringify(window.__calls)'), JSON.stringify(['A', 'ABridge']), 'bridge: the main and the bridge are both attempted, in order');
  ok(results.find((r) => r[0] === 'Arc Testnet')[1] !== 'failed', 'bridge: the main result is preserved when the bridge fails', JSON.stringify(results.find((r) => r[0] === 'Arc Testnet')));
  ok(results.find((r) => r[0] === 'Arc Testnet bridge')[1] === 'failed', 'bridge: the bridge failure is reported separately', JSON.stringify(results.find((r) => r[0] === 'Arc Testnet bridge')));
}

/* ---- 7. crosschain: a wallet change after the main deploy stops the bridge signature ---- */
{
  const a = loadApp(); const ev = a.ev;
  ev("pendingSource = { name: 'A', code: 'contract A {}', template: 'simple' }; account = '0xabc'; signer = {}; multichainMode = 'cross'; activeNetwork = 'arc';");
  ev("mdState.selected = new Set(['arc']); mdState.includeBridge = true; mdState.running = false;");
  ev(`
    matGate = async () => true; reqBlockReason = () => ''; reqAddressProblem = () => null;
    compilePendingResolved = async () => ({ name: 'A', target: 'A', abi: [], bytecode: '0x', sourceHash: matHash(pendingSource.code) });
    compileSource = async (bname) => ({ name: bname, target: bname, abi: [{ type: 'constructor', inputs: [{ name: 'tokenMessenger_', type: 'address' }, { name: 'messageTransmitter_', type: 'address' }, { name: 'usdc_', type: 'address' }] }], bytecode: '0x', sourceHash: 'x' });
    switchWalletNetwork = async () => {}; mdWaitForChain = async () => true; mainnetDeployConfirm = async () => false;
    mdRowValues = () => []; renderNetBar = () => {}; updateSideNet = () => {}; renderMultiDeployPanel = () => {}; logConsole = () => {}; uiResetDeployResults = () => {}; uiAddDeployResult = () => {}; refreshBalance = async () => {};
    provider = { getNetwork: async () => ({ chainId: NETWORKS[activeNetwork].chainIdDec }) };
    window.__calls = [];
    deployCompiled = async (compiled, values, key) => { window.__calls.push(compiled.name); if (String(compiled.name).indexOf('Bridge') < 0) account = '0xdef'; return { address: '0x' + '1'.repeat(40) }; };   // account changes after the main deploy
  `);
  const results = await ev('multiDeploy()');
  eq(ev('JSON.stringify(window.__calls)'), JSON.stringify(['A']), 'bridge: the bridge is never signed after a wallet change', ev('JSON.stringify(window.__calls)'));
  ok(results.find((r) => r[0] === 'Arc Testnet')[1] !== 'failed', 'bridge: the primary result is preserved', JSON.stringify(results.find((r) => r[0] === 'Arc Testnet')));
  ok(!results.some((r) => r[0] === 'Arc Testnet bridge'), 'bridge: no false bridge success is recorded', JSON.stringify(results.map((r) => r[0])));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
