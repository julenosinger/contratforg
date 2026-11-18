# Phase 11.5 — URL routing & deep-link navigation

Status: 2026-11-18. Section-based navigation converted into a permanent URL router: every page has a stable address that
survives refresh, direct navigation, bookmarking and Back/Forward, without rewriting the application and without any
regression in the generators, wallet integration or security gates.

## Initial / final HEAD

- Initial: `c478d9f` (latest `origin/main` at the start of this phase).
- Final: see the commit for this phase.

## Route registry (single source of truth)

| Section | URL |
|---|---|
| Home | `/` |
| Token / Escrow / NFT | `/token-builder` |
| Swap / AMM | `/swap` |
| Treasury | `/treasury` |
| Vault (ERC-4626) | `/vault` |
| MultiSend | `/multisend` |
| Crosschain (CCTP) | `/crosschain` |
| Compile & Deploy | `/compile-deploy` |
| AI Auditor | `/ai-auditor` |
| ABI Playground | `/abi-playground` |
| Test Lab | `/test-lab` |
| Deploy History | `/deploy-history` |
| Gas Estimator | `/gas-estimator` |
| Verify on Explorer | `/verify` |
| Share / Export | `/share` |
| Contract Wizard | `/contract-wizard` |
| AI → Solidity | `/ai-solidity` |
| Analytics | `/analytics` |
| Test Generator | `/test-generator` |

All 19 navigable sections are covered.

## Navigation root cause

Navigation was spread over four duplicated "hide all, show one" blocks (the sidebar click handler, `deployFromBuffer`,
`loadHistoryIntoPlayground`, `wizardGenerate`), none of which touched the URL. The URL only carried the `#cfg=` share
hash; there was no path-based routing and no history integration, so refresh always landed on Home.

## Router architecture (`contractforge-deploy/app.js`)

- `ROUTES` — the path → section map (single source of truth), plus `SECTION_PATHS` (reverse) and `SECTION_TITLES`.
- `showSection(section)` — the single presentation function: hides all sections, shows the target, marks the sidebar item
  active, calls `uiSyncCurrent()` and sets `document.title` (`AI → Solidity | ContractForge`, Home keeps the original).
- `navigateTo(section, {replace})` — shows the section and reflects it in the URL with `history.pushState` (or
  `replaceState`); reaching the already-active route does not push a redundant history entry.
- `routeFromPath()` — maps `window.location.pathname` to a section; an unknown path falls back to Home (controlled Not Found).
- `initRouter()` — attaches `popstate` (Back/Forward) and restores the section for the current URL on load.

The three programmatic navigation paths (`deployFromBuffer`, `loadHistoryIntoPlayground`, `wizardGenerate`) now call
`navigateTo` and keep their existing side effects. The `[data-go]` quick actions, the brand/logo, `ccTest` and `ccAudit`
already click the corresponding `.nav-item`, so they route through the same function automatically.

## Vercel deep-link support (`vercel.json`)

Added a rewrite that serves `index.html` for dotless paths (the SPA routes), while real files (`.js`, `.css`, `.svg`,
`/vendor/*`, `robots.txt`, …) are served as-is:

```json
"rewrites": [ { "source": "/((?!.*\\.).*)", "destination": "/index.html" } ]
```

The Cloudflare Pages fallback was already present (`contractforge-deploy/_redirects` → `/* /index.html 200`). The existing
headers, CSP, cache policies and static assets are unchanged.

## Initialization order & safety

`initRouter()` runs after `loadFromUrlHash()` (so a shared `#cfg=` config is imported first) and after the sections are
rendered. Routing only shows/hides existing sections — it never connects a wallet, switches a network, requests a
signature, or runs a deploy. Opening `/compile-deploy` directly renders the page without executing anything.

## Workspace state preservation

Switching routes hides/show sections without re-rendering them, so the generated source, builder form values, template,
constructor arguments, deployment mode, selected network, and in-memory audit/AI state are preserved across internal
navigation. Refreshing restores the correct page; unsaved data is not claimed to be persisted (no new persistence was
introduced, and no sensitive value is ever stored in the URL or storage).

## Share-link compatibility

`#cfg=` links are unchanged: `loadFromUrlHash` still imports the config on load, and `navigateTo` preserves the hash in the
URL. Untrusted shared content still goes through the existing validation and `escapeHtml`.

## Tests (`tests/app-routing-stability.mjs`, 137 checks)

Real Chromium against a local server that reproduces the Vercel SPA fallback. Across 390/640/768/1024/1280/1440 px:
fresh `/`, click navigation updates the URL, refresh preserves the page, direct `/vault`/`/multisend`/`/compile-deploy`
open the right section, Back/Forward, sidebar/URL agreement, repeated clicks add no history, unknown route falls back to
Home, `#cfg=` import, query-string tolerance, wallet stays disconnected and the network unchanged across navigation, form
state survives, mobile menu works, themes work, no console errors. A full sweep verifies every one of the 19 routes maps
to its section and survives refresh.

## Regression comparison

- `app-routing-stability.mjs` — 137 passed, 0 failed.
- `network-selector-stability.mjs` — 204 · `header-layout-stability.mjs` — 156 · `mainnet-default-network.mjs` — 40.
- `ui` 376 · `header-home-ui` 206 · `creation-tabs-audit` 302 · `ai-workspace-ui` 183 · `ai-chat-ui` 168 ·
  `ai-chat-startup` 67 · `share-ui` 100 · all builder suites green.
- `csp-browser` 11 · `share-browser` 27.

Pre-existing, out of scope (present at `c478d9f`, documented): the locale-dependent thousands separators in
`analysis-tabs-audit`/`gas-tab-ui`/`analytics-tab-ui` (pass on CI's `C.UTF-8`), and `header-home-browser` "phone Actions
menu".

## CI

Final GitHub Actions run: see the push for this commit (the new suite runs in the node job with `REQUIRE_BROWSER=1`).
Foundry v1.7.1 · Foundry solc 0.8.28 · app solc 0.8.24.
