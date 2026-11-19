// Phase 13.2.2.1: security hardening of the tool-execution module. Verifies the feature gate has no browser override,
// workflow-state aggregation is correct, actions are validated, snapshots protect against stale/missing source, compiler
// diagnostics are preserved (real solc), and AI audit/test artifacts are validated and preserved. Real solc runs for
// compilation; AI responses are deterministic mocks.
import { loadApp } from './harness.mjs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const solc = require('solc');
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m + (d === undefined ? '' : ' ' + JSON.stringify(d))); } };
const eq = (a, b, m) => ok(a === b, m + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')');

const VALID = '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\ncontract C { uint256 public x; function set(uint256 y) external { x = y; } }';
const BROKEN = 'pragma solidity ^0.8.24;\ncontract Bad {\n  uint256 public x = "hello";\n  function f( {\n}';

function solcOut(name, code) {
  const input = { language: 'Solidity', sources: { [name + '.sol']: { content: code } }, settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.bytecode.linkReferences'] } }, optimizer: { enabled: true, runs: 200 } } };
  return JSON.parse(solc.compile(JSON.stringify(input)));
}
const validOut = solcOut('C', VALID);
const brokenOut = solcOut('Bad', BROKEN);
const brokenErrorCount = (brokenOut.errors || []).filter((e) => e.severity === 'error').length;
ok(validOut.contracts && validOut.contracts['C.sol'] && validOut.contracts['C.sol'].C, 'the valid fixture actually compiles under solc');
ok(brokenErrorCount >= 1, 'the broken fixture actually fails under solc');

const app = loadApp();
const { ev } = app;

ev(`ensureSolcLoaded = async () => {}; solcCompile = async (inp) => { const src = JSON.parse(inp).sources; const n = Object.keys(src)[0]; const content = src[n].content; if (content === ${JSON.stringify(VALID)}) return ${JSON.stringify(JSON.stringify(validOut))}; return ${JSON.stringify(JSON.stringify(brokenOut))}; };`);
const AUDIT = JSON.stringify({ score: 70, summary: 'ok', findings: [{ severity: 'high', title: 'T1', description: 'D1' }, { severity: 'critical', title: 'C1', description: 'D2', recommendation: 'R', lineHint: 'x = 1;' }] });
ev(`aiFetch = async (action, payload) => { if (action === 'tests') return { text: '// SPDX-License-Identifier: MIT\\ncontract CTest {}' }; if (action === 'audit') return { text: ${JSON.stringify(AUDIT)} }; throw new Error('unexpected ' + action); };`);

const snap = (code) => ({ name: 'C', code });

(async () => {
  /* P0-1: no browser/mutable override — the gate is a constant, and there is no window.__agentExecEnabled. */
  eq(await ev('agentExec.flagEnabled'), false, 'the flag is false by default');
  eq(await ev("typeof window.__agentExecEnabled"), 'undefined', 'there is no window.__agentExecEnabled override');
  eq((await ev(`agentExec.run(['compile_contract'], ${JSON.stringify(snap(VALID))})`)).status, 'disabled', 'the agent workflow is disabled (no override can enable it)');

  /* P0-4: centralized validation / allowlist */
  eq(await ev(`agentExec.validateAction('compile_contract').ok`), true, 'a known action validates');
  eq(await ev(`agentExec.validateAction('deploy_contract').ok`), false, 'an unknown action is rejected');
  eq(await ev(`agentExec.validateAction('execute_shell').ok`), false, 'a shell action is rejected');
  eq(await ev(`agentExec.validateAction('sign_transaction').ok`), false, 'a signing action is rejected');
  eq(await ev(`agentExec.validateAction('compile_contract', { x: '${'a'.repeat(5000)}' }).ok`), false, 'oversized params are rejected');

  /* P0-5: snapshot integrity — missing editor is a mismatch, never a match */
  ev(`pendingSource = { name: '', code: '' };`);
  const sn = await ev(`agentExec.snapshot(${JSON.stringify(snap(VALID))})`);
  ok(sn.executionId && sn.sourceHash && sn.contractVersion === sn.sourceHash.slice(0, 40), 'the snapshot binds an execution id, source hash and version');
  eq(await ev(`agentExec.editorMismatch(${JSON.stringify(sn)})`), true, 'a missing editor is a mismatch');
  ev(`pendingSource = { name: 'C', code: ${JSON.stringify(VALID)} };`);
  eq(await ev(`agentExec.editorMismatch(${JSON.stringify(sn)})`), false, 'a matching editor is not a mismatch');
  ev(`pendingSource = { name: 'C', code: 'contract Different {}' };`);
  eq(await ev(`agentExec.editorMismatch(${JSON.stringify(sn)})`), true, 'a changed editor is a mismatch');

  /* real compilation: valid + broken, with actual diagnostics preserved */
  ev(`pendingSource = { name: 'C', code: ${JSON.stringify(VALID)} };`);
  const r1 = await ev(`agentExec.compile(${JSON.stringify(snap(VALID))})`);
  eq(r1.status, 'completed', 'a valid contract compiles through the real compiler');
  ok(r1.bytecodeAvailable === true && r1.abiAvailable === true, 'the result carries real ABI + bytecode availability');
  eq(r1.stale, false, 'a compile on the current source is not stale');
  eq(r1.errorCount, 0, 'a successful compile has zero errors');

  const r2 = await ev(`agentExec.compile(${JSON.stringify(snap(BROKEN))})`);
  eq(r2.status, 'failed', 'a broken contract fails compilation');
  eq(r2.errorCount, brokenErrorCount, 'the actual error count is preserved (not hardcoded 1)');
  ok(r2.diagnostics.length >= brokenErrorCount, 'the actual diagnostics are preserved');

  /* stale flag: the editor diverged from the compiled snapshot */
  ev(`pendingSource = { name: 'C', code: 'contract Other {}' };`);
  const r3 = await ev(`agentExec.compile(${JSON.stringify(snap(VALID))})`);
  eq(r3.stale, true, 'a compile result is marked stale when the editor diverged');
  ev(`pendingSource = { name: 'C', code: ${JSON.stringify(VALID)} };`);

  /* P1-7: generated test artifact is preserved and bound */
  const g = await ev(`agentExec.generateTests(${JSON.stringify(snap(VALID))})`);
  eq(g.status, 'completed', 'test generation completes');
  ok(g.generated === true && typeof g.artifact === 'string' && g.artifact.includes('contract CTest'), 'the generated artifact is preserved');
  ok(g.artifactHash && g.framework === 'foundry', 'the artifact hash and framework are preserved');

  /* P1-8: audit findings are validated and preserved */
  const a = await ev(`agentExec.audit(${JSON.stringify(snap(VALID))})`);
  eq(a.status, 'completed', 'a valid audit completes');
  eq(a.auditor, 'ai', 'the auditor is AI-assisted (not a formal/Slither audit)');
  eq(a.criticalCount, 1, 'a critical finding is counted');
  ok(Array.isArray(a.findings) && a.findings.length === 2, 'the validated findings are preserved');

  ev(`aiFetch = async () => ({ text: 'not json' });`);
  eq((await ev(`agentExec.audit(${JSON.stringify(snap(VALID))})`)).status, 'failed', 'a malformed audit response is rejected');
  ev(`aiFetch = async () => ({ text: '{"score":70,"findings":[{"severity":"evil","title":"T","description":"D"}]}' });`);
  eq((await ev(`agentExec.audit(${JSON.stringify(snap(VALID))})`)).status, 'failed', 'an invalid severity is rejected');
  ev(`aiFetch = async () => ({ text: '{"score":999,"findings":[]}' });`);
  eq((await ev(`agentExec.audit(${JSON.stringify(snap(VALID))})`)).status, 'failed', 'an out-of-range score is rejected');
  ev(`aiFetch = async (action) => { if (action === 'tests') return { text: 'contract CTest {}' }; if (action === 'audit') return { text: ${JSON.stringify(AUDIT)} }; throw new Error('x'); };`);

  /* test execution is genuinely unavailable */
  eq((await ev(`agentExec.runTests(${JSON.stringify(snap(VALID))})`)).status, 'unavailable', 'test execution reports unavailable');

  /* P0-3: deterministic workflow-state aggregation */
  const agg = (rs) => ev(`agentExec.aggregateStatus(${JSON.stringify(rs)})`);
  eq((await agg([{ status: 'completed' }, { status: 'completed' }])).status, 'completed', 'all success -> completed');
  eq((await agg([{ status: 'completed' }, { status: 'unavailable' }])).status, 'unavailable', 'a required unavailable tool -> unavailable');
  eq((await agg([{ status: 'failed' }])).status, 'failed', 'only failure -> failed');
  eq((await agg([{ status: 'completed' }, { status: 'failed' }])).status, 'partial', 'partial success -> partial');
  eq((await agg([{ status: 'rejected' }])).status, 'blocked', 'a rejected action -> blocked');
  eq((await agg([{ status: 'blocked' }])).status, 'blocked', 'a blocked action -> blocked');
  eq((await agg([])).status, 'failed', 'no actions -> failed');
  eq((await agg([{ status: 'completed' }])).ok, true, 'ok is true only on full success');
  eq((await agg([{ status: 'failed' }])).ok, false, 'ok is false on failure');

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
