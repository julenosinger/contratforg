// Phase 13.2.2: real development-tool execution. The compiler runs through the actual solc (npm) to prove real
// compilation; the AI test/audit adapters use deterministic mocks; test execution is genuinely unavailable (no browser
// runner). The feature flag is off by default and enabled via the documented test hook.
import { loadApp } from './harness.mjs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const solc = require('solc');
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m + (d === undefined ? '' : ' ' + JSON.stringify(d))); } };
const eq = (a, b, m) => ok(a === b, m + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')');

const VALID = '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\ncontract C { uint256 public x; function set(uint256 y) external { x = y; } }';
const BROKEN = 'pragma solidity ^0.8.24; contract { this is not valid';

function solcOut(name, code) {
  const input = { language: 'Solidity', sources: { [name + '.sol']: { content: code } }, settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.bytecode.linkReferences'] } }, optimizer: { enabled: true, runs: 200 } } };
  return JSON.parse(solc.compile(JSON.stringify(input)));
}
const validOut = solcOut('C', VALID);
const brokenOut = solcOut('Bad', BROKEN);
ok(validOut.contracts && validOut.contracts['C.sol'] && validOut.contracts['C.sol'].C, 'the valid fixture actually compiles under solc');
ok(Array.isArray(brokenOut.errors) && brokenOut.errors.some((e) => e.severity === 'error'), 'the broken fixture actually fails under solc');

const app = loadApp();
const { ev } = app;

/* wire the real solc output into the app compiler */
ev(`ensureSolcLoaded = async () => {}; solcCompile = async (inp) => { const src = JSON.parse(inp).sources; const n = Object.keys(src)[0]; const content = src[n].content; if (content === ${JSON.stringify(VALID)}) return ${JSON.stringify(JSON.stringify(validOut))}; return ${JSON.stringify(JSON.stringify(brokenOut))}; };`);
ev(`aiFetch = async (action, payload) => { if (action === 'tests') return { text: '// SPDX-License-Identifier: MIT\\ncontract CTest {}' }; if (action === 'audit') return { text: ${JSON.stringify(JSON.stringify({ score: 70, summary: 'ok', findings: [{ severity: 'high', title: 'T', description: 'D' }, { severity: 'critical', title: 'C', description: 'D' }] }))} }; throw new Error('unexpected ' + action); };`);
ev(`window.agentExec && (window.agentExec.flagEnabled === false) ? (window.__agentExecEnabled = true) : 0;`);

const snap = (code) => ({ name: 'C', code });

(async () => {
  /* real compilation: valid + broken */
  const r1 = await ev(`agentExec.compile(${JSON.stringify(snap(VALID))})`);
  eq(r1.status, 'completed', 'a valid contract compiles through the real compiler');
  ok(r1.bytecodeAvailable === true && r1.abiAvailable === true, 'the result carries real ABI + bytecode availability');
  ok(r1.sourceHash && r1.sourceHash.length >= 8 && r1.contractVersion === r1.sourceHash.slice(0, 40), 'the result binds the source hash and version');
  ok(r1.stale === false, 'a compile on the current source is not stale');

  const r2 = await ev(`agentExec.compile(${JSON.stringify(snap(BROKEN))})`);
  eq(r2.status, 'failed', 'a broken contract fails compilation');
  ok(r2.errorCount > 0 && typeof r2.error === 'string', 'the failure carries a diagnostic');

  /* stale source: the editor changed after the snapshot */
  ev(`pendingSource = { name: 'C', code: 'contract Different {}' };`);
  const r3 = await ev(`agentExec.compile(${JSON.stringify(snap(VALID))})`);
  eq(r3.stale, true, 'a compile result is marked stale when the editor source changed');
  ev(`pendingSource = { name: '', code: '' };`);

  /* test generation (real AI call path, mocked response) */
  const g = await ev(`agentExec.generateTests(${JSON.stringify(snap(VALID))})`);
  eq(g.status, 'completed', 'test generation completes');
  ok(g.generated === true, 'tests are marked generated (not executed)');

  /* test execution is genuinely unavailable */
  const t = await ev(`agentExec.runTests(${JSON.stringify(snap(VALID))})`);
  eq(t.status, 'unavailable', 'test execution reports unavailable (no browser runner)');

  /* security auditor (AI-assisted, not Slither) */
  const a = await ev(`agentExec.audit(${JSON.stringify(snap(VALID))})`);
  eq(a.status, 'completed', 'the audit completes');
  eq(a.auditor, 'ai', 'the auditor is AI-assisted (not a formal/Slither audit)');
  eq(a.criticalCount, 1, 'a critical finding is counted');
  eq(a.findingCount, 2, 'all findings are counted');

  /* orchestrator: multi-step workflow with the flag enabled */
  const run = await ev(`agentExec.run(['compile_contract', 'generate_tests', 'audit_contract', 'run_tests'], ${JSON.stringify(snap(VALID))})`);
  eq(run.status, 'completed', 'the multi-step workflow completes');
  eq(run.results.map((x) => x.tool).join(','), 'compile_contract,generate_tests,audit_contract,run_tests', 'all tools run in order');
  eq(run.results[0].status, 'completed', 'compile completes in the workflow');
  eq(run.results[3].status, 'unavailable', 'run_tests is unavailable in the workflow');

  /* orchestrator: a failed compile blocks downstream steps */
  const runBroken = await ev(`agentExec.run(['compile_contract', 'audit_contract'], ${JSON.stringify(snap(BROKEN))})`);
  eq(runBroken.status, 'completed', 'a workflow with a failed compile still returns its results');
  eq(runBroken.results.length, 1, 'a failed compile blocks downstream steps');
  eq(runBroken.results[0].status, 'failed', 'the compile failure is reported');

  /* orchestrator: unknown action is rejected */
  const runBad = await ev(`agentExec.run(['deploy_contract'], ${JSON.stringify(snap(VALID))})`);
  eq(runBad.results[0].status, 'rejected', 'an unknown action is rejected');

  /* stale source blocks the orchestrator */
  ev(`pendingSource = { name: 'C', code: 'contract Other {}' };`);
  const runStale = await ev(`agentExec.run(['compile_contract'], ${JSON.stringify(snap(VALID))})`);
  eq(runStale.status, 'blocked', 'a changed editor source blocks the workflow');
  ev(`pendingSource = { name: '', code: '' };`);

  /* feature flag: disabled by default */
  ev('window.__agentExecEnabled = false;');
  const disabled = await ev(`agentExec.run(['compile_contract'], ${JSON.stringify(snap(VALID))})`);
  eq(disabled.status, 'disabled', 'tool execution is disabled by default');
  ev('window.__agentExecEnabled = true;');

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
