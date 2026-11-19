# Phase 13.2 — Intelligent Tool Execution & Secure Wallet Deployment

Status: 2026-11-19. Adds the deterministic **security/orchestration foundation** for an AI development agent. All new
capabilities are **DISABLED by default** behind hard-coded feature flags; nothing here signs, controls keys, or broadcasts.
The existing manual Compile & Deploy flow remains the only signing path and is unchanged.

## Initial HEAD

`6ef208d`.

## Architecture audit

- The AI backend is the shared core in `api/ai.js` + `functions/api/ai.js` (byte-identical). The frontend owns the Solidity
  compiler (`solc-js`), the test generator and auditor (which call `/api/ai`), the wallet provider, and the manual
  Compile & Deploy flow (`compileSource`, maturity gate, `deployInFlight` guard, wallet signing).
- The frontend already binds approvals to exact source text via `matHash` (cyrb53) in `maturity.js`.

## Existing components reused

- `matHash` (cyrb53) — the same algorithm is re-implemented server-side as `agentHashStr` for intent/source binding.
- Arc chain ids (`5042` Mainnet, `5042002` Testnet) — reused as `ARC_MAINNET_CHAIN_ID` / `ARC_TESTNET_CHAIN_ID`.
- The manual Compile & Deploy flow — **unchanged**; no parallel deployment engine was created.

## Agent orchestration design

`agentValidateToolAction(action, params)` enforces a strict allowlist (`inspect_contract`, `generate_contract`,
`modify_contract`, `compile_contract`, `generate_tests`, `run_tests`, `audit_contract`, `diagnose_errors`,
`propose_correction`, `prepare_deployment`, `request_deployment_approval`) and rejects unknown/oversized params. The model
can never invent an executable tool name.

## Execution state machine

`AGENT_EXEC_STATES` / `AGENT_EXEC_TRANSITIONS` define `created → interpreting → planning → executing → validating →
awaiting_user_approval → awaiting_wallet_signature → submitted → confirming → confirmed → completed`, with terminal
`failed`/`cancelled`/`rejected`/`expired` and an `ambiguous` reconciliation state. `agentValidateTransition` rejects
skipping approval, signing before authorization, treating submission as confirmation, and replaying completed runs.

## Contract versioning

`agentContractVersionId(sourceHash)` derives a version id from the source hash; `agentIntentChanged`/`agentBuildDeploymentIntent`
bind the deployment intent to a canonical hash so any change to source/bytecode/args/destination/value invalidates approval.

## Tool integrations

No tool is newly wired in this phase (execution is flag-disabled). The deterministic primitives are ready to coordinate the
existing compile/test/audit services in a later, authorized stage.

## Correction-loop behavior

`agentCorrectionAllowed(attempts)` enforces `AGENT_MAX_CORRECTIONS = 3`; a bounded diagnosis→correction→revalidation loop
can never run indefinitely.

## Deployment intent structure

`agentBuildDeploymentIntent` produces `{ operationId, walletAddress, contractId, contractVersion, sourceHash,
compilerVersion, bytecodeHash, constructorArgs, chainId, deploymentMode, destination, calldataHash, value, gasEstimate,
createdAt, expiresAt, intentHash }`, where `intentHash = hash(canonicalSerialize(fields))`. `agentValidateDeploymentIntent`
rejects invalid wallet/chain/hashes/expiry; `agentIntentChanged` detects any tampering.

## Wallet authorization flow

Not activated. When enabled, the flow is: prepare intent → `awaiting_user_approval` (explicit review) →
`awaiting_wallet_signature` (user signs via the existing provider) → `submitted` → `confirming` → `confirmed`. The user is
the final authority; the AI never signs.

## Transaction validation / on-chain verification

Represented by the state machine (`submitted`/`confirming`/`confirmed`/`ambiguous`) and the intent hash; the actual receipt
query, chain-identity check, and deployment-history write remain the existing frontend flow and are not reimplemented here.

## Security findings

- Action allowlist blocks arbitrary tool invocation and shell/sign/fund-movement names.
- Intent hash makes approval non-transferable and detects any material change.
- Network mismatch (`agentNetworkMismatch`) and the review gate (`agentDeploymentBlocked`) block compilation failure,
  invalid parameters, unsupported networks, wallet mismatch, changed intents, and critical findings.
- Feature flags are hard-coded `false` and enforced by trusted code (not UI).

## Files modified

`api/ai.js` + `functions/api/ai.js` (shared core additions) · `tests/ai-agent-tools.mjs` (new) · `tests/package.json`
(`npm test` chain) · `docs/phase13-2-intelligent-tool-execution-secure-deployment.md`.

## Tests before and after

- New `ai-agent-tools.mjs` — **105 passed** (both platform builds): feature-flag defaults, allowlist acceptance/rejection
  (incl. shell/sign/funds), state-machine valid + invalid transitions, intent immutability/hashing, contract versioning,
  network ids/mismatch, correction bound, review-gate reasons, canonical-serialization determinism.
- Regression unchanged and green: `ai-proxy` 286 · `ai-catalog-pricing` 161 · `ai-agent-intent` 139 · `auth-wallet` 56 ·
  `ai-chat-ui` 170 · `ai-workspace-ui` 183 · `deploy-mode-ui` 107 · `ui` 376.

## CI URL

See the push for this commit (node, forge, slither, actionlint).

## Feature flag status

`AGENT_TOOL_EXECUTION_ENABLED = false` · `AGENT_WALLET_DEPLOY_ENABLED = false` — both enforced in trusted shared-core code.

## Production / live verification status

- **Implemented:** deterministic security/orchestration primitives.
- **Mock-verified:** all 105 tests.
- **Testnet-verified / Mainnet-verified / Live:** not applicable — execution and wallet deployment are disabled.
- **Production deployment:** pending redeploy to `contractv4.pages.dev` (no Cloudflare deploy access).

## Remaining blockers

1. No tool execution is wired (compilation/test/audit coordination is deferred until the flags are enabled after review).
2. The intent hash is cyrb53 (consistent with `matHash`); a cryptographic hash (keccak256, available via the vendored
   `@noble` in the auth module) is the documented production upgrade for on-chain authorization.
3. Actual wallet-signing and on-chain receipt handling remain the existing manual flow and must not be reimplemented.

## Final commit SHA

See the commit for this phase.

## Status classification

**Disabled / mock-verified foundation** — no production, testnet, or mainnet deployment capabilities are activated; the
deterministic security layer is in place and tested, ready for a later, separately reviewed activation.
