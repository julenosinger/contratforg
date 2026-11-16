# Phase 10.4.1: Home builder grid

## Before and after

Before (Phase 10.4): the six builders sat in three uneven columns by category (Simple 1 card, DeFi 3, Payments 2), which left a large empty area under the first column and unequal card heights.

After: one grid, `#homeBuilders` (`.home-grid.home-builders`), six cards in the original order: 01 Token, Escrow, NFT, 02 Swap / AMM, 03 Treasury, 04 Vault (ERC-4626), 05 MultiSend, 06 Crosschain (CCTP).

- **Desktop:** three equal columns (3 x 2). **Tablet (up to 1100px):** two equal columns (2 x 3). **Phone (up to 640px):** one column (1 x 6). Columns are `minmax(0, 1fr)`, so long words wrap instead of widening the page.
- **Equal cards:** every card has the same class, padding, border and radius; within a row the cards stretch to the same height; the height is a minimum (150px), never fixed, so nothing is clipped.
- **Each card shows:** a small category label (SIMPLE, DEFI or PAYMENTS), the builder number (01 to 06), a lightweight line icon, the title, the original description word for word, and an arrow at the bottom right that moves a little on hover or focus.
- **Whole card is the target:** each card is still one `<button data-go="...">`, so the navigation target, the keyboard behaviour (Tab, Enter, Space) and the click handling in `initHome` are the same as before. Hover and focus use the emerald accent; motion is switched off for users who ask for reduced motion. Light mode is covered.

## What did not change

`ui.js`, `renderHome()` and the click handler are untouched. The header, the sidebar, the hero, the active-contract card, recent deployments, How it works, the deployment modes and the networks are untouched. No generator, compiler, deployment, wallet or network code changed, and no state or storage was touched. The three category rules from 10.4 (`.home-cats`, `.home-cat*`) were removed because nothing uses them any more.

## Files

`index.html` (the six cards in one grid), `app.css` (the grid and card styles, scoped to `.home-builders`; the unused category rules removed).

## Tests

`header-home-ui.mjs` (190 checks, 16 more than before): one grid of six in the original order with no category columns left, category, number and title on every card, the original descriptions word for word, one button per card with a decorative icon and arrow and no inline handler, every card opens its original builder, the CSS for three, two and one columns, equal stretch with a minimum height and no fixed height, emerald hover and focus, reduced motion, light mode, the same class and border radius on all six, and keyboard focus. `creation-tabs-audit.mjs` was updated to the new structure. `header-home-browser.mjs` now measures the real grid (3 x 2, 2 x 3, 1 x 6, equal widths, equal heights per row, no clipped text) and was NOT executed: Chromium cannot start in this sandbox.

## Limits

The three layouts were verified from the CSS and the DOM, not seen in a browser. The tablet breakpoint follows the window width (1100px), not the width of the content column.
