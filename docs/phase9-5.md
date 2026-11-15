# Phase 9.5: Simple contracts builder

Section 01 is now a two-column builder on the shared engine. The eight template cards, the eight per-template forms, `genSimple()` and its three siblings (`genSimpleDAO`, `genSimpleSmartWallet`, `genSimpleStaking`), the deploy buffer and the whole Compile & Deploy page are unchanged. Nothing was rewritten inside the forms: the new overview reads whichever form is on screen, so it follows the template you pick.

## What the audit found (and the page now says)

Most numeric fields are written into the Solidity unchecked. Every flag the page shows was verified against the compiler (`solc`): the test flags a field exactly when the generated source does not compile, or the generator refuses.

| Kind | Fields | Rule |
|---|---|---|
| Whole number | ERC-20 decimals (0..255), NFT supply and royalty, DAO quorum and delay, staking exit fee | a fraction or a negative value does not compile |
| Number >= 0 | ERC-20 supply and cap, escrow timeout, vesting duration and cliff, paywall period, DAO threshold, staking lock and APY | a negative value does not compile (a fraction is fine) |
| Scaled amount | NFT price, escrow / vesting / paywall amounts | at most 6 decimals (written as x 10^6); the portable modes accept only digits with an optional decimal part and THROW otherwise |
| Text in a string | symbol, base URI | a quote or a backslash does not compile |
| Refused with an alert (nothing generated) | DAO voting period (whole, at least 1); Smart Wallet guardian (required, not the deployer), session key (1..720 h), recovery delay (1..30 d), daily limit | |
| DRAFT (generated, deploy page refuses it) | escrow parties (three distinct addresses), vesting and paywall beneficiary, DAO governance token (Single mode), token defaults on networks with no USDC, NFT payment token when the price is not 0 | |

Per mode: no template has a constructor argument in Single network mode; the portable modes add `usdc_` (NFT), `token_` (escrow, vesting, paywall), `token_` + `votingPeriod_` (DAO), `dailyLimit_` (Smart Wallet), `stakingToken_` (staking), and none for ERC-20.

Per network (all 16): the token rows show the network's USDC or say there is none; the Smart Wallet limit defaults to the network's own value in its gas token (0.1 ETH, 100 POL, 100 USDC on Arc, and so on); BNB Chain's default token has 18 decimals while amounts are written for 6 in Single mode, and the page warns there only; the DAO note says block times differ between chains; mainnets are flagged on the Network row and all 9 mainnet ids still refuse `deployCompiled` without the maturity confirmation, for every template.

## What changed

- `index.html`: only `#sec-simple` (the shell: header, steps, two columns, overview, notes, progress). `#simpleGrid`, `#simpleForm` and `#simpleCode` keep their ids and are still filled by the same scripts; maturity badges on the cards and the advanced-options grouping from the page script keep working.
- `app.js`: `SMP_SPEC` (the per-template facts above) and `SMP_CONFIG`. Nothing in the generators or the card/form renderers.
- `builder.js`: one optional setting, `watch`, so a screen whose form is drawn by script redraws after it. The other five screens do not use it.
- `app.css`: a few shared `.bld` rules (notes list, compact cards, form panel).
- Tests: `simple-builder-ui.mjs` (1582 checks, 47 of them compile-checked), `simple-builder-browser.mjs` (NOT executed here: Chromium cannot start in this sandbox), `creation-tabs-audit.mjs` gained the Simple facts (272 checks).

## Limits

- Review & Audit never completes (the app does not record which source an audit covered).
- The Smart Wallet unit label inside the form (`s_limit_unit`) is drawn once with the form; it does not follow a later network change. This is the page script's existing behavior, not changed here.
- The wizard selects its card after a 100 ms delay (existing behavior); the overview follows the form as soon as it is drawn.
