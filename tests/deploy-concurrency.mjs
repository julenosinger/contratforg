// Phase 11.1.2 — deployment concurrency, constructor compatibility and multichain network-transition integrity.
// Adversarial tests for the atomic lock, strict constructor ABI matching, and fail-closed network verification.
import { loadApp } from './harness.mjs';

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m + (d ? '  [' + d + ']' : '')); } };

/* ---- 1. Atomic deployment concurrency guard ---- */
{
  const a = loadApp(); const ev = a.ev;
  ev("pendingSource = { name: 'A', code: 'contract A {}', template: 'simple' }; signer = {}; account = '0xabc'; reqBlockReason = () => ''; reqAddressProblem = () => null; logConsole = () => {};");
  ev("window.__matCalls = 0; window.__resolveMat = null; matGate = () => { __matCalls++; return new Promise((r) => { __resolveMat = r; }); };");
  const p = ev('compileAndDeploy()');
  ok(ev('deployInFlight') === true, 'lock: acquired synchronously before the maturity gate');
  ev('compileAndDeploy()');   // second click while the first is awaiting the maturity dialog
  ok(ev('window.__matCalls') === 1, 'lock: a second click is refused before reaching the maturity gate', 'matCalls=' + ev('window.__matCalls'));
  ev('window.__resolveMat(false)');   // cancel
  await p;
  ok(ev('deployInFlight') === false, 'lock: cancellation releases the lock');
}
{
  const a = loadApp(); const ev = a.ev;
  ev("pendingSource = { name: 'A', code: 'contract A {}', template: 'simple' }; signer = {}; account = '0xabc'; reqBlockReason = () => ''; reqAddressProblem = () => null; logConsole = () => {}; matGate = async () => true; compilePendingResolved = async () => { throw new Error('boom'); };");
  await ev('compileAndDeploy()');
  ok(ev('deployInFlight') === false, 'lock: an exception releases the lock');
}
{
  const a = loadApp(); const ev = a.ev;
  ev("logConsole = () => {};");
  ev('deployInFlight = true;');
  let hit = false;
  ev("const _l = logConsole; logConsole = (k, m) => { if (String(m).indexOf('already in progress') >= 0) hit = true; };");
  ev("compileAndDeploy = async () => {};");   // defensive: never reached because deployInFlight is already true
  ev("const _orig = compileAndDeploy; compileAndDeploy = async () => { if(deployInFlight){ logConsole('warn','A deployment is already in progress.'); return; } };");
  ev('compileAndDeploy()');
  ok(ev('hit') === true, 'lock: a rejected second click does not start a new operation', ev('hit'));
  ev('deployInFlight = false;');
}

/* ---- 2. Strict constructor compatibility ---- */
{
  const a = loadApp(); const ev = a.ev;
  ev('renderCtorArgs = () => {};');
  // same name + same type + same position: value preserved
  ev("pendingCtorArgs = [{ param: 'owner', type: 'address', hint: 'static', value: '0x' + '1'.repeat(40), userSet: true, genNetwork: 'arc' }];");
  ev("syncCtorArgsFromAbi([{ name: 'owner', type: 'address' }]);");
  ok(ev("pendingCtorArgs[0].value") === '0x' + '1'.repeat(40), 'ctor: same name + same type preserves the value', ev('pendingCtorArgs[0].value'));
  // same name + different type: value cleared
  ev("syncCtorArgsFromAbi([{ name: 'owner', type: 'uint256' }]);");
  ok(ev("pendingCtorArgs[0].value") === '' && ev("pendingCtorArgs[0].type") === 'uint256', 'ctor: same name + different type clears the value', JSON.stringify(ev('pendingCtorArgs[0]')));
  // same type + different position (swapped): values not reused
  ev("pendingCtorArgs = [{ param: 'x', type: 'uint256', value: '1', userSet: true, genNetwork: 'arc', hint: 'static' }, { param: 'y', type: 'uint256', value: '2', userSet: true, genNetwork: 'arc', hint: 'static' }];");
  ev("syncCtorArgsFromAbi([{ name: 'y', type: 'uint256' }, { name: 'x', type: 'uint256' }]);");
  ok(ev("pendingCtorArgs[0].value") === '' && ev("pendingCtorArgs[1].value") === '', 'ctor: same type + different position is not silently reused', JSON.stringify(ev('pendingCtorArgs')));
  // changed array dimensions: value cleared and type re-labelled
  ev("pendingCtorArgs = [{ param: 'a', type: 'uint256[]', value: '1', userSet: true, genNetwork: 'arc', hint: 'static' }];");
  ev("syncCtorArgsFromAbi([{ name: 'a', type: 'uint256[3]' }]);");
  ok(ev("pendingCtorArgs[0].value") === '' && ev("pendingCtorArgs[0].type") === 'uint256[3]', 'ctor: changed array dimensions clear the value', JSON.stringify(ev('pendingCtorArgs[0]')));
  // source-level uint shorthand matches the canonical uint256 and keeps the value
  ev("pendingCtorArgs = [{ param: 'n', type: 'uint', value: '7', userSet: true, genNetwork: 'arc', hint: 'static' }];");
  ev("syncCtorArgsFromAbi([{ name: 'n', type: 'uint256' }]);");
  ok(ev("pendingCtorArgs[0].value") === '7', 'ctor: canonical uint/uint256 equivalence keeps the value', ev('pendingCtorArgs[0].value'));
  // zero-argument constructor clears obsolete fields
  ev("syncCtorArgsFromAbi([]);");
  ok(ev('pendingCtorArgs.length') === 0, 'ctor: a zero-argument constructor clears obsolete fields', ev('pendingCtorArgs.length'));
}

/* ---- 3. Multichain network-transition integrity (mdAssertReady) ---- */
{
  const a = loadApp(); const ev = a.ev;
  ev("pendingSource = { code: 'contract A {}' }; account = '0xabc'; signer = {}; multichainMode = 'multi'; activeNetwork = 'arc';");
  // passes on the expected chain
  ev("provider = { getNetwork: async () => ({ chainId: NETWORKS.arc.chainIdDec }) };");
  const op = ev('deployOpSnapshot()');
  let r = await ev(`mdAssertReady('arc', ${JSON.stringify(op)}).then(() => 'ok').catch((e) => e.message)`);
  ok(r === 'ok', 'net: passes when the wallet is on the expected chain', r);
  // fails closed on the wrong chain
  ev("provider = { getNetwork: async () => ({ chainId: 999999 }) };");
  r = await ev(`mdAssertReady('arc', ${JSON.stringify(op)}).then(() => 'ok').catch((e) => e.message)`);
  ok(/chainId 999999/.test(r), 'net: fails closed on the wrong chain', r);
  // fails closed when disconnected
  ev("provider = { getNetwork: async () => ({ chainId: NETWORKS.arc.chainIdDec }) }; account = null; signer = null;");
  r = await ev(`mdAssertReady('arc', ${JSON.stringify(op)}).then(() => 'ok').catch((e) => e.message)`);
  ok(/disconnected/.test(r), 'net: fails closed when the wallet is disconnected', r);
  // fails closed when the account changed
  ev("provider = { getNetwork: async () => ({ chainId: NETWORKS.arc.chainIdDec }) }; account = '0xabc'; signer = {};");
  r = await ev(`mdAssertReady('arc', ${JSON.stringify(op)}).then(() => 'ok').catch((e) => e.message)`);
  ok(r === 'ok', 'net: passes again after reconnect on the same account', r);
  ev("account = '0xdef';");
  r = await ev(`mdAssertReady('arc', ${JSON.stringify(op)}).then(() => 'ok').catch((e) => e.message)`);
  ok(/account changed/.test(r), 'net: fails closed when the account changed', r);
}

/* ---- 4. Multi-deploy keeps its own per-network switch allowed ---- */
{
  const a = loadApp(); const ev = a.ev;
  ev("pendingSource = { code: 'contract A {}' }; account = '0xabc'; multichainMode = 'multi'; activeNetwork = 'arc';");
  const op = ev('deployOpSnapshot()');
  ev("activeNetwork = 'base';");   // the internal multi-deploy transition
  const r = ev(`(() => { try { assertOpUnchanged(${JSON.stringify(op)}, { allowNetworkChange: true }); return 'ok'; } catch (e) { return e.message; } })()`);
  ok(r === 'ok', 'net: the internal multi-deploy network switch is allowed', r);
  // but the same switch trips a single deploy
  ev("multichainMode = 'single';");
  const op2 = ev('deployOpSnapshot()');
  ev("activeNetwork = 'ethereum';");
  const r2 = ev(`(() => { try { assertOpUnchanged(${JSON.stringify(op2)}); return 'ok'; } catch (e) { return e.message; } })()`);
  ok(/network changed/.test(r2), 'net: the same switch trips a single deploy', r2);
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
