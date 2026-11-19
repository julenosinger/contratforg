# Phase 13.1 — Multilingual Semantic Intelligence & Contract Awareness

Status: 2026-11-19. Makes the model the primary semantic interpreter (via an enriched system prompt), adds
contract-awareness (the editor contract is sent to the backend), a versioned semantic schema (v2) with server-side
validation, and bounded context compaction. No autonomous execution, no financial changes.

## Initial HEAD

`e83d996`.

## Architecture findings

- The shared core (`api/ai.js` + `functions/api/ai.js`, byte-identical) holds the provider router, model catalog, pricing
  engine, and the Phase 13.0 agent layer (`agentClassifyIntent`, schema v1, planning, context).
- The `chat` action already forwards conversation history; the system prompt is the only place prompts live.
- The frontend `aiChatSend` did not send the current editor contract; contract context was only available via manual
  "Attach contract" (which injects source into the message text).

## Files changed

- `functions/api/ai.js` + `api/ai.js` (byte-identical shared core): enhanced chat prompt (multilingual + semantic +
  contradiction + planning + contract context); optional `contract` field validation and DATA injection; `AGENT_SCHEMA_V2`,
  `agentValidateSemantic`, `agentCompressContext`.
- `contractforge-deploy/app.js` — `aiChatSend` now sends the current editor contract (name + source, bounded to
  `AI_ATTACH_MAX`).
- `tests/ai-proxy.mjs` — multilingual/contract prompt + contract-field checks (272 → 286).
- `tests/ai-agent-intent.mjs` — schema v2 + compaction checks (109 → 139).
- `tests/ai-chat-ui.mjs` — request-schema update + editor-contract checks (168 → 170).
- `docs/phase13-1-multilingual-semantic-intelligence.md` — this report.

## Semantic interpretation design

The language model is the primary interpreter: the chat system prompt now instructs it to understand the objective,
requirements and constraints, detect contradictions (explain + clarify rather than silently violate one), outline
multi-step plans, and respond in the user's language. This is **folded into the existing single chat request** — no extra
model call per message. The Phase 13.0 deterministic classifier remains the safety fallback (it never rejects a message,
only classifies; for languages outside PT/EN it falls back to `question`).

## Supported language behavior

The prompt requires: respond in the language of the latest substantive message; respect explicit instructions
("continue in English"); keep Solidity syntax/pragma/identifiers unchanged; NatSpec comments in English by default,
but in the user's language when explicitly requested; do not mention network/deployment unless relevant. The deterministic
layer does not constrain language. (Model multilingual competence is mock-verified via prompt assertions; live multilingual
verification is pending.)

## Structured schema (v2)

`agentValidateSemantic` validates model-generated `{ schemaVersion: 2, language, intent, goal, requirements: [{id,type,
description}], constraints, target: {type,version}, missingInformation, requiresClarification, proposedActions }`,
rejecting unknown intents/actions/targets/requirement-types, non-boolean flags, overlong fields, and non-allowlisted
actions (`deploy`, `sign`, `execute_shell`). This enforces the action allowlist regardless of what a model emits.

## Contract-awareness implementation

The frontend sends `contract: { name, code }` (bounded, only when the editor has a named contract). The backend validates
name/code and injects the source into the last user message as a clearly-marked `DATA` block, and adds a prompt line
("current editor contract is \"X\"… preserve its existing functionality"). Client contract metadata is treated as untrusted.

## Context-management implementation

`agentCompressContext(messages, maxChars)` keeps the conversation objective plus the most recent turns that fit a budget
(default 12,000 chars), dropping older turns without altering them. No secrets/signatures are retained; the existing
browser-local conversation storage is reused (no new database).

## Planning implementation

Multi-step requests are interpreted by the model (the prompt asks it to outline the plan) and supported by the deterministic
`agentPlanFromText` from Phase 13.0. Plans are `proposed` only — nothing executes.

## Provider compatibility

DeepSeek, Anthropic and OpenAI remain unchanged; the Phase 12.3.3 `thinking:{type:"disabled"}` fix and the raised `chat`
budget are preserved. No automatic fallback, no new paid dependencies, no keys in the browser. Cloudflare/Vercel shared
core remains byte-identical (37,709 chars).

## Security validation

- Action allowlists enforced by `agentValidateSemantic` (and `agentValidateIntent`).
- Autonomous requests (sign/move funds/withdraw/shell) detected and never executed; the deploy directive instructs the
  model to explain authorization.
- Model output is treated as data; no state changes, no transactions, no billing.

## Performance measurements

- Semantic interpretation adds **no additional model call** (folded into the chat request).
- The prompt grows by a fixed, small multilingual/semantic block; the contract source (≤ 15,000 chars) is added only when
  the editor has a contract. No duplicate calls, no retries, no loops.

## Tests before and after

| Suite | Before | After |
|---|---|---|
| `ai-proxy.mjs` | 272 | **286** |
| `ai-agent-intent.mjs` | 109 | **139** |
| `ai-chat-ui.mjs` | 168 | **170** |
| `ai-catalog-pricing.mjs` | 161 | 161 |
| `auth-wallet.mjs` | 56 | 56 |
| `ai-chat-startup` / `ai-workspace-ui` / `auditor-tab-ui` / `tests-tab-ui` | — | unchanged, green |

## CI URL

See the push for this commit (node, forge, slither, actionlint).

## Production deployment status

Pending redeploy to `contractv4.pages.dev` (Direct Upload); no Cloudflare deploy access. Live multilingual behavior is
not yet verified in production.

## Known limitations (distinguishing implemented vs future)

- **Implemented + mock-verified:** enhanced prompt, contract-awareness plumbing, schema v2 validation, compaction.
- **Planned (future):** a dedicated model-driven `interpret` step producing machine-readable schema v2 (validated by
  `agentValidateSemantic`), contract/version identifiers, and — in an explicitly authorized phase — allowlisted tool
  execution.

## Recommended Phase 13.2 scope

Wire `agentValidateSemantic`-validated model interpretation into an explicit, allowlisted tool-execution layer
(compile/test/audit with user confirmation), add contract/version tracking, and integrate live multilingual verification.
Continue to exclude deploy/sign/fund-movement without explicit authorization.
