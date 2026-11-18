# Phase 12.3.1 — DeepSeek Production Failure Investigation & Recovery

Status: 2026-11-18 · Emergency diagnostic. Root cause identified as **external Cloudflare configuration**; no application
code was changed. This document records the evidence, the decision tree, and the exact recovery steps.

## Initial HEAD

`fbb40f4` (unchanged; no code commit was necessary).

## Root cause (with evidence)

The production `/api/ai` returns `503 "AI is not configured on this deployment."` because the deployed Pages Function is
**not receiving the configured environment variables/secrets** (`AI_PROVIDER`, `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`). The
code itself is correct and deployed; the failure is in how Cloudflare binds the dashboard configuration to the runtime
Worker.

### Verified facts (live probes, 2026-11-18)

| Probe | Request | Result | Meaning |
|---|---|---|---|
| P1 | `POST /api/ai` `{"action":"bogus"}` + valid Origin | **503** `AI is not configured on this deployment.` | provider/key check fails *before* action validation |
| P2 | `POST /api/ai` wrong Content-Type | **415** `Unsupported media type` | the function is deployed and running |
| P3 | `POST /api/ai` no Origin | **403** `Forbidden` | origin check works |
| P4 | `POST /api/auth/challenge` | **503** `Authentication storage is not configured…` | the **Phase 12.3 (fbb40f4) code is deployed** (auth endpoint exists) |
| P5 | `GET /api/ai` | **405** `Method not allowed` | method routing works |

The decisive observation is P1 vs P4 together: the current (fbb40f4) code is deployed (P4 proves the new auth function
exists), yet `/api/ai` fails its provider/key check (P1). In the current code, `{"action":"bogus"}` would return **400
"Invalid request"** if `AI_PROVIDER` resolved to `deepseek` and `DEEPSEEK_API_KEY` were present — because the invalid
action is only rejected *after* the provider/key check. It returned 503 instead, so the provider/key check is failing.

## Decision tree for the 503

`aiResolveProvider(read)` → `read(AI_KEY_VARS[provider])` → (body → `aiBuild` → `aiCallProvider`) all share one message:

1. **Unknown provider** — `AI_PROVIDER` is not `anthropic`/`openai`/`deepseek` (or is unset, defaulting to `anthropic`).
2. **Missing provider key** — the selected provider's key env is absent/empty (`DEEPSEEK_API_KEY`, or `ANTHROPIC_API_KEY`
   when `AI_PROVIDER` is unset).
3. **Unknown/disabled model** — reachable only *after* a valid action and a present key.

Because P1 (`action:"bogus"`) returned 503 (not 400), the failing branch is **1 or 2** (both occur before action
validation). They are indistinguishable externally because they share one message — a diagnosability limitation noted
below. Both point to the same root cause: the dashboard variables are not reaching the runtime Function.

## Cloudflare configuration findings

- The repo has **no root `wrangler.toml`** and **no deploy workflow**; `ci.yml`/`release.yml` only build/attach a ZIP
  artifact. The project (`contractv4`) is therefore deployed **manually** (Direct Upload / `wrangler pages deploy`).
- `contractforge-deploy/wrangler.toml` declares **no `[vars]` and no bindings** — so a `wrangler pages deploy` run with
  this config injects no environment variables by itself.
- Cloudflare Pages "frozen snapshot" behavior (documented): variables/secrets changed in the dashboard do **not** reach an
  already-served deployment; they apply only to a **new** deployment. A "Retry deployment" re-serves the frozen snapshot.

## Model catalog findings

`deepseek:deepseek-flash` is present, enabled, and supports all four actions (`chat`/`audit`/`tests`/`generate`) in
`functions/api/ai.js` (verified by `tests/ai-catalog-pricing.mjs`). The model identifier matches the adapter and is
current per official DeepSeek docs. No catalog issue.

## Files changed

Only this report (`docs/phase12-3-1-deepseek-production-recovery.md`). The root cause is external configuration, so no
application code was changed (per the "smallest possible fix" directive).

## Exact correction (user action — requires Cloudflare dashboard/CLI access)

1. **Confirm the project type** — Cloudflare dashboard → Workers & Pages → `contractv4` → Settings. Note whether it is
   Git-integrated or Direct Upload.
2. **Set the variables in the Production environment** (the selector at Settings → Variables and Secrets must be
   **Production**, not Preview), exact names:
   - `AI_PROVIDER` = `deepseek` (plaintext)
   - `DEEPSEEK_MODEL` = `deepseek-flash` (plaintext)
   - `DEEPSEEK_API_KEY` = the key (mark **Encrypt** / secret)
3. **Trigger a genuinely new deployment** (do not use "Retry deployment", which re-serves the frozen snapshot):
   - Direct Upload: from the repo root run `npx wrangler pages deploy contractforge-deploy` (the `functions/` directory is
     picked up from the working directory), **after** the variables are set.
   - Git-integrated: push a commit (or "Create deployment" / "Retry" that performs a real rebuild).

If the Direct Upload path continues to ignore dashboard variables, set the two plaintext variables in
`contractforge-deploy/wrangler.toml` under `[vars]` (do not put the key there) and pass the key with
`npx wrangler pages secret put DEEPSEEK_API_KEY` before deploying.

## Verification (safe — no paid request)

Re-run P1 after the fix:

```
curl -sS -X POST https://contractv4.pages.dev/api/ai \
  -H "Origin: https://contractv4.pages.dev" -H "Content-Type: application/json" \
  -d '{"action":"bogus","payload":{}}'
```

- **Before fix:** `503` → configuration is still missing.
- **After fix:** `400 Invalid request` → the provider/key check now passes (the request reaches action validation).

Then a real request (AI → Solidity chat) should return 200 (DeepSeek) or a `502` provider error — never the 503.

## Live DeepSeek verification status

**Pending.** The endpoint was not reachable for a live DeepSeek call because the provider/key check fails first. A single
minimal live request can only be made after the configuration is bound and a new deployment is live.

## Tests passed (mock, unchanged)

No code changed; the baseline remains green: `ai-proxy` 262 · `ai-catalog-pricing` 159 · `auth-wallet` 56 · `ai-chat-ui`
168 · `ai-workspace-ui` 183. CI at `fbb40f4` (run 44375962243) was green.

## Remaining blockers

1. The production deployment must be rebuilt with the variables bound (user action above) before live DeepSeek works.
2. No runtime logs/dashboard access here, so the exact branch (unknown provider vs missing key) could not be read directly;
   the fix above addresses both.

## Recommended follow-up (not applied here)

Distinguish the three 503 branches with distinct, non-sensitive messages (e.g. "AI provider is not configured" / "AI
provider key is not configured" / "AI model is not configured") and surface the backend message in the frontend
(`aiFetch` currently masks 503 with a hard-coded string). This is a diagnosability improvement, deferred to avoid an
unnecessary code change during an external-configuration incident.

## Final commit SHA

See the commit for this report (documentation only; no application code changed). Production code remains `fbb40f4`.
