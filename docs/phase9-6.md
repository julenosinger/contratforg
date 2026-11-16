# Phase 9.6: Contract Wizard

Section 14 now sits in the same two-column shell as the builders. The wizard is a router, not a generator, so it does not use the builder engine's code panel and progress: it gets an overview ("Your Choices" and "About This Choice") that only reads `wizardState`, `activeNetwork` and the Deployment Mode. `wizardPick`, `wizardNext`, `wizardBack`, `renderWizardStep` and `wizardGenerate`, and every id and handler, are unchanged, with one defect fixed (below).

## What the audit found (and the page now says)

- **It generates nothing.** `wizardGenerate()` only routes: Swap, Vault, Treasury and Crosschain open their own builder; the other eight contracts (ERC-20, NFT, escrow, vesting, subscription, staking, DAO, Smart Wallet) open Simple contracts with that template selected, after a 100 ms delay. The button used to say "Generate & go to editor"; it now says "Open the builder" and the page says nothing is generated or deployed.
- **The network step acts at once.** Clicking a network switches the app's active network immediately; a mainnet asks to confirm first and stays on the old network if refused. The overview shows the real network (also when it changes from the sidebar or the wallet) and flags mainnets.
- **MultiSend is not offered** (twelve contracts in six goals), although the router would open it if asked.
- **Defect fixed:** the contract chosen under one goal survived a change of goal, so choosing DeFi > Vault, going back and choosing "Launch a token" let you press Next without picking and still opened the Vault. `wizardPick` now clears the contract when the goal changes (picking the same goal again keeps it).
- **Constructor facts per contract**, verified against the real generators in every Deployment Mode: none in Single network mode; in the portable modes `usdc_` (NFT), `token_` (escrow, vesting, subscription), `stakingToken_`, `token_` + `votingPeriod_` (DAO), `dailyLimit_` (Smart Wallet), `tokenA_` + `tokenB_` (swap), `asset_` (vault), `gasTokenAlias_` (treasury), the three CCTP addresses (crosschain), none for ERC-20.
- **Per network (all 16):** the Crosschain notes appear exactly when the network is missing from the CCTP V1 table (Single mode) or has no CCTP V2 (portable modes); mainnets (there are 9, with 7 testnets) are flagged.

## What changed

- `index.html`: only `#sec-wizard` (shell, two columns, overview, notes, the button text and one note).
- `app.js`: `WZ_INFO`, `wzRender` and its listeners; one line in `wizardPick` (the defect above).
- `builder.js`: `addView` / `viewKeys`, so a screen without a code panel can be redrawn with the others when the Deployment Mode changes.
- Tests: `wizard-builder-ui.mjs` (295 checks), `wizard-builder-browser.mjs` (NOT executed here: Chromium cannot start in this sandbox), `creation-tabs-audit.mjs` gained the wizard facts (279 checks).

## Limits

- The wizard still has no step for MultiSend and the "Configure" step is really "choose the contract" (labels kept as they were).
- The wizard picks the template card after a short delay (existing behavior).
