/* Phase 13.2.2.1: hardened real development-tool execution for the AI agent (browser-side).
   Security corrections over 13.2.2:
   - The feature gate is a trusted build-time constant with no browser/mutable override (no window.__agentExecEnabled).
   - Internal adapters are separated from the flag-gated agent workflow (run); adapters remain manual tools.
   - Workflow status is aggregated deterministically (completed/failed/partial/blocked/unavailable).
   - Actions are validated against a single allowlist (no model-invented tool names).
   - An immutable execution snapshot protects the workflow against stale source and missing-editor mismatches.
   Nothing here signs or broadcasts; the manual Compile & Deploy flow is unchanged and remains the only signing path. */
(function () {
  'use strict';

  /* Trusted build-time feature gate. Disabled in production; enabling requires a reviewed code change. There is no
     browser-global, URL, or storage override: client-side code is a UI control, never a security boundary. */
  const FLAG = false;

  /* The canonical action allowlist for this module (a browser-compatible subset of the shared-core policy). */
  const TOOL_ACTIONS = ['compile_contract', 'generate_tests', 'audit_contract', 'run_tests'];
  const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];
  const MAX_PARAMS = 4000;
  const MAX_ARTIFACT = 60000;   // generated test source upper bound
  const MAX_FINDINGS = 200;

  function hashOf(code) { return (typeof matHash === 'function') ? matHash(String(code || '')) : ''; }

  /* Centralized action validation (parity with the shared-core allowlist for the implemented tools). */
  function validateAction(action, params) {
    if (typeof action !== 'string' || TOOL_ACTIONS.indexOf(action) < 0) return { ok: false, reason: 'unknown action' };
    if (params !== undefined && (typeof params !== 'object' || Array.isArray(params))) return { ok: false, reason: 'invalid params' };
    if (params !== undefined && JSON.stringify(params).length > MAX_PARAMS) return { ok: false, reason: 'params too large' };
    return { ok: true };
  }

  /* An immutable execution snapshot. `editorMismatch` treats a missing/empty editor as a mismatch, never a match. */
  function snapshot(contract, sessionId) {
    const code = contract && typeof contract.code === 'string' ? contract.code : '';
    const sourceHash = hashOf(code);
    return {
      executionId: 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      contractId: contract && contract.name ? contract.name : '',
      contractName: contract && contract.name ? contract.name : '',
      contractVersion: sourceHash.slice(0, 40),
      sourceHash: sourceHash,
      sessionId: sessionId || '',
      startedAt: Date.now(),
    };
  }

  function editorMismatch(snap) {
    if (typeof pendingSource === 'undefined' || !pendingSource || !pendingSource.code) return true;   // missing ≠ matching
    return hashOf(pendingSource.code) !== snap.sourceHash;
  }

  /* Compile through the real compiler and preserve the actual diagnostics (errors + warnings + source locations). The
     adapter works on the passed snapshot (independent of the editor) and reports `stale` when the editor diverged. */
  async function compile(contract, snap) {
    const s = snap || snapshot(contract);
    const start = Date.now();
    try {
      const out = await compileSource(contract.name, contract.code);
      const warnings = Array.isArray(out.warnings) ? out.warnings.map((w) => ({ severity: w.severity || 'warning', message: (w.formattedMessage || w.message || '').split('\n')[0], sourceLocation: w.sourceLocation || '' })) : [];
      return {
        tool: 'compile_contract', executionId: s.executionId, contractId: s.contractId, contractVersion: s.contractVersion, sourceHash: s.sourceHash,
        status: 'completed', errorCount: 0, warningCount: warnings.length, diagnostics: warnings,
        abiAvailable: Array.isArray(out.abi) && out.abi.length > 0,
        bytecodeAvailable: typeof out.bytecode === 'string' && out.bytecode.length > 2,
        bytecodeHash: out.bytecodeKeccak256 || '',
        compilerVersion: out.compilerVersion || '',
        stale: editorMismatch(s), durationMs: Date.now() - start,
      };
    } catch (e) {
      const diags = Array.isArray(e && e.diagnostics) ? e.diagnostics : [];
      const errors = diags.filter((d) => d && d.severity === 'error');
      const warnings = diags.filter((d) => d && d.severity === 'warning');
      return {
        tool: 'compile_contract', executionId: s.executionId, contractId: s.contractId, contractVersion: s.contractVersion, sourceHash: s.sourceHash,
        status: 'failed', errorCount: errors.length, warningCount: warnings.length,
        diagnostics: diags.map((d) => ({ severity: d.severity || 'error', message: (d.formattedMessage || d.message || '').split('\n')[0], sourceLocation: d.sourceLocation || '' })),
        error: String((e && e.message) || e), stale: editorMismatch(s), durationMs: Date.now() - start,
      };
    }
  }

  /* Generate tests and preserve the generated artifact (bounded, untrusted text; never executed). */
  async function genTests(contract, snap) {
    const s = snap || snapshot(contract);
    try {
      const data = await aiFetch('tests', { name: contract.name, code: contract.code, framework: 'foundry', coverage: 'full' });
      const code = String((data && data.text) || '').replace(/^```[a-z]*\s*/, '').replace(/\s*```$/, '').trim();
      if (!code) return { tool: 'generate_tests', executionId: s.executionId, contractId: s.contractId, contractVersion: s.contractVersion, sourceHash: s.sourceHash, status: 'failed', generated: false, error: 'The AI returned no tests.' };
      if (code.length > MAX_ARTIFACT) return { tool: 'generate_tests', executionId: s.executionId, contractId: s.contractId, contractVersion: s.contractVersion, sourceHash: s.sourceHash, status: 'failed', generated: false, error: 'generated tests too large' };
      return {
        tool: 'generate_tests', executionId: s.executionId, contractId: s.contractId, contractVersion: s.contractVersion, sourceHash: s.sourceHash,
        status: 'completed', generated: true, framework: 'foundry', artifact: code, artifactHash: hashOf(code), stale: editorMismatch(s),
      };
    } catch (e) {
      return { tool: 'generate_tests', executionId: s.executionId, contractId: s.contractId, contractVersion: s.contractVersion, sourceHash: s.sourceHash, status: 'failed', generated: false, stale: editorMismatch(s), error: String((e && e.message) || e) };
    }
  }

  /* Validate an AI audit response strictly and preserve the sanitized findings (untrusted text, rendered safely). */
  function validateAudit(raw) {
    let obj;
    try { obj = JSON.parse(String(raw || '').replace(/```json|```/g, '').trim()); } catch (_) { return { ok: false, reason: 'invalid audit JSON' }; }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, reason: 'invalid audit response' };
    if (typeof obj.score !== 'number' || !(obj.score >= 0 && obj.score <= 100)) return { ok: false, reason: 'invalid score' };
    const rawFindings = Array.isArray(obj.findings) ? obj.findings : [];
    if (rawFindings.length > MAX_FINDINGS) return { ok: false, reason: 'too many findings' };
    const findings = [];
    for (const f of rawFindings) {
      if (!f || typeof f !== 'object') return { ok: false, reason: 'invalid finding' };
      if (SEVERITIES.indexOf(f.severity) < 0) return { ok: false, reason: 'invalid severity' };
      if (typeof f.title !== 'string' || f.title.length < 1 || f.title.length > 200) return { ok: false, reason: 'invalid finding title' };
      if (typeof f.description !== 'string' || f.description.length > 2000) return { ok: false, reason: 'invalid finding description' };
      findings.push({
        severity: f.severity,
        title: f.title.slice(0, 200),
        description: f.description.slice(0, 2000),
        recommendation: typeof f.recommendation === 'string' ? f.recommendation.slice(0, 1000) : '',
        lineHint: typeof f.lineHint === 'string' ? f.lineHint.slice(0, 200) : '',
      });
    }
    return { ok: true, score: obj.score, summary: typeof obj.summary === 'string' ? obj.summary.slice(0, 500) : '', findings };
  }

  async function audit(contract, snap) {
    const s = snap || snapshot(contract);
    try {
      const data = await aiFetch('audit', { name: contract.name, code: contract.code, focus: 'full' });
      const v = validateAudit(String((data && data.text) || ''));
      if (!v.ok) return { tool: 'audit_contract', executionId: s.executionId, contractId: s.contractId, contractVersion: s.contractVersion, sourceHash: s.sourceHash, status: 'failed', error: v.reason };
      return {
        tool: 'audit_contract', executionId: s.executionId, contractId: s.contractId, contractVersion: s.contractVersion, sourceHash: s.sourceHash,
        status: 'completed', auditor: 'ai', score: v.score, summary: v.summary,
        findingCount: v.findings.length, criticalCount: v.findings.filter((f) => f.severity === 'critical').length,
        findings: v.findings, stale: editorMismatch(s),
      };
    } catch (e) {
      return { tool: 'audit_contract', executionId: s.executionId, contractId: s.contractId, contractVersion: s.contractVersion, sourceHash: s.sourceHash, status: 'failed', stale: editorMismatch(s), error: String((e && e.message) || e) };
    }
  }

  /* No supported browser test runner exists: test execution is genuinely unavailable (never fabricated). */
  async function runTests(contract, snap) {
    const s = snap || snapshot(contract);
    return { tool: 'run_tests', executionId: s.executionId, contractId: s.contractId, contractVersion: s.contractVersion, sourceHash: s.sourceHash, status: 'unavailable', reason: 'no supported browser test runner' };
  }

  const ADAPTERS = { compile_contract: compile, generate_tests: genTests, audit_contract: audit, run_tests: runTests };

  /* Deterministic workflow-state aggregation. `completed` requires every result to have succeeded. */
  function aggregateStatus(results) {
    const r = Array.isArray(results) ? results : [];
    if (!r.length) return { ok: false, status: 'failed', reason: 'no actions executed', results: r };
    let failed = false, unavailable = false, rejected = false, blocked = false, completed = 0;
    for (const x of r) {
      if (x.status === 'completed') completed++;
      else if (x.status === 'failed') failed = true;
      else if (x.status === 'unavailable') unavailable = true;
      else if (x.status === 'rejected') rejected = true;
      else if (x.status === 'blocked') blocked = true;
    }
    if (rejected) return { ok: false, status: 'blocked', reason: 'an action was rejected', results: r };
    if (blocked) return { ok: false, status: 'blocked', reason: 'an action was blocked', results: r };
    if (failed && completed === 0) return { ok: false, status: 'failed', reason: 'the required action failed', results: r };
    if (failed) return { ok: false, status: 'partial', reason: 'some actions failed', results: r };
    if (unavailable) return { ok: false, status: 'unavailable', reason: 'a required capability is unavailable', results: r };
    return { ok: true, status: 'completed', results: r };
  }

  /* The flag-gated agent workflow. The workflow operates on the live editor, so a missing or changed editor blocks it.
     No browser/mutable override; disabled in production. */
  let currentRunId = null;
  async function run(actions, contract, ctx) {
    if (!FLAG) return { ok: false, status: 'disabled', reason: 'tool execution is disabled' };
    const runId = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    currentRunId = runId;
    const snap = snapshot(contract, ctx && ctx.sessionId);
    const results = [];
    for (const action of actions) {
      if (currentRunId !== runId) return { ok: false, status: 'cancelled', reason: 'superseded by a newer run', results: aggregateStatus(results).results };
      const v = validateAction(action, ctx && ctx.params);
      if (!v.ok) { results.push({ tool: action, status: 'rejected', reason: v.reason }); continue; }
      if (editorMismatch(snap)) { results.push(Object.assign(blockedResult(snap, 'source changed during execution'), { tool: action })); return aggregateStatus(results); }
      const r = await ADAPTERS[action](contract, snap);
      results.push(r);
      if (action === 'compile_contract' && r.status === 'failed') break;
    }
    return aggregateStatus(results);
  }

  function blockedResult(snap, reason) {
    return { executionId: snap.executionId, contractId: snap.contractId, contractVersion: snap.contractVersion, sourceHash: snap.sourceHash, status: 'blocked', reason };
  }

  /* Public interface. `run` is the flag-gated agent workflow; the adapters are manual tools (same trust as the existing
     compile/test/audit buttons) and are intentionally not gated. */
  window.agentExec = {
    run, aggregateStatus, validateAction, snapshot, editorMismatch,
    compile, generateTests: genTests, audit, runTests,
    actions: TOOL_ACTIONS.slice(), flagEnabled: FLAG,
  };
})();
