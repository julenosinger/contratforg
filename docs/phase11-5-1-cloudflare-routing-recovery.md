# Phase 11.5.1 — Cloudflare Pages deep-link & refresh recovery

Status: 2026-11-18. Fixes a Cloudflare Pages-specific defect introduced (exposed) after Phase 11.5: on
`https://contractv4.pages.dev`, navigating to a route such as `/ai-solidity` and pressing F5 returned the browser to `/`
(Home), while the same route on Vercel (`https://contratforg.vercel.app`) refreshed correctly.

## Initial / final HEAD

- Initial: `70f00bd` (the Phase 11.5 commit, latest `origin/main` at the start of this phase).
- Final: see the commit for this phase.

## Confirmed root cause (with network evidence)

The top-level `contractforge-deploy/404.html` file shipped to Cloudflare Pages contained:

```html
<meta http-equiv="refresh" content="0;url=/">
...
<script>window.location.href='/';</script>
```

Cloudflare Pages has a documented rule (Serving Pages → Single-page application rendering):

> If your project does not include a top-level `404.html` file, Pages assumes that you are deploying a single-page
> application. Pages' default SPA behavior matches all incoming paths to the root, allowing your application to handle
> routes client-side.

The inverse is what bit us: **because a top-level `404.html` existed, Cloudflare disabled its SPA fallback and served
`404.html` for every unmatched path** (`/ai-solidity`, `/vault`, `/multisend`, …). That page's `<meta refresh>` and
`window.location.href='/'` then bounced the browser to `/`, which is exactly the reported behavior.

### Live evidence (recorded 2026-11-18)

| Request | Cloudflare (`contractv4.pages.dev`) | Vercel (`contratforg.vercel.app`) |
|---|---|---|
| `GET /ai-solidity` | **404**, body = `404.html` (the `url=/` redirect page) | **200**, body = the real ContractForge `index.html`, URL preserved |
| `GET /vault` | 404, body = `404.html` | **200**, `final=/vault` |
| `GET /` | 200 (app) | 200 (app) |
| `GET /app.js` | 200 `application/javascript` | 200 |
| `GET /_redirects` | 404, body = `404.html` (config files are not served as assets) | — |

The redirect is a **JavaScript + meta-refresh redirect**, not an HTTP 301/302/308: Cloudflare returns a 404 document whose
body then navigates the browser. The app's own code contains no root redirect — a grep for `location.href`,
`location.replace`, `location.assign` and `http-equiv="refresh"` across `contractforge-deploy/` shows only the removed
`404.html`, the Phase 11.5 router's `pathname`/`pushState` reads (no forced `/`), and the share-link `location.origin` reads.

Note: the existing `_redirects` rule `/* /index.html 200` was redundant with Cloudflare's native SPA behavior and, because
`/*` also matches `/index.html`, is subject to Cloudflare's own infinite-loop detection. Removing the top-level `404.html`
is the single sufficient fix; no new fallback rule is needed and none was added.

## Exact modified files

1. `contractforge-deploy/404.html` — **deleted** (`git rm`). This is the root cause and the entire functional change.
2. `tests/cloudflare-routing-recovery.mjs` — **new** (96 checks), see below.
3. `.github/workflows/ci.yml` and `ci/workflows/ci.yml` — added the new suite to the node job with `REQUIRE_BROWSER=1`.
4. `docs/phase11-5-1-cloudflare-routing-recovery.md` — this document.

No application code (`app.js`, `ui.js`, `index.html`, `app.css`) changed. The Phase 11.5 router (`ROUTES`,
`SECTION_PATHS`, `showSection`, `navigateTo`, `routeFromPath`, `initRouter`) is untouched and remains the single source of
truth.

## Why the existing router remains safe

The defect was never in the router. The Phase 11.5 router restores the correct section from `window.location.pathname` on
load and on `popstate`, and it never redirects to `/`. The problem was purely that Cloudflare never *delivered* the app for
deep links — it delivered `404.html`. Once `404.html` is gone, Cloudflare serves `index.html` at the requested URL with a
200, and the router does exactly what it already did correctly on Vercel.

## Cloudflare configuration changes

None required beyond removing `404.html` from the shipped output. The `_redirects` (`/* /index.html 200`) and `_headers`
(CSP and security headers) are already deployed and unchanged. The zip build (`scripts/build-zip.mjs`) walks
`contractforge-deploy/` and will simply stop including the removed file; `tests/zip.mjs` confirms `index.html`, `_headers`
and `_redirects` remain at the root and nothing else is affected.

## Regression tests

`tests/cloudflare-routing-recovery.mjs` (96 checks) reproduces Cloudflare's SPA serving in a local server (no top-level
`404.html` → `index.html` is served for unmatched routes at the original URL with a 200) and asserts:

1. No top-level `404.html` is shipped; the `_redirects` SPA rule is present.
2. All 19 routes load with a **200** document response (no HTTP redirect) and the correct section + sidebar state.
3. F5 preserves every route and section.
4. No HTTP 3xx is emitted for any SPA route (distinguishes an HTTP redirect from a JavaScript redirect by instrumenting
   `location.replace` and watching `response` events).
5. Static assets (`app.js`, `app.css`, `favicon.svg`, `vendor/MANIFEST.json`) keep their real content types.
6. Back and Forward work.
7. `/#cfg=` share links still import.
8. Mobile routing works (nav toggle), `/compile-deploy` never deploys or touches the wallet, network stays Arc Mainnet,
   and there are no console errors.

The suite is wired into mandatory CI with `REQUIRE_BROWSER=1` (a missing browser fails the job).

## Regression comparison

- `cloudflare-routing-recovery.mjs` — **96 passed** (new).
- `app-routing-stability.mjs` — 137 passed · `header-layout-stability.mjs` — 156 · `network-selector-stability.mjs` — 204 ·
  `mainnet-default-network.mjs` — 40 · `csp-browser.mjs` — 11.
- `zip.mjs` — 15 passed (the only suite that enumerates the shipped files).
- `ui` 376 · `share-ui` 100 · `mainnet-default-network` 40 all green.

Pre-existing, out of scope (unchanged from `70f00bd`): the locale-dependent thousands separators in
`analysis-tabs-audit`/`gas-tab-ui`/`analytics-tab-ui` (pass on CI's `C.UTF-8`), and `header-home-browser` "phone Actions
menu".

## Production verification status

The live Cloudflare deployment (`contractv4.pages.dev`) was queried and the defect reproduced (404 + `url=/` redirect body
for `/ai-solidity` and `/vault`). The repository fix (removing `404.html`) is verified by the local reproduction and CI.
Final certification of the **live** Cloudflare URL requires a redeploy of `contractv4.pages.dev` from this commit, which is
an external action outside this repository and is documented as a remaining deployment step.

## CI

Final GitHub Actions run: see the push for this commit (the new suite runs in the node job with `REQUIRE_BROWSER=1`).

## Remaining external deployment actions

Redeploy the Cloudflare Pages project (`contractv4.pages.dev`) from the commit that removes `404.html`. If the project is
configured for git integration, this is automatic on push to `main`; if it uses direct upload, publish the zip produced by
`node scripts/build-zip.mjs` (which no longer contains `404.html`).
