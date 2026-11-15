# Phase 8.5: Swap / AMM builder

Status: 2026-11-15. Page reorganisation of section 02 only. Starting HEAD `270f4cc` (Phase 8.4 committed), working tree clean. Nothing is committed by this phase.

## Confirmed paths (unchanged)

- **Generate:** the button's `data-onclick="genSwap()"` runs `genSwap()`, which validates, builds the Solidity per branch (AMM single pair, AMM factory, order book), applies `portabilize` and `matStamp`, calls `showCode('swapCode', …)`, sets `pendingSource = { name, code, template }`, calls `renderCtorArgs()` and sets `#pendingContractLabel`. It compiles and deploys nothing.
- **Deploy:** `data-onclick="deployFromBuffer('swap')"` opens `#sec-deploy` (pending contract, `ctorArgsPanel`, `multiDeployPanel`, Compile and deploy, Download .sol, Copy code, console). `compileAndDeploy()` then compiles in the worker, applies the mainnet maturity check, and `deployCompiled()` sends the transaction; the history is written only after `contract.deployed()`.
- **Branches** (real, from `genSwap`): `amm` + `single` is one pair contract; `amm` + `factory` is a factory with `createPair` and ignores Token A/B; `orderbook` is a StableFX-style order book with a fee in Token B to the deployer, and `swap_multi` has no effect on it.

## What changed

| File | Change |
|---|---|
| `contractforge-deploy/index.html` | Only `#sec-swap`: header (title, description, the existing maturity slot, the Phase 8.4 mode control), three steps, a 70/30 grid (configuration left, overview right), the code panel below. Every `swap_*` id, default, option value and both button handlers are kept. The existing `details.adv` block (fee, pair support) is now written in the markup, so the page script's collapse step skips it. |
| `contractforge-deploy/app.css` | One block scoped to `#sec-swap` (and `.light #sec-swap`), placed before the shared and AI blocks. |
| `contractforge-deploy/app.js` | A read-only view after `genSwap()`: `swbRead`, `swbProblems`, `swbRender`, `swbDecorateCode`, `swbInit`. `genSwap`, `showCode`, `pendingSource` and the deploy code are untouched. |
| `contractforge-deploy/multichain.js` | One line: `renderModeSelector()` also calls `swbRender()` so the overview shows the Deployment Mode. |
| `tests/swap-builder-ui.mjs` (new, in `npm test`), `tests/swap-builder-browser.mjs` (new) | See Tests. |

## The page

- **Configuration** (left): Contract Identity (name), Trading Pair (two balanced token fields, with the existing network-default hints and a note that follows the real branch), Protocol Configuration (the same select, a description that follows the choice, and Advanced Options with the fee and pair support). The fee shows its percentage live: 30 bps is 0.30%, 45 is 0.45%, 10000 or more is flagged invalid.
- **Protocol texts** describe what each generator produces. The order book is described as peer-to-peer orders with no pools and no AMM, and the fee note says it goes in Token B to the fee collector. It is never described as Uniswap or as having liquidity.
- **Overview** (right, read-only): project name as the generator will sanitise it, protocol, Token A/B (typed or network default, flagged when invalid, missing, not used by a factory, or set at deploy time in a portable mode), fee, pair support, network with chain id, Deployment Mode. These read the form, `activeNetwork` and `multichainMode`; they write nothing.
- **Build Progress**, real state only:
  - Configuration: done only when the same checks `genSwap()` makes pass (they are mirrored without the alerts).
  - Code Generation: done only when `#swapCode` holds code equal to the deploy buffer, the buffer is a swap template, and the form (and network and mode) still match what was generated. If the form changes it says the code is out of date; if another section took the buffer it warns that Deploy now would deploy something else.
  - Review & Audit: never completes. The app keeps no audit result tied to a source, so it states "Not audited" and points to the auditor and Test Lab.
  - Deployment: done only when the deploy history has a record for this contract written after this generation (the app writes it after confirmation). An older deployment of the same name, or another contract, does not count.
- **Generated Solidity panel:** still `showCode`'s output (file, line count, `pre` with the exact text). A head decoration adds the language, the real maturity badge from `matInfo`, and "Not audited" only when the level is experimental. The code scrolls inside the panel (520px max).

## Not changed

Generators, `showCode`, the compiler, Multi-deploy, `reqBlockReason`, `matGate`/`matIsApproved`, `deployCompiled`, wallet and network code, the AI tab, other creation modules. Generated Solidity is byte-identical (the golden suite covers 72 outputs, including the four swap variants).

## Tests

Baseline at `270f4cc`: `ui` 375, `multichain` 930, `deploy-mode-ui` 107, `ai-chat-ui` 168, `ai-workspace-ui` 183, `ai-chat-startup` 67, `ai-proxy` 146, `xss` 43, `csp` 240, `innerhtml-lint` OK, golden 72.

After: all of those unchanged and passing, plus the new `swap-builder-ui` **176**. compile-generators 342, maturity 146, playground 55, lab 73, solc-loader 7, vendor 10, reproducible-bytecode 70, compile-foundry-tests 19, headers 6, zip 15. No test failed and no existing assertion was changed.

`swap-builder-ui` covers: every id, default, option and handler; all four protocol/pair combinations generating through `genSwap()` with `#swapCode` equal to `pendingSource.code`, identical inputs giving identical Solidity, correct templates and file names, the order book not being an AMM; the code head (real file, lines, language, maturity, "Not audited" exactly when experimental); Generate compiling or deploying nothing; Deploy now opening the same deploy page with its panels and handlers and also compiling nothing; constructor arguments in portable mode; Multi-deploy with nothing pre-selected and no mainnet; the mainnet maturity gate still refusing; the overview and the fee percentages against real inputs, defaults, invalid values and network/mode changes; progress honesty (refused generation, stale code, buffer taken by another section, audit report ignored, old or foreign deployments ignored, a confirmed record completing it); markup typed in the form staying text; CSS scope and the 70/30 and single-column rules. I broke the code four ways (generation shown without code, audit success from any report, old deployments counting, Deploy now replaced); the suite failed each time.

Pre-existing failures, unchanged: `native-solc-bytecode.mjs` (0 of 69) and `native-solc-oracle.mjs` (2 of 9), because the machine has no native `solc` 0.8.24. They stop `npm test` there, so later scripts were run one by one.

**NOT EXECUTED:** `swap-builder-browser.mjs`, `deploy-mode-browser.mjs`, `ai-chat-browser.mjs` and `csp-browser.mjs` (Chromium cannot start in this sandbox: system libraries missing, no root). `swap-builder-browser.mjs` is written to check on desktop, tablet and phone: about 70/30 columns, one column on a phone, balanced token fields, no sideways scroll, controls inside the screen, touch-sized buttons, the live fee percentage, the code panel scrolling on its own without widening the page, progress after a real generation, and Deploy now reaching the real deploy page. None of it is verified.

## Remaining limitations

- Real-browser appearance (spacing, the 70/30 split, the sticky overview, the phone layout) is unverified and the mockup was matched from the screenshot only.
- The overview mirrors `genSwap()`'s checks rather than calling it, so a future change to those checks needs the mirror updated; `genSwap()` stays the authority.
- Review & Audit never shows success by design; showing it would need the app to record which source an audit covered.
- The mockup's "Uniswap V2-style" wording and per-field icons were not copied: the order-book branch is not Uniswap-style, and icons would be decoration.
