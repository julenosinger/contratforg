# Phase 10.2: Verify on Explorer

The tab (section 12) keeps its form and its two functions and gains an overview and real progress. `verifyContract()` and `checkVerificationStatus()` read the same fields and send the same request as before (a form POST of `apikey, module, action, contractaddress, sourceCode, codeformat, contractname, compilerversion, optimizationUsed, runs, constructorArguements` to the network's explorer API; a GET with the GUID for the status). The new code only reads the form, the application state and what the page itself logs, and sends nothing. Every field id, the handlers, the defaults and the activity log are unchanged.

## What the audit found, and what the page now says

- **Where verification works.** Only networks with an explorer API in `NETWORKS[].explorerApi`: 12 of the 16 (7 mainnets, 5 testnets). Arc Testnet (the default network), Arc Mainnet and both Robinhood networks have none. The page's own refusal listed 5 networks ("Ethereum, Polygon, Base, Arbitrum, Optimism"), which was wrong; it now lists the real 12, taken from the table. The overview says "Not available here" before you click.
- **The compiler the app really uses.** solc 0.8.24, optimizer on, 200 runs (fixed in `compileSource`). A different compiler version or run count in the form will not match the deployed bytecode; the form says so beside the field and in the overview.
- **Which code is verified.** The request uses the CURRENT buffer (`pendingSource`), not necessarily the code that was deployed. The overview states "Same code as your deployment" only when the address is a deployment this page itself recorded on this network AND the source on screen is the exact source of the run that produced it (the same run tracking as 9.8). A deploy-history record makes the address known ("Found in the deploy history") but never claims the source (history keeps no source). Otherwise: "Not confirmed", with the reason.
- **Constructor arguments.** When the contract on screen takes constructor arguments and none are pasted, the overview says so; hex that is not an even number of digits is flagged.
- **The API key.** A password field with autocomplete off. The new code never shows, stores or logs it (tests search the page, the log, the overview and the browser storage). It leaves the page only inside the request, as before.

## What changed

- Two columns: Deployed contract (the address, plus an explicit "Use the latest deployment" button), Explorer access, Compiler settings, the two original buttons, and the original activity log in its own card; on the right the Verification Overview and Verification Progress.
- **Use the latest deployment** fills the address only when you click, only when the field is empty (or already holds that address), and from a deployment on the active network (this page's first, else the history). It never replaces something you typed and sends nothing.
- **Progress from real answers:** Ready to submit (lists exactly what is missing), Submitted (only after the explorer accepts; it shows the address, network and GUID that were in the form at the click, even if you edit the form while the request is in flight), Verified (only when the explorer itself answers "Pass - Verified"). A refusal or a request error is shown as the answer it was; "Pending" is shown as pending.
- The overview redraws with the other views when the network or Deployment Mode changes, and when a deployment is recorded.

## Tests

`verify-ui.mjs` (119 checks): ids, defaults and handlers; all 16 networks (12 with an API and its host, the 4 without and the real list, the mainnet warning); the page's refusal text; the exact request (method, URL, content type, parameters and values) and that nothing is sent by typing, navigating or redrawing; the key absent from the page, the log, the overview and the storage; the form checks; the exact association (history only, run seen, changed source, identical source, another address, another network); Use latest; the progress through failure, request error, accepted, pending and verified; hostile text from the explorer and the fields; repeated navigation. `creation-tabs-audit.mjs` gained the verify facts. `verify-browser.mjs` was written for the real layout and was NOT executed: Chromium cannot start in this sandbox.

## Limits

- The layout was not seen in a browser.
- The "Submitted" and "Verified" states come from the lines the page logs (its own record of the explorer's answers), so they follow that wording.
- Whether the explorer's verification API still accepts these requests is up to the explorer; the page does not change the protocol.
- The history's 50-record limit still keeps the oldest fifty (see phase 10.1), so a very recent deployment may not be in the history.
