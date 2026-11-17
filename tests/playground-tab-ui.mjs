// Phase 12.4: ABI Playground (section 09). Loading, calling, sending, watching and subscribing are unchanged (playground.mjs, run against a local chain, checks them); the page's own
// context line stays where it was. The tab now has an overview and a progress beside the form. These tests (no network: the contracts' nodes are never reached, the wallet
// is a stand-in) prove: nothing is created or asked by drawing the overview, the overview describes the loaded contract (its network with the mainnet warning, the ABI's
// source and counts, how it reads and what sending needs), the "last compiled ABI" is only called the deployment's own when a deployment made on this page proves it, the
// wallet's chain is compared without asking the wallet, a watch or a subscription started for an earlier contract is reported as still running, and it all holds on all 16 networks.
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root, addrFor } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
const A = addrFor('a1'), B = addrFor('b2');
const ABI = [{ type: 'constructor', inputs: [] }, { type: 'function', name: 'total', inputs: [], outputs: [{ type: 'uint256', name: 'v' }], stateMutability: 'view' }, { type: 'function', name: 'set', inputs: [{ type: 'uint256', name: 'x' }], outputs: [], stateMutability: 'nonpayable' }, { type: 'function', name: 'pay', inputs: [], outputs: [], stateMutability: 'payable' }, { type: 'event', name: 'Set', inputs: [{ type: 'uint256', name: 'x', indexed: false }] }, { type: 'error', name: 'Nope', inputs: [] }];

function fresh() {
  const a = loadApp({ realEthers: true }); const d = a.w.document;
  const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
  a.alerts = []; a.w.alert = (m) => a.alerts.push(String(m));
  a.fetches = []; a.w.fetch = async (u) => { a.fetches.push(String(u)); return { json: async () => ({}) }; };
  a.w.__req = 0;
  const settle = async () => { await tick(); await tick(); await tick(); };
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await settle(); };
  const net = async (k) => { a.ev(`activeNetwork = '${k}'; updateSideNet();`); await settle(); };
  const setv = async (id, v) => { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new a.w.Event('input', { bubbles: true })); el.dispatchEvent(new a.w.Event('change', { bubbles: true })); await settle(); };
  const rows = () => { const m = {}; [...d.querySelectorAll('#pgSummary .bld-row')].forEach((r) => { const k = r.querySelector('dt').textContent; (m[k] = m[k] || []).push({ text: r.querySelector('dd').childNodes[0] ? r.querySelector('dd').childNodes[0].textContent : '', flag: (r.querySelector('.bld-flag') || {}).textContent || '', state: r.dataset.state }); }); return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.length === 1 ? v[0] : v])); };
  const prog = () => Object.fromEntries([...d.querySelectorAll('#pgProgress li')].map((l) => [l.querySelector('b').textContent, { state: l.dataset.state, text: l.querySelector('.bld-t').textContent }]));
  const load = async (addr, abi, key, src = 'custom') => { a.ev(`document.getElementById('pg_abisrc').value = '${src}'; pgLoad('${addr}', ${JSON.stringify(abi)}, ${key ? `'${key}'` : 'null'})`); await settle(); };
  const wallet = (on, chainId) => { a.ev(`signer = ${on ? `(() => { const s = new ethers.VoidSigner('${A}'); s.getChainId = async () => 1; return s; })()` : 'null'}`); a.w.ethereum = chainId == null ? undefined : { chainId, on() {}, request: async () => { a.w.__req++; } }; };
  return { ...a, d, go, net, setv, rows, prog, load, wallet, settle };
}
const NETS = (a) => JSON.parse(a.ev('JSON.stringify(Object.entries(NETWORKS).map(([k, n]) => [k, n.label, !!n.isMainnet, n.chainIdDec, n.rpc]))'));

/* 1. the page: ids, handlers, defaults */
{
  const a = fresh(); const { d } = a;
  for (const id of ['pg_deployments', 'pg_address', 'pg_abisrc', 'pg_customAbiField', 'pg_customAbi', 'pg_context', 'pg_filter', 'pg_search', 'pg_functions', 'pg_calls', 'pg_log']) ok(!!d.getElementById(id), 'id: ' + id);
  eq([...d.querySelectorAll('#sec-playground [data-onclick], #sec-playground [data-onchange]')].map((b) => (b.getAttribute('data-onclick') || b.getAttribute('data-onchange'))), ['pgSelectDeployment()', 'onAbiSrcChange()', 'loadPlayground()', 'subscribeEvents()', "filterFns('all',this)", "filterFns('read',this)", "filterFns('write',this)", "filterFns('event',this)"], 'every handler is kept, in order');
  eq([[...d.getElementById('pg_abisrc').options].map((o) => o.value), d.getElementById('pg_customAbiField').style.display, d.getElementById('pg_context').style.display, d.getElementById('pg_calls').style.display, d.querySelector('#pg_filter .pill.active').dataset.filter, d.querySelector('#pg_log .msg').textContent], [['last', 'custom', 'history'], 'none', 'none', 'none', 'all', 'Pick a contract above to start interacting with it.'], 'the options, the hidden parts, the filter and the boot line are as before');
  ok(['pg_deployments', 'pg_address', 'pg_abisrc', 'pg_customAbi'].every((id) => !!d.querySelector(`label[for="${id}"]`)), 'every field has a label');
  eq([...d.getElementById('sec-playground').outerHTML.matchAll(/\son[a-z]+="/gi)].length, 0, 'csp: no inline handler');
  eq([d.querySelector('#sec-playground .section-head .n').textContent, d.querySelector('#sec-playground .section-head h2').textContent, d.getElementById('sec-playground').classList.contains('bld')], ['09', 'ABI Playground', true], 'number and heading are unchanged');
  const cs = css.slice(css.indexOf('/* ---- ABI Playground (section 09)'), css.indexOf('/* ---- Gas Estimator (section 11)'));
  const sels = []; cs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (_, __, s) => { sels.push(...s.split(',').map((x) => x.trim())); return ''; });
  const real = sels.filter((s) => !s.startsWith('@'));
  ok(real.length >= 5 && real.every((s) => /^(\.light\s+)?\.bld#sec-playground/.test(s)), 'css: every rule of this tab is scoped to #sec-playground', JSON.stringify(real.filter((s) => !/^(\.light\s+)?\.bld#sec-playground/.test(s))));
  ok(d.getElementById('pgSummary').children.length >= 4 && d.querySelectorAll('#pgProgress li').length === 3 && d.querySelectorAll('#pgNotes li').length === 5, 'overview: rows, three steps and five notes');
  eq(a.ev("CFBuilder.viewKeys().includes('playground')"), true, 'registered with the shared engine');
  ok(d.querySelectorAll('#sec-lab .fn-card').length === 0 && !!d.getElementById('lab_functions'), 'the Test Lab, which shares the function cards, keeps its own container')
}

/* 2. drawing the overview creates and asks nothing */
{
  const a = fresh(); const { d } = a; a.wallet(true, '0x1');
  await a.go('playground'); await a.setv('pg_address', A); await a.setv('pg_abisrc', 'custom'); await a.setv('pg_abisrc', 'last'); await a.go('home'); await a.go('playground');
  for (const k of ['sepolia', 'arc', 'avalanche']) await a.net(k);
  for (let i = 0; i < 6; i++) a.ev('pgRender()');
  eq([Object.keys(a.ev('JSON.stringify(pgProviders)') === '{}' ? {} : { x: 1 }).length, a.fetches, a.alerts, a.w.__req, a.ev('typeof pgReadContract + String(pgReadContract)')], [0, [], [], 0, 'objectnull'], 'opening the tab, typing, changing networks and drawing the overview create no node connection, fetch nothing, alert nothing and never ask the wallet');
}

/* 3. a loaded contract on each of the 16 networks */
{
  const nets = NETS(fresh());
  eq(nets.length, 16, '16 networks');
  for (const [k, label, main, chain, rpc] of nets) {
    const a = fresh(); const { d } = a; await a.net('sepolia');
    await a.load(A, ABI, k, 'history');
    const r = a.rows(), p = a.prog();
    eq([r['Loaded contract'].text, r.Network.text, r.Network.flag.startsWith('Mainnet'), r.ABI.text, r['ABI source'].text, r.Reading.text, r.Reading.flag], [A, `${label} (${chain})`, main, '1 read, 2 write, 1 events', 'The deploy history', 'Through ' + new URL(rpc).host, 'No wallet needed'], `${k}: the loaded contract, its network${main ? ' with the mainnet warning' : ''}, the ABI and how it is read`);
    eq(k === 'sepolia' ? 'App network' in r : r['App network'].text, k === 'sepolia' ? false : 'Ethereum Sepolia', `${k}: the app's own network is shown only when it differs`);
    eq([p['Contract loaded'].state, p['Ready to send'].state, p.Calls.state, d.getElementById('pgEmpty').hidden], ['done', 'todo', 'todo', true], `${k}: the steps`);
    eq(a.pageErrors.length, 0, `${k}: no page errors`);
  }
}

/* 4. where the ABI came from, and when "the last compiled ABI" is proven to be this contract's */
{
  const a = fresh(); const { d } = a; await a.net('sepolia');
  await a.load(A, ABI, null, 'custom');
  eq([a.rows().ABI.flag, a.rows()['ABI source'].text, a.rows()['ABI source'].state], ['Pasted by you', 'An ABI you pasted', 'ok'], 'a pasted ABI is called that');
  // the last compiled ABI
  a.ev("renderSimpleForm('erc20'); genSimple('erc20')");
  a.ev(`window.__lastCompiledBytecode = '0x6080${'60'.repeat(40)}'; window.__lastCompiledABI = ${JSON.stringify(ABI)}`);
  a.ev(`document.getElementById('pg_abisrc').value = 'last'; document.getElementById('pg_address').value = '${A}'; loadPlayground()`); await a.settle();
  eq([a.rows()['ABI source'].text, a.rows()['ABI source'].state, a.rows().ABI.flag], ['The last compiled ABI', 'missing', 'From the last compile: this page cannot tell it belongs to this address'], '"last compiled ABI" is not tied to the address: the page says it cannot tell');
  await a.go('deploy');
  a.ev(`uiResetDeployResults(); uiAddDeployResult({ name: pendingSource.name, network: 'sepolia', address: '${B}', txHash: '0x${'1'.repeat(64)}', bytecodeKeccak256: ethers.utils.keccak256(window.__lastCompiledBytecode) })`); await a.settle();
  await a.go('playground');
  eq(a.rows().ABI.flag, 'From the last compile: this page cannot tell it belongs to this address', 'a deployment at ANOTHER address does not prove it');
  a.ev(`document.getElementById('pg_address').value = '${B}'; loadPlayground()`); await a.settle();
  eq([a.rows().ABI.flag, a.rows()['ABI source'].state], ['The ABI of the deployment this page made at this address', 'ok'], 'a deployment from this page, at this address, with this bytecode: proven');
  a.ev("renderPlaygroundFunctions(playgroundABI)"); await a.settle();
  eq(a.rows().ABI.flag, 'The ABI of the deployment this page made at this address', 'still proven while the loaded ABI is that compile\'s');
  a.ev("window.__lastCompiledBytecode = '0x6080" + '61'.repeat(40) + "'"); await a.go('home'); await a.go('playground');
  eq(a.rows().ABI.flag, 'From the last compile: this page cannot tell it belongs to this address', 'a different compile since: no longer proven');
  // history source: the record, by index and by address
  const recs = [{ name: 'One', address: A, network: 'base', abi: ABI, txHash: '0x1', timestamp: Date.now() }, { name: 'Two', address: B, network: 'arc', abi: ABI, txHash: '0x2', timestamp: Date.now() }];
  a.w.localStorage.setItem('contractforge_deploy_history', JSON.stringify(recs)); a.ev('renderHistory()'); await a.settle();
  a.ev('loadHistoryIntoPlayground(1)'); await a.settle();
  eq([d.getElementById('pg_address').value, a.rows()['ABI source'].text, a.rows().Network.text.startsWith('Arc Testnet'), a.rows().ABI.flag], [B, 'The deploy history', true, 'Stored with the deployment record'], 'a history record opens by its index, with its own network and ABI');
  a.ev("document.getElementById('pg_deployments').value = '0'; pgSelectDeployment()"); await a.settle();
  eq([d.getElementById('pg_address').value, a.rows().Network.text.startsWith('Base ('), a.rows()['App network'].text], [A, true, 'Ethereum Sepolia'], 'the deployments list opens the right record, on its own network');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 5. the wallet: read-only, connected, on the right chain, on another chain (the chain id is read from the wallet's own property: nothing is requested) */
{
  const a = fresh(); const { d } = a; await a.net('sepolia');
  await a.load(A, ABI, 'base', 'custom');
  const base = a.ev("NETWORKS['base'].chainIdDec"), main = a.ev("NETWORKS['base'].chainIdDec");
  let r = a.rows(), p = a.prog();
  eq([r.Sending.text, r.Sending.state, p['Ready to send'].state, p['Ready to send'].text], ['Read-only', 'missing', 'todo', 'Reading works now. Sending needs a connected wallet on Base.'], 'no wallet: read-only, and reading still works');
  a.wallet(true, undefined); a.ev('pgRender()');
  eq([a.rows().Sending.text, a.rows().Sending.flag], ['Wallet connected', 'The wallet\'s chain is not visible to this page'], 'a wallet that does not say its chain');
  a.wallet(true, '0x' + base.toString(16)); a.ev('pgRender()');
  eq([a.rows().Sending.text, a.rows().Sending.state, a.rows().Sending.flag, a.prog()['Ready to send'].state], ['Wallet is on Base', 'ok', 'Real funds: each transaction is checked first and you confirm it', 'done'], 'a wallet on the contract\'s chain: ready, with the mainnet wording (Base is a mainnet)');
  a.wallet(true, '0x1'); a.ev('pgRender()');
  eq([a.rows().Sending.text, a.rows().Sending.state, a.rows().Sending.flag, a.prog()['Ready to send'].state, a.prog()['Ready to send'].text], ['Wallet is on another chain', 'bad', 'Chain 1, not 8453: switch the wallet to Base (the line above has the button)', 'attention', 'The wallet is on chain 1. Switch it to Base to send.'], 'a wallet on another chain');
  eq(a.w.__req, 0, 'and the wallet was never asked for anything');
  await a.load(A, ABI, 'sepolia', 'custom'); a.wallet(true, '0x' + a.ev("NETWORKS['sepolia'].chainIdDec").toString(16)); a.ev('pgRender()');
  eq(a.rows().Sending.flag, 'Each transaction is checked first with a dry run', 'a testnet: no mainnet wording');
  for (const [k, , isMain, chain] of NETS(a)) { await a.load(A, ABI, k, 'custom'); a.wallet(true, '0x' + chain.toString(16)); a.ev('pgRender()'); eq(a.rows().Sending.flag, isMain ? 'Real funds: each transaction is checked first and you confirm it' : 'Each transaction is checked first with a dry run', `${k}: ${isMain ? 'real funds, you confirm' : 'dry run'}`); }
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 6. a watch or a subscription started for an earlier contract keeps running: the overview says so */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); a.wallet(false);
  await a.load(A, ABI, 'sepolia', 'custom'); await a.go('playground');
  const stub = (addr) => a.ev(`pgReadContract = { address: '${addr}', provider: {}, on() {}, off() {}, 'total()': async () => ethers.BigNumber.from(5) }`);
  stub(A);
  eq(a.rows()['Live updates'], { text: 'None', flag: '', state: 'ok' }, 'before anything is started: none');
  d.querySelector('#sec-playground [data-onclick="subscribeEvents()"]').click(); await a.settle();
  eq([a.rows()['Live updates'].text, a.rows()['Live updates'].state, a.ev('eventSubscriptions.length')], ['Subscribed to 1 event', 'ok', 1], 'a subscription for the loaded contract');
  a.ev('renderPlaygroundFunctions(playgroundABI)'); await a.settle();
  d.querySelector('[data-onclick="watchRead(1)"]').click(); await a.settle();
  const live = a.rows()['Live updates'];
  eq(live.map((x) => x.text), ['Watching total() every 5 seconds', 'Subscribed to 1 event'], 'a watch and a subscription, both listed');
  eq(live[0].flag, 'Starting another watch stops this one', 'and what starting another does');
  await a.load(B, ABI, 'sepolia', 'custom'); stub(B);
  const live2 = a.rows()['Live updates'];
  eq(live2.map((x) => x.state), ['bad', 'bad'], 'another contract is loaded: both are reported as still running for the earlier one');
  ok(/^Started for 0x[0-9a-f]{6}….{4} and still running: start another watch to replace it$/.test(live2[0].flag) && /press Subscribe to Events again to move it here$/.test(live2[1].flag), 'with what to do', JSON.stringify(live2));
  d.querySelector('#sec-playground [data-onclick="subscribeEvents()"]').click(); await a.settle();
  eq(a.rows()['Live updates'].map((x) => [x.text, x.state]), [['Watching total() every 5 seconds', 'bad'], ['Subscribed to 1 event', 'ok']], 'subscribing again moves the subscription to the new contract; the watch still points at the old one');
  a.ev('clearInterval(pgPoll); pgPoll = null'); await a.go('home'); await a.go('playground');
  eq(a.rows()['Live updates'], { text: 'Subscribed to 1 event', flag: '', state: 'ok' }, 'a watch that is no longer running is no longer listed');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 7. the session's calls, a click that loads nothing, hostile text, navigation */
{
  const a = fresh(); const { d } = a; await a.net('sepolia');
  a.ev('loadPlayground()'); eq([a.alerts, a.rows()['Loaded contract'].text], [['Enter the deployed contract address.'], 'None yet'], 'loading with no address: the page\'s own alert, and nothing loaded');
  await a.load(A, ABI, 'sepolia', 'custom'); a.wallet(true, '0x' + a.ev("NETWORKS['sepolia'].chainIdDec").toString(16));
  a.ev("pgRecordCall({ fn: 'total', write: false, ok: true, args: '', result: '5', time: '10:00:00' }); pgRecordCall({ fn: 'set', write: true, ok: false, args: '1', result: 'reverted', time: '10:00:01' })"); await a.settle();
  eq([a.rows()['Calls this session'].text, a.prog().Calls.state, a.prog().Calls.text], ['2 (1 reads, 1 transactions, 1 failed)', 'done', '2 this session, 1 failed. Only this session\'s calls are listed.'], 'the session\'s calls are counted from the page\'s own list');
  a.ev("pgCalls.length = 0; pgRecordCall({ fn: 'set', write: true, ok: false, args: '1', result: 'x', time: 't' })"); await a.settle();
  eq(a.prog().Calls.state, 'attention', 'only failed calls: needs attention');
  const EVIL = '<img src=x onerror=window.__xss=1>';
  a.w.localStorage.setItem('contractforge_deploy_history', JSON.stringify([{ name: EVIL, address: A, network: EVIL, abi: [{ type: 'function', name: EVIL, inputs: [], outputs: [], stateMutability: 'view' }], txHash: '0x1', timestamp: Date.now() }]));
  a.ev('renderHistory()'); await a.settle(); a.ev('loadHistoryIntoPlayground(0)'); await a.settle();
  eq([a.w.__xss, d.querySelectorAll('#sec-playground img').length, a.rows().Network.text.startsWith('Ethereum Sepolia')], [undefined, 0, true], 'a hostile name, network and function name become no markup; an unknown network falls back to the app\'s');
  ok(![...d.querySelectorAll('#pgSummary *, #pgProgress *, #pgNotes *')].some((el) => [...el.attributes].some((at) => /__xss|onerror/.test(at.value) && at.name !== 'id')), 'no attribute of the overview carries the payload');
  const shot = () => JSON.stringify([a.rows(), a.prog()]);
  const s0 = shot();
  for (const s of ['home', 'wizard', 'swap', 'playground', 'deploy', 'playground', 'gas', 'playground', 'lab', 'playground']) await a.go(s);
  eq(shot(), s0, 'after ten navigations the overview is the same');
  eq([d.querySelectorAll('#pgProgress li').length, d.querySelectorAll('#pgNotes li').length, a.fetches], [3, 5, []], 'no duplicated rows and nothing fetched');
  
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
