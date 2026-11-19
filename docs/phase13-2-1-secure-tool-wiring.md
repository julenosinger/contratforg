# Phase 13.2.1 — Secure Tool Wiring & Cryptographic Deployment Integrity

Status: 2026-11-19. Replaces the non-cryptographic intent hash with a standard cryptographic digest, extends the
deployment-intent validation, and adds a trusted, flag-gated tool dispatcher plus tool-result provenance validation.
AI-initiated wallet deployment remains **disabled**; the manual Compile & Deploy flow is unchanged.

## Initial / final HEAD

- Initial: `d78ab3f` · Final: see the commit for this phase.

## Baseline test results

`ai-proxy` 286 · `ai-catalog-pricing` 161 · `ai-agent-intent` 139 · `ai-agent-tools` 105 · `auth-wallet` 56 · `ai-chat-ui`
170 · `ai-workspace-ui` 183 · `deploy-mode-ui` 107 · `ui` 376 — all green before changes.

## Existing tools discovered

- Compilation, test generation, auditing and wallet signing all run in the **browser** (`app.js`: `compileSource`,
  `generateTests`, `runAudit`, and the manual Compile & Deploy flow with `deployInFlight` + the maturity gate). There is no
  server-side compiler.
- `matHash` (cyrb53) in `maturity.js` binds the frontend maturity gate to exact source text; it is **not** a cryptographic
  hash and is **left unchanged** (non-security use).
- The vendored `@noble/hashes` keccak256 is used by the wallet-auth module (`_auth.mjs`) but is ESM-only.

## Reused components

`agentCanonicalSerialize`, the action allowlist (`AGENT_TOOL_ACTIONS`), the execution state machine, and the Arc chain ids
were reused from Phase 13.2. No parallel compiler/deployment/signer was introduced.

## Cryptographic hashing implementation

`agentHashStr` now computes **SHA-256 via Web Crypto** (`crypto.subtle.digest`), available in both Node (Vercel/tests) and
Cloudflare Workers. It is collision-resistant and deterministic, replacing cyrb53 for security-sensitive intent binding.
The intent hash is **domain-separated and versioned** (`ContractForge.DeploymentIntent` + `schemaVersion 1`). keccak256
(via the vendored `@noble`) is the Ethereum-native alternative and is documented as a future upgrade once the platform
module systems are unified (the shared core is byte-identical across the CommonJS Vercel file and the ESM Cloudflare file,
so a synchronous ESM import cannot be added to both).

## Canonical intent schema

`agentBuildDeploymentIntent` produces `{ domain, schemaVersion, chainId, walletAddress (lowercased), contractId,
contractVersion, sourceHash, compilerVersion, bytecodeHash, constructorArgsHash, transactionDataHash, transactionValue,
deploymentMode, destination (lowercased), nonce, expiresAt, intentHash }`. `constructorArgsHash` and `intentHash` are
computed from trusted validated values; raw constructor arguments are not stored. `agentIntentChanged` recomputes the hash
and detects any material change (value, destination, bytecode, args, calldata, chain id, wallet).

## Tool dispatcher architecture

`agentDispatchTool(action, params, ctx)` validates the action against the allowlist and the feature flag; it returns
`disabled`/`rejected`/`accepted` and never executes anything itself. `agentValidateToolResult` enforces provenance: a
`completed` tool result must carry its source hash (no fabricated success).

## Compilation / test / audit integration

Not newly wired in this phase — these are browser tools and their execution remains behind `AGENT_TOOL_EXECUTION_ENABLED`.
The deterministic result-validation primitive is in place to accept their real output in a later, separately reviewed stage.

## Feature flag status

`agentToolExecutionEnabled(read)` / `agentWalletDeployEnabled(read)` read `AGENT_TOOL_EXECUTION_ENABLED` /
`AGENT_WALLET_DEPLOY_ENABLED` with a **false default**; both remain disabled in production. The model cannot change flags.

## Security findings

- Intent binding is now cryptographic (SHA-256) and domain-separated; approval is non-transferable and any material change
  invalidates it.
- A hash establishes integrity, not consent — the code never implies a signing capability.
- The dispatcher and result validator reject unknown/shell/sign actions and fabricated success.
- Prompt-injection defenses from Phase 13.0/13.1 (action allowlist, autonomous detection) remain in place.

## Files modified

`api/ai.js` + `functions/api/ai.js` (shared core) · `tests/ai-agent-tools.mjs` · `docs/phase13-2-1-secure-tool-wiring.md`.

## Tests before and after

- `ai-agent-tools.mjs` **105 → 153** (+48): 256-bit digest length, domain/schema/version checks, tamper-detection for
  value/destination/bytecode/args/calldata/chain/wallet, invalid/expired/wrong-domain/nonce rejection, env-driven flags,
  dispatcher disabled/accept/reject, and tool-result provenance.
- Regression unchanged and green: `ai-proxy` 286 · `ai-catalog-pricing` 161 · `ai-agent-intent` 139 · `auth-wallet` 56 ·
  `ai-chat-ui` 170 · `ai-workspace-ui` 183 · `deploy-mode-ui` 107 · `ui` 376.

## CI URL

See the push for this commit (node, forge, slither, actionlint).

## Production deployment status

Pending redeploy to `contractv4.pages.dev` (no Cloudflare deploy access).

## Remaining limitations

1. Actual compiler/test/audit execution is not wired; only the deterministic dispatch/result-validation primitives are in
   place (execution is flag-disabled).
2. The intent hash is SHA-256; keccak256 (vendored `@noble`) is the documented future upgrade.
3. Wallet deployment is disabled; no signing/broadcast path is activated.

## Next-phase readiness assessment

The cryptographic intent, validation, dispatcher, and result-provenance primitives are implemented and mock-verified. A
next phase can safely wire the browser compiler/test/audit adapters behind `AGENT_TOOL_EXECUTION_ENABLED` and, only after
separate review, the wallet authorization flow — while keeping `AGENT_WALLET_DEPLOY_ENABLED=false` until then.

## Classification

- **Implemented + mock-verified:** cryptographic intent hash, domain separation, extended validation, dispatcher, flags,
  tool-result provenance.
- **Disabled:** tool execution and wallet deployment (flags false).
- **Not yet wired:** actual compiler/test/audit execution (browser tools).
- **Blocked:** production deployment (no access); keccak256 upgrade (module-system unification).
