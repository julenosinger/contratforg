# Phase 12.2 — AI Model Catalog & USDC Pricing Engine

Status: 2026-11-18 · **Server-side, simulation/shadow mode.** The catalog and pricing engine are implemented and tested,
but nothing activates billing, charges users, creates wallets, deploys contracts, or changes the frontend. The existing
`POST /api/ai` contract (`{ action, payload }` → `{ text, outputTokens }`) is unchanged for all consumers.

## Initial / final HEAD

- Initial: `b276289` · Final: see the commit for this phase.

## Files modified

- `api/ai.js` (Vercel) and `functions/api/ai.js` (Cloudflare) — the **byte-identical shared core** gained the catalog,
  operation prices, provider-cost model, quote engine and billing state machine; `aiCallProvider` now validates the
  catalog entry and clamps the output cap. The handler maps an unknown/disabled model to a controlled `503`.
- `tests/ai-proxy.mjs` — 12 new handler-level checks (250 → 262).
- `tests/ai-catalog-pricing.mjs` — **new**, 159 checks on the pure catalog/pricing functions across both platform builds.
- `tests/package.json` — the new suite is part of `npm test`.
- `docs/phase12-2-ai-model-catalog-pricing.md` — this document.

No changes to `app.js`, HTML, CSS, generators, compiler, deploy, wallet, network, or routing.

## Model catalog design

`AI_CATALOG` maps `provider:model` → `{ id, provider, model, enabled, verified, default, ops, maxInputTokens, maxOutputTokens }`.

| Entry | Enabled | Verified | Default | Note |
|---|---|---|---|---|
| `anthropic:claude-sonnet-4-6` | ✓ | ✓ | ✓ | existing production default |
| `openai:gpt-4o-mini` | ✓ | ✗ | ✓ | unverified legacy Chat Completions model |
| `openai:gpt-4o` | ✓ | ✗ | — | unverified (kept for Phase 12.1 compat) |
| `deepseek:deepseek-flash` | ✓ | ✓ | ✓ | current per official DeepSeek docs |
| `deepseek:deepseek-reasoner` | ✗ | ✗ | — | deprecated 2026-07-24 → disabled |

`aiCallProvider` resolves the provider/model exactly as Phase 12.1 did (`AI_PROVIDER` → `AI_MODEL`/`OPENAI_MODEL`/
`DEEPSEEK_MODEL`), then looks the model up in the catalog: an unknown or disabled model is a controlled `503`
(`AI is not configured on this deployment.`), and nothing reaches a provider. The output cap is
`min(AI_MAX_TOKENS[action], entry.maxOutputTokens)`.

## Verified model identifiers

- `deepseek-flash` — verified current via official DeepSeek docs (served by DeepSeek-V4.1-Flash-1017; `deepseek-chat`/
  `deepseek-reasoner` deprecated 2026-07-24).
- `claude-sonnet-4-6` — the existing production default (verified by the running deployment).
- `gpt-4o-mini`, `gpt-4o` — real OpenAI model IDs but **not independently verified as available in Nov 2026** (OpenAI
  is migrating Chat Completions to the Responses API); marked `verified: false` and must be confirmed before enabling
  OpenAI in production.

Token limits are conservative (`maxInputTokens: 60000` ≈ the existing `AI_MAX_BODY` char bound; `maxOutputTokens: 4096`
≈ the app's own `AI_MAX_TOKENS` cap), not per-model verified context windows.

## Pricing configuration

Customer prices are integer micro-USDC (`1 USDC = 1,000,000 micro`), server-controlled, versioned
(`AI_PRICING_VERSION = 1`), and keyed by commercial operation:

| Operation | Reference price | Micro |
|---|---|---|
| `question` (Solidity question) | 0.02 USDC | 20,000 |
| `generate` (contract generation) | 0.20 USDC | 200,000 |
| `correct` (code correction) | 0.05 USDC | 50,000 |
| `explain` (code explanation) | provisional 0.05 USDC | 50,000 |
| `review` (AI security review) | 0.15 USDC | 150,000 |
| `tests` (test generation) | 0.10 USDC | 100,000 |

`explain` is provisionally priced like `correct` (it has no reference price in the specification). The existing wire
actions map via `AI_ACTION_OP = { chat: question, audit: review, tests: tests, generate: generate }`; `chat` defaults to
the cheapest operation pending future content classification.

## Provider cost calculation methodology

Customer charge and provider cost are **strictly separated**. Provider cost is computed in integer micro-USDC from token
usage and a **versioned rate table** (`AI_PROVIDER_COST` with `version`, `verified`, `source`, `effective`). Input,
output and cached-input tokens are summed via `aiTokenCost` (ceil-rounded, `tokens × ratePerMillion / 1e6`, overflow-safe).

In this phase every rate is `null` and `verified: false`, so `aiProviderCost` returns `null` (**unknown**), never zero —
guessed usage is never used for settlement. The methodology is testable with injected synthetic rates; the production
table remains unverified until real, sourced rates are supplied.

## Quote schema

`aiQuote(provider, model, op, { nowMs, ttlMs })` returns a deterministic, server-side quote (simulation only):

```jsonc
{
  "ok": true,
  "quoteId": "q_<seq>_<now>",
  "operation": "review",
  "provider": "anthropic", "model": "claude-sonnet-4-6",
  "priceMicro": 150000, "maxChargeMicro": 150000,
  "pricingVersion": 1,
  "expiresAt": 1060000,
  "inputTokenLimit": 60000, "outputTokenLimit": 4096,
  "providerCostMicro": null          // unknown until verified rates exist
}
```

The price/max-charge are fixed server values (the model never sets its price; the client never supplies one). The quote
is not wired to `/api/ai` and is not financially binding; a future authenticated quote will bind user/session/request.

## Pricing versioning

`AI_PRICING_VERSION` tags the operation price table; `AI_PROVIDER_COST.version`/`source`/`effective` tag provider rates.
The quote carries `pricingVersion`, so a future ledger can detect which price schedule produced a charge.

## Cost-control mechanisms

- Input bounded by the existing `AI_MAX_BODY` (60,000 chars) + per-message `AI_MAX_MESSAGE` (20,000 chars).
- Output capped by `min(AI_MAX_TOKENS[action], entry.maxOutputTokens)`.
- Unknown/disabled model → `503` before any provider call; no automatic fallback; no retry; a 45 s timeout.
- One provider call per request (asserted); client cannot override provider/model/system/token limits.
- Max customer charge is the fixed operation price; provider cost is tracked separately and never conflated.
- An emergency disable switch is representable by setting a model's `enabled: false` (or `AI_PROVIDER` to an unknown value).

## Billing state machine design (not implemented)

States: `quoted → authorized → reserved → executing → settled`, plus terminal `rejected`, `expired`, `failed`,
`refunded`, `ambiguous`. `AI_BILLING_TRANSITIONS` encodes the valid moves (e.g. `executing → settled|failed|ambiguous|
refunded`; `ambiguous → refunded|failed`; `refunded`/`expired`/`rejected`/`failed` are terminal). No reservation,
settlement, refund, ledger write, or credit mutation occurs in this phase.

## Cloudflare / Vercel parity

The entire catalog/pricing/quote implementation lives in the **shared core**, which remains byte-identical
(24,210 chars) and is asserted by `ai-proxy.mjs` (`core(vercel) === core(cloudflare)`). The platform-specific code is
limited to env access and the `__aiTest` export shape.

## Security analysis

- No API keys in responses or error bodies (asserted). No client-side price/model/provider overrides.
- Exact integer arithmetic (no floats); `aiUsdcToMicro`/`aiTokenCost`/`aiMicroToUsdc` reject negative, non-integer and
  overflow inputs.
- Provider cost "unknown" never silently becomes zero (no fabricated usage).
- No financial state is created or mutated; no paywall; no D1/DO/payment infrastructure.

## Test results

- `tests/ai-catalog-pricing.mjs` — **159 passed** (catalog lookup, exact conversions, zero/negative/overflow rejection,
  token-cost arithmetic, provider cost with cached/unknown/negative usage, clamp semantics, deterministic quotes +
  expiry + version, operation prices, action mapping, billing state machine) across **both** platform builds.
- `tests/ai-proxy.mjs` — **262 passed** (146 Phase 12.0 + 104 Phase 12.1 + 12 Phase 12.2 catalog-validation checks).
- Frontend suites unchanged and green: `ai-chat-ui` 168 · `ai-chat-startup` 67 · `ai-workspace-ui` 183 ·
  `auditor-tab-ui` 90 · `tests-tab-ui` 89 · `creation-tabs-audit` 302 · `ui` 376.

## Known limitations

- Provider rates are unverified (`null`); provider cost is always "unknown" until real, sourced rates are added.
- `gpt-4o-mini`/`gpt-4o` availability is not independently verified; keep them unverified until confirmed.
- The quote id is per-instance (serverless), not globally durable — sufficient for simulation, not for a future ledger.
- The `generate` legacy action remains validated but has no frontend caller.

## Phase 12.3 prerequisites

1. Wallet-signature authentication (`/api/auth/challenge` + `/verify`) and server-side sessions.
2. The official Arc Mainnet USDC address (currently a placeholder) before any deposit work.
3. Verified provider token rates (with source + effective date) to make provider cost non-null.
4. A decision on the `generate` legacy action.
