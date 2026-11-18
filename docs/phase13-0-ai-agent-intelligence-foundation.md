# Phase 13.0 — AI Agent Intelligence Foundation

Status: 2026-11-18. Adds a deterministic intent-understanding, planning, context and clarification layer to the AI →
Solidity backend. **This is a foundation phase: the agent interprets and prepares, but does not autonomously execute
compile/test/audit/deploy or sign transactions.** The existing DeepSeek/Anthropic/OpenAI generation pipeline is unchanged.

## Initial HEAD

`d4e0a04` (includes the Phase 12.3.3 DeepSeek recovery).

## Existing architecture findings

- `aiFetch(action, payload)` → `POST /api/ai`; actions `chat`, `audit`, `tests`, `generate` (legacy). The shared core in
  `api/ai.js` and `functions/api/ai.js` is byte-identical and holds the provider router, model catalog, pricing engine,
  and (now) the agent layer.
- The `chat` action already forwards the conversation history (`messages`, up to 20 turns) to the provider, so the model
  already sees prior turns and generated code. The system prompt is built server-side and is the only place prompts live.

## Capabilities already present

- Multi-provider router (Anthropic/OpenAI/DeepSeek), server-controlled model catalog, provider-key handling, no-fallback.
- Conversation history passing (the model sees prior turns and code).
- Structured response contract `{ text, outputTokens }`.
- Contract adoption (`adoptAiCode`), audit and test generation via per-block actions.

## Missing capabilities identified (now added)

- Deterministic intent classification (English + Portuguese).
- A versioned, validated structured-intent schema.
- Multi-step request planning (proposed, not executed).
- Bounded, conversation-scoped context assembly (objective, last contract, current contract).
- Clarification detection for ambiguous contract references.
- Security detection of autonomous/unsafe requests (sign, move funds).

## Root architectural limitation

Intent understanding is a **deterministic keyword/stem heuristic** (English + Portuguese), not model-generated. It is
accurate for the documented request patterns and is intentionally conservative: it classifies but never authorizes
execution. Richer semantic understanding remains the model's job; the heuristic layer provides a stable, testable
classification + planning backbone for Phase 13.1 tool routing.

## Files modified

- `functions/api/ai.js` and `api/ai.js` — the shared core gained the agent section (`AGENT_*` constants and
  `agentClassifyIntent`, `agentParseIntent`, `agentValidateIntent`, `agentPlanFromText`, `agentBuildContext`,
  `agentNeedsClarification`, `agentAutonomousIntent`, `agentProposedActions`, `agentTargetType`, `agentChatDirective`),
  and the `chat` system prompt now appends a compact intent-aware directive for `modify`/`correct`/`deploy` requests only.
- `tests/ai-agent-intent.mjs` — new, 109 checks.
- `tests/package.json` — the new suite is part of `npm test`.
- `docs/phase13-0-ai-agent-intelligence-foundation.md` — this document.

No changes to `app.js`, HTML, CSS, generators, compiler, deploy, wallet, network, or routing. The frontend and the public
`{ text, outputTokens }` contract are untouched.

## Intent schema (versioned)

`agentParseIntent(text)` returns `{ schemaVersion: 1, intent, confidence, target: { type, contractId }, requirements,
constraints, missingInformation, requiresClarification, proposedActions }`. Intents: `question`, `generate`, `modify`,
`explain`, `correct`, `compile`, `test`, `audit`, `deploy_prepare`, `multi_step`, `clarification_required`, `unsupported`.
`agentValidateIntent` rejects unknown intents, invalid confidence, unknown target types, and non-allowlisted action names
(`deploy`, `sign`, `execute_shell`, … are not in the allowlist).

## Context management design

`agentBuildContext(messages, contract)` returns `{ objective, currentContract: { name, hasSource }, lastContractName,
recentMessageCount }` — bounded to the conversation (≤ 20 messages), derived from the existing message history and an
optional current-contract reference. No new database or migration; no private keys/signatures/secrets are ever stored.

## Planning representation

`agentPlanFromText(text)` detects two or more of `generate`/`compile`/`test`/`audit` and returns
`{ schemaVersion, goal, steps: [{ id, action, status: 'proposed' }] }`. Steps are always `proposed`; nothing executes.

## Security boundaries

- `agentAutonomousIntent` flags signing, moving funds, withdrawing, and shell/command execution.
- `agentValidateIntent` rejects non-allowlisted actions, so a model can never invent executable tool names.
- The `chat` directive, for `deploy_prepare`/`unsupported`, instructs the model to explain that ContractForge never
  deploys or signs autonomously and that every transaction requires explicit user review/authorization.
- The agent layer never signs, accesses keys, moves funds, deploys, or executes code. Model output is treated as data.

## Provider compatibility

DeepSeek, Anthropic and OpenAI remain functional and unchanged; the Phase 12.3.3 `thinking:{type:"disabled"}` correction
and the raised `chat` budget are preserved. No automatic fallback, no new paid dependencies, no keys in the browser.

## Test results

- `tests/ai-agent-intent.mjs` — **109 passed** (classification EN+PT across all intents, multi-step plans, clarification,
  injection/autonomous detection, structured-output validation rejecting malformed and non-allowlisted actions, context
  bounding/extraction, and the additive chat directive) across both platform builds.
- `ai-proxy.mjs` **272** · `ai-catalog-pricing.mjs` **161** · `auth-wallet.mjs` **56** · frontend suites unchanged:
  `ai-chat-ui` 168 · `ai-chat-startup` 67 · `ai-workspace-ui` 183 · `auditor-tab-ui` 90 · `tests-tab-ui` 89.

## Regression comparison

No suite regressed; the chat prompt enrichment is additive only and the existing chat-prompt assertions still pass.

## CI URL

See the push for this commit (all four jobs: node, forge, slither, actionlint).

## Production deployment status

The code change must be redeployed to `contractv4.pages.dev` (Direct Upload) before the intent layer is live there;
deployment is pending author access. DeepSeek generation itself remains the verified Phase 12.3.3 state.

## Remaining limitations (future work, not implemented here)

- Intent classification is deterministic/heuristic; it does not extract `requirements`/`constraints`/`missingInformation`
  from arbitrary text (those fields are present but empty in Phase 13.0).
- Contract references are inferred from the conversation; systematic contract/version identifiers (current vs compiled vs
  deployed) and passing the editor contract into the chat payload are Phase 13.1 work.
- No tool execution; plans are `proposed` only.

## Recommended scope for Phase 13.1

Wire the classified intent + plan into a controlled, allowlisted tool-execution layer (compile/test/audit with explicit
user confirmation), add structured contract/version tracking, and enrich `requirements`/`constraints` extraction (validated
server-side). Continue to exclude deploy/sign/fund-movement without explicit user authorization.
