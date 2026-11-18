# Phase 12.3 — DeepSeek Production Verification + Secure Wallet Authentication

Status: 2026-11-18. Part A audits and mock-verifies the DeepSeek integration (live verification remains pending external
configuration). Part B implements an isolated wallet-authentication foundation (SIWE challenge/verify, EIP-191 signature
recovery, durable nonce/session storage, HttpOnly sessions) without enabling billing, paywalls, or frontend changes.

## Initial / final HEAD

- Initial: `31f44ef` · Final: see the commit for this phase.

## Files modified

- `functions/vendor/noble/secp256k1.mjs` + `sha3.mjs` — vendored `@noble/curves`/`@noble/hashes` (MIT), the pure-JS
  secp256k1 + keccak256 used for EIP-191 signature recovery. Duplicated at `vendor/noble/*.mjs` for Vercel.
- `functions/api/auth/_auth.mjs` + `api/auth/_auth.mjs` — **byte-identical** shared auth core (SIWE message, recovery,
  challenge/verify handlers, D1 store adapter).
- `functions/api/auth/challenge.js` + `verify.js` — Cloudflare Pages Functions (`POST /api/auth/challenge`, `/verify`).
- `api/auth/challenge.js` + `verify.js` — Vercel serverless functions (same endpoints).
- `migrations/0001_auth.sql` — D1 schema (challenges + sessions).
- `tests/auth-wallet.mjs` — new, 56 checks. `tests/package.json` — wired into `npm test`.
- `docs/phase12-3-auth-deepseek-verification.md` — this document.

No changes to `app.js`, HTML, CSS, generators, compiler, deploy, wallet, network, or routing.

## DeepSeek configuration findings (Part A1)

The Cloudflare Pages Function reads `DEEPSEEK_API_KEY` from `env` (`functions/api/ai.js`); the Vercel function reads
`process.env` (`api/ai.js`). The provider is resolved from `AI_PROVIDER` (default `anthropic`); the DeepSeek model from
`DEEPSEEK_MODEL` (default `deepseek-flash`, verified current per official docs; `deepseek-chat`/`deepseek-reasoner`
deprecated 2026-07-24). The expected production configuration is:

```
DEEPSEEK_API_KEY = [encrypted secret]
AI_PROVIDER      = deepseek
DEEPSEEK_MODEL   = deepseek-flash
```

The model identifier matches the implemented adapter and the approved catalog (`deepseek:deepseek-flash`, enabled).

## Mock verification results (Part A2/A3)

`tests/ai-proxy.mjs` (262 checks) and `tests/ai-catalog-pricing.mjs` (159 checks) already cover, with deterministic mocks:

- DeepSeek selection via `AI_PROVIDER=deepseek`; endpoint `api.deepseek.com/chat/completions`; `Authorization: Bearer`.
- `deepseek-flash` default; `deepseek-reasoner` disabled; unknown model → 503.
- Response normalization (`choices[0].message.content` → `text`, `completion_tokens` → `outputTokens`).
- Missing `DEEPSEEK_API_KEY` → 503 with **no fallback**; Anthropic default preservation; no automatic fallback.
- Usage normalization (input/output/cached tokens), malformed/empty responses, provider 400/401/403/429/500 → 502 without leaking.

## Live verification status (Part A3)

A live probe of `https://contractv4.pages.dev/api/ai` (2026-11-18) with a valid Origin returned:

```
HTTP 503  { "error": "AI is not configured on this deployment." }
```

The endpoint is deployed, but **no provider key is active** and `AI_PROVIDER` is not set to `deepseek`. `POST
/api/auth/challenge` returns 405 (the new functions are not deployed until this commit is released). **Live DeepSeek
connectivity is therefore PENDING** — it cannot be claimed. The exact remaining step: set `AI_PROVIDER=deepseek`,
`DEEPSEEK_MODEL=deepseek-flash`, ensure `DEEPSEEK_API_KEY` is bound, redeploy, then make one minimal request (e.g. the AI
→ Solidity chat) and confirm a 200 with normalized output. No provider behavior changes are made by this phase.

## Authentication architecture (Part B)

Two endpoints, both delegating to a **byte-identical** shared core (`_auth.mjs`; a test asserts equality):

- **`POST /api/auth/challenge`** — validates the request Origin against the deployment host (never a client-supplied
  domain); validates the address; generates a 32-byte random nonce; builds a SIWE (EIP-4361 subset) message binding
  domain, URI, chain id, nonce, issued-at and expiration; stores the challenge durably; returns `{ nonce, message, … }`.
- **`POST /api/auth/verify`** — validates origin/address/signature/nonce; **atomically consumes** the nonce (a single
  `DELETE … WHERE nonce = ? AND expires_at > ? RETURNING …`), so a nonce is single-use and race-safe; checks the stored
  address; rebuilds the message from the stored challenge; recovers the signer via EIP-191 (secp256k1 + keccak256,
  vendored `@noble`); compares recovered == claimed; issues a session whose token is stored only as a `keccak256` hash;
  returns an `HttpOnly; Secure; SameSite=Lax` cookie.

Only EOA signatures (`v` 27/28) are accepted; contract-wallet (ERC-1271) signatures are explicitly rejected (recovery
returns `null`), documented as out of scope rather than weakening EOA verification.

## Durable storage requirements (Part B3)

The store interface (`putChallenge`, `consumeChallenge`, `putSession`, `getSession`, `deleteSession`) is implemented by
`d1Store(db)` for Cloudflare D1. Nonce consumption is a single atomic SQL statement (replay- and race-safe); only the
session-token **hash** is stored. The D1 schema is `migrations/0001_auth.sql`. No in-memory `Map` is used in production:
if no store is bound, the endpoints return `503 "Authentication storage is not configured"`. **Blockers:** the D1 database
must be created in the Cloudflare dashboard and bound as `AUTH_DB`, then the migration applied; Vercel needs an equivalent
durable store wired in `api/auth/*.js`. Until then, production authentication stays off.

## Security test results (Part C)

`tests/auth-wallet.mjs` (56 checks, both platform cores + a known EIP-191 vector): challenge uniqueness, challenge
expiration, invalid signature, wrong address, wrong origin/domain (cross-domain replay), nonce replay, concurrent nonce
consumption, session expiration/revocation, cookie security (`HttpOnly; Secure; SameSite=Lax`), CSRF (Origin check), raw
session token never in the body, missing durable storage → 503, D1 adapter SQL + atomic consume, Cloudflare/Vercel handler
wiring and parity. DeepSeek items 1–6 are covered by the existing `ai-proxy.mjs`/`ai-catalog-pricing.mjs`.

## Cloudflare / Vercel parity

The auth core is byte-identical across platforms; the platform files differ only in the thin transport wrapper (Pages
`onRequestPost` vs Vercel `(req,res)`), matching the existing `api/ai.js` pattern. The vendored crypto is placed at
matching relative depth (`functions/vendor/noble/` and `vendor/noble/`), and `.mjs` keeps it out of Cloudflare's `.js`
file-based routing.

## Existing test baseline (regression)

`ai-proxy` 262 · `ai-catalog-pricing` 159 · `auth-wallet` 56 · `ai-chat-ui` 168 · `ai-workspace-ui` 183 · `zip` 15 ·
`headers` 6 — all green. No pre-existing suite regressed. (Known, unchanged: the locale thousands-separator suites and the
`ai-chat-browser` layout offsets, which are not in CI.)

## Remaining blockers

1. **Live DeepSeek**: set `AI_PROVIDER=deepseek` + `DEEPSEEK_MODEL=deepseek-flash`, bind `DEEPSEEK_API_KEY`, redeploy.
2. **D1**: create the `AUTH_DB` database, apply `migrations/0001_auth.sql`, bind it to the Pages project (dashboard).
3. **Vercel durable store**: wire a durable store (Upstash/Postgres) in `api/auth/*.js` for Vercel production auth.
4. **ERC-1271** (smart-contract wallets) is not implemented; rejected explicitly.

## Next-phase prerequisites (Phase 12.4)

1. The verified Arc Mainnet USDC address (currently the placeholder `0x36…0000`).
2. D1 binding + migration live (so sessions/accounts can persist).
3. A decision on the deposit-attribution mechanism (payment contract vs unique addresses) before any deposit work.
