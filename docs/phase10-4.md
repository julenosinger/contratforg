# Phase 10.4: unified header and Home dashboard

## Header: from three stacked bars to two levels

Before: the wallet bar, the network banner and the contract bar were three full-width rows. Now `.sticky-top` has two levels (and the network panel, which still opens below them):

- **Level 1, `#globalBar`:** on the left the network card (`#netBanner`, restyled as a compact selector: name, TESTNET/MAINNET tag and chain id; the whole card is the transparent "Change network" button, so `toggleNetPanel` and `aria-expanded` are unchanged) and the deployment-mode control (`#gbarMode`, the shared control from Phase 8.4, so there is still one source of truth); on the right the wallet controls (`#balanceBadge`, `#walletStatus`, `#connectBtn`, the same elements and handlers, reordered by CSS). On a mainnet the card keeps the "Real funds. Transactions cannot be undone." line visible; on a testnet the "Test funds only." note stays for screen readers.
- **Level 2, `#currentContract`:** shown only when there is a source. File name, the real maturity badge, the real line count, the constructor-argument count, the DRAFT chip and the reason when there is one. **Publish** stays the one prominent button; Test, Audit, Copy, Download and Discard moved into an **Actions** menu. The five items are the buttons the bar always had, with the same handlers (`ccTest`, `ccAudit`, `copySource`, `downloadSource`, `ccDiscard`) and the same disabled states and reasons on a DRAFT. The menu is a real menu: it opens with the button or ArrowDown, moves with the arrows, Home and End (skipping disabled items), closes with Escape (focus returns to the button), Tab or an outside click, and closes after a choice. One set of document listeners serves every redraw.
- In the AI workspace the network card, the mode control and the contract bar stay hidden as before; the wallet stays.
- Nothing in the header changes `pendingSource`, `pendingCtorArgs`, `activeNetwork`, `multichainMode` or `mdState`; chain switching, wallet connection and every mainnet confirmation are untouched.

## Home

- **Hero:** "Build something powerful." with Create Contract (the Wizard, primary), Build with AI and Explore Templates.
- **Active contract card** (`#homeContinue`): file name, template, maturity badge, network (LIVE on a mainnet), deployment mode, constructor information and the DRAFT state when it is one. Continue goes to the builder that made the contract (a fixed table: swap, treasury, vault, multisend, crosschain and its V2 bridge, the Simple templates, AI contracts to the AI tab; an imported or unknown contract continues at the deploy page), Audit to the auditor, Review & Deploy to Compile & Deploy. It never says a contract is audited, safe or ready. With no contract the card is hidden.
- **Builders** in three groups: Simple, DeFi (Swap / AMM, Treasury, Vault) and Payments (MultiSend, Crosschain); the same six cards and navigation.
- **Recent deployments:** up to five real records with network (LIVE on mainnets), address, time, Explorer and Playground; the Playground buttons keep each record's index in storage.
- **Deployment modes and Supported networks:** collapsible (open by default); all four modes and all 16 networks; collapsing or redrawing never changes the active network, the mode or the selection.

## Files

`index.html` (the header and Home markup), `app.css` (a block scoped to the header, the contract bar and Home, placed before the sections that have their own scope tests; two lines added to the AI workspace rules), `ui.js` (the contract bar markup, the Actions menu, the active-contract card and the Continue table). No generator, compiler, deployment, wallet or network definition changed. Two innerHTML approvals were re-pinned to the new statements.

## Tests

`header-home-ui.mjs` (174 checks): the structure and ids; the network card on all 16 networks (tag, name, chain, the mainnet warning visible, the testnet note screen-reader only), the panel and Escape; the shared mode control; the contract bar and the Actions menu (keyboard, focus, outside click, every item's handler, Discard, Publish); DRAFT restrictions and the mainnet gate; no duplicated listener or id after redraws; the header on every page and in the AI workspace; the hero, the categories and every card's navigation; the active contract card for all six builders; recent records and their indexes; no state change, storage write, request or wallet call. Updated for the new layout: `ui.mjs` (header structure, Home heading and text, the bar's buttons), `ai-workspace-ui.mjs` (seven buttons in the bar), `deploy-mode-ui.mjs` (nine mode controls). `creation-tabs-audit.mjs` gained the header and Home facts. `header-home-browser.mjs` was written for the real layout and was NOT executed: Chromium cannot start in this sandbox.

## Limits

- The layout (heights, wrap on a phone, the menu's position) was not seen in a browser.
- The brand stays in the sidebar; it was not duplicated into the header.
- On a mainnet the network card has a third line (the real-funds warning), so level 1 is a little taller there than on a testnet.
