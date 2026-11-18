# Phase 11.4.1 — Network selector UX & state stability

Status: 2026-11-18. Three confirmed network-selector corrections, no redesign and no regression: the header warning is
compact, the mainnet switch confirmation names the real source network, and the panel never closes while switching the
Mainnets/Testnets/All category. Arc Mainnet stays the default and every security gate is preserved.

## Initial / final HEAD

- Initial: `8cb0d45` (latest `origin/main` at the start of this phase).
- Final: see the commit for this phase.

## Root cause of each problem

1. **Verbose header warning.** `renderNetBanner()` rendered `<span class="nb-note">Real funds. Transactions cannot be
   undone.</span>` as a visible third line on the mainnet banner (`.sticky-top .net-banner.mainnet .nb-note { order:5;
   flex:1 0 100% }`), inflating the header.

2. **Wrong "Stay on testnet" label.** `uiConfirmSwitch(label, gasSymbol)` hardcoded the cancel button to
   `Stay on testnet`, and `confirmMainnet(label)` never passed the source network. Switching Arc Mainnet → Polygon
   therefore offered "Stay on testnet" even though the current network was a mainnet.

3. **Panel disappearing on category switch.** The Mainnets/Testnets/All tabs call `renderNetBar()`, which replaces
   `#netbar`'s innerHTML and detaches the clicked tab. The document-level outside-click handler then ran
   `e.target.closest('#netPanel')` on the now-detached node, which returns `null`, so it misclassified the in-panel click
   as an outside click and closed the panel.

## Modified files

- `contractforge-deploy/ui.js` — `renderNetBanner` (note is screen-reader only + a `title` tooltip on the change button);
  `uiConfirmSwitch(label, gasSymbol, sourceLabel)` (names the source network).
- `contractforge-deploy/app.js` — `renderNetBar` (tabs and network buttons `stopPropagation`, skip the dialog for the
  already-active network, close the panel exactly once after a completed selection); `confirmMainnet` (passes the source).
- `contractforge-deploy/app.css` — the `.nb-note` is screen-reader-only on every network (one rule, no visible line).
- `tests/network-selector-stability.mjs` — new real-browser suite (204 checks).
- `.github/workflows/ci.yml` and `ci/workflows/ci.yml` — run the new suite with `REQUIRE_BROWSER=1`.
- Test updates reflecting the intended behavior: `header-home-ui.mjs`, `header-home-browser.mjs`, `csp-browser.mjs`.
- `docs/phase11-4-1-network-selector-stability.md` — this file.

No Solidity generator, network config, wallet signing, deployment logic, maturity gate or CSP rule was touched.

## Behavior

- The collapsed selector shows only the network name, the MAINNET/TESTNET tag, the chain id and the chevron. The real-funds
  warning moved to the button's `title` tooltip (and stays in the DOM as a screen-reader-only note).
- The mainnet confirmation dialog names both networks: "Switch to Polygon?" / "You are on Arc Mainnet. … will spend real
  POL …" / cancel "Stay on Arc Mainnet" / confirm "Switch to Polygon".
- Selecting the already-active network closes the panel without a redundant confirmation.
- Category switching (Mainnets/Testnets/All) re-renders the list but never closes the panel, never changes the active
  network, and never asks the wallet.

## New tests (`network-selector-stability.mjs`, 204 checks)

Real Chromium across 390 / 640 / 768 / 1024 / 1280 / 1440 px: fresh-load default, no visible warning + tooltip, open the
panel, category switching keeps it open with the network unchanged, all 16 networks under "All", correct source-network
cancel label, cancel preserves state, confirm switches once, no redundant confirmation, mainnet→testnet with no misleading
warning, repeated reopen, outside-click and Escape closure, keyboard Enter, no wallet requests on filter changes, chain
mismatch detection, pending-confirmation cancel, dark/light themes, and stable header/banner geometry.

## Regression results

- `network-selector-stability.mjs` — 204 passed, 0 failed.
- `header-layout-stability.mjs` — 156 passed (unchanged).
- `mainnet-default-network.mjs` — 40 passed (unchanged).
- `header-home-ui.mjs` — 206 passed; `ui.mjs` — 376 passed; `csp-browser.mjs` — 11 passed; `share-browser.mjs` — 27 passed.
- Builder suites all green (deploy-overview 240, wizard 295, treasury 121, vault 356, multisend 312, simple 1581,
  crosschain 556, swap 176, builder-core 59).

Pre-existing, out of scope (present at `8cb0d45`): `header-home-browser` "phone: the Actions menu opens inside the screen"
(contract-bar menu), and the locale-dependent thousands separators in `analysis-tabs-audit`/`gas-tab-ui`/`analytics-tab-ui`
(they pass on the CI runner's `C.UTF-8` locale).

## CI

Final GitHub Actions run: see the push for this commit. Foundry v1.7.1 · Foundry solc 0.8.28 · app solc 0.8.24.
