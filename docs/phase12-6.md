# Phase 12.6: Test Lab (tab 18)

The simulator (the in-browser EVM, loaded from `lab-evm.js` on first use), the compile, the five accounts, the time, the test tokens, the CCTP stand-ins and the calls are unchanged: `lab.mjs` (73 checks, the real engine and a real compiler) passes on the new markup. Every original element of the tab (the status line, the contract header, the constructor form, the acting account, the balances, the time and mining controls, the test-token controls, the filter, the function and transaction lists and the log) is byte-for-byte what it was; the tab only re-groups them into four cards and adds a read-only overview on the right.

## What the audit found (and the overview now says)

- **It is a simulation.** A private chain inside the page: no wallet, no network node, no real funds. The first row says so. The simulated chain id is the active network's at the moment you load (read from the engine itself), and a note says it is only the id the contract sees; if the app moves to another network afterwards, the overview says the lab is still on the other id. A mainnet gets no "real funds" wording here, because nothing is real.
- **Which contract is in the lab, and whether it is still the one on screen.** The page already keeps a hash of the source it loaded; the overview uses it: "In the lab: Name at 0x...", or "The contract changed since it was loaded", in agreement with the page's own header line. A contract waiting for constructor arguments is shown as compiled but not deployed, with the number of arguments. A draft is refused by the page before the engine starts, and shown as a draft with the reason.
- **The lab deploys the last contract of the file when the name on screen is not found** (known, unchanged); the overview says "The file has no contract called X, so the lab deployed Y".
- **Time and blocks** are the engine's own: the time starts at your clock and moves only when you move it, blocks move with each call or Mine blocks (a note: a contract that counts blocks, such as a voting period, needs Mine blocks).
- **Test tokens:** the test USDC and EURC always have 6 decimals, at fixed fake addresses, or, when the source hard-codes the network's real USDC or EURC address, at that very address. On a network whose real USDC is not 6 decimals (BNB Chain: 18) the overview says so.
- **Circle's real CCTP address cannot be reached in the lab.** The test messenger and transmitter are stand-ins at fixed addresses (the CCTP V2 shape). A contract built with Circle's real addresses hard-coded, which is the crosschain payments contract in Single network mode, calls an address with no code in the lab, so a call that reaches it reverts without a reason (confirmed by running it). The overview detects the real addresses in the source and warns; the portable bridge takes the messenger as an argument and gets the stand-in, so it is not warned.
- **Calls:** counted from the page's own list (the deploy is not a call), with the failed ones, and the note that the page keeps the last 40; limits of 15,000,000 gas per call and 24 KB per contract are listed.
- The last step is never done: passing in the lab is a simulation, not a guarantee.

## What changed

- `index.html`: only `#sec-lab`, regrouped into four cards (contract and simulation; accounts, time and test tokens; functions; activity) and the overview, progress and notes columns. Every id, handler, default and element is kept (compared with the version before this phase).
- `app.css`: a short block scoped to `#sec-lab`.
- `lab.js`: the overview (`labOvRender`, `labOvRead`, `labRealCctp`), written with the shared row and step writers of Phase 12.0. It reads the lab's own state; it never starts the engine, compiles, deploys or calls anything, and sets no HTML from text.

## Tests

`tests/lab-tab-ui.mjs`, 116 checks, running the REAL simulator and a real compiler (nothing else simulated): ids, the fifteen handlers and the original elements compared with the version before this phase; drawing the overview, switching network and tab never load the simulator, touch the compiler or fetch anything; no contract, a draft; an ERC-20 loaded on Sepolia (chain id, the contract in the lab, accounts, test tokens), time and mining moved and the overview following them, the acting account, a read and a failed transaction counted, a changed contract reported as outdated and loaded again, a name that is not in the file; a contract waiting for constructor arguments and then deployed; a source that hard-codes the network's USDC; the crosschain payments contract in Single mode warned about Circle's real address and its call confirmed to revert without a reason, and the portable bridge getting the stand-in; all 16 networks loaded for real (the chain id, the token decimals, no mainnet alarm), and a network change after the start; every mode, hostile text as text and ten navigations leaving the overview the same. Mutation checks: ten changes to the code, all caught.

`tests/lab-tab-browser.mjs` (written, not executed: Chromium cannot start in the authoring sandbox) starts the lab in a real browser and checks the two columns, one column on a phone, the balances table, function cards and log inside the screen, and no sideways scroll.

## Limits

- The overview detects Circle's real CCTP addresses (the ones in the app's tables) in the source; a contract that calls some other address with no code in the lab would revert the same way without being warned.
- The overview learns about the lab from its own state and the page's status line, header and time line; a change to those would need this view changed too (the test file fails if it happens).
- The layout was verified by DOM and CSS only.
