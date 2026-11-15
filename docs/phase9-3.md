# Phase 9.3: MultiSend builder

Section 05 is now a two-column builder on the shared engine (`builder.js`), like the Treasury and the Vault. `genMultisend()`, the deploy buffer and the whole Compile & Deploy page are unchanged. The page only reads the form and the app state.

## What the audit found (and the page now says)

| Fact | Evidence |
|---|---|
| The contract has no token address and no network logic: the token is an argument of every call, the network is only a comment. | generated Solidity |
| It is the SAME contract in every Deployment Mode and on every one of the 16 networks (no constructor argument in any mode). | 64 generations compared, bodies identical apart from the network comment and the stamp |
| A fee recipient that is not an address writes a DRAFT (the deploy page refuses it). An empty owner means the deployer. There is no setter, so the recipient is fixed at deploy time. | `reqProblems`, generated Solidity |
| `ms_max` and `ms_fee` are written into the Solidity unchecked. `1.5` or `-1` does not compile (checked with solc); max `0` compiles but no batch could ever be sent; a fee above 10000 bps compiles and charges more than 100% on top. | solc, `genMultisend()` |
| The fee is charged on top of the amounts: the sender pays the batch total plus the fee (ERC-20 and native). Native mode needs msg.value covering both and returns the change. | generated Solidity |
| "Native" means the network's gas token: ETH, POL, AVAX, BNB, and USDC on Arc. | `NETWORKS[*].gasSymbol` |

Multichain and mainnet: all 16 networks are generated in every Deployment Mode; the Network row flags the 8 mainnets; the 9 mainnet ids still refuse `deployCompiled` without the maturity confirmation.

## What changed

- `index.html`: only `#sec-multisend`. Ids, defaults, types, option text and handlers are kept; max, fee and owner stay inside the Advanced Options block.
- `app.js`: `MSL_CONFIG`. `app.css`: one scoped rule (`.bld-wide`). `builder.js`: nothing.
- Tests: `multisend-builder-ui.mjs` (315 checks), `multisend-builder-browser.mjs` (NOT executed here: Chromium cannot start in this sandbox), `creation-tabs-audit.mjs` gained the MultiSend facts (257 checks).

## Limits

- Review & Audit never completes (the app does not record which source an audit covered).
- The overview mirrors the generator's checks; the audit test pins the facts so a divergence is caught.
