# Phase 13.2.2 — Real Tool Execution & Intelligent Agent Workflow Integration

Status: 2026-11-19. Wires the AI agent to the **real** browser-side development tools (compiler, test generation, AI
security review) through trusted adapters, with contract-version binding, stale-source protection, a feature flag and a
small orchestrator. AI-initiated wallet deployment stays disabled; the manual Compile & Deploy flow is unchanged.

## Initial / final HEAD

- Initial: `37a1ad3` · Final: see the commit for this phase.

## Baseline test results

`ai-proxy` 286 · `ai-catalog-pricing` 161 · `ai-agent-intent` 139 · `ai-agent-tools` 153 · `auth-wallet` 56 · `ai-chat-ui`
170 · `ai-workspace-ui` 183 · `deploy-mode-ui` 107 · `ui` 376 · `csp` 252 — all green before changes.

## Actual tool inventory (verified, not assumed)

| Capability | Implementation | Environment | Real? |
|---|---|---|---|
| Solidity compilation | `compileSource` (solc-js 0.8.24, WebAssembly) | browser | **real** |
| Test generation | `aiFetch('tests')` → `/api/ai` | browser → backend | real AI call |
| Test execution | none (no supported browser runner) | — | **unavailable** |
| Security review | `aiFetch('audit')` → `/api/ai` | browser → backend | AI-assisted (not Slither/formal) |
| Wallet signing | manual Compile & Deploy (`compileSource` + maturity gate + `deployInFlight`) | browser | unchanged, only signing path |

No browser test runner and no browser Slither exist, so `run_tests` is genuinely unavailable and the audit is explicitly
labelled `ai` (not a formal audit).

## Existing modules reused

`compileSource`, `aiFetch`, `matHash` (source binding), and the manual Compile & Deploy flow. No parallel compiler,
deployer, signer, or auditor was introduced.

## Files changed

- `contractforge-deploy/agent-exec.js` — **new** tool-execution module.
- `contractforge-deploy/index.html` + `tests/harness.mjs` — load the new module.
- `tests/agent-exec.mjs` — **new**, 26 checks (real solc).
- `tests/package.json` — wired into `npm test`.
- `docs/phase13-2-2-real-tool-execution.md` — this report.

## Compiler integration evidence

`agentExec.compile(contract)` invokes the real `compileSource` and returns `{ tool:'compile_contract', contractId,
contractVersion (source hash), sourceHash, status, errorCount, abiAvailable, bytecodeAvailable, bytecodeHash,
compilerVersion, durationMs, stale }`. `tests/agent-exec.mjs` compiles a valid contract and a syntactically broken contract
**through the npm `solc`**, proving `completed` + bytecode availability for the former and `failed` + diagnostics for the
latter.

## Test generation / execution evidence

`agentExec.generateTests` invokes the real AI `tests` path and reports `generated` (generation is not execution).
`agentExec.runTests` returns `status:'unavailable'` with `reason:'no supported browser test runner'` — never a fabricated
pass.

## Auditor integration evidence

`agentExec.audit` invokes the real AI `audit` path and returns `{ auditor:'ai', score, findingCount, criticalCount }`,
clearly distinguishing AI-assisted review from a formal/Slither audit.

## Orchestration implementation

`agentExec.run(actions, contract, ctx)` dispatches allowlisted actions (`compile_contract`, `generate_tests`,
`audit_contract`, `run_tests`), gates on the flag, rejects unknown actions, blocks on stale source, and stops downstream
steps after a failed compile.

## Contract version integrity

Every result carries `sourceHash` and `contractVersion` (the source-hash prefix). `liveChanged` compares the snapshot hash
against the live editor source, marking results `stale` and blocking the workflow when the editor changed mid-run.

## Tool result provenance

Results originate only from the trusted adapters (real `compileSource`/`aiFetch`), never from model text. Browser-side tools
are client-side and are **not server-attested** — documented as a trust limitation.

## Security findings

- No shell/`eval`/subprocess execution; no arbitrary model code runs.
- No wallet signing, no broadcast, no transaction value/destination mutation.
- Feature flag is a trusted constant (`false`); the model cannot enable it.
- `run_tests` and the AI audit never fabricate success.

## Feature flag status

`agentExec` is disabled by default (a trusted `false` constant plus `window.__agentExecEnabled` test hook). Production
remains `AGENT_TOOL_EXECUTION_ENABLED=false` / `AGENT_WALLET_DEPLOY_ENABLED=false`.

## Regression test results

- New `agent-exec.mjs` — **26 passed** (real solc: valid compile → completed + bytecode, broken compile → failed + error;
  stale-source detection; test generation; test-execution unavailable; AI audit with critical-finding count; multi-step
  orchestration incl. dependency failure and unknown-action rejection; flag disabled by default).
- Regression unchanged and green: `ai-proxy` 286 · `ai-catalog-pricing` 161 · `ai-agent-intent` 139 · `ai-agent-tools` 153 ·
  `auth-wallet` 56 · `ai-chat-ui` 170 · `ai-chat-startup` 67 · `ai-workspace-ui` 183 · `deploy-mode-ui` 107 · `csp` 252 ·
  `headers` 6 · `ui` 376.

## CI URL

See the push for this commit (node, forge, slither, actionlint).

## Production deployment status

Pending redeploy to `contractv4.pages.dev` (no Cloudflare deploy access).

## Remaining blockers

1. **Test execution** — no browser test runner exists; `run_tests` is correctly `unavailable`. Adding a safe isolated runner
   is a separate, separately reviewed piece of work.
2. **Formal audit** — no browser Slither; the audit is AI-assisted only.
3. **Correction loop** (`diagnose_errors`/`propose_correction`) — deferred to a later stage.
4. Browser-side results are client-side, not server-attested.

## Classification

- **Implemented + real integration verified:** compiler (`compileSource` via real solc).
- **Implemented + mock-verified:** test generation and AI audit (real call path, deterministic mocked response).
- **Unavailable (correctly reported):** test execution; formal/Slither audit.
- **Disabled:** feature flag; wallet deployment.
- **Blocked:** production deployment (no access).

## Recommended next phase

Wire the orchestrator into the chat flow (execution progress UI), implement the bounded correction loop using real compiler
diagnostics, and — only after separate review — the wallet authorization flow, keeping `AGENT_WALLET_DEPLOY_ENABLED=false`
until then.
