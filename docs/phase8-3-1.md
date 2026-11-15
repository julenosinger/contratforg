# Phase 8.3.1: Clean chat startup

Status: 2026-11-15. Behavior only; no layout change. Starting HEAD `de02f35` (Phase 8.3 committed), working tree clean. Nothing is committed by this phase.

## Root cause (confirmed)

`initAiChat()` ended its load with `aiState.activeId = aiState.convs.length ? aiState.convs[0].id : null`, so the first saved chat
(the newest) was opened on every page load, which is the AMM prompt in your screenshot. Two related things made it look worse:

- `aiChatNew()` always added a new empty chat to memory, and `aiSave()` wrote it to storage, where `aiLoad()` then dropped it
  (it requires at least one message). So the sidebar could show several "New chat" rows in one session, as in the screenshot.
- Nothing distinguished entering the tab from a rerender, so there was no place to start clean.

## Changes (`contractforge-deploy/app.js` only)

| Where | Change |
|---|---|
| `initAiChat()` | `activeId = null` after loading. Every saved chat is loaded and listed; none is selected. The welcome screen, empty composer and chips come from the existing render. |
| `aiEnterFresh()` (new) | Runs once when `aiSyncWorkspace()` sees the section go from closed to open. It deselects (`activeId = null`), drops any in-memory empty chat, sets status Ready and re-renders. It does nothing if a request is pending (`aiState.sending`) or the message box has text. It never calls `aiSave()`, so storage is not touched. |
| `aiEmptyConv()` (new) | Finds the one empty chat, if any. |
| `aiChatNew()` | Reuses the empty chat if there is one, otherwise adds one. Same public name and signature; it still focuses the composer, closes the phone drawer and leaves the composer text alone. |
| `aiChatSend()` | With nothing selected, it reuses the empty chat or creates one, so the first message from the welcome screen creates exactly one conversation. |
| `aiSave()` | Skips chats with no messages (they were already discarded on load). The stored format is unchanged. |

## Behavior

- Opening the app or the tab shows the welcome screen, an empty composer and the six chips. Saved chats are listed, none highlighted.
- Selecting an old chat shows its full history; sending continues it with that history in the request.
- Coming back from another section starts clean again, unless there is an unsent draft or a request in flight, in which case the open chat and the draft stay.
- Not a section entry, so no reset: clicking AI → Solidity while already in it, collapsing or opening the list, resizing, unrelated DOM changes and re-renders.
- A chat that was waiting for a reply keeps its activity indicator and receives the reply even if you leave and return.
- Not changed: `aiLoad`, `aiValidMessage`, `aiBuildRequestMessages`, `aiChatSelect`, rename, delete (after deleting the open chat it still opens the first remaining one), Delete All, search, limits, `cf_ai_chats_v1`, the Phase 8.3 CSS and markup.

## Tests

Baseline at `de02f35`: `ui` 374, `ai-chat-ui` 166, `ai-workspace-ui` 183, `ai-proxy` 146, `xss` 43, `csp` 241, `innerhtml-lint` OK.

After: `ui` 374, `ai-chat-ui` 168, `ai-workspace-ui` 183, `ai-chat-startup` **67 (new, in `npm test`)**, `ai-proxy` 146, `xss` 43, `csp` 241,
`innerhtml-lint` OK; compile-generators 342, golden 72, maturity 146, multichain 930, playground 55, lab 73, solc-loader 7, vendor 10,
reproducible-bytecode 70, compile-foundry-tests 19, headers 6, zip 15. No new failure.

One existing test changed on purpose: "New Chat adds a conversation each time" in `ai-chat-ui.mjs` now reads "reuses the empty chat; adds a
new one once the previous has messages; an empty chat is never stored" (this is the requested no-duplicates rule).

`ai-chat-startup` covers: empty storage and saved storage at startup (nothing selected, welcome screen, empty composer, Ready, stored
text byte-identical afterwards, no AI call); opening and continuing an old chat (full history sent, reply stored in the same chat,
other chats untouched); New Chat (empty chat shown, never stored, never stacked, first send makes no duplicate, unused empty chat
disappears after leaving); returning from another section, including the exact Home, AI, Swap, AI, Deploy, AI sequence; draft and
pending-request protection; no reset from re-click, sidebar toggle, resize, DOM changes or re-render; Use in ContractForge then back;
Delete and Delete All; the phone drawer; and the Phase 8.3 workspace class and ids. I broke the code five ways (auto-select again,
no reset on entry, draft unprotected, pending unprotected, empty chat stored); the suite failed each time.

Pre-existing failures, unchanged: `native-solc-bytecode.mjs` (0 of 69) and `native-solc-oracle.mjs` (2 of 9), because the machine has no
native `solc` 0.8.24. They stop `npm test` there, so the later scripts were run one by one.

**NOT EXECUTED:** `ai-chat-browser.mjs` and `csp-browser.mjs` (Chromium cannot start in this sandbox). `ai-chat-browser.mjs` now also asserts that a fresh visit shows the
welcome screen with all six saved chats listed, then opens the first; that is unrun.

## Remaining limitations (found, not changed)

- `aiSave()` enforces the 30-chat and 200 KB limits by dropping from the front of the list, which is the newest chat. With more than
  30 chats, the newest would be lost on reload. This is existing behavior and the brief says not to change limits or truncation; it is
  worth a separate fix.
- Old messages saved by Phase 7 as plain "Error: …" text (no `kind`) show as ordinary text, not as the notice card, and are still sent to
  the model as context. Re-sending in such a chat still works; only new failures are marked as errors.
- After deleting the open chat, the first remaining chat opens (unchanged). If you want the welcome screen there too, it is a one-line change.
- Real-browser behavior is not verified (see NOT EXECUTED).
