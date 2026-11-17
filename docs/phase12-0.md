# Phase 12.0: the base for the six analysis tabs

Test Lab (18), AI Auditor (08), ABI Playground (09), Gas Estimator (11), Analytics (16) and Test Generator (17) are redesigned one by one in the phases that follow. This phase changes **nothing the user can see**. It makes the later phases safe: it records, as a test, what each of the six tabs really does today, and it moves the overview code that four views had copied into one place.

## 1. What the six tabs do today (locked by `tests/analysis-tabs-audit.mjs`, 130 checks)

The facts were read from the code and confirmed by running it with stand-ins for the wallet, the RPC node and the AI service (nothing real is called). Known defects are locked as they are, marked KNOWN in the test: fixing one is a decision, and the test line is then changed on purpose.

- **Structure:** each tab's number, title, menu entry, ids (exactly once each), handlers (including the `change` handlers of the Playground and the Lab), the options of every select and the defaults (10,000 blocks of look-back; gwei override and manual price at 0).
- **Test Generator:** asks the AI (`tests`) with the name, the whole source, the framework (default foundry) and the coverage (default basic); disables the button while waiting; strips the code fences; counts the "function test" lines in the text; downloads `.test.js` for Hardhat and `.t.sol` otherwise; never compiles or runs anything. KNOWN: the text is kept in one variable that does not record which source it was written for, so it can be stale.
- **AI Auditor:** asks the AI (`audit`) with the name, the whole source and the focus; keeps the report in memory exactly as given; labels the score Secure (80 and up), Moderate risk (60), High risk (40), Critical issues (below), clamped to 0 to 100; the markdown download carries the name, score and findings; a bad answer or an unavailable service leaves the earlier report alone. KNOWN: nothing records which source was audited, and the word "Secure" comes from the model's own number.
- **Gas Estimator:** needs a contract, a connected wallet and a compile; asks the node for the price (unless you set gwei) and for `estimateGas` on the creation bytecode only; without `estimateGas` it uses 32,000 + 200 per non-zero byte + 4 per byte and says so; warns above 20,000 bytes and errors above 24,576 (EIP-170); the dollar price is the manual one, or fixed at $1 where the gas token is USDC, or fetched from CoinGecko; if the price cannot be fetched the figure is withheld. KNOWN: the constructor arguments are not part of the estimate; Avalanche (AVAX) and BNB Chain (BNB) are priced with the Ethereum price, because only ETH and POL have their own CoinGecko id.
- **Analytics:** needs an address and a connected wallet; reads logs of that address from (latest - look-back) to latest; shows Transactions, Events, Native balance (in the network's gas token), USDC balance (the network's own USDC, or a dash where there is none), From block and Latest block, ten bars and the events. KNOWN: "Transactions" is the account nonce (for a contract, not a count of transactions to it), and the labels come from the active network without checking which chain the wallet's connection is on.
- **ABI Playground:** reading never needs a wallet; sending needs one, on the contract's own chain; without a wallet it says it is read-only; a history record opens by its index in storage.
- **Test Lab:** five test accounts, test USDC and EURC and two CCTP stand-ins at fixed fake addresses; a simulation that uses neither the wallet nor a node (its engine is loaded on first use); opening the tab sends nothing; Test in the contract bar does nothing for a draft.

## 2. One writer for the overview rows and steps

`builder.js` now has `CFBuilder.rowWriter(list)` and `CFBuilder.stepWriter(list)`. The Deploy, Verify, Share and Wizard overviews had each written the same eight lines for a summary row and the same ten for a progress step; they now use the shared ones, and the six new overviews will too. The writers only build DOM nodes with `textContent`.

**Proof the output did not change:** `tests/overview-views-snapshot.mjs` draws those four views in 67 states (six networks on the Deploy, Verify and Share overviews with and without a wallet and a filled form; a draft; a portable escrow with a constructor argument; Multi-deploy with a mainnet; an exact deployment; a submitted verification; a share link with an artifact; the Wizard for six contracts on Arc Testnet and Arc Mainnet in Single and Portable modes) and compares a hash of each with `tests/fixtures/overview-views.json`. The fixture was written from the code as it was BEFORE the change (the previous commit's `app.js` and `builder.js`), and the code after the change reproduces all 67 hashes. After an intended change, `node overview-views-snapshot.mjs --update` rewrites the fixture and the diff is reviewed.

## Files

`builder.js` (the two writers), `app.js` (the four views use them: 27 added and 34 removed lines), `tests/analysis-tabs-audit.mjs`, `tests/overview-views-snapshot.mjs`, `tests/fixtures/overview-views.json`, `tests/package.json`. No generator, compiler, deploy, wallet, network or AI-service code changed, and no HTML or CSS changed.

## Limits

- This phase is not visible, so no browser test was written for it; the 13 browser suites written in earlier phases still have never been run (Chromium cannot start in the authoring sandbox).
- The default row state in the shared writer is never used by the four views (they always pass a state); the snapshot cannot see a change to it.
