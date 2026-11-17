# Phase 12.5: Contract Analytics (tab 16)

`loadAnalytics()`, `refreshAnalytics()`, `setAnalyticsAddress()` and the history pills are unchanged: same questions to the wallet's connection (block number, account nonce, native balance, the network's USDC balance, the logs of the address), same six cards, same ten bars, same event list. The tab now has two columns: the form and the results on the left, a read-only overview on the right.

**On the open decision** (only warn about the chain, or also read from the selected network's own node): the page only warns. Where the numbers are read from is unchanged.

## What the audit found (and the overview now says)

- **Everything is read through your wallet's connection**, so it describes the chain the wallet is on, while the labels (network, native symbol, USDC) come from the app's active network. The overview says "Reads through: your wallet's connection" and compares the chain id the wallet already holds (`window.ethereum.chainId`, a property: nothing is requested) with the active network: the same chain, another known chain or an unknown one, with the warning that the numbers then belong to that chain.
- **The pills only fill the address; they do not switch network.** Picking a deployment made on another network and loading it reads the wallet's chain and labels the result with the app's network. The overview looks the typed address up in the deploy history and, when the record is on another network, says so, with a note under the field. (The pill click changes the address without any input event, so the overview did not redraw; found by the tests and fixed by redrawing after a pill's own handler.)
- **The "Transactions" card is the account's nonce** (known, unchanged): for a contract it is the number of contracts it created (it starts at 1), not the number of transactions sent to it. The overview lists it as "Transactions card" with that explanation.
- **Events are counted over the whole range, but only the newest 20 are listed;** the ten bars split the range into equal parts. A node may refuse a large look-back; the page then shows the node's own message and the earlier cards stay on screen, which the overview says.
- **The look-back** is read exactly as the page reads it (empty means 10,000; 0 means only the latest block; a negative value makes the range start after the latest block and the node answers with an error); the overview shows the value actually used and explains each case. The address is not validated by the page; the overview marks an address that is not 0x plus 40 hex characters ("the node will refuse it").
- **USDC balance:** the network's own USDC address is used; where the network has none, or the wallet is on another chain, the card shows a dash and the overview says why.
- **What the numbers were read for.** The page notes, at the click, the address, the look-back and the network, and reads its own cards and console line afterwards: "current", or "outdated" because the address, the network or the look-back changed; a failure keeps the earlier cards on screen and the overview says so. The page's two checks (no address, no wallet), which only alert, are shown as the reason nothing was loaded. The last step is never done: the numbers are a snapshot of the chain head.

## What changed

- `index.html`: only `#sec-analytics`. Every id, handler, default and the six cards' container are kept; the form and the results are two cards.
- `app.css`: a short block scoped to `#sec-analytics`.
- `app.js`: the overview (`anRender`, `anRead`, `anFinish`), written with the shared row and step writers of Phase 12.0. It never asks the wallet or a node for anything, never writes the form, and sets no HTML from text.

## Tests

`tests/analytics-tab-ui.mjs`, 116 checks, with the real ethers library and a simulated wallet node: ids and handlers; nothing asked until Load or Refresh is pressed (including typing, switching networks and clicking a pill); the exact questions and cards; readiness, the page's own alerts shown as reasons, working, current, each kind of outdated, Refresh tracked the same way, every look-back case, and a node that refuses the range keeping the earlier cards; a deployment from another network (and unknown and unrecorded ones) and what the pills do; the wallet on the same, another known and an unknown chain with the wallet never asked; all 16 networks with the mainnet warning, the native symbol, the USDC balance or its absence; every mode; hostile text as text; ten navigations leave the overview unchanged. Mutation checks: ten changes to the code, all caught.

`tests/analytics-tab-browser.mjs` (written, not executed: Chromium cannot start in the authoring sandbox) checks the two columns, one column on a phone, six cards, ten bars and sixty events inside the screen, and no sideways scroll.

## Limits

- The "Transactions" label, the chain the numbers are read from and the pills' behaviour remain as they were; they are described, not changed.
- The overview learns about a load from the cards and the console line the page already produces; a change to those would need this view changed too (the test file fails if it happens).
- The layout was verified by DOM and CSS only.
