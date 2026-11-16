# Phase 9.8: Compile & Deploy workspace

Section 07 is now a two-column workspace (65/35). The deploy page's own elements were MOVED into it, not rebuilt: the 15 original elements (the mainnet banner, the pending-contract field, the compiler select, the constructor panel, the draft alert, the three action buttons, the Multi-deploy panel, the results card, the log buttons and the console) keep their ids, classes, attributes, handlers and values, and the page's scripts that fill them are untouched. A byte comparison against the previous version differs only in indentation. `compileAndDeploy`, `compilePending`, `compileSource`, `deployCompiled`, `collectCtorValues`, `matGate`, `mainnetDeployConfirm`, `multideploy.js` and `mdState` were not changed.

## Layout

- Left: a contract strip (name, maturity, compiler, mode, network with LIVE, size); **1 Contract Source** (the pending-contract field, the compiler select, a collapsible read-only Solidity preview, Download .sol and Copy code); **2 Constructor Arguments** (the original panel, with a count and an empty state); **3 Deployment Networks** (the original Multi-deploy panel, its two groups Testnets and Mainnets, the count of selected networks and whether live networks are included); the original **Compile and deploy** button, full width; and **Activity**, the original console in its own card with internal scrolling.
- Right: **Deployment Overview** (`dplSummary`), **Deployment Readiness** (a checklist of the same facts), **Deployment Progress** (`dplProgress`) and **Confirmed Results** (the original results card).
- One state engine: everything on the right and the strip is drawn by `dplRead()` / `dplRender()`, extended, not duplicated. There is no Compile Only or Reset button: the page has no such handlers.

## Exact association of "Deployed"

The overview used to match a result to the contract by name alone. The page clears its results at the start of every deploy run, right before it compiles the buffer (single and multi). The workspace now notes the source hash at that moment (a transparent wrapper around the page's reset function, which changes nothing else), so a result is "confirmed ... for this exact source" only when the source on screen is the same source. Results from an earlier source, a changed source with the same name, or a run the page did not see start are shown as "Unverified" and do not count as a deployment of this source. Regenerating the identical source makes it exact again.

## Multichain and mainnet

All 16 networks (7 testnets, 9 mainnets) are covered: the Network row and the strip flag every mainnet, the maturity row follows the page's own approvals, and `deployCompiled` still refuses a mainnet that was not confirmed (9 of 9). Multi-deploy still pre-selects nothing, still lists every network, and the card counts live networks.

## Tests

`deploy-overview-ui.mjs` (240 checks) was extended: the original elements and their order, the new layout CSS (65/35, one column on narrow screens, scoped to the workspace), the read-only preview equal to `pendingSource.code`, Download and Copy, the constructor card, the 16 networks and the Multi-deploy groups, the exact association (including a real `compileAndDeploy()` run with compiler, deployment and wallet stubbed, so nothing is sent). `deploy-overview-browser.mjs` was rewritten for the new layout and was NOT executed (Chromium cannot start in this sandbox).

## Limits

- Chromium could not run here, so the 65/35 geometry, the mobile layout and the scrolling were not seen in a browser.
- The workspace redraws when the tab opens, and when the page's own panels, console, results, wallet, network or constructor inputs change. A contract generated while the tab is hidden appears when the tab is opened.
- The preview shows the whole source as text; it has no syntax highlighting.
