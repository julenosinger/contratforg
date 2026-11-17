# Phase 12.4: ABI Playground (tab 09)

Loading, calling, sending, watching and subscribing are unchanged (the functions in `playground.js` and the shared function cards used by the Test Lab are untouched; `playground.mjs`, 55 checks against a local chain, passes on the new markup). The page's own context line (`#pg_context`: network, LIVE, short address and the wallet line with its Switch button) stays exactly where it was. The tab now has two columns: the contract and ABI form, the functions and the activity log on the left, a read-only overview on the right.

## What the audit found (and the overview now says)

- **The contract's network is not the app's network.** A loaded contract lives on `pgTarget` (from its deployment record, or the app's network when none is known), and every call goes there. The overview shows the contract's network with the mainnet warning and, when the app is on another network, an "App network" row saying so.
- **Reading and sending.** Reads go to the network's own public node (the overview names its host) and need no wallet. Sending needs a wallet on the same chain; the page checks it on every write, dry-runs the transaction first (`callStatic`) and, on a mainnet, asks you to confirm with a summary and a real-funds warning. The overview compares the chain id the wallet already holds (`window.ethereum.chainId`, a property: nothing is requested) with the contract's chain: ready, on another chain (with the chain), unknown, or read-only. On a mainnet it says real funds.
- **Which ABI is in use.** "Use last compiled ABI" is the ABI of the last compile, whatever address you type. The overview says "this page cannot tell it belongs to this address", and says it is the deployment's own only when a deployment made on this page created exactly that address from exactly that compile (an address and bytecode proof, the same idea as the Gas and Share tabs). A pasted ABI and a deploy-history ABI are named as such. The page does not keep which source was chosen, so the overview notes it when a contract is loaded.
- **A watch or a subscription is not stopped by loading another contract (known, unchanged).** They keep running for the contract they were started for. The overview lists them ("Watching total() every 5 seconds", "Subscribed to 1 event") and, once another contract is loaded, marks them as started for the earlier address and says what to do: press Subscribe to Events again, or start another watch.
- **The ABI's counts** (read, write, events), the **session's calls** (the page's own list, last 25: reads, transactions, failed) and the limit of **Recent events (the last 2,000 blocks)** are described.
- **History opens by index.** Deploy History, Home and the deployments list open a record by its index in storage, as before.

## What changed

- `index.html`: only `#sec-playground`. Every id, handler, option, default and the context line are kept; the form, the functions and the activity log are three cards.
- `app.css`: a short block scoped to `#sec-playground`.
- `playground.js`: the overview (`pgRender`, `pgLastProven`, the notes of the ABI source at load and of the contract a watch or subscription started for), written with the shared row and step writers of Phase 12.0. It never creates a node connection, never calls a contract, never asks the wallet and sets no HTML from text.

## Tests

`tests/playground-tab-ui.mjs`, 137 checks (real ethers, no network reached, a stand-in signer and wallet): ids and handlers; drawing creates no node connection, fetches nothing, never asks the wallet; a loaded contract on each of the 16 networks (its own network with the mainnet warning, the app-network row, the ABI counts and source, the node host); a pasted ABI, the last compiled ABI unproven, proven only by a deployment at that address with that bytecode and not proven after a different compile, and history records opened by index and by the deployments list; the wallet read-only, connected, on the same chain (with the mainnet or dry-run wording on all 16), on another and on an unknown chain; a subscription and a watch listed, reported as still running for an earlier contract, moved by subscribing again, and gone when a watch stops; the session's calls; hostile text as text; ten navigations leave the overview unchanged. Mutation checks: eleven changes to the code, all caught.

`tests/playground-tab-browser.mjs` (written, not executed: Chromium cannot start in the authoring sandbox) checks the two columns, one column on a phone, twelve long-named function cards and a long call result inside the screen, and no sideways scroll.

## Limits

- Calling and sending themselves (revert reasons, the mainnet confirmation, the chain check) are covered by `playground.mjs`; the overview does not duplicate them.
- The overview learns about a load, a watch or a subscription from the DOM the page already produces and from clicks on its own buttons; a different way of starting them would need this view changed too (the test file fails if the buttons change).
- The layout was verified by DOM and CSS only.
