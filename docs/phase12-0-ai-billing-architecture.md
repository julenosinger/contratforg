# Phase 12.0 — Multi-AI Infrastructure & USDC Billing: Architecture Audit

Status: 2026-11-18 · **Audit & preparation phase — no production code, payments, or live AI changes.**

> Naming note: the existing `docs/phase12-0.md` … `phase12-6.md` belong to a *different, completed*
> workstream (the six analysis-tab UI redesign, locked by `analysis-tabs-audit.mjs` and the `*-tab-ui.mjs` suites).
> This AI-billing workstream uses the `-ai-billing-*` / `-ai-*` suffix to stay distinct.

---

## 1. Initial HEAD and working-tree status

- Initial HEAD: `099f4a6` (also `origin/main`), fetched and verified.
- Branch: `main`. Working tree: clean (no tracked or untracked changes besides local `tests/*.log`, now git-ignored).
- This phase makes **no code changes**; the deliverable is this report.

## 2. Complete existing AI dependency map

### Frontend entry point
`aiFetch(action, payload)` — `contractforge-deploy/app.js:3420`. POSTs `{ action, payload }` to `/api/ai`
with `Content-Type: application/json`, then resolves `{ text, outputTokens }`. It maps HTTP statuses to
friendly errors and throws on missing/unexpected bodies.

### Consumers of `/api/ai` (all four call sites)

| Call site | File:line | Action | Trigger |
|---|---|---|---|
| `runAudit()` | `app.js:3880` | `audit` | AI Auditor "Run AI Audit" |
| `generateTests()` | `app.js:7089` | `tests` | Test Generator "Generate Tests" |
| `aiChatSend()` | `app.js:6759` | `chat` | AI → Solidity composer send |
| `aiChatRunAction()` | `app.js:6696` | `audit` / `tests` | per-code-block Audit / Tests buttons in chat (via `aiChatAudit`, `aiChatTests`) |

The `generate` action exists in the backend but has **no current frontend caller** (legacy generation flow);
it is preserved for API compatibility and validated like the others.

### AI → Solidity workspace state (in-memory + localStorage)
`aiState` (`app.js:6243`) — conversations, `activeId`, `sending`/`sendingId`, status. Chat history is persisted to
`localStorage` under `cf_ai_chats_v1` (`aiLoad`/`aiSave`, `app.js:6273/6282`) with caps: 30 conversations, 40 messages
each, ~200 KB total, 20 000-char message, 15 000-char attached contract context. **No account is attached to chat
history** — it is browser-local only.

### Adoption of AI-generated code
`adoptAiCode(rawCode)` (`app.js:6247`) stamps the code (`matStamp`, template `'ai'`), extracts contract names, sets
`pendingSource = { name, code, template:'ai', aiTargets }`, clears constructor args and navigates to Compile & Deploy.
Generated contracts are **never deployed automatically** — they flow through the existing compile → review → confirm
→ sign → broadcast gates.

## 3. Current `/api/ai` implementation findings

Two backend files share an identical **SHARED CORE** (lines 11–163; `tests/ai-proxy.mjs` asserts byte-identical text):

- `api/ai.js` — Vercel serverless (`module.exports` handler, `req`/`res`, Express-style).
- `functions/api/ai.js` — Cloudflare Pages Function (`onRequestPost` / `onRequest`, `Request` / `env`).

| Finding | Value |
|---|---|
| Provider | **Anthropic only** (`POST https://api.anthropic.com/v1/messages`, `anthropic-version: 2023-06-01`) |
| API key | `ANTHROPIC_API_KEY` — server env (Vercel) / secret binding (Cloudflare). Never in the bundle. |
| Model | default `claude-sonnet-4-6`, overridable by `AI_MODEL`. **Not a structured, server-controlled catalog.** |
| Actions | `audit`, `generate`, `tests`, `chat` — fixed, validated server-side |
| Authentication | **None.** Same-origin check only: `aiOriginOk(origin, sec-fetch-site, host)` + `Sec-Fetch-Site`. |
| Rate limit | per-IP fixed windows (default 6/min, 40/h); memory / KV / Upstash Redis / CF Rate Limiter binding. Best-effort per instance when memory-only. |
| Token metering | `aiExtract` returns `outputTokens` to the client; **nothing is persisted server-side** (no usage ledger). |
| Response validation | text block + output tokens extracted; `audit` requests JSON but is **not schema-validated server-side** (client does `JSON.parse` + `escapeHtml`). |
| Error handling | 400/403/413/415/429/502/503 with generic bodies; provider internals never leak (`ai-proxy.mjs` asserts this). |
| Prompt/context | prompts, focus, coverage, complexity, framework and token limits are built **on the server**; client cannot inject system/model/messages. |
| Availability | Endpoint must be deployed on each host; a 404/405/501 → "AI is not available on this deployment". |

## 4. Cloudflare compatibility assessment

- Cloudflare Pages serves `functions/api/ai.js` (Pages Function). No `_routes.json`; the single function route
  `/api/ai` is the only function, so nothing else is intercepted.
- Secrets are read from `env` bindings (documented in the function header): `ANTHROPIC_API_KEY`, `AI_MODEL`,
  `AI_RATE_LIMITER` (Rate Limiting binding), `AI_RATE_LIMIT_KV` (KV), `UPSTASH_REDIS_REST_URL/_TOKEN`.
- `wrangler.toml` declares **no D1 / KV / Durable Object / R2 bindings today**. The multi-provider + billing work
  will need new bindings added there and in the dashboard (see §16).
- The Vercel function reads `process.env` and uses Upstash Redis (or Vercel KV aliases) for the shared rate limit.
- `build-zip.mjs` ships `contractforge-deploy/` (app assets) plus `functions/` (Pages Functions); `_headers`/`_redirects`
  remain at the root. The zip path is unchanged by this phase.

## 5. Multi-provider adapter design

A provider-independent service layered behind a single route (`/api/ai` today, extended later):

```
Request Validator  →  Authentication  →  Usage/Billing Authorization  →  Provider Router
                                                                           ├─ OpenAI adapter
                                                                           ├─ Anthropic adapter
                                                                           └─ DeepSeek adapter
        ↑                                                                       ↓
Response Normalizer ← Solidity Output Validator ← Usage Metering ← (provider response)
```

**Adapters implement one interface** (per provider), responsible only for: request serialization (the provider's
native message/chat schema), auth header injection, streaming (where supported), timeout, and response parsing into
the normalized shape. Prompts, tool schemas and output constraints stay in one place (the current server-side prompt
builder) so behavior is identical across providers.

- **No automatic fallback**: if a selected provider fails, the request fails (or the user is prompted to retry on
  another provider). The model/price must never silently change.
- **Model catalog lives server-side** (env/D1), never in the frontend. Frontend renders only what the server exposes.
- **Backward compatibility**: the existing `{ action, payload }` → `{ text, outputTokens }` contract is preserved for
  Phases 12.1–12.3; new fields are additive.

## 6. Proposed normalized API schemas

**Request (server-internal, after validation):**

```jsonc
{
  "op": "audit | generate | tests | chat",          // operation type (server-derived)
  "provider": "openai | anthropic | deepseek",       // server-resolved (from session/default)
  "model": "claude-sonnet-4-6",                      // from server catalog
  "system": "…",                                     // built server-side only
  "messages": [ { "role": "user|assistant", "content": "…" } ],
  "maxInputTokens": 60000,                           // chars-equivalent, server cap
  "maxOutputTokens": 2000,
  "maxCalls": 1,                                     // model calls per operation
  "timeoutMs": 45000,
  "requestId": "req_<uuid>",                         // idempotency / trace id
  "context": { "network": { "label": "…", "chainId": 5042, "usdc": "…" }, "soliditySource": "…" },
  "authorizedChargeMicro": 20                        // integer USDC micro-units (server-quoted)
}
```

**Response (normalized):**

```jsonc
{
  "requestId": "req_<uuid>",
  "text": "…",
  "usage": { "inputTokens": 0, "outputTokens": 0 },
  "provider": "anthropic",
  "model": "claude-sonnet-4-6",
  "chargeMicro": 20,                                 // settled charge (0 on failure)
  "status": "ok | partial | failed"
}
```

**Errors (structured, never leaking provider internals):**

```jsonc
{ "error": { "code": "unauthorized | insufficient_funds | rate_limited | provider_down | timeout | invalid_request | not_configured", "message": "…", "retryAfter": 60 } }
```

## 7. Authentication architecture

Today the wallet address is only used to sign transactions (`connectWallet` → `eth_requestAccounts`); **it is not an
authentication mechanism.** For billing we require wallet-signature authentication:

1. `POST /api/auth/challenge` → server issues `{ nonce, domain, address?, issuedAt, expiresAt }` (domain bound to the
   deployed host, short TTL).
2. Client signs with `personal_sign` (EIP-191) over a canonical challenge string.
3. `POST /api/auth/verify` → server recovers the address from the signature (`ecrecover`), verifies nonce freshness,
   domain binding and expiry, then issues a short-lived session token (HttpOnly cookie or server-held token).
4. All billing/usage endpoints require a valid session.

**Properties:** nonce single-use + expiry → replay protection; domain binding → no cross-site challenge reuse;
`eth_accounts` alone never proves control; signatures must never be replayed as transaction signatures (separate
message domain). Sessions are stored server-side (D1) with expiry and revocation.

## 8. USDC deposit architecture

**Target:** Arc Mainnet, chain ID `5042`. **Blocked:** the current `NETWORKS.arcMain.usdc` is
`0x3600000000000000000000000000000000000000` — a **placeholder**. The real Arc USDC contract address must be
verified from an authoritative source (Arc docs / explorer `https://explorer.arc.io`) before any deposit logic. Do not
invent or hardcode it.

**Attribution options compared** (no contract deployed in this phase):

| Option | Security | Gas | Ops complexity | Reconciliation | Notes |
|---|---|---|---|---|---|
| Shared treasury + memo/calldata tag | Low (ambiguous, spoofable) | Low | Low | Hard | Not acceptable alone |
| Unique deposit address per user (derived contract) | High | Medium | Medium | Easy (address↔user map) | Requires deterministic deployment |
| Dedicated payment contract with beneficiary arg | High | Medium | Medium | Easy (event `Deposit(user, amount, id)`) | Clear event; cleanest attribution |
| ERC-20 `transfer` to a per-user counterfactual address | High | Medium | Medium | Easy | No deploy on deposit |

**Recommended:** a dedicated, immutable payment contract emitting
`Deposit(indexed payer, uint256 amount, bytes32 paymentId)` — the on-chain receipt is the unique, forgery-resistant
identifier. Deposit crediting requires: correct `chainId` (5042), the verified USDC token contract, a confirmed
receipt (`confirmations ≥ N`), no re-used tx hash, and reorg tolerance (only credit after finality depth).

## 9. Financial ledger schema (D1, integer USDC micro-units)

USDC has 6 decimals → all amounts are **integers in micro-USDC** (no floats). D1 is the durable source of truth;
Durable Objects are considered **only** for the per-account reservation lock (not as the accounting store).

```sql
-- accounts: identity + aggregate balances (denormalized for reads, reconciled from entries)
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,                -- internal account id
  wallet TEXT UNIQUE NOT NULL,        -- checksummed address
  available_micro INTEGER NOT NULL DEFAULT 0 CHECK (available_micro >= 0),
  reserved_micro INTEGER NOT NULL DEFAULT 0 CHECK (reserved_micro >= 0),
  created_at INTEGER NOT NULL
);
-- entries: immutable double-entry journal (one row = one leg)
CREATE TABLE entries (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id TEXT UNIQUE NOT NULL,      -- idempotency key / event id
  account_id TEXT NOT NULL,
  kind TEXT NOT NULL,                 -- deposit | credit | reserve | settle | release | refund | adjust
  amount_micro INTEGER NOT NULL,      -- signed
  balance_after_micro INTEGER NOT NULL,
  ref TEXT,                           -- tx hash | requestId | reservationId
  created_at INTEGER NOT NULL
);
-- reservations: open holds
CREATE TABLE reservations (
  reservation_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  amount_micro INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'held',  -- held | settled | released
  request_id TEXT UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
-- usage / reconciliation
CREATE TABLE usage (
  usage_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  provider TEXT, model TEXT, op TEXT,
  input_tokens INTEGER, output_tokens INTEGER,
  quoted_micro INTEGER, charged_micro INTEGER,
  status TEXT, created_at INTEGER NOT NULL
);
```

**Transactional invariants (enforced by conditional SQL in one transaction):**

- `available_micro >= 0` and `reserved_micro >= 0` always (`CHECK` + conditional `UPDATE … WHERE available_micro >= amount`).
- No double-credit: deposits keyed by unique `tx_hash`/`paymentId` (`UNIQUE`).
- No double-charge: reservations keyed by unique `request_id`.
- No spend beyond reservation: settle requires a `held` reservation of `>=` amount.
- No settlement without a reservation; no client-authorized balance change (only server-side functions mutate).
- No credit from unconfirmed transactions (only after finality depth).
- Retries/timeouts are safe: `reserve` → `execute` → `settle`/`release` is idempotent by `request_id`.

## 10. Payment & AI operation state machines

**Deposit:** `detected` → `confirming` → `confirmed` → `credited` (or `orphaned` if no user matches → `reconciled`).

**AI operation:** `quoted` → `reserved` → `executing` → `settled` | `released` | `failed`.
- Provider timeout or ambiguous outcome → `release` the reservation (never silently charge), record a zero-charge
  `failed` usage row; a partial output may be billed per an explicit published policy (§12).

## 11. Idempotency and concurrency design

- Every mutation carries a client-generated `Idempotency-Key` (or server `request_id`); the ledger `entry_id`/`request_id`
  uniqueness makes retries safe.
- The reservation lock is a D1 conditional update (`UPDATE reservations SET status='held' WHERE reservation_id=? AND status='pending'`)
  or, under high contention, a Durable Object per account. All balance mutations use `WHERE` guards so concurrent
  requests cannot overdraw.

## 12. Pricing and cost-control model

- Server-side pricing engine; the frontend never computes or overrides amounts.
- Reference price **0.20 USDC (200 000 micro-USDC)** for standard Solidity generation — a commercial proposal, not a
  profitability guarantee.
- Per-operation price table (server): `simple question < generation < correction < explanation < audit < tests < multi-step workflow`,
  multiplied by provider/model rate where appropriate.
- Caps: max input tokens, max output tokens, max model calls per operation, max authorized charge, quote expiry (e.g. 60 s),
  server-side quote re-verification, provider-usage reconciliation (reconcile provider-reported tokens vs billed).
- **The model never sets its own price; the client never overrides billing.**
- Kill switches: global/account budget thresholds, emergency disable flag, provider outage circuit-breaker.
- Failure policy: failed/timeout = no charge; partial outputs billed only by an explicit, published rule; no silent
  charging; no unlimited retry loops (max retries + backoff).

## 13. Security threat model

| Threat | Control |
|---|---|
| Unauthorized AI consumption | wallet-signature auth + session; per-account balance |
| API key exposure | keys server-side only (env/bindings); never in bundles/HTML/storage/logs/API responses/git |
| Wallet impersonation | nonce challenge + `ecrecover` + domain binding + expiry |
| Signature replay | single-use nonce, server session, `request_id` idempotency |
| Duplicate deposits / charges | unique `tx_hash`/`paymentId`/`request_id` keys |
| Concurrent balance spending | conditional `WHERE available >= amount` updates; reservation lock |
| Request replay | idempotency keys; single-use reservations |
| Provider timeout ambiguity | default release (no charge) unless explicit partial policy |
| Prompt injection | prompts/data server-built; user contract text treated as DATA (already enforced) |
| Malicious Solidity output | output is untrusted text; compiled then reviewed; compile ≠ security proof |
| XSS via AI responses | all AI text rendered with `escapeHtml`; severity words allow-listed |
| Cost exhaustion | budget thresholds, per-account caps, rate limits, kill switch |
| Cross-chain confusion | strict `chainId === 5042` + verified token + verified recipient |
| Unauthorized deployment | AI output never signs/broadcasts; explicit user review + existing maturity gates |

## 14. Proposed UI integration (Phases 12.2–12.4, not now)

Add to the AI workspace (and later the auditor/test tabs): provider selector, model selector, operation selector,
available-credit badge, operation price, estimated consumption, explicit confirm-before-charge, processing status,
streaming, Solidity preview, compile diagnostics, usage/payment history. **The existing conversation system and the
`adoptAiCode` flow are preserved unchanged.** AI text never executes transactions or mutates billing state.

## 15. Implementation sequence (Phases 12.1–12.5)

- **12.1** — Multi-provider adapter core + normalized contract, `ANTHROPIC_API_KEY` kept as the live path; add
  `OPENAI_API_KEY`/`DEEPSEEK_API_KEY` (optional); provider resolver from server config; keep the existing
  `{action,payload}`→`{text,outputTokens}` contract. Non-invasive, behind the same route.
- **12.2** — Server-controlled model catalog + per-operation pricing engine + quote endpoint (no charging yet).
- **12.3** — Wallet-signature auth (`/api/auth/challenge` + `/verify`), sessions in D1.
- **12.4** — USDC deposits (verified Arc USDC + payment contract), D1 ledger, reservation/settle/release.
- **12.5** — Enforce billing authorization on `/api/ai`, usage metering, reconciliation, history UI, kill switches.

## 16. Required Cloudflare resources and secrets

- **Secrets/bindings:** `ANTHROPIC_API_KEY` (exists), `OPENAI_API_KEY`, `DEEPSEEK_API_KEY` (new, optional in 12.1);
  `AI_MODEL`, rate-limit bindings (exist). Vercel equivalents via `process.env`.
- **D1:** `AI_BILLING_DB` (accounts, entries, reservations, usage).
- **Optional DO:** `ACCOUNT_LOCK` per-account reservation coordinator (only if D1 contention is insufficient).
- **Optional KV/R2:** none required for billing (D1 is authoritative).
- **Dashboard changes:** add the D1/DO bindings to the Cloudflare Pages project (production **and** preview separately),
  and the corresponding `wrangler.toml` `[[d1_databases]]` / `[[durable_objects.bindings]]` blocks. Secrets are set in
  the dashboard, never committed.

## 17. Test baseline & regression evidence

Fresh baseline (this phase, no code changed; routing suites re-run from Phase 11.5.1):

| Suite | Result |
|---|---|
| `ai-proxy.mjs` | 146 passed |
| `ai-chat-ui.mjs` | 168 passed |
| `ai-chat-startup.mjs` | 67 passed |
| `ai-workspace-ui.mjs` | 183 passed |
| `auditor-tab-ui.mjs` | 90 passed |
| `tests-tab-ui.mjs` | 89 passed |
| `app-routing-stability.mjs` | 137 passed |
| `cloudflare-routing-recovery.mjs` | 96 passed |
| `header-layout-stability.mjs` | 156 passed |
| `network-selector-stability.mjs` | 204 passed |
| `mainnet-default-network.mjs` | 40 passed |
| `csp-browser.mjs` | 11 passed |

**Pre-existing failures (unchanged, not introduced here):**

- `ai-chat-browser.mjs` — 117 passed, **11 failed**: AI-workspace position measurements ("workspace starts right under
  the wallet header", "composer sits at the bottom of the screen"). These predate this phase (the file was last touched
  in Phase 8.3.1; the Phase 11.3 header footprint likely shifted the measured offsets) and are **not in CI**.
- Locale-dependent thousands separators in `analysis-tabs-audit.mjs` / `gas-tab-ui.mjs` / `analytics-tab-ui.mjs`
  (local pt-BR; pass on CI's `C.UTF-8`).
- `header-home-browser.mjs` "phone: Actions menu opens inside the screen".

No CI run is required for this audit-only phase (no code changed); the last green run is
`44354197234` (all four jobs) at `099f4a6`.

## 18. Open questions and deployment blockers

1. **Arc Mainnet USDC address is a placeholder** (`0x36…0000`) — must be verified before Phase 12.4. **Hard blocker.**
2. **Arc native gas token** is labeled `USDC` with `gasDecimals: 18` in `NETWORKS.arcMain` while the ERC-20 `usdc`
   is 6 decimals — the payment token (ERC-20 USDC) must not be confused with the native gas token.
3. **Naming collision** between this workstream ("12.0–12.5") and the completed analysis-tabs phases (`phase12-*.md`);
   resolved by using the `-ai-*` suffix.
4. **Cloudflare dashboard configuration** (D1/DO bindings, preview vs production secrets) is external to this repo and
   cannot be validated here.
5. **Session/token design** (cookie vs header, expiry, revocation) needs a decision in Phase 12.3.
6. **Deposit attribution** (payment contract vs unique addresses) needs a final choice and the real token address in
   Phase 12.4.

---

## File-by-file implementation plan — Phase 12.1 (multi-provider adapter core)

Objective: add OpenAI and DeepSeek adapters behind a provider router while keeping Anthropic (and the existing
`{action,payload}`→`{text,outputTokens}` contract) as the default, with **no visible behavior change**.

1. **`functions/api/ai.js`** (Cloudflare) and **`api/ai.js`** (Vercel) — keep the identical SHARED CORE; add a
   `providers/` adapter set (one new file per provider) or inline small `adaptOpenAI`/`adaptDeepSeek` helpers that map
   the normalized `{ system, messages, maxTokens }` into each provider's native request, inject the key from
   `env.OPENAI_API_KEY` / `env.DEEPSEEK_API_KEY`, and parse the native response back to `{ text, outputTokens }`.
   Resolve provider from `env.AI_PROVIDER` (default `anthropic`); keep `AI_MODEL` as the selected model. No fallback.
2. **`api/ai.js` header comment** — document the two new optional env vars and the provider resolution order.
3. **`functions/api/ai.js` header comment** — same, plus the new secret bindings.
4. **`tests/ai-proxy.mjs`** — add cases: provider selection via `AI_PROVIDER`; OpenAI/DeepSeek request shaping and
   response parsing; missing key → `503`; unknown provider → `503`/`400`; **no automatic fallback** (a failing selected
   provider returns `502`, never silently switches). Keep all 146 existing checks passing.
5. **`wrangler.toml`** — (optional, dashboard-driven) document `OPENAI_API_KEY` / `DEEPSEEK_API_KEY` as secrets; no
   binding changes needed for the adapter core itself.
6. **No changes** to `app.js`, `index.html`, `app.css`, generators, compiler, deploy, wallet, or network code.
7. **`docs/phase12-1-ai-adapters.md`** — record the new contract and test evidence.

The `generate` legacy action is left as-is (still validated, still server-built) until a decision is made about
removing it.
