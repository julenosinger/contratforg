# Phase 12.3.3 — DeepSeek Empty Response Recovery

Status: 2026-11-18 · **Root cause identified and fixed in code; live AMM verification pending redeploy.**

## Initial HEAD / production SHA

- Initial HEAD: `5f855cf` (production code unchanged through the investigation).
- The current production build still runs the pre-fix code until a redeploy.

## Exact reproduction

AI → Solidity chat with:

> "A minimal constant-product AMM for two ERC-20 tokens. Add/remove liquidity and swap both ways. 0.3% fee on swaps goes to liquidity providers."

The UI showed `Generating…` → then `The AI returned an empty answer.` / `The request could not be completed`.

## HTTP response evidence (live, 2026-11-18)

| Probe | Request | Result |
|---|---|---|
| P0 | `{"action":"bogus"}` | **400** — provider/key config is now correct (reached action validation) |
| Test A (short) | chat "What is an ERC-20 token? Answer in one sentence." | **200**, `text` ~350 bytes (valid content) |
| Test B (AMM) | the AMM prompt | **200**, `{"text":"","outputTokens":4096}` in **27.5 s** |

Test B is decisive: the request succeeded (HTTP 200), DeepSeek generated **4096 tokens** (the entire output budget), but
returned **empty `text`**. This is the signature of DeepSeek's thinking mode exhausting the `max_tokens` budget on
reasoning (`finish_reason: "length"`), leaving no room for the actual answer.

## Root cause

The DeepSeek adapter (`functions/api/ai.js` / `api/ai.js`) sent `{ model, max_tokens, messages }` **without** disabling
thinking. DeepSeek's `deepseek-flash` (V4) enables thinking mode by default, so a complex request (a full AMM) spends the
entire `max_tokens=4096` budget on hidden reasoning and returns empty `content`. Short requests worked because their
reasoning + answer fit under 4096; the long AMM generation did not.

## DeepSeek model verification

`deepseek-flash` is the current, valid provider model identifier (served by DeepSeek-V4.1-Flash; the legacy `deepseek-chat`
/`deepseek-reasoner` were deprecated 2026-07-24). The catalog entry `deepseek:deepseek-flash` is enabled. The model is not
the problem — the missing `thinking: { type: "disabled" }` was.

## Response parsing findings

The adapter correctly reads `choices?.[0]?.message?.content` and normalizes `usage.completion_tokens` →
`outputTokens`. The empty text was genuine (the provider returned empty content after exhausting the budget), not a parser
bug. No fabricated content is produced.

## Frontend handling findings

The frontend (`aiFetch` + `aiChatSend`) awaits the response, reads `data.text`, and throws `The AI returned an empty answer.`
only when `text` is genuinely empty; the loading indicator always terminates in `finally`. No frontend change is required.

## Files modified

- `functions/api/ai.js` and `api/ai.js` (byte-identical shared core):
  1. DeepSeek adapter now sends `thinking: { type: "disabled" }`.
  2. `AI_MAX_TOKENS.chat` raised `4096 → 8192`.
  3. Model-catalog `maxOutputTokens` raised `4096 → 8192`.
- `tests/ai-proxy.mjs` — updated chat-budget assertions; added DeepSeek thinking-disabled, raised-budget, and
  empty-content (no fabrication) checks.
- `tests/ai-catalog-pricing.mjs` — added a catalog `maxOutputTokens === 8192` check.
- `docs/phase12-3-3-deepseek-empty-response-recovery.md` — this report.

## Minimal correction applied

`thinking: { type: "disabled" }` (root cause) plus a raised `chat` output budget (8192) so a full NatSpec AMM is not
truncated. No provider fallback, no fabricated text, no streaming, no unrelated changes. Anthropic and OpenAI adapters are
unchanged.

## Tests before and after

- `ai-proxy.mjs`: **262 → 272** (10 new: thinking disabled for audit + chat, chat budget 8192 for Anthropic/OpenAI/DeepSeek,
  empty-content → empty text without fabrication).
- `ai-catalog-pricing.mjs`: **159 → 161** (catalog max-output 8192).
- Frontend suites unchanged and green: `ai-chat-ui` 168 · `ai-chat-startup` 67 · `ai-workspace-ui` 183 ·
  `auditor-tab-ui` 90 · `tests-tab-ui` 89 · `creation-tabs-audit` 302 · `ui` 376.

## Production deployment verification

The code fix must be redeployed to `contractv4.pages.dev` (Direct Upload: `npx wrangler pages deploy contractforge-deploy`,
or a fresh dashboard upload — not "Retry deployment"). The deployed SHA will only change after that redeploy.

## Short-request result

**Live: 200 with valid content** (an ERC-20 explanation) — confirmed before the fix.

## AMM-request result

**Live: 200 with empty `text`, `outputTokens: 4096`** — reproduced before the fix. Post-fix live verification is **pending
redeploy** (I have no Cloudflare deploy access).

## Remaining risks

- The post-fix AMM generation cannot be verified live until a redeploy. With thinking disabled, the AMM (~3–5 k tokens)
  should complete, but generation time may approach the Pages Function wall-clock limit for very large contracts (a
  documented future limitation; streaming is out of scope).
- Long generations beyond ~8 k tokens remain a known limit; raising further would need a streaming/async job design.

## Final commit SHA

See the commit for this phase.

## Classification

**PARTIALLY_RECOVERED** — short requests are verified live; the long-generation root cause (DeepSeek thinking mode) is
fixed and mock-verified, but the AMM case requires a production redeploy to confirm end-to-end recovery.
