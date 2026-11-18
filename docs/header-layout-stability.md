# Header layout stability — wallet state must never control header geometry

Status: 2026-11-17. P1 structural fix: eliminate header movement when the wallet connects, disconnects, switches
accounts or networks, or refreshes its balance, with an automated browser regression test enforced in CI.

## Initial HEAD

`e27fe4b` (Phase 12.0-12.6), the latest `origin/main` at the start of this phase. The header markup (`.gbar`,
`.walletbar`, `#globalBar`, `#netBanner`, `#gbarMode`, `#currentContract`) was untouched by Phase 12.

## Root cause

The level-1 header (`#globalBar`, `.gbar`) and the wallet (`.walletbar`) both used `flex-wrap:wrap`, and `.wb-actions`
used `display:contents`. The wallet's content is wider when connected (address + network label + balance) than when
disconnected ("Wallet not connected" + "Connect Wallet"), so at 1280px the disconnected bar fit on one row but the
connected bar wrapped to a second row — the header grew from 63px to 107px, pushing the contract bar and the whole page
down. Balance text width also varies, and a long network name ballooned the banner (`.nb-net { flex:1 0 100% }`) to
331px. In short: wallet content drove the header's row count and height.

Measured before the fix (Chromium):

| viewport | disconnected `#globalBar` height | connected height | result |
|---|---|---|---|
| 1366px | 63px | 63px | ok |
| 1280px | 63px | **107px** | **moves (wraps)** |
| 1024px | 107px | 107px | wraps (already) |

## Fix (structural, not a patch)

The wallet now has a **fixed footprint** (`flex:0 0 430px` on desktop), so its content can never change the bar's width
and therefore never changes where the bar wraps. The text inside that footprint truncates with `ellipsis` instead of
widening the bar; the full value stays in the DOM (`textContent`), so a screen reader or copy still sees it.

- `.gbar` — two horizontal regions: left (`flex:1 1 auto`, `flex-wrap:nowrap`) and the fixed-width wallet (`flex:0 0 430px`, `margin-left:auto`). The only wrap is the viewport-driven one below ~1190px (a fixed flex-basis decision, never content-driven).
- `.walletbar` / `.wb-actions` — `flex-wrap:nowrap`; `#balanceBadge` (max 120px) and `.status` (max 176px) truncate with `ellipsis`; `#connectBtn` is `flex:0 0 auto`.
- `.net-banner` — `min-width:200px; max-width:220px`, and `.nb-net` truncates (ellipsis), so a long network name cannot widen the left region.
- `.dm-mount .dm-trigger` — `max-width:120px` with `.dm-v` truncation.
- `main` — added `min-width:0` (standard grid-item guard so the fixed wallet width cannot force the grid column wider than the viewport on narrow screens).
- `@media (max-width:640px)` — the wallet becomes a deliberate two-row block (status full-width on top, balance + button below), which is stable across connected/disconnected and can shrink with `ellipsis`; the banner and mode shrink to fit.

No Solidity generator, no Vault, no wallet signing, no network config, no deployment logic was touched.

## Files changed

- `contractforge-deploy/app.css` — the structural header changes above.
- `tests/header-layout-stability.mjs` — new browser regression suite (156 checks).
- `.github/workflows/ci.yml` and `ci/workflows/ci.yml` — run the new suite in the node job with `REQUIRE_BROWSER=1`.
- `docs/header-layout-stability.md` — this file.

## Automated regression test (`tests/header-layout-stability.mjs`)

Serves the real page in Chromium (Playwright, same convention as `csp-browser.mjs`) and drives a mock EIP-1193 provider
through the real `connectWallet` / `refreshBalance` / `accountsChanged` / `chainChanged` paths — no real transaction or
node. It measures `getBoundingClientRect()` for `#globalBar`, `#netBanner`, `#gbarMode`, `#currentContract` and
`#sec-home` and asserts, at nine viewports (1920, 1440, 1280, 1024, 900, 768, 640, 390, 320), that none of them move
(tolerance 0.5px, sub-pixel rounding only) across:

1. disconnected → connected
2. connected → different account
3. connected → different network (wallet `chainChanged`)
4. small balance → large balance
5. rapid consecutive wallet updates
6. connected → disconnected

plus: no horizontal overflow, every header control visible inside the screen, the balance badge truncates with ellipsis,
and a long network name truncates inside the capped banner. The suite is wired into CI (`REQUIRE_BROWSER=1`), so a future
change that reintroduces wallet-induced movement fails the build.

## Results

- `header-layout-stability.mjs`: **156 passed, 0 failed**.
- Existing suites (local, Node): `header-home-ui` 190, `ui` 376, `deploy-mode-ui` 107, `csp` 248, `xss` 43,
  `ai-workspace-ui` 183, `creation-tabs-audit` 302 — all green.
- Existing browser suites: `csp-browser` 11, `share-browser` 27 — green.
- `header-home-browser` 62 passed / 1 failed — the remaining "phone: the Actions menu opens inside the screen" failure is
  **pre-existing** (it fails on the original `e27fe4b` too; the contract-bar's Actions menu opens below the 780px phone
  viewport). This phase's changes reduce that suite from 2 failures to 1: the header change also fixed the pre-existing
  "tablet: network and wallet share the one row" assertion.

## After (Chromium, same measurement)

| viewport | disconnected height | connected height |
|---|---|---|
| 1920 / 1440 / 1280px | 63px | 63px |
| 1024px | 107px (deliberate wrap) | 107px |
| 900 / 768 / 640 / 390 / 320px | stable | stable |

The header's row count no longer changes with wallet state at any viewport.

## Remaining limitations

- `header-home-browser.mjs` "phone: the Actions menu opens inside the screen" remains failing — a pre-existing, out-of-scope
  issue in the contract-bar menu (not the wallet), present before this phase.
- No formal third-party security audit is implied; the tests demonstrate behaviour.

## CI

Final GitHub Actions run: see the push for commit `…` (header-layout-stability run added to the `node` job). Foundry v1.7.1,
Foundry solc 0.8.28, app solc 0.8.24.
