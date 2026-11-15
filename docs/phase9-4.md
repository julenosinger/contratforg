# Phase 9.4: Crosschain (CCTP) builder

Section 06 is now a two-column builder on the shared engine (`builder.js`). `genCrosschain()`, `genCrosschainV2()`, the deploy buffer and the whole Compile & Deploy page are unchanged. The page only reads the form and the app state.

## Two contracts behind one tab

| | Single network mode | Every other mode (portable, multi, cross) |
|---|---|---|
| Template | `crosschain` (payments contract) | `bridge` (CCTP V2 bridge) |
| Interface | 4-argument `depositForBurn` (the CCTP V1 signature) | CCTP V2 |
| Functionality and resume | six contracts (payment, escrow, recurring, each with or without resume) | **ignored**: the bridge is the same contract whatever you pick |
| Addresses | typed, or the network's V1 table, or the USDC default; a missing one is a DRAFT | three constructor arguments, filled per network at deploy time from the CCTP V2 table; never a problem at generation |
| Constructor | none | `tokenMessenger_`, `messageTransmitter_`, `usdc_` |

## Network findings (all 16 networks, in the audit and the tests)

- CCTP V1 data (Single mode) exists for 11 networks. BNB Chain, both Arc networks and both Robinhood networks are missing, so Single mode there writes a DRAFT (2 problems; 3 on the Robinhood networks, which also have no USDC default).
- CCTP V2 data (portable modes) exists for 13 networks, including both Arc networks and excluding BNB Chain and the two Robinhood networks. Mainnets use the mainnet V2 table, testnets the testnet one. On the three networks without V2 the deploy page's address inputs start empty and you enter them.
- A mainnet is flagged on the Network row, and all 9 mainnet ids still refuse `deployCompiled` without the maturity confirmation in both families of contracts.

## What changed

- `index.html`: only `#sec-crosschain`. Ids, defaults, placeholders, option text and handlers are kept; the three addresses and resume stay inside the Advanced Options block.
- `app.js`: `CCX_CONFIG` (both templates, the draft hook, per-mode guidance). Nothing in `builder.js`, `multichain.js`, `multideploy.js` or the generators.
- Tests: `crosschain-builder-ui.mjs` (558 checks), `crosschain-builder-browser.mjs` (NOT executed here: Chromium cannot start in this sandbox), `creation-tabs-audit.mjs` gained the Crosschain facts (262 checks).

## Noted, not changed

- The payments contract's header comment says "CCTP v2 interface" although it uses the V1 signature.
- Review & Audit never completes (the app does not record which source an audit covered).
