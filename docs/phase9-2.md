# Phase 9.2: Vault (ERC-4626) builder

Section 04 is now a two-column builder on the shared engine (`builder.js`), like the Treasury. `genVault()`, the deploy buffer and the whole Compile & Deploy page are unchanged. The page reads the form and the app state and never writes them.

## What the audit found (and the page now says)

| Fact | Where it comes from |
|---|---|
| A missing asset writes a DRAFT (the deploy page refuses it). It happens where the network has no default USDC: Robinhood Chain and Robinhood Testnet. | `reqTokenProblem`, `resolveToken` |
| A performance fee outside 0..9999 is REFUSED with an alert, nothing is generated. | `genVault()` |
| Portable modes make the asset a constructor argument (`asset_`) and scale the cap by the asset's own `decimals()` when the constructor runs. A cap that is not digits with an optional decimal part makes the generator THROW (no message). | `portabilize` in `multichain.js` |
| The single mode writes the cap as `cap * 10**6`: a negative cap or one with more than 6 decimals does not compile. | generated Solidity, compiled with solc |
| The share symbol is written raw into a Solidity string: a quote or backslash does not compile. | generated Solidity, compiled with solc |
| Share pricing uses 1e12 virtual shares, which assumes a 6-decimal asset, in every mode. Only BNB Chain has a default USDC that is not 6-decimal (18). | `NETWORKS[*].usdcDecimals` |
| There is one real strategy option (`passthrough`, manual yield). | the select |

Multichain and mainnet: every one of the 16 networks is generated and checked in the single and the portable modes. A mainnet gets a "Mainnet: real funds" flag on the Network row (the maturity confirmation and the typed network name are what the deploy path really asks for). The flag is a shared helper, so the Swap and Treasury overviews got it too. All 9 mainnets still refuse `deployCompiled` without the maturity confirmation.

## What changed

- `index.html`: only `#sec-vault`. All ids, defaults, types, option text and handlers are kept. The fee and the cap stay inside the Advanced Options block, as before.
- `app.js`: `VLT_CONFIG` (read, problems, signature, draft, guidance, summary rows). The Network rows of Swap and Treasury use `CFBuilder.networkRow`.
- `builder.js`: `networkRow` helper only.
- `app.css`: one shared rule for the two-field row (`.bld-pair`), scoped to `.bld`.
- Tests: new `vault-builder-ui.mjs` (363 checks) and `vault-builder-browser.mjs` (NOT executed here: Chromium cannot start in this sandbox); `creation-tabs-audit.mjs` gained the Vault facts above (252 checks).

## Limits

- Review & Audit never completes (the app does not record which source an audit covered).
- The overview mirrors the generator's checks; the audit test pins the facts so a divergence is caught.
- Whether the typed asset is really an ERC-20 on the network is not checked (no RPC call is made by this page).
