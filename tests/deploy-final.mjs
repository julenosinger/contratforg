// Phase 11.1.4 — authoritative wallet identity before signing and truthful multichain batch status.
import { loadApp } from './harness.mjs';

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m + (d ? '  [' + d + ']' : '')); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m, 'got ' + JSON.stringify(a) + ' want ' + JSON.stringify(b));

/* ---- 1. currentWalletAccounts: EIP-1193 eth_accounts, listAccounts fallback, graceful null ---- */
{
  const a = loadApp(); const ev = a.ev;
  ev("window.ethereum = { request: async ({ method }) => (method === 'eth_accounts' ? ['0xABC'] : null) };");
  const r = await ev('currentWalletAccounts()');
  ok(r && r.accounts && r.accounts[0] === '0xabc', 'identity: eth_accounts resolves the authorized account (lowercased)', JSON.stringify(r));
  // fallback to provider.listAccounts when window.ethereum is absent
  ev("window.ethereum = undefined; provider = { listAccounts: async () => ['0xDEF'] };");
  const r2 = await ev('currentWalletAccounts()');
  ok(r2 && r2.accounts && r2.accounts[0] === '0xdef', 'identity: listAccounts is the fallback query', JSON.stringify(r2));
  // no query available -> null
  ev("provider = {};");
  const r3 = await ev('currentWalletAccounts()');
  ok(r3 === null, 'identity: no available query resolves to null', JSON.stringify(r3));
}

/* ---- 2. assertWalletIdentity: authoritative account check ---- */
{
  const a = loadApp(); const ev = a.ev;
  ev("pendingSource = { code: 'contract A {}' }; account = '0xabc'; multichainMode = 'single'; activeNetwork = 'arc';");
  const op = ev('deployOpSnapshot()');
  // cached equals actual -> ok
  ev("window.ethereum = { request: async () => ['0xabc'] };");
  let r = await ev(`assertWalletIdentity(${JSON.stringify(op)}, 'Arc Testnet').then(() => 'ok').catch((e) => e.message)`);
  ok(r === 'ok', 'identity: the cached account matches the authorized account', r);
  // cached differs from actual -> fatal (a delayed account-change event)
  ev("window.ethereum = { request: async () => ['0xDEF'] };");
  r = await ev(`assertWalletIdentity(${JSON.stringify(op)}, 'Arc Testnet').then(() => 'ok').catch((e) => ({ m: e.message, fatal: !!e.fatal }))`);
  ok(r.fatal === true && /account changed/.test(r.m), 'identity: a different authorized account is a fatal violation', JSON.stringify(r));
  // empty account list -> disconnect
  ev("window.ethereum = { request: async () => [] };");
  r = await ev(`assertWalletIdentity(${JSON.stringify(op)}, 'Arc Testnet').then(() => 'ok').catch((e) => ({ m: e.message, fatal: !!e.fatal }))`);
  ok(r.fatal === true && /disconnected/.test(r.m), 'identity: an empty account list is a disconnect', JSON.stringify(r));
  // query fails -> graceful fallback (cached check already passed)
  ev("window.ethereum = { request: async () => { throw new Error('denied'); } }; provider = {};");
  r = await ev(`assertWalletIdentity(${JSON.stringify(op)}, 'Arc Testnet').then(() => 'ok').catch((e) => ({ m: e.message, fatal: !!e.fatal }))`);
  ok(r === 'ok', 'identity: an unavailable account query degrades to the cached check', JSON.stringify(r));
}

/* ---- 3. batch outcome classification (mdOutcome) ---- */
{
  const a = loadApp(); const ev = a.ev;
  const cls = (keys, results, aborted) => ev(`mdOutcome(${JSON.stringify(keys)}, ${JSON.stringify(results)}, ${aborted})`);
  eq(cls(['arc'], [['Arc Testnet', '0x1']], false), 'completed', 'outcome: all succeed');
  eq(cls(['arc', 'basesep'], [['Arc Testnet', '0x1'], ['Base Sepolia', 'failed']], false), 'partially_completed', 'outcome: one recoverable failure');
  eq(cls(['arc'], [['Arc Testnet', 'failed']], false), 'failed', 'outcome: all fail');
  eq(cls(['arc'], [['Arc Testnet', '0x1'], ['Arc Testnet bridge', 'failed']], false), 'partially_completed', 'outcome: main succeeds, bridge fails');
  eq(cls(['arc'], [['Arc Testnet', '0x1']], true), 'aborted', 'outcome: a fatal abort overrides success');
}

/* ---- 4. multiDeploy: truthful final status ---- */
{
  const a = loadApp(); const ev = a.ev;
  const setup = (ev, nets, cross) => {
    ev(`pendingSource = { name: 'A', code: 'contract A {}', template: 'simple' }; account = '0xabc'; signer = {}; multichainMode = '${cross ? 'cross' : 'multi'}'; activeNetwork = 'arc';`);
    ev(`mdState.selected = new Set(${JSON.stringify(nets)}); mdState.includeBridge = ${cross}; mdState.running = false;`);
    ev(`
      matGate = async () => true; reqBlockReason = () => ''; reqAddressProblem = () => null;
      compilePendingResolved = async () => ({ name: 'A', target: 'A', abi: [], bytecode: '0x', sourceHash: matHash(pendingSource.code) });
      compileSource = async (bname) => ({ name: bname, target: bname, abi: [{ type: 'constructor', inputs: [{ name: 'tokenMessenger_', type: 'address' }, { name: 'messageTransmitter_', type: 'address' }, { name: 'usdc_', type: 'address' }] }], bytecode: '0x', sourceHash: 'x' });
      switchWalletNetwork = async () => {}; mdWaitForChain = async () => true; mainnetDeployConfirm = async () => false;
      mdRowValues = () => []; renderNetBar = () => {}; updateSideNet = () => {}; renderMultiDeployPanel = () => {}; uiResetDeployResults = () => {}; uiAddDeployResult = () => {}; refreshBalance = async () => {};
      provider = { getNetwork: async () => ({ chainId: NETWORKS[activeNetwork].chainIdDec }) };
      window.ethereum = { request: async () => ['0xabc'] };
      window.__logs = []; logConsole = (k, m) => { window.__logs.push(k + ': ' + m); };
    `);
  };
  // all succeed -> completed, no misleading log
  {
    const a2 = loadApp(); const ev2 = a2.ev;
    setup(ev2, ['arc'], false);
    ev2("deployCompiled = async (c, v, key) => { return { address: '0x' + '1'.repeat(40) }; };");
    const r = await ev2('multiDeploy()');
    eq(r.outcome, 'completed', 'status: all succeed → completed');
    ok(ev2("window.__logs.some((l) => /^ok: Multi-deploy completed/.test(l))"), 'status: the success log is only for a completed batch', ev2('JSON.stringify(window.__logs)'));
  }
  // one recoverable failure -> partially_completed
  {
    const a2 = loadApp(); const ev2 = a2.ev;
    setup(ev2, ['arc', 'basesep'], false);
    ev2("deployCompiled = async (c, v, key) => { if (key === 'arc') throw new Error('tx rejected'); return { address: '0x' + '1'.repeat(40) }; };");
    const r = await ev2('multiDeploy()');
    eq(r.outcome, 'partially_completed', 'status: one recoverable failure → partially_completed');
  }
  // fatal abort -> aborted, no misleading success log, lock released, network restored
  {
    const a2 = loadApp(); const ev2 = a2.ev;
    setup(ev2, ['arc', 'basesep'], false);
    ev2("window.__sw = 0; switchWalletNetwork = async () => { if (++window.__sw === 2) account = '0xdef'; }; deployCompiled = async (c, v, key) => { return { address: '0x' + '1'.repeat(40) }; };");
    const r = await ev2('multiDeploy()');
    eq(r.outcome, 'aborted', 'status: a fatal identity violation → aborted');
    ok(r.results.some((x) => x[0] === 'Arc Testnet' && /^0x/.test(x[1])), 'status: the confirmed result is preserved after abort', JSON.stringify(r.results));
    ok(!ev2("window.__logs.some((l) => /^ok: Multi-deploy/.test(l))"), 'status: no success-level completion log after an abort', ev2('JSON.stringify(window.__logs)'));
    ok(ev2('deployInFlight') === false, 'status: the lock is released after an abort', ev2('deployInFlight'));
    ok(ev2('activeNetwork') === 'arc', 'status: the network is restored after an abort', ev2('activeNetwork'));
  }
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
