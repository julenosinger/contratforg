// Phase 11.1.1 — deploy integrity: unified contract resolution across deployment modes, constructor ABI
// synchronization, library-linking / bytecode validation, and operation-scoped async guards. Uses the real solc 0.8.24
// for the critical integration cases (selection, library linking, bytecode); the app's own functions are exercised
// through the harness exactly as the earlier suites do.
import { createRequire } from 'node:module';
import { loadApp } from './harness.mjs';

const require = createRequire(import.meta.url);
const solc = require('solc');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m + (d ? '  [' + d + ']' : '')); } };

const { ev, w } = loadApp();

/* Compile real Solidity and return the compiler's per-contract artifacts (abi + bytecode.object + linkReferences). */
function compileContracts(src, name = 'X') {
  const input = {
    language: 'Solidity',
    sources: { [`${name}.sol`]: { content: src } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.bytecode.linkReferences'] } } },
  };
  const out = JSON.parse(solc.compile(JSON.stringify(input)));
  const fatal = (out.errors || []).filter((e) => e.severity === 'error');
  if (fatal.length) throw new Error('compile failed: ' + fatal.map((e) => e.formattedMessage.split('\n')[0]).join('; '));
  return out.contracts[`${name}.sol`] || {};
}

/* Run resolveContract (in the app) against real compiler artifacts. */
function resolve(src, requested) {
  const contracts = compileContracts(src);
  return ev(`(() => {
    try { return { ok: resolveContract(${JSON.stringify(contracts)}, ${requested === undefined ? 'undefined' : JSON.stringify(requested)}) }; }
    catch (e) { return { err: String(e.message), ambiguous: !!e.ambiguous, deployable: e.deployable || [], libraries: e.libraries || [] }; }
  })()`);
}

/* ---- 1. Contract selection (real compiler output) ---- */
{
  const r = resolve('contract A {} contract B {}', 'A');
  ok(r.ok === 'A', 'selection: exact match wins', JSON.stringify(r));
}
{
  const r = resolve('contract A {} contract B {}', 'C');
  ok(/not found/.test(r.err || ''), 'selection: a requested-but-missing target is refused', JSON.stringify(r));
}
{
  const r = resolve('contract A {}');
  ok(r.ok === 'A', 'selection: a single deployable contract is auto-selected', JSON.stringify(r));
}
{
  const r = resolve('contract A {} contract B {}');
  ok(r.ambiguous && r.deployable.length === 2 && /A, B/.test(r.err || ''), 'selection: multiple deployable contracts require a pick', JSON.stringify(r));
}
{
  // Factory vs Pair: the factory is the explicit target and must never be swapped for the pair.
  const r = resolve('contract Pair {} contract Factory {}', 'Factory');
  ok(r.ok === 'Factory', 'selection: the Factory is kept over the Pair', JSON.stringify(r));
}
{
  const r = resolve('abstract contract A {} contract B {}');
  ok(r.ok === 'B', 'selection: an abstract contract does not mask the one concrete contract', JSON.stringify(r));
}
{
  const r = resolve('interface I {}');
  ok(/No deployable/.test(r.err || ''), 'selection: an interface-only source has no deployable contract', JSON.stringify(r));
}

/* ---- 2. Library linking + bytecode validation (real compiler output) ---- */
{
  // A contract that calls an unlinked library must not be deployable.
  const r = resolve('library Lib { function f() external pure returns (uint) { return 1; } } contract C { function g() external pure returns (uint) { return Lib.f(); } }', 'C');
  ok(/needs these libraries linked/.test(r.err || '') && r.libraries.includes('Lib'), 'library: an unlinked library reference is refused with the library name', JSON.stringify(r));
}
{
  // unresolvedLibraries reads the link-reference name directly, independent of selection.
  const contracts = compileContracts('library Lib { function f() external pure returns (uint) { return 1; } } contract C { function g() external pure returns (uint) { return Lib.f(); } }');
  const libs = ev(`unresolvedLibraries(${JSON.stringify(contracts.C)})`);
  ok(Array.isArray(libs) && libs.includes('Lib'), 'library: unresolvedLibraries reads the link reference name', JSON.stringify(libs));
}
{
  // The realistic flow: compileSource blocks a contract whose bytecode still needs linking.
  const src = 'library Lib { function f() external pure returns (uint) { return 1; } } contract C { function g() external pure returns (uint) { return Lib.f(); } }';
  const out = JSON.parse(solc.compile(JSON.stringify({ language: 'Solidity', sources: { 'C.sol': { content: src } }, settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.bytecode.linkReferences'] } } } })));
  ev('ensureSolcLoaded = async () => {}; solcCompile = async () => ' + JSON.stringify(JSON.stringify(out)) + ';');
  ev('pendingSource = { name: "C", code: ' + JSON.stringify(src) + ', template: "ai", aiTargets: ["C"] };');
  let cerr = '';
  try { await ev('compileSource("C", ' + JSON.stringify(src) + ')'); } catch (e) { cerr = String(e.message || e); }
  ok(/needs these libraries linked/.test(cerr), 'library: compileSource blocks a contract that needs linking', cerr);
}
{
  // Valid creation bytecode is pure hex.
  const c = compileContracts('contract A {}');
  ok(/^[0-9a-fA-F]*$/.test(c.A.evm.bytecode.object) && c.A.evm.bytecode.object.length > 0, 'bytecode: a valid creation bytecode is non-empty pure hex');
}
{
  // An interface has no creation bytecode.
  const c = compileContracts('interface I { function f() external; }');
  ok(!c.I.evm.bytecode.object || c.I.evm.bytecode.object === '' || c.I.evm.bytecode.object === '0x', 'bytecode: an interface has empty creation bytecode');
}
{
  // compileSource rejects a malformed (non-hex, unlinked-placeholder) bytecode object.
  ev("ensureSolcLoaded = async () => {}; solcCompile = async () => JSON.stringify({ contracts: { 'Bad.sol': { Bad: { abi: [], evm: { bytecode: { object: '__$deadbeef__', linkReferences: {} } } } } } });");
  ev("pendingSource = { name: 'Bad', code: 'contract Bad {}', template: 'ai', aiTargets: ['Bad'] };");
  let err = '';
  try { await ev("compileSource('Bad', 'contract Bad {}')"); } catch (e) { err = String(e.message || e); }
  ok(/malformed|unlinked/.test(err), 'bytecode: a non-hex creation bytecode is refused by compileSource', err);
}
{
  // ABI and bytecode must come from the same resolved target.
  ev("ensureSolcLoaded = async () => {}; solcCompile = async () => JSON.stringify({ contracts: { 'A.sol': { A: { abi: [{ type: 'function', name: 'fa' }], evm: { bytecode: { object: '6080', linkReferences: {} } } }, B: { abi: [{ type: 'function', name: 'fb' }], evm: { bytecode: { object: '6081', linkReferences: {} } } } } } });");
  const compiled = await ev("compileSource('A', 'contract A {} contract B {}', 'B')");
  ok(compiled && compiled.target === 'B' && compiled.bytecode === '0x6081' && compiled.abi[0].name === 'fb', 'artifact: the selected ABI and bytecode belong to the same target', JSON.stringify(compiled && { t: compiled.target, b: compiled.bytecode }));
}

/* ---- 3. Constructor ABI synchronization ---- */
{
  ev('renderCtorArgs = () => {};');
  ev("pendingSource = { name: 'A', code: '', resolvedTarget: 'A' }; pendingCtorArgs = [];");
  ev("syncCtorArgsFromAbi([{ name: 'owner', type: 'address' }, { name: 'supply', type: 'uint256' }]);");
  const args = ev('JSON.stringify(pendingCtorArgs)');
  ok(/owner/.test(args) && /supply/.test(args) && /uint256/.test(args), 'ctor: the form is rebuilt from the compiled ABI', args);
}
{
  // A second, different target clears stale values and re-labels types from the ABI.
  ev("syncCtorArgsFromAbi([{ name: 'owner', type: 'address' }, { name: 'fee', type: 'uint256' }]);");
  const args = ev('JSON.stringify(pendingCtorArgs)');
  ok(/fee/.test(args) && !/supply/.test(args), 'ctor: a changed target clears the stale parameter', args);
}
{
  // Zero-argument constructor clears the form.
  ev("pendingCtorArgs = [{ param: 'owner', type: 'address', value: '0x' + '1'.repeat(40), userSet: true, genNetwork: 'arc', hint: 'static' }];");
  ev('syncCtorArgsFromAbi([]);');
  ok(ev('pendingCtorArgs.length') === 0, 'ctor: a zero-argument constructor clears the form');
}
{
  // A no-op when the form already matches, so builder defaults (hint/value) are never clobbered.
  ev("pendingCtorArgs = [{ param: 'token_', type: 'address', hint: 'usdc', value: '', userSet: false, genNetwork: 'arc' }];");
  ev("syncCtorArgsFromAbi([{ name: 'token_', type: 'address' }]);");
  ok(ev("pendingCtorArgs[0].hint") === 'usdc', 'ctor: matching parameters keep their builder defaults', ev('pendingCtorArgs[0].hint'));
}
{
  // Missing required constructor values still block (count mismatch).
  ev('renderCtorArgs = () => {};');
  ev("pendingCtorArgs = [{ param: 'owner', type: 'address', hint: 'static', value: '', userSet: false, genNetwork: 'arc' }];");
  let threw = '';
  try { ev("collectCtorValues([{ name: 'owner', type: 'address' }, { name: 'supply', type: 'uint256' }])"); } catch (e) { threw = String(e.message || e); }
  ok(/needs 2 constructor argument/.test(threw), 'ctor: a mismatched argument count blocks deployment', threw);
}

/* ---- 4. Operation-scoped async guards ---- */
{
  ev("pendingSource = { name: 'A', code: 'contract A {}' }; account = '0xabc'; multichainMode = 'single'; activeNetwork = 'arc';");
  const op = ev('deployOpSnapshot()');
  // no change → ok
  let r = ev(`(() => { try { assertOpUnchanged(${JSON.stringify(op)}); return 'ok'; } catch (e) { return e.message; } })()`);
  ok(r === 'ok', 'async: an unchanged operation passes', r);
  // source change → abort
  ev("pendingSource = { name: 'A', code: 'contract A { uint x; }' };");
  r = ev(`(() => { try { assertOpUnchanged(${JSON.stringify(op)}); return 'ok'; } catch (e) { return e.message; } })()`);
  ok(/source changed/.test(r), 'async: a source change aborts before signing', r);
  // restore, then network change → abort (single deploy)
  ev("pendingSource = { name: 'A', code: 'contract A {}' }; activeNetwork = 'base';");
  r = ev(`(() => { try { assertOpUnchanged(${JSON.stringify(op)}); return 'ok'; } catch (e) { return e.message; } })()`);
  ok(/network changed/.test(r), 'async: a network change aborts a single deploy', r);
  ev('activeNetwork = "arc";');
  // account change → abort
  ev("account = '0xdef';");
  r = ev(`(() => { try { assertOpUnchanged(${JSON.stringify(op)}); return 'ok'; } catch (e) { return e.message; } })()`);
  ok(/account changed/.test(r), 'async: a wallet account change aborts', r);
  ev('account = "0xabc";');
  // mode change → abort
  ev("multichainMode = 'multi';");
  r = ev(`(() => { try { assertOpUnchanged(${JSON.stringify(op)}); return 'ok'; } catch (e) { return e.message; } })()`);
  ok(/mode changed/.test(r), 'async: a deployment-mode change aborts', r);
  // legitimate multi-deploy network transition is allowed
  ev("multichainMode = 'multi'; activeNetwork = 'ethereum';");
  const op2 = ev('deployOpSnapshot()');
  ev('activeNetwork = "sepolia";');
  r = ev(`(() => { try { assertOpUnchanged(${JSON.stringify(op2)}, { allowNetworkChange: true }); return 'ok'; } catch (e) { return e.message; } })()`);
  ok(r === 'ok', 'async: an internal multi-deploy network switch is allowed', r);
}
{
  // Double-click / concurrent deploy: compileAndDeploy refuses to start while one is in flight.
  ev("pendingSource = { name: 'A', code: 'contract A {}', template: 'ai' }; account = '0xabc'; signer = {}; matGate = async () => true; reqBlockReason = () => ''; reqAddressProblem = () => null; uiResetDeployResults = () => {}; logConsole = () => {}; mainnetDeployConfirm = async () => false; compilePendingResolved = async () => ({ abi: [], bytecode: '0x', target: 'A' });");
  ev('deployInFlight = true;');
  let guardHit = false;
  ev("const _origLog = logConsole; logConsole = (k, m) => { if (String(m).indexOf('already in progress') >= 0) guardHit = true; };");
  ev('compileAndDeploy();');
  ok(ev('guardHit') === true, 'async: a concurrent deploy is refused', ev('guardHit'));
  ev('deployInFlight = false;');
}

/* ---- 5. Unified resolution: the selector path returns null on cancel (no deploy) ---- */
{
  const a = loadApp();
  a.ev("uiContractSelect = async () => null;");
  a.ev("compilePending = async () => { const e = new Error('x'); e.ambiguous = true; e.deployable = ['A','B']; throw e; };");
  const r = await a.ev('compilePendingResolved()');
  ok(r === null, 'resolution: cancelling the selector returns null (no deploy)', JSON.stringify(r));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
