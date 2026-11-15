# Phase 8: Premium AI → Solidity chat

Status: 2026-11-15. UI and UX only. The proxy, the prompts, the request schema, the history format, the maturity gate and
the adoption flow are unchanged.

## What changed

| File | Change |
|---|---|
| `contractforge-deploy/app.css` | The old `.ai-*` block is replaced by one block scoped to `#sec-nlai` (and `.light #sec-nlai`). Nothing outside the AI tab is affected (checked by `tests/ai-chat-ui.mjs`). |
| `contractforge-deploy/index.html` | Section 15 markup only: sidebar (New Chat, search, list, Delete All confirmation), header with status line, composer box with integrated Send, compact controls, context chip. All ids are kept. |
| `contractforge-deploy/app.js` | The AI chat block: rendering, welcome state, code card, status line, context chip, async guards. Two new example prompts (`erc20`, `treasury`) in `NL_EXAMPLES`. |
| `tests/ui.mjs` | Only the five button labels changed (see below). |
| `tests/ai-chat-ui.mjs` | New: 164 checks on the chat UI. Added to `npm test`. |
| `tests/ai-chat-browser.mjs` | New: real-browser layout checks (desktop, tablet, phone). **Not wired into CI and not executed yet** (no Chromium could start in the authoring sandbox). |

Not touched: `chat-md.js`, `functions/api/ai.js`, `api/ai.js`, `maturity.js`, networks, `adoptAiCode`, `aiBuildRequestMessages`,
`aiLoad`/`aiSave`/`aiValidMessage`, the storage key `cf_ai_chats_v1` and its limits (30 conversations, 40 messages, ~200 KB).

## Preserved public functions and ids

`aiChatNew`, `aiChatSelect`, `aiChatDelete`, `aiChatDeleteAll`, `aiChatRename`, `aiChatToggleSidebar`, `aiChatSend`,
`aiAutoGrow`, `aiChatAttachContext`, `aiDecorateCodeBlock`, `aiChatCopy`, `aiChatDownload`, `aiChatUse`, `aiChatAudit`,
`aiChatTests`, `adoptAiCode`, `setNLExample`, `aiChatRender`. Ids: `aiChat`, `aiSidebar`, `aiConvs`, `aiThread`
(`role=log`, `aria-live=polite`), `aiComposer`, `aiSendBtn`, `aiGenerating`, `nl_network`, `nl_complexity`.

New helpers: `aiChatRenderList`, `aiChatAskDeleteAll`, `aiChatCancelDeleteAll`, `aiChatDetachContext`, `aiSetStatus`, `aiSetSidebar`.

## Behaviour notes

- **Delete All** now asks first (inline Confirm / Cancel). `aiChatDeleteAll()` itself still deletes immediately when called.
- **Welcome state** shows only while the open chat has no messages. The six chips fill the composer; nothing is sent.
- **Code card**: file name, `Solidity`, line count, `Experimental`, `Not audited`, then Copy Code, Download .sol, Use in
  ContractForge, Audit, Generate Tests. The order and handlers are the same as before. Use in ContractForge still goes
  through `adoptAiCode` (`matStamp`, `pendingSource` with `template:'ai'`, labels, `deployFromBuffer('nlai')`). Nothing is
  compiled, signed or deployed by the chat.
- **Attached context** stays plain text in the message box (what you see is what is sent). A chip labels it (name, lines,
  truncation to `AI_ATTACH_MAX`) and can remove it; sent messages show it as a collapsed "Attached contract" block.
- **Status line**: Ready, Generating, Completed, Request failed, AI unavailable (when the service says it is not configured
  or not available), plus short notices. No streaming, Stop, Regenerate, edit or diff.
- **Sidebar**: collapsible; on phones it is a drawer (backdrop, Escape, closes after choosing a chat). Arrow keys, Home and
  End move through conversations. Rename still uses `prompt()`.

## Defects fixed on the way (root cause, fix)

1. **An empty AI answer made the whole saved chat disappear on reload.** `aiFetch` accepts `text: ''`; the stored empty assistant
   message fails `aiValidMessage`, and `aiLoad` drops the conversation. Now an empty answer is recorded as a visible error message.
2. **Audit/Tests could start while a chat reply was in flight** (the buttons did not check `aiState.sending`), so two requests
   shared one flag and the first to finish re-enabled Send. The actions now wait, and are dimmed while busy.
3. **A non-Solidity fenced block (for example a shell command) was labelled as a contract** and offered Use/Audit/Tests. Only
   Solidity blocks get the contract header and actions; other languages only get Copy.
4. **A message over 20,000 characters** was sent, refused by the proxy, and (if saved) discarded on reload. It is now stopped
   locally with the text kept, and the composer has `maxlength=20000`.
5. **Attaching the contract twice duplicated it**, and Enter during IME composition sent the message. Both fixed.
6. **Copy errors** (no clipboard, permission denied) were unhandled; they are now reported on the button.

## Tests

Baseline before changes (same machine): `ai-proxy` 146, `xss` 43, `csp` 235, `innerhtml-lint` OK (0 new sinks), `ui` 374, all passing.

After:

| Suite | Result |
|---|---|
| `compile-generators` | 342 passed |
| `golden` | 72 identical |
| `maturity` | 146 passed |
| `ai-proxy` | 146 passed |
| `multichain` | 930 passed |
| `ui` | 374 passed (5 label assertions updated, see below) |
| `ai-chat-ui` (new) | 164 passed |
| `xss` | 43 passed |
| `innerhtml-lint` | OK, 74 sinks, 0 not approved |
| `csp` | 241 passed (6 more `data-on*` values, all parseable) |
| `playground` / `lab` / `solc-loader` / `vendor` / `reproducible-bytecode` / `compile-foundry-tests` | 55 / 73 / 7 / 10 / 70 / 19 passed |
| `headers` / `zip` | 6 / 15 passed |

Existing failures, identical with the changes stashed (environment, unrelated to the chat): `native-solc-bytecode.mjs`
(0 passed, 69 failed: no native `solc` 0.8.24 on this machine) and `native-solc-oracle.mjs` (7 passed, 2 failed: same reason).
Because `npm test` stops at the first failing script, these two stop the chain here, so the later scripts were run one by one.

Assertions changed in `ui.mjs`: the five code-block button labels, from `Copy / Download / Use / Audit / Tests` to
`Copy Code / Download .sol / Use in ContractForge / Audit / Generate Tests` (the requested labels). Positions and handlers are unchanged.

Not executed here: `csp-browser.mjs` and `ai-chat-browser.mjs` (Chromium downloads but cannot start: system libraries are
missing and there is no root). `forge` suites: not related to this change. `mutation-check.py`: not run.

## Remaining limitations

- Real-browser layout (mobile drawer, safe-area, keyboard resize, code block scrolling, contrast) is not verified by a test
  that ran. Run `REQUIRE_BROWSER=1 node ai-chat-browser.mjs` (optionally `SHOTS=/tmp/shots`) and `csp-browser.mjs` in CI or locally.
- Conversations have no timestamps, so there is no Today/Yesterday grouping (adding one would change the stored format).
- A reply longer than 20,000 characters would still be dropped on reload (pre-existing validation; unchanged by request).
- Rename uses `window.prompt()`.
