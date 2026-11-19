/* Phase 13.2.2: real development-tool execution for the AI agent (browser-side).
   Wraps the existing compiler (compileSource) and the AI tools (aiFetch 'tests' / 'audit') with contract-version binding,
   structured results, stale-source protection, a feature flag and a small orchestrator. Disabled by default; nothing here
   signs or broadcasts, and the manual Compile & Deploy flow is unchanged and remains the only signing path. */
(function () {
  'use strict';

  /* Trusted feature gate. `window.__agentExecEnabled` is a test-only hook; in production this is always false. */
  const FLAG = false;
  function enabled() { return FLAG === true || (typeof window !== 'undefined' && window.__agentExecEnabled === true); }

  function hashOf(code) { return (typeof matHash === 'function') ? matHash(String(code || '')) : ''; }

  /* True when the live editor source no longer matches the snapshot the workflow started from. */
  function liveChanged(sourceHash) {
    if (typeof pendingSource === 'undefined' || !pendingSource || !pendingSource.code) return false;
    return hashOf(pendingSource.code) !== sourceHash;
  }

  /* Compile the given source through the real compiler and bind the result to its source hash. */
  async function compile(contract) {
    const start = Date.now();
    const sourceHash = hashOf(contract.code);
    const versionId = sourceHash.slice(0, 40);
    try {
      const out = await compileSource(contract.name, contract.code);
      return {
        tool: 'compile_contract', contractId: contract.name, contractVersion: versionId, sourceHash,
        status: 'completed', errorCount: 0, stale: liveChanged(sourceHash),
        abiAvailable: Array.isArray(out.abi) && out.abi.length > 0,
        bytecodeAvailable: typeof out.bytecode === 'string' && out.bytecode.length > 2,
        bytecodeHash: out.bytecodeKeccak256 || '',
        compilerVersion: out.compilerVersion || '',
        durationMs: Date.now() - start,
      };
    } catch (e) {
      return {
        tool: 'compile_contract', contractId: contract.name, contractVersion: versionId, sourceHash,
        status: 'failed', errorCount: 1, stale: liveChanged(sourceHash), error: String((e && e.message) || e), durationMs: Date.now() - start,
      };
    }
  }

  /* Generate tests for the given source (real AI call — generation, not execution). */
  async function genTests(contract) {
    const sourceHash = hashOf(contract.code);
    const versionId = sourceHash.slice(0, 40);
    try {
      const data = await aiFetch('tests', { name: contract.name, code: contract.code, framework: 'foundry', coverage: 'full' });
      const code = String((data && data.text) || '').replace(/^```[a-z]*\s*/, '').replace(/\s*```$/, '').trim();
      return {
        tool: 'generate_tests', contractId: contract.name, contractVersion: versionId, sourceHash,
        status: code ? 'completed' : 'failed', generated: code.length > 0, stale: liveChanged(sourceHash),
        error: code ? '' : 'The AI returned no tests.',
      };
    } catch (e) {
      return { tool: 'generate_tests', contractId: contract.name, contractVersion: versionId, sourceHash, status: 'failed', generated: false, stale: liveChanged(sourceHash), error: String((e && e.message) || e) };
    }
  }

  /* Run the existing AI security auditor (AI-assisted review, not a formal/Slither audit). */
  async function audit(contract) {
    const sourceHash = hashOf(contract.code);
    const versionId = sourceHash.slice(0, 40);
    try {
      const data = await aiFetch('audit', { name: contract.name, code: contract.code, focus: 'full' });
      const report = JSON.parse(String((data && data.text) || '').replace(/```json|```/g, '').trim());
      const findings = Array.isArray(report.findings) ? report.findings : [];
      return {
        tool: 'audit_contract', contractId: contract.name, contractVersion: versionId, sourceHash,
        status: 'completed', auditor: 'ai', score: Number(report.score) || 0, stale: liveChanged(sourceHash),
        findingCount: findings.length, criticalCount: findings.filter((f) => f && f.severity === 'critical').length,
      };
    } catch (e) {
      return { tool: 'audit_contract', contractId: contract.name, contractVersion: versionId, sourceHash, status: 'failed', stale: liveChanged(sourceHash), error: String((e && e.message) || e) };
    }
  }

  /* No supported browser test runner exists: test execution is genuinely unavailable (never fabricated). */
  async function runTests(contract) {
    const sourceHash = hashOf(contract.code);
    return { tool: 'run_tests', contractId: contract.name, contractVersion: sourceHash.slice(0, 40), sourceHash, status: 'unavailable', reason: 'no supported browser test runner' };
  }

  const TOOLS = { compile_contract: compile, generate_tests: genTests, audit_contract: audit, run_tests: runTests };

  /* Dispatch approved actions to the trusted adapters, gate on the flag, and guard against stale source and unknown
     actions. A failed compile blocks downstream steps. */
  async function run(actions, contract, ctx) {
    const c = ctx || {};
    if (!enabled()) return { ok: false, status: 'disabled', reason: 'tool execution is disabled' };
    const sourceHash = hashOf(contract.code);
    const results = [];
    for (const action of actions) {
      const adapter = TOOLS[action];
      if (!adapter) { results.push({ action, status: 'rejected', reason: 'unknown action' }); continue; }
      if (liveChanged(sourceHash)) {
        return { ok: false, status: 'blocked', reason: 'source changed during execution', results };
      }
      const r = await adapter(contract);
      results.push(r);
      if (action === 'compile_contract' && r.status === 'failed') break;
    }
    return { ok: true, status: 'completed', results };
  }

  window.agentExec = { run, compile, generateTests: genTests, audit, runTests, tools: Object.keys(TOOLS), flagEnabled: FLAG };
})();
