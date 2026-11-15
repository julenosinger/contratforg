# Phase 8.2: Full-height AI → Solidity workspace

Status: 2026-11-15. Layout only. Starting HEAD `a879157` (Phase 8 committed), working tree clean. Nothing is committed by this phase.

## What changed

| File | Change |
|---|---|
| `contractforge-deploy/app.js` | `aiSyncWorkspace()` and one `MutationObserver` on `#sec-nlai` (created once, in `initAiChat`). |
| `contractforge-deploy/app.css` | One appended block, "Phase 8.2". |
| `contractforge-deploy/index.html` | One element in the existing chat header: `.ai-brand` (`<h2>ContractForge AI</h2>` + "Solidity Development Assistant"). |
| `tests/ai-workspace-ui.mjs` | New, 155 checks, added to `npm test`. |
| `tests/ai-chat-browser.mjs` | Extended with geometry checks for the workspace (not executed, see below). |
| `tests/ai-chat-ui.mjs` | The CSS-scope check now also accepts rules under `body.ai-workspace`. |

## How visibility is controlled

Every way of opening a section writes `style.display` on the `<section>` (menu click, `wizardGenerate`, `deployFromBuffer`,
the playground jump), so `aiSyncWorkspace()` reads `#sec-nlai`'s inline display (`block` means open) and toggles
`body.ai-workspace`. The observer runs before the next paint, so there is no flash. Entering also scrolls the thread to the
bottom and, at 980px and below (the menu is stacked above the page), brings `main` to the top of the screen.

Nothing is removed, rebuilt or given an inline style. The bars are hidden by CSS only, so leaving AI restores them with their
own inline `display` (the contract bar is shown or hidden by `renderCurrentContract`, which keeps running).

## Selectors

Hidden only under `body.ai-workspace` (with `display:none !important`, because the contract bar's display is inline):

- `#netBanner` (BAR A, network)
- `#currentContract` (BAR B, contract toolbar)
- `#netPanel` (the Change Network panel that opens from BAR A; without its trigger it would be orphaned)
- `#sec-nlai .section-head` (the external "15 AI → Solidity" heading)

Not touched: `.walletbar`, `#connectBtn`, the balance badge, the side menu.

Layout under `body.ai-workspace`:

```
main            { display:flex; flex-direction:column; height:100dvh; max-width:none; padding:0 }
.sticky-top     { flex:none; margin:0 }                     /* wallet bar only */
#sec-nlai       { display:flex !important; flex-direction:column; flex:1 1 0; min-height:0; padding:12px 20px 16px }
#sec-nlai .ai-chat { flex:1 1 0; height:auto; min-height:420px }
```

The chat is sized by the space the flex column actually has left, so there is no hand-tuned offset. Sidebar and chat are flex
siblings of one row, so they share the same height. The Phase 8 `clamp(540px, calc(100dvh - 250px), 920px)` rule stays as the
fallback for when the class is absent, and is overridden under the class. On phones the section padding shrinks to 6px with
the safe-area inset, and the subtitle is hidden.

The header now reads: menu button, **ContractForge AI** / *Solidity Development Assistant*, the active conversation title
(kept, separated by a rule) and the status indicator. The header `h2` replaces the hidden section heading, so the page keeps
one visible heading for the section. There is still one header and one composer.

## Chat height

Before (Phase 8 formula), by viewport height: 800px gives 550px; 1000px gives 750px; 1080px gives 830px. It also sat under the
wallet bar, network bar, contract bar and heading.

After: the chat takes the viewport minus the wallet bar and 28px of padding. As an estimate from the CSS (the wallet bar's
height was not measured, I took about 50px): about 720px at 800, about 920px at 1000, about 1000px at 1080. These are
**estimates, not measurements**: no browser could run in the authoring sandbox. `tests/ai-chat-browser.mjs` measures the real values and
asserts they are larger than the old formula.

## Tests

Baseline at `a879157`, same machine: `ui` 374, `ai-chat-ui` 164, `ai-proxy` 146, `xss` 43, `csp` 241, `innerhtml-lint` OK. After the change:

| Suite | Result |
|---|---|
| `compile-generators` / `golden` / `maturity` | 342 / 72 identical / 146 |
| `ai-proxy` / `multichain` | 146 / 930 |
| `ui` | 374 passed |
| `ai-chat-ui` | 164 passed |
| `ai-workspace-ui` (new) | 155 passed |
| `xss` / `innerhtml-lint` / `csp` | 43 / OK, 0 new sinks / 241 |
| `playground` / `lab` / `solc-loader` / `vendor` / `reproducible-bytecode` / `compile-foundry-tests` | 55 / 73 / 7 / 10 / 70 / 19 |
| `headers` / `zip` | 6 / 15 |

`ai-workspace-ui` runs the real page with `app.css` loaded and reads `getComputedStyle`. It covers: both bars and the heading
hidden in AI; shown in each of the other sections after a round trip; the exact sequence Home, AI, Swap, AI, Deploy, AI, Home
and twenty round trips; the same DOM nodes and unchanged inline styles after all of it; the current contract and the bar's
six actions intact; Use in ContractForge still adopting (template `ai`, experimental) and leaving AI cleanly; one header and
one composer. I broke the code three ways (class never set, rule not scoped, class never cleared); the suite failed each time.
These tests use jsdom's CSS cascade, which is reliable for these rules but is not a layout engine.

Pre-existing failures, unchanged by this work: `native-solc-bytecode.mjs` (0 of 69 pass) and `native-solc-oracle.mjs` (2 of 9 fail), because
the machine has no native `solc` 0.8.24. They stop `npm test` at that point, so the later scripts were run one by one.

**NOT EXECUTED (reported as not run, not as passed):** `ai-chat-browser.mjs` and `csp-browser.mjs`. Chromium downloads but cannot
start here (system libraries missing, no root). Everything about real geometry is therefore unverified: the measured
heights, no sideways scroll, composer visibility, short screens, zoom, the mobile keyboard and safe-area insets.

## Remaining limitations

- Real-browser verification is still owed. Run `REQUIRE_BROWSER=1 node ai-chat-browser.mjs` and `csp-browser.mjs` where Chromium works.
- With the network bar hidden in AI, the network and mainnet status are not shown there. The chat's Target Network selector is
  independent of the active network, and Use in ContractForge opens Compile & Deploy, where the bar is back.
- The workspace is `100dvh` tall; on viewports shorter than about 500px the chat keeps a 420px minimum and the page scrolls.
- On iOS the virtual keyboard does not shrink `dvh`; the composer relies on the Phase 8 scroll-into-view on focus.
