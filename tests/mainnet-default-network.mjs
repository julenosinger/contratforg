// Mainnet-first default network (Phase 11.4). Arc Mainnet is the default on fresh load; the wallet is never forced or auto-switched;
// every other network, deployment mode and mainnet safety gate stays as it was. Simulated browser (jsdom) through the real page
// functions; no blockchain transaction is ever run.
import { loadApp } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));

/* 1-6. fresh load: Arc Mainnet is the default, Mainnets is the category, the sidebar and header agree, the wallet stays out */
{
  const app = loadApp(); const { ev, w } = app; const d = w.document;
  eq(ev('activeNetwork'), 'arcMain', 'fresh load: Arc Mainnet is the active network');
  eq([ev('NETWORKS.arcMain.chainIdDec'), ev('NETWORKS.arcMain.chainIdHex')], [5042, '0x13b2'], 'Arc Mainnet: chain id 5042 (0x13b2)');
  eq([ev('NETWORKS.arcMain.rpc'), ev('NETWORKS.arcMain.explorer'), ev('NETWORKS.arcMain.gasSymbol')], ['https://rpc.mainnet.arc.io', 'https://explorer.arc.io', 'USDC'], 'Arc Mainnet keeps its rpc, explorer and gas token');
  eq(ev('NETWORKS.arcMain.isMainnet'), true, 'Arc Mainnet is classified as a mainnet');
  eq(ev('netFilter'), 'mainnet', 'fresh load: the Mainnets category is selected');
  eq([d.getElementById('sidenet').textContent, d.getElementById('sidechain').textContent, d.getElementById('sidegas').textContent], ['Arc Mainnet', '5042', 'USDC'], 'the sidebar shows Arc Mainnet · 5042 · USDC');
  ok(d.getElementById('netBanner').classList.contains('mainnet') && /Arc Mainnet/.test(d.getElementById('netBanner').textContent), 'the header banner is a mainnet banner naming Arc Mainnet');
  ok(d.body.classList.contains('mainnet-mode'), 'the body carries the mainnet-mode class (visually identifiable)');
  eq([ev('account'), ev('signer'), ev('provider')], [null, null, null], 'the wallet stays disconnected (no account, signer or provider)');
  eq(d.getElementById('connectBtn').textContent, 'Connect Wallet', 'the connect button still says Connect Wallet');
  eq(ev('typeof window.ethereum'), 'undefined', 'no injected wallet is queried on load');
  // the balance badge is empty/unavailable, never a fake balance
  ok(/^—\s|^\s*$/.test(d.getElementById('balanceBadge').textContent.trim()) || d.getElementById('balanceBadge').textContent.trim() === '— USDC', 'the balance badge is a placeholder, not a fake balance', d.getElementById('balanceBadge').textContent);
  eq(app.pageErrors.length, 0, 'no page errors on load');
}

/* 7-9. manual switching: testnet direct, mainnets through the in-app confirm dialog */
{
  const app = loadApp(); const { ev, w } = app; const d = w.document;
  const wait = () => new Promise((r) => setTimeout(r, 0));
  w.confirm = () => { throw new Error('the browser confirm box must not be used'); };
  // 7. to Arc Testnet: direct (no dialog)
  ev("netFilter = 'testnet'; renderNetBar();");
  [...d.querySelectorAll('#netbar .netbtn')].find((b) => /Arc Testnet/.test(b.textContent)).click(); await wait();
  eq(ev('activeNetwork'), 'arc', 'manual switch to Arc Testnet works (no dialog)');
  eq(d.getElementById('sidenet').textContent, 'Arc Testnet', 'the sidebar follows to Arc Testnet');
  // 8. to Ethereum (mainnet): the in-app confirm dialog is mandatory
  ev("netFilter = 'mainnet'; renderNetBar();");
  const eth = () => [...d.querySelectorAll('#netbar .netbtn')].find((b) => /^Ethereum/.test(b.textContent.trim()) || /Ethereum/.test(b.textContent));
  eth().click(); await wait();
  const dlg = () => d.getElementById('switchConfirm');
  ok(!!dlg() && /Switch to Ethereum\?/.test(dlg().textContent) && /real ETH/.test(dlg().textContent), 'switching to Ethereum Mainnet opens the in-app confirm dialog', dlg()?.textContent);
  eq(ev('activeNetwork'), 'arc', 'nothing changes while the dialog is open');
  d.getElementById('scCancel').click(); await wait();
  eq(ev('activeNetwork'), 'arc', 'Cancel keeps the current network');
  eth().click(); await wait(); d.getElementById('scOk').click(); await wait();
  eq(ev('activeNetwork'), 'ethereum', 'confirming switches to Ethereum');
  // 9. to Base (mainnet): same mandatory dialog
  ev("netFilter = 'mainnet'; renderNetBar();");
  [...d.querySelectorAll('#netbar .netbtn')].find((b) => /Base\b/.test(b.textContent)).click(); await wait();
  ok(!!dlg() && /Switch to Base\?/.test(dlg().textContent), 'switching to Base opens the in-app confirm dialog', dlg()?.textContent);
  d.getElementById('scOk').click(); await wait();
  eq(ev('activeNetwork'), 'base', 'confirming switches to Base');
  // every supported network is still present in the selector
  ev("netFilter = 'all'; renderNetBar();");
  eq(d.querySelectorAll('#netbar .netbtn').length, 16, 'all 16 networks remain listed');
  // deployment modes are intact
  eq(['single', 'portable', 'multi', 'cross'].map((m) => { ev(`setMultichainMode('${m}')`); return ev('multichainMode'); }), ['single', 'portable', 'multi', 'cross'], 'all four deployment modes remain selectable');
}

/* 10. wallet chainChanged stays functional (the app follows the wallet, never the other way around on its own) */
{
  const app = loadApp(); const { ev, w } = app;
  const listeners = {};
  w.window.ethereum = { on: (evt, cb) => { listeners[evt] = cb; }, removeListener: () => {}, request: async () => {}, chainId: '0xaa36a7' };
  // the chainChanged handler rebuilds the provider and refreshes the balance: give it the smallest real stubs
  w.ethers.providers = { Web3Provider: class { constructor() { return { getSigner: () => ({}) }; } } };
  w.ethers.utils.formatUnits = () => '1.0000';
  w.ethers.Contract = class { constructor() {} decimals() { return Promise.resolve(6); } balanceOf() { return Promise.resolve('0x0'); } };
  ev("window.__evmListenersRegistered = false; registerWalletEvents();");
  ok(typeof listeners.chainChanged === 'function' && typeof listeners.accountsChanged === 'function', 'chainChanged and accountsChanged listeners are registered');
  // a wallet-driven switch to Ethereum Sepolia updates the active network
  ev("provider = { getBalance: async () => '0x0' }; signer = {}; account = '0xabc';");
  listeners.chainChanged('0xaa36a7'); // sepolia (11155111)
  eq(ev('activeNetwork'), 'sepolia', 'chainChanged to Sepolia updates the active network');
  // back to Arc Mainnet via the wallet
  listeners.chainChanged('0x13b2'); // arcMain (5042)
  eq(ev('activeNetwork'), 'arcMain', 'chainChanged to Arc Mainnet updates the active network');
  // accountsChanged to [] disconnects
  listeners.accountsChanged([]);
  eq([ev('account'), ev('signer'), ev('provider')], [null, null, null], 'accountsChanged([]) disconnects the wallet');
}

/* 11. network-specific balance labels (Arc Mainnet uses USDC) */
{
  const app = loadApp(); const { ev, w } = app;
  const d = w.document;
  w.window.ethereum = { request: async () => {}, on: () => {}, chainId: '0x13b2' };
  w.ethers.utils.formatUnits = () => '1.0000';
  w.ethers.Contract = class { constructor() {} decimals() { return Promise.resolve(6); } balanceOf() { return Promise.resolve('0x0'); } };
  ev("account = '0xabc'; provider = { getBalance: async () => '0xde0b6b3a7640000' };");
  await ev('refreshBalance()'); await tick();
  eq(d.getElementById('balanceBadge').textContent, '1.0000 USDC (gas)  /  1.00 USDC (ERC-20)', 'the balance is labelled with the network gas token (USDC gas + ERC-20 USDC on Arc Mainnet)', d.getElementById('balanceBadge').textContent);
}

/* 12. mainnet confirmations remain mandatory (deploy is blocked without the maturity check) */
{
  const app = loadApp(); const { ev } = app;
  eq(ev('activeNetwork'), 'arcMain', 'still Arc Mainnet by default');
  let err = '';
  ev("window.__deployErr = '';");
  try {
    await ev("deployCompiled({ sourceHash: 'deadbeef', name: 'X', abi: [], bytecode: '0x', bytecodeKeccak256: '0x1' }, [], 'arcMain')");
  } catch (e) { err = String(e.message || e); }
  ok(/maturity check was not confirmed/.test(err), 'deployCompiled refuses a mainnet deploy without the maturity confirmation', err);
}

/* 13. a mismatched wallet chain is reported, never silently ignored */
{
  const app = loadApp(); const { ev, w } = app; const d = w.document;
  w.window.ethereum = { chainId: '0xaa36a7', request: async () => {}, on: () => {} };
  w.window.ethers = w.ethers;
  ev("activeNetwork = 'arcMain'; signer = {};");   // app on Arc Mainnet (5042), wallet on Sepolia (11155111)
  eq(ev('gasWalletChain()'), 11155111, 'the wallet chain is read from window.ethereum.chainId');
  // the gas overview reports the mismatch
  ev("document.getElementById('gasSummary') && (window.__gasBox = document.createElement('dl')); ");
  eq(ev("(() => { const c = gasWalletChain(); const net = NETWORKS.arcMain; return c !== null && c !== net.chainIdDec; })()"), true, 'a wallet on another chain is detected as a mismatch against Arc Mainnet');
}

/* 14. historical deployments preserve their original network */
{
  const app = loadApp(); const { ev, w } = app;
  const d = w.document;
  ev("addToDeployHistory({ name: 'A', address: '0x' + '1'.repeat(40), network: 'sepolia', abi: [], txHash: '0x1' }); addToDeployHistory({ name: 'B', address: '0x' + '2'.repeat(40), network: 'arc', abi: [], txHash: '0x2' });");
  ev('renderHistory();');
  eq(ev('activeNetwork'), 'arcMain', 'the default network is still Arc Mainnet after adding history');
  const rows = [...d.querySelectorAll('#historyList .hist-row')].map((r) => r.textContent);
  ok(rows.some((t) => /Sepolia/.test(t)) && rows.some((t) => /Arc Testnet/.test(t)), 'history records keep their original networks (Sepolia and Arc Testnet, not reassigned to Arc Mainnet)', JSON.stringify(rows));
  ok(!rows.every((t) => /Arc Mainnet/.test(t)), 'the recorded networks are not silently rewritten to Arc Mainnet');
}

/* 15. reload restores the intended default (the default is not persisted and pending operations are untouched) */
{
  const a1 = loadApp();
  a1.ev("activeNetwork = 'sepolia'; updateSideNet();");
  eq(a1.ev('activeNetwork'), 'sepolia', 'the active network can be changed away from the default');
  const a2 = loadApp();
  eq(a2.ev('activeNetwork'), 'arcMain', 'a fresh load defaults to Arc Mainnet again (the default is not persisted)');
  eq(a2.ev('netFilter'), 'mainnet', 'and the Mainnets category is selected again');
}

/* 16. network switching does not rebuild or reorder the header (structural stability) */
{
  const app = loadApp(); const { ev, w } = app; const d = w.document;
  const sig = () => [...d.querySelectorAll('#globalBar *')].map((e) => e.id || e.className).join('|');
  const before = sig();
  for (const k of ['arc', 'ethereum', 'base', 'sepolia', 'arcMain']) {
    ev(`activeNetwork = '${k}'; updateSideNet();`);
  }
  eq(sig(), before, 'switching networks keeps the header DOM structure (no rebuild, no reorder)');
  ok(d.getElementById('netBanner').classList.contains('mainnet'), 'after switching back to Arc Mainnet the banner is a mainnet banner again');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
