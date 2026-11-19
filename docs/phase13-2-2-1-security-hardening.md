# Phase 13.2.2.1 — Security Hardening & Execution Integrity

Status: 2026-11-19. Corrective hardening of the Phase 13.2.2 tool-execution module (`contractforge-deploy/agent-exec.js`).
All P0 findings are corrected with regression tests; the feature gate has no browser override; workflow status is
deterministic; compiler diagnostics and AI audit/test artifacts are preserved.

## Initial / final HEAD

- Initial: `b7ede17` · Final: see the commit for this phase.

## Initial test baseline

`agent-exec` 26 · `ai-agent-tools` 153 · `ai-proxy` 286 · `ai-agent-intent` 139 · `ai-catalog-pricing` 161 · `auth-wallet`
56 · `ai-chat-ui` 170 · `ai-workspace-ui` 183 · `deploy-mode-ui` 107 · `csp` 252 · `ui` 376 — all green.

## Verified findings and corrections

| # | Finding | Root cause | Correction |
|---|---|---|---|
| P0-1 | Browser flag bypass | `enabled()` honored `window.__agentExecEnabled` | Removed the mutable override; the gate is a trusted `FLAG = false` constant |
| P0-2 | Direct adapter bypass | `window.agentExec` exposed ungated adapters | Adapters are manual tools (same trust as the existing buttons); only `run` is the flag-gated workflow |
| P0-3 | False `completed` | `run` returned `ok:true, status:'completed'` even on failure | `aggregateStatus` returns `completed`/`failed`/`partial`/`blocked`/`unavailable`; `ok:true` only on full success |
| P0-4 | Uncentralized validation | `run` used `TOOLS[action]` directly | `validateAction` enforces the single allowlist (`compile_contract`/`generate_tests`/`audit_contract`/`run_tests`) + param limits |
| P0-5 | Snapshot integrity | `liveChanged` returned `false` for a missing editor | `snapshot` + `editorMismatch` treat a missing/empty editor as a mismatch; `run` blocks on divergence |
| P1-6 | Lost diagnostics | adapter reported `errorCount: 1` and discarded warnings | `compileSource` now attaches `err.diagnostics` / `warnings`; the adapter preserves real error/warning counts and locations |
| P1-7 | Lost test artifacts | adapter returned only a boolean | `genTests` preserves the bounded `artifact` + `artifactHash` + `framework` |
| P1-8 | Unvalidated audit | audit parsed JSON without schema checks and discarded findings | `validateAudit` strictly validates structure/severity/title/description/score/size and preserves sanitized findings |
| P1-9 | Async safety | no execution identity or supersession guard | execution IDs + a `currentRunId` guard reject superseded runs |

## Files changed

- `contractforge-deploy/agent-exec.js` — corrected module.
- `contractforge-deploy/app.js` — `compileSource` attaches `err.diagnostics` (failure) and `warnings` (success),
  additive and backward-compatible.
- `tests/agent-exec.mjs` — rewritten: 26 → **42** checks.
- `docs/phase13-2-2-1-security-hardening.md` — this report.

## Before/after behavior

- `run()` always returns `disabled` in production (flag `false`); there is no `window.__agentExecEnabled`.
- `aggregateStatus` no longer reports `completed` on failure: `all success → completed`, `some fail → partial`, `only
  fail → failed`, `rejected/blocked → blocked`, `unavailable → unavailable`.
- Compiler results now carry the real `errorCount`/`warningCount`/`diagnostics` (verified against `solc` output).
- Audit results carry validated `findings` (not just counts); malformed/invalid responses are rejected.

## Security controls implemented

- Feature gate: trusted constant, no browser/URL/storage override; the model cannot enable it.
- Allowlist validation; model-invented tool names (shell/sign/deploy) are rejected.
- Immutable execution snapshot; missing/changed editor blocks the workflow and marks results stale.
- `run_tests` remains genuinely `unavailable`; audit remains `auditor:'ai'` (never presented as formal/Slither).
- No signing, broadcast, fund movement, or wallet deployment. The manual Compile & Deploy flow is unchanged.

## Tests added

`tests/agent-exec.mjs` (42 checks): no `window.__agentExecEnabled`; `run` disabled; `validateAction` allowlist + rejection;
snapshot/`editorMismatch` (missing vs matching vs changed); real `solc` compile (valid → completed + bytecode, broken →
`errorCount` equals the actual solc error count + diagnostics preserved); stale flag; test artifact preserved; audit
validation (malformed JSON, invalid severity, out-of-range score) + findings preserved; `run_tests` unavailable;
`aggregateStatus` full matrix.

## Real compiler verification

`tests/agent-exec.mjs` compiles a valid and a multi-error broken contract through the **npm `solc`**, asserting the
adapter's `errorCount` equals the real solc error count (not a hardcoded `1`).

## Regression results

New `agent-exec` 42 · unchanged and green: `ai-agent-tools` 153 · `ai-proxy` 286 · `ai-agent-intent` 139 ·
`ai-catalog-pricing` 161 · `auth-wallet` 56 · `ai-chat-ui` 170 · `ai-chat-startup` 67 · `ai-workspace-ui` 183 ·
`deploy-mode-ui` 107 · `deploy-integrity` 27 · `contract-resolution` 15 · `deploy-overview-ui` 240 · `creation-tabs-audit`
302 · `csp` 252 · `ui` 376.

## CI URL

See the push for this commit (node, forge, slither, actionlint).

## Feature flag / wallet deployment / production status

- Feature flag: `FLAG = false` (trusted constant, no override); production tool execution remains disabled.
- Wallet deployment: disabled throughout; no signing or broadcast.
- Production deployment: pending redeploy to `contractv4.pages.dev` (no Cloudflare deploy access).

## Remaining limitations

1. No browser test runner or Slither — `run_tests` is `unavailable`; audit is `ai`-assisted only.
2. Browser-side tool results are client-side and not server-attested (documented trust limitation).
3. The correction loop (`diagnose_errors`/`propose_correction`) and the chat execution-progress UI remain deferred.

## Recommended next phase

Enable development-tool execution in a reviewed environment (set the constant true), integrate the orchestrator into the
chat flow with the execution-progress UI, and implement the bounded correction loop — while keeping wallet deployment
disabled until a separately reviewed activation phase.

## Classification

- **Fixed and verified:** all P0/P1 findings above (with real-solc compilation for the compiler).
- **Unavailable:** test execution; formal/Slither audit.
- **Disabled:** feature flag; wallet deployment.
- **Deferred:** correction loop; chat execution UI.
- **Not independently verified:** production deployment (no access).
