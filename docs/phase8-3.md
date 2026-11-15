# Phase 8.3: Fullscreen AI workspace

Status: 2026-11-15. Layout only. Starting HEAD `01dadc2` (Phase 8.2 and its scroll fix committed), working tree clean. Nothing is committed by this phase.

## Root cause of the wasted space

Phase 8.2 made `main` one screen tall, but three things inside it still took height from the chat, as the live screenshot showed
(chat from y=75 to y=520 on a 700px window, then about 180px of other content):

1. the technical footer note (`.foot-note`) was a flex child under the chat, with its own 48px top margin and 22px padding;
2. the section kept `padding:12px 20px 16px`;
3. the chat was still drawn as a card (1px border, 14px radius), so it read as a component inside a page.

## Changes

| File | Change |
|---|---|
| `contractforge-deploy/app.css` | Phase 8.3 edits inside the existing chat and Phase 8.2 blocks (listed below). |
| `contractforge-deploy/index.html` | One element: the `0 / 20000` counter in the composer hint (`#aiCount`), as in the reference. |
| `contractforge-deploy/app.js` | `aiAutoGrow` also updates the counter (it already runs on every change of the message box). |
| `tests/ai-workspace-ui.mjs`, `tests/ai-chat-ui.mjs`, `tests/ai-chat-browser.mjs` | Updated and extended (see Tests). |

CSS, all under `body.ai-workspace` unless noted:

```
#sec-nlai                 { padding:0 }                                   /* was 12px 20px 16px */
#sec-nlai .ai-chat        { flex:1 1 0; height:auto; min-height:360px; border:0; border-radius:0 }   /* was a card, min 420px */
.foot-note                { display:none }                                /* was kept below the chat */
@media (max-width:760px)  { #sec-nlai .ai-chat { min-height:320px } }    /* section padding rule removed */
```

Base rules (any viewport, still scoped to `#sec-nlai`): the `clamp(540px, calc(100dvh - 250px), 920px)` height and its mobile
twin are gone. The chat now has `height:80vh/80dvh` only as a fallback for the (never expected) case where the workspace class is
absent, and `min-height:420px`. There is no fixed maximum height left in the chat rules (a test checks that). The conversation
panel is 260px (was 264px). The composer has `flex-shrink:0`.

Unchanged from 8.2 and still doing the work: `main` is `height:100dvh` (a column), the wallet bar is its first child, the section
is `flex:1 0 auto` and the chat `flex:1 1 0`, so the workspace is exactly "viewport minus wallet header", and the thread
(`flex:1; min-height:0; overflow-y:auto`) and the conversation list scroll on their own. No `position:fixed`. `main` scrolls by itself
only when the viewport is shorter than the chat's minimum height. On phones the history is still the drawer.

## Decision to confirm: the footer note

The brief says the technical footer must stay outside the workspace and that no space may be left under the chat. I read this
as: the footer is not part of the AI screen, so it is hidden there and comes back (with its original margins) on every other
tab; a test checks both. If you want it reachable from the AI tab, it needs to sit below the first screen and be reached by
scrolling the page, which makes the workspace move when the wheel is over the composer. I did not do that.

## Before / after (estimates, not measurements)

Before, from your live screenshot (700px window): chat 445px tall, ending 180px above the bottom edge.
After, expected from the CSS: viewport minus the wallet header, about 640px on that window (assuming a wallet header of about 60px),
ending at the bottom edge. No browser could run here, so this is **not measured**; `ai-chat-browser.mjs` asserts the real
geometry (below).

## Tests

Baseline at `01dadc2`: `ui` 374, `ai-chat-ui` 164, `ai-workspace-ui` 160, `ai-proxy` 146, `xss` 43, `csp` 241, `innerhtml-lint` OK.

After: `ui` 374, `ai-chat-ui` 166 (+2 for the counter), `ai-workspace-ui` 183 (+23), `ai-proxy` 146, `xss` 43, `csp` 241,
`innerhtml-lint` OK. The other suites (compile-generators 342, golden 72, maturity 146, multichain 930, playground 55, lab 73,
solc-loader 7, vendor 10, reproducible-bytecode 70, compile-foundry-tests 19, headers 6, zip 15) pass as before. No test failed.

`ai-workspace-ui` (computed styles in a simulated browser): no padding, no border or radius on the chat, 260px panel, composer
never shrinks, thread and list scroll on their own, footer hidden in AI and shown again after each of the other sections, plus all
the earlier navigation checks (Home, AI, Swap, AI, Deploy, AI; twenty round trips; same nodes and inline styles afterwards). The
check that kept the old `clamp(...)` fallback now asserts that no fixed maximum height remains.

Pre-existing failures, unchanged: `native-solc-bytecode.mjs` (0 of 69) and `native-solc-oracle.mjs` (2 of 9), because the machine has
no native `solc` 0.8.24; they stop `npm test` there, so the later scripts were run one by one.

**NOT EXECUTED:** `ai-chat-browser.mjs` and `csp-browser.mjs` (Chromium cannot start here: system libraries missing, no root).
`ai-chat-browser.mjs` was extended with the geometry checks from the brief, all unrun: workspace top equals the wallet header's
bottom, workspace bottom equals the viewport bottom, composer at the bottom, no card border or radius, panel about 260px, chat
reaches the right edge, the thread scrolls while the page does not move, sidebar and chat heights match, footer hidden in AI and
shown in Swap, drawer on phones, no sideways overflow, no console or CSP error. Until it runs, none of that is verified.

## Remaining limitations

- Real-browser verification is still owed (command: `REQUIRE_BROWSER=1 node ai-chat-browser.mjs`, then `csp-browser.mjs`).
- The reference's "Today / Yesterday" groups and message times are not reproduced: conversations have no timestamps and the
  brief forbids new stored fields. The reference's paperclip icon in the message box is also not added.
- On phones the menu is still stacked above the page (existing app layout); entering the AI tab scrolls the workspace into view.
- On iOS the virtual keyboard does not shrink `dvh`; the composer relies on the scroll-into-view on focus from Phase 8.
