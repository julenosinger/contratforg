# Phase 12.1 — Multi-AI Provider Router (OpenAI · Anthropic · DeepSeek)

Status: 2026-11-18 · **Backend-only provider integration.** Anthropic remains the default; OpenAI and DeepSeek adapters are
added behind a server-controlled router. No billing, no wallet auth, no UI changes, no frontend provider selector.

## Initial / final HEAD

- Initial: `a7b4a7d` · Final: see the commit for this phase.

## Modified files

- `api/ai.js` — Vercel serverless function: shared core gained the provider router; the handler now resolves the provider
  from `AI_PROVIDER` and calls the shared `aiCallProvider`.
- `functions/api/ai.js` — Cloudflare Pages Function: identical shared-core additions; handler reads provider config from `env`.
- `tests/ai-proxy.mjs` — 104 new checks (146 → 250).
- `docs/phase12-1-ai-provider-router.md` — this document.

**No changes** to `app.js`, `index.html`, `app.css`, generators, compiler, deploy, wallet, network, or routing. The frontend
`aiFetch` and the public `{ text, outputTokens }` contract are untouched.

## Provider architecture

```
POST /api/ai
  → existing origin check + rate limit (unchanged)
  → aiResolveProvider(read)        // 'AI_PROVIDER' → anthropic | openai | deepseek | null (unknown)
  → key check (AI_KEY_VARS)        // missing → 503, no fallback
  → aiBuild(body)                  // unchanged: validates action + payload, builds { system, user, messages, maxTokens }
  → aiCallProvider(provider, built, read)  // adapter.body → fetch (timeout) → adapter.parse
  → { text, outputTokens }         // unchanged public response
```

The shared core now contains: `AI_PROVIDERS`, `AI_KEY_VARS`, `AI_TIMEOUT_MS_DEFAULT`, `aiResolveProvider`, `aiModelFor`,
`aiTimeoutMs`, `AI_ADAPTERS` (one adapter per provider), and `aiCallProvider`. These are **byte-identical** in both
platform files; `tests/ai-proxy.mjs` still asserts `core(vercel) === core(cloudflare)` (15 998 chars).

Key properties:

- **No silent fallback** — a selected provider that fails, times out, or has no key returns an error; it never tries another.
- **No retry** — a single provider call per request; a timeout never triggers another paid request.
- **Server-controlled provider/model/key** — the client payload cannot choose the provider, model, or system prompt.

## Configuration variables

| Variable | Purpose | Default |
|---|---|---|
| `AI_PROVIDER` | select provider: `anthropic` \| `openai` \| `deepseek` | `anthropic` |
| `ANTHROPIC_API_KEY` | Anthropic key (existing) | — (required for anthropic) |
| `AI_MODEL` | Anthropic model (existing) | `claude-sonnet-4-6` |
| `OPENAI_API_KEY` | OpenAI key (new) | — (required for openai) |
| `OPENAI_MODEL` | OpenAI model (new) | `gpt-4o-mini` |
| `DEEPSEEK_API_KEY` | DeepSeek key (new) | — (required for deepseek) |
| `DEEPSEEK_MODEL` | DeepSeek model (new) | `deepseek-flash` |
| `AI_TIMEOUT_MS` | upstream request timeout (new) | `45000` |

An absent `AI_PROVIDER` preserves Anthropic. An unknown `AI_PROVIDER` → controlled `503`. A selected provider with no key
→ `503`. All keys stay server-side and never appear in any client response (asserted by tests).

## Cloudflare setup

Set the secrets as **environment variables / secrets** on the Pages project (Dashboard → project → Settings →
Environment variables), separately for **Production** and **Preview**:

- `ANTHROPIC_API_KEY` (already present), `AI_PROVIDER` (optional), `AI_MODEL` (optional)
- `OPENAI_API_KEY`, `OPENAI_MODEL` — only if enabling OpenAI
- `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL` — only if enabling DeepSeek
- `AI_TIMEOUT_MS` (optional)

Pages Functions read them through `env` (`functions/api/ai.js`). No `wrangler.toml` binding change is required for the
adapter core.

## Vercel setup

Set the same variables as **server environment variables** (Dashboard → project → Settings → Environment Variables),
separately per environment. The Vercel function reads them through `process.env` (`api/ai.js`).

## Provider request/response mappings

| | Anthropic | OpenAI | DeepSeek |
|---|---|---|---|
| Endpoint | `api.anthropic.com/v1/messages` | `api.openai.com/v1/chat/completions` | `api.deepseek.com/chat/completions` |
| Auth header | `x-api-key: <key>` + `anthropic-version` | `authorization: Bearer <key>` | `authorization: Bearer <key>` |
| Output cap | `max_tokens` | `max_completion_tokens` (deprecated `max_tokens` not used) | `max_tokens` |
| System prompt | separate `system` field | first `system` message | first `system` message |
| Text | `content[].text` | `choices[0].message.content` | `choices[0].message.content` |
| Output tokens | `usage.output_tokens` | `usage.completion_tokens` | `usage.completion_tokens` |
| Input tokens | `usage.input_tokens` | `usage.prompt_tokens` | `usage.prompt_tokens` |

OpenAI uses `max_completion_tokens` (the current field; `max_tokens` is deprecated and rejected by reasoning models).
DeepSeek uses its OpenAI-compatible schema with `max_tokens` (valid 1…384K). `deepseek-flash` is the current model per the
official DeepSeek docs; `deepseek-chat`/`deepseek-reasoner` were deprecated 2026-07-24 and are not used as defaults.

## Error classification

| Condition | Status | Public body |
|---|---|---|
| Unknown `AI_PROVIDER` | 503 | `AI is not configured on this deployment.` |
| Selected provider key missing | 503 | `AI is not configured on this deployment.` |
| Any upstream HTTP failure (400/401/403/429/500…) | 502 | `AI request failed` (no provider detail) |
| Upstream timeout | 502 | `AI request failed` |

Internally, `aiCallProvider` distinguishes a timeout (`{ ok:false, timedOut:true }`) from an HTTP status
(`{ ok:false, status }`) for future billing classification; the public response stays a generic 502.

## Token usage semantics

- `outputTokens` is the only field in the public response (unchanged).
- Internally, `inputTokens` and `outputTokens` are normalized from each provider's own usage fields and are `0` when
  absent — **never fabricated**. This distinction (reported vs unknown) is preserved for future billing, which must never
  charge on fabricated usage.

## Security considerations

- Keys are server-side only (env/bindings), never in the bundle, HTML, storage, logs, responses, or git.
- The client cannot override the provider, model, system prompt, or token limits (existing `aiBuild` validation preserved).
- Provider error bodies are never forwarded; only a generic `502` message is returned.
- Same-origin + IP rate limiting are unchanged and run before the provider call.
- No auto-fallback prevents a provider outage from silently switching the user to a different (possibly more expensive) model.

## Test results

- `tests/ai-proxy.mjs`: **250 passed, 0 failed** (146 baseline + 104 new). New coverage: OpenAI/DeepSeek selection, request
  shaping (endpoints, auth headers, `max_completion_tokens` vs `max_tokens`, system-as-message), model override,
  response normalization, missing usage (→ 0), malformed/empty/null responses, provider 400/401/403/429/500 → 502 without
  leaking, explicit Anthropic selection, unknown provider → 503, missing OpenAI/DeepSeek key → 503 with **no fallback**,
  provider timeout → 502, no cross-request config leakage, and client-sent `provider` field ignored.
- Frontend AI suites unchanged and green: `ai-chat-ui` 168 · `ai-chat-startup` 67 · `ai-workspace-ui` 183 ·
  `auditor-tab-ui` 90 · `tests-tab-ui` 89 · `creation-tabs-audit` 302 · `ui` 376.

## Known limitations

- **No live-provider verification** — adapters are validated against deterministic mocks only. Real OpenAI/DeepSeek
  connectivity requires authorized credentials and is **pending**.
- `OPENAI_MODEL` default `gpt-4o-mini` is a legacy Chat Completions model and must be verified/overridden before enabling
  OpenAI in production; newer GPT-5/o-series models use the Responses API (out of scope here).
- DeepSeek thinking mode is left at provider default; the `content` field always carries the final answer.
- No streaming (the existing contract is non-streaming).

## Deployment verification status

- Cloudflare and Vercel shared-core parity verified by `ai-proxy.mjs` (byte-identical core).
- Live deployment (production keys + real provider calls) remains **pending external configuration** — see below.

## Next-phase prerequisites (Phase 12.2)

1. A server-controlled model catalog (replace the env-only defaults with a D1/static catalog) and per-operation pricing.
2. Decide on the `generate` legacy action (still validated, no frontend caller).
3. Real `OPENAI_API_KEY` / `DEEPSEEK_API_KEY` (and chosen models) for live verification, if OpenAI/DeepSeek are to be
   enabled in production.
