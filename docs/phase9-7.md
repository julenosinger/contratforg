# Phase 9.7: Compile & Deploy overview

Section 07 is the one place where compilation, the constructor, Multi-deploy, the maturity gates and the transaction meet, so this phase is deliberately the smallest: a read-only card was added ABOVE the page. Nothing on the page was moved, renamed or restyled (`compileAndDeploy`, `compilePending`, `compileSource`, `deployCompiled`, the constructor panel, Multi-deploy, the mainnet banner, the draft alert, the results card and the activity console all keep their ids, handlers and order).

## What the audit found (and the card now shows)

- Compilation is not a separate step: `compileAndDeploy()` runs the draft check, the wallet check, the maturity gate, then compiles, asks for the mainnet confirmation, and calls `deployCompiled()`. The page never records "compiled", so the card does not either.
- `deployCompiled()` itself refuses a mainnet whose maturity check was not confirmed for this exact source (a last line of defence, independent of the button).
- A deployment is recorded (results card and history) only after `contract.deployed()`. The card's "Deployed" stage reads the page's own results for this contract name; the history alone does not count, a result for another contract does not count, and the stage goes back to "todo" when the page clears its results for a new deployment.
- Constructor values come from the panel inputs (`ctor_arg_N`); empty or malformed values are flagged the way the deploy would reject them.
- Multi-deploy is explicit: nothing is pre-selected and the card counts the selected networks and the mainnets among them.

## What the card shows

Contract (name, template, real maturity level), Source (ready, or the draft reason, or "cannot be the deployer"), Compiler, Network (mainnets flagged), Deployment Mode, Multi-deploy (only in the multi modes), Constructor, Wallet, Maturity check (mainnets: confirmed for this exact source, or "asked when you press Compile and deploy"). Three stages: Source, Ready to deploy, Deployed. Nothing is invented: no gas estimate, no compile result, no audit result.

## What changed

- `index.html`: the card (inside `#sec-deploy`, above the original panel). The original panel is byte for byte as before.
- `app.js`: `dplRead`, `dplRender` and its observers (the tab opening, the page's own panels, the wallet, the network, the constructor inputs, the Deployment Mode).
- `app.css`: one rule, scoped to the card. `builder.js`: nothing.
- Tests: `deploy-overview-ui.mjs` (163 checks: all 16 networks, the 9 mainnet gates, drafts of every builder, wallet, constructor, Multi-deploy, honesty of "Deployed", nothing compiled or sent while reading, and the existing flow answering as before), `deploy-overview-browser.mjs` (NOT executed here: Chromium cannot start in this sandbox), `creation-tabs-audit.mjs` gained the deploy facts (286 checks).

## Limits

- The card cannot say a contract compiled (the page does not keep that), and it does not show the gas or fee estimate (the page has none before sending).
- The card does not move or restyle the original panel: a full re-layout of this page should wait until the browser tests have run on a real browser.
