# Phase 12.1: Test Generator (tab 17)

`generateTests()`, `copyTests()` and `downloadTests()` are unchanged: same request to the AI (`tests`, with the name, the whole source, the framework and the coverage), same output, same file names. The tab now has two columns: the form and the result on the left, a read-only overview on the right.

## What the audit found (and the overview now says)

- **Nothing is compiled or run.** The page asks the AI for text. The "N test functions" on the result card is a count of lines in that text. The overview's review step can never be "done": it says to read the tests and run them (`forge test`, `npx hardhat test`) yourself.
- **The text does not record what it was written for.** The page keeps one text in one variable. The overview notes, at the click on Generate Tests, the contract (name and a hash of the source), the framework and the coverage, exactly what `generateTests()` reads at that moment. It then compares with what is on screen: tests are "current", or "outdated" because the contract changed, or because the framework or coverage changed.
- **Hardhat and "Both":** the card counts Foundry-style `function test` lines, so a Hardhat text shows "0 test functions" there (known, unchanged); the overview counts `it()` blocks for Hardhat, and for Both it counts the Foundry lines only. A "Both" answer is one text and Download saves it as a single `.t.sol` file; the page says so beside the field.
- **Download follows the choices made when you press it,** not the ones the text was written for: switching to Hardhat after a Both text renames the file and leaves the text. The overview marks that case outdated and shows the file name Download would use.
- **A failed regeneration keeps the earlier text:** after a success followed by a failure Download still saves the earlier tests. The overview says "Download would still save the earlier tests for <contract>".
- **Failures are shown as what they are:** "AI is not configured on this deployment" and "not available" are shown as AI unavailable; any other error as a failed request, with its own message; an empty answer is not a success and has no count. The page's own console line (`Test gen error: ...`) is unchanged.
- **A draft** can still have tests written (as before); the overview shows it as a draft with the reason it cannot be deployed. With no contract the page's own alert appears and nothing is asked of the AI.
- **Mode and network:** tests do not depend on the network, but the contract on screen was generated for one; the overview shows the active network (with the mainnet warning) and the Deployment Mode like the other tabs.

## What changed

- `index.html`: only `#sec-tests`. Every id, handler, option, default and the disabled contract field are kept; the page gets the intro text, a result card, and the overview, progress and notes columns.
- `app.css`: a short block scoped to `#sec-tests`.
- `app.js`: the overview (`tgRender`, `tgRead`, `tgFinish`), written with the shared row and step writers of Phase 12.0. It notes the form at the click (a capture listener on the Generate button), watches the page's own results (the button, the output and the console line) and redraws when the tab opens, a setting changes, the network or the mode changes. It never calls the AI, never writes the form or the contract, and sets no HTML from text.

## Tests

`tests/tests-tab-ui.mjs`, 94 checks, the AI simulated (good, Hardhat, Both, empty, unavailable, failing, held while waiting): ids and handlers; nothing asked until Generate is pressed; the exact request and the three file names; the overview through none, waiting, current, settings changed, contract changed, regenerated; the Hardhat and Both facts; unavailable, failed, empty and failed-after-success; a draft and a click with no contract; all 16 networks with the mainnet warning and every mode with no extra AI call; hostile text as text only; ten navigations leave the overview unchanged. Mutation checks: ten changes to the code, nine caught (the tenth, recording a run with no contract, changes nothing visible).

`tests/tests-tab-browser.mjs` (written, not executed: Chromium cannot start in the authoring sandbox) checks the two columns, one column on a phone, a long test text scrolling inside its own box, and no sideways scroll.

## Limits

- The count on the result card for a Hardhat text still reads 0; fixing it means changing `generateTests()`, left for a decision.
- The overview learns about a generation from the button, the output and the console line the page already produces; a future change to those would need this view changed too (the test file fails if it happens).
- The layout was verified by DOM and CSS only.
