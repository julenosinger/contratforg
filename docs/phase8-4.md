# Phase 8.4: Contextual Deployment Mode selector

Status: 2026-11-15. UI relocation only. Starting HEAD `c26b1a6` (Phase 8.3.1 committed), working tree clean. Nothing is committed by this phase.

## The existing mode, as found in the code

- State: `let multichainMode = 'single'` in `multichain.js`, initialised from `localStorage['cf_mc_mode']` when the value is one of the keys.
- Keys and texts: `MC_MODES = { single, portable, multi, cross }`, each with `label` and `desc` ("Single network", "Portable", "Multi-deploy", "Crosschain").
- One setter: `setMultichainMode(mode)`. It rejects unknown keys, stores the mode, redraws the selector, logs "generate the contract again to apply it", and refreshes the constructor-argument panel, the network banner and the multi-deploy panel. It does not compile, deploy or touch the wallet or the source.
- Consumers (unchanged): `isPortable()` in the generators, `mdVisible()` and the bridge option in `multideploy.js`, the banner and contract-bar chips in `ui.js`, `maturity.js`, `required.js`. The Home page's "How should it deploy?" cards (`#homeModes`) are another existing control on the same state.
- The old selector was `#mcSelector` (a `.mc-box` with four `.mc-btn` buttons) in the left sidebar, drawn by `renderModeSelector()`.

## What changed

| File | Change |
|---|---|
| `multichain.js` | `renderModeSelector()` now draws the shared control instead of the sidebar panel. New: `dmToggle`, `dmOpen`, `dmClose`, and a one-time listener binding. `setMultichainMode`, `MC_MODES`, `multichainMode`, the key `cf_mc_mode` and every consumer are untouched. |
| `index.html` | `#mcSelector` removed from the sidebar. An empty `<div class="dm-mount">` added to the headings of Token/Escrow/NFT (Simple contracts), Swap/AMM, Treasury, Vault, MultiSend, Crosschain and Contract Wizard, and to the AI composer toolbar (between Complexity and Attach Current Contract). |
| `app.css` | `.dm-*` rules placed before the AI block, plus four scoped rules for the AI toolbar. The old `.mc-box`/`.mc-btn` rules are now unused and left in place. |
| `tests/multichain.mjs`, `tests/ui.mjs` | Two assertions that targeted the old sidebar buttons now target the new options, and one asserts the old selector is gone. |
| `tests/deploy-mode-ui.mjs` (new, in `npm test`), `tests/deploy-mode-browser.mjs` (new) | See Tests. |

## How it works

- **One state.** The popover options call the existing `setMultichainMode()`; nothing else writes the mode. Because that setter already calls `renderModeSelector()`, every control, and the Home cards (updated in place), refreshes on every change, whoever caused it.
- **Controls are built once and updated in place**, so focus and open state survive a mode change and nothing is duplicated by redraws.
- **One popover.** A single `#dmPopover` element on `<body>` (role `listbox`, options `role="option"` with `aria-selected`). It is positioned from the trigger with `position:fixed`, so no parent's overflow can clip it (the AI chat has `overflow:hidden`). In the AI composer it opens upward. At 600px and below it is a bottom sheet inside the safe area with 56px options. `z-index:90` sits above the sticky bar (20) and below the confirmation dialogs (100, 1000). There is no backdrop or overlay.
- **Listeners.** One `click`, one `keydown`, one `resize` and one capture `scroll` listener for the whole page, bound once. Triggers use the app's existing `data-onclick` mechanism.
- **Keyboard.** Enter, Space or ArrowDown/ArrowUp on the trigger opens it; focus goes to the selected option; ArrowDown/Up (wrapping), Home and End move; Enter/Space chooses; Escape closes and returns focus to the trigger; Tab closes and leaves focus on the trigger so Tab moves on; a click outside closes without taking focus; only one popover is open at a time.
- **Texts are the code's own.** Titles and descriptions are `MC_MODES[k].label/desc`, which already match what the code does, so I did not rewrite them. The footnote in the popover says the choice only configures the next contract and nothing is compiled or deployed. From the AI toolbar it says: "Used by ContractForge when you compile and deploy. It is not sent to the AI and does not change what the AI writes."

## Compatibility with each module

I found no module in which a mode is unavailable: every generator reads `isPortable()` and works in all four modes, and Crosschain generates the CCTP V2 bridge in the portable modes. So no mode is disabled or hidden, and the control shows no per-module warning. Mode changes never rewrite the generated source; the existing log line still tells you to generate again.

## Tests

Baseline at `c26b1a6`: `ui` 374, `multichain` 930, `ai-chat-ui` 168, `ai-workspace-ui` 183, `ai-chat-startup` 67, `ai-proxy` 146, `xss` 43, `csp` 241, `innerhtml-lint` OK.

After: `ui` 375 (one added assertion), `multichain` 930, `ai-chat-ui` 168, `ai-workspace-ui` 183, `ai-chat-startup` 67, `ai-proxy` 146, `xss` 43, `csp` 240 (the old panel's four handlers are gone, one trigger handler added), `innerhtml-lint` OK, and the new `deploy-mode-ui` **107**. compile-generators 342, golden 72, maturity 146, playground 55, lab 73, solc-loader 7, vendor 10, reproducible-bytecode 70, compile-foundry-tests 19, headers 6, zip 15 are unchanged. No test failed.

`deploy-mode-ui` covers: the old selector gone with the rest of the sidebar intact; eight placements from one renderer and one popover on body; four options with the real labels and descriptions, icons and indicator; the shared state (setter, `cf_mc_mode`, banner, multi-deploy panel, Home cards, every control) including changes made by another caller; persistence across navigation and across a reload, and an invalid stored value; no listener added by redraws, switches or open/close; no compile, deploy, wallet, network, AI or fetch call and no loss of source, form input, AI draft or conversations; keyboard and focus rules; the AI toolbar (note text, no AI request, request schema identical in every mode, mode never sent, fullscreen workspace intact); and CSS scope, stacking and phone rules. I broke the code five ways (listeners bound every render, Escape losing focus, setter not refreshing, a private state instead of the setter, a mode change that deploys); the suite failed each time.

Pre-existing failures, unchanged: `native-solc-bytecode.mjs` (0 of 69) and `native-solc-oracle.mjs` (2 of 9) because the machine has no native `solc` 0.8.24. They stop `npm test` there, so the later scripts were run one by one.

**NOT EXECUTED:** `deploy-mode-browser.mjs`, `ai-chat-browser.mjs` and `csp-browser.mjs` (Chromium cannot start in this sandbox: system libraries are missing, no root). `deploy-mode-browser.mjs` is written to check, on desktop, tablet and phone: controls inside the screen with no sideways scroll, the popover on screen and topmost (`elementFromPoint`), the phone bottom sheet and 54px+ options, anchoring, focus, a real pointer choice updating every control and surviving a reload, scroll closing it, the AI popover opening upward and not moving the chat, the toolbar fitting the width, and no console or CSP error. None of that is verified.

## Remaining limitations

- Real-browser rendering of the new control (alignment in each heading, popover position, the phone sheet) is unverified.
- On phones the control sits on its own line under the heading, using `:has()`, which older browsers lack; there it stays beside the heading and may be tight.
- Not added to Compile & Deploy, where the mode already has the multi-deploy panel and the banner chip; the Home cards remain a second, synchronized way to choose.
- The popover closes when anything scrolls; it does not follow the page.
