# Phase 12.3: Gas Estimator (tab 11)

`estimateGas()` and `logGas()` are unchanged: same checks, same questions to the node (the gas price, and `eth_estimateGas` on the creation bytecode), same formula when the node cannot estimate, same CoinGecko request, same numbers and same log lines. The tab now has two columns: the price inputs and the meter on the left, a read-only overview on the right.

## What the audit found (and the overview now says)

- **Where each number comes from.** Gas price: yours (the override) or the network's, asked of your wallet's connection. Gas units: the node, or, if it cannot estimate, the page's formula (32,000 + 200 per non-zero byte + 4 per byte), which the overview calls "a rough number". Dollar price: yours; fixed at $1 where the gas token is USDC (the two Arc networks); otherwise CoinGecko, an outside service, asked only when you press Estimate and no price is set. If the price cannot be fetched the dollar figure is withheld ("nothing is invented").
- **The constructor arguments are not in the estimate.** The node is asked about the creation bytecode only, with no arguments; the overview says so when the contract has arguments.
- **The wrong dollar price for Avalanche and BNB Chain (known, unchanged).** The page maps only ETH and POL to a CoinGecko id; for AVAX and BNB it asks for the Ethereum price and labels it "$N per AVAX/BNB". The overview marks the row bad on those two networks, the price field's note says to set your own, and a note lists it. Fixing it is a one-line change in `estimateGas()`, left for a decision.
- **The numbers belong to the wallet's chain, not the page's label.** The estimate goes through the wallet's connection (the page switches the wallet to the active network on connect and follows a wallet switch to a known chain, but a wallet on an unknown chain, or a network changed on the page afterwards, can differ). The overview compares the chain id the wallet already holds (`window.ethereum.chainId`, a property: nothing is requested) with the active network and says so when they differ.
- **Which compile the bytecode is from.** The bytecode and the ABI come from the last compile, with no record of the contract. The overview says "from the last compile ... this page cannot tell it is from the contract on screen", and "from this exact source" only when a deployment made on this page proves it (the same proof as the Share tab). Nothing is compiled on this tab.
- **Size.** The overview shows the bytecode size against the EIP-170 limit of 24,576 bytes and the page's own warning from 20,000.
- **What the estimate was made for.** The page notes, at the click, the contract (name and hash), the network and the two overrides, and reads its own log lines and meter afterwards: "current", or "outdated" because the contract, the network or an override changed. A failed run keeps the earlier meter on screen, and the overview says so. The page's own pre-checks (no contract, no wallet, no bytecode) are shown as the reason an estimate was not made.
- **The last step is never done:** gas prices move, so estimate again right before deploying and add what the constructor arguments cost.

## What changed

- `index.html`: only `#sec-gas`. Every id, handler, default and the six meter cards are kept; the button gets an id (`estimateGasBtn`) so the click can be noted.
- `app.css`: a short block scoped to `#sec-gas`.
- `app.js`: the overview (`gasRender`, `gasRead`, `gasFinish`), written with the shared row and step writers of Phase 12.0. It never asks the wallet, the node or CoinGecko for anything, never writes the form or the contract, and sets no HTML from text.

## Tests

`tests/gas-tab-ui.mjs`, 158 checks, with the real ethers library and a simulated node, wallet and price service: ids and handlers; nothing asked until Estimate Gas is pressed (the node, CoinGecko, alerts); the one request and the meter; readiness (a contract, a wallet, bytecode), the compiled-bytecode association (last compile, and exact after a deployment from the page), the size at 20,000, 20,001 and 24,577 bytes, the constructor argument note, and the overrides; working, current, each kind of outdated, the formula, failed-keeps-the-earlier-meter and the page's own pre-checks; all 16 networks with the mainnet warning, the dollar price source and request for each gas token (the AVAX and BNB defect locked), and the estimate in the network's token; an unreachable price service; the wallet on the same, another known and an unknown chain; every mode; hostile text as text; ten navigations leave the overview unchanged. Mutation checks: eleven changes to the code, all caught.

`tests/gas-tab-browser.mjs` (written, not executed: Chromium cannot start in the authoring sandbox) checks the two columns, one column on a phone, the six meter cards and the log inside the screen, and no sideways scroll.

## Limits

- The wrong price for AVAX and BNB, the missing constructor arguments and the wallet-chain label remain as they were; they are described, not fixed.
- The overview learns about an estimate from the log lines and the meter the page already produces; a change to those would need this view changed too (the test file fails if it happens).
- The layout was verified by DOM and CSS only.
