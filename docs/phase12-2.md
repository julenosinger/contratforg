# Phase 12.2: AI Auditor (tab 08)

`runAudit()`, `renderAuditReport()`, `downloadAuditReport()` and `buildAuditMarkdown()` are unchanged: same request to the AI (`audit`, with the name, the whole source and the focus), same report on screen, same file. The tab now has two columns: the form and the report on the left, a read-only overview on the right.

**On the decision left open in the plan** (saving the audited source's hash inside `runAudit()`): it is not needed and was not done. The page notes the contract, a hash of its source and the focus at the click on Run AI Audit (a capture listener on the button), which is exactly what `runAudit()` reads at that moment, so the overview can say "this report is about this exact source" without touching the function.

## What the audit found (and the overview now says)

- **The score is the AI's number.** The old intro said the page computes it from the findings; it does not: it shows `report.score` as given (clamped to 0 to 100), and the word beside it (Secure from 80, Moderate risk from 60, High risk from 40, Critical issues below) only follows that number. The intro was corrected, and the overview says "A number given by the AI ... not computed by this page and not a guarantee". With a focus other than the full audit it also says the score refers to that focus only.
- **Which source a report is about.** The page keeps one report in memory with no record of its contract. The overview compares the click's contract and focus with what is on screen: "current", or "outdated" because the contract changed or the focus changed. The review step is never marked done: it says to read each finding and decide, and that an AI audit is advisory.
- **Download Report is mislabelled when the contract changes** (known, unchanged): the file name and the report's title use the contract on screen when you press it, so a report about A downloaded while B is on screen is called B. The overview says so ("Titled with the contract on screen now (B), but the report is about A"). After a failed run Download still saves the earlier report, and the overview says that too.
- **Failures.** `runAudit()` reports a failure only with an alert (`Audit error: ...`). To show the reason in the overview, a pass-through is placed on `alert()` only while a run is waiting: it records the text of an `Audit error: ...` alert and then calls the original with the same arguments, so the page's own alert appears exactly as before; it is removed when the button comes back (and left alone if something else replaced `alert` meanwhile). "AI is not configured" or "not available" is shown as AI unavailable; any other message (including an answer that is not valid JSON, for example a report cut off) as a failed audit.
- **The AI service's limits** (read from `functions/api/ai.js` and `api/ai.js`): at most 60,000 characters of source, which the overview shows as "Size" and marks when exceeded (the page still sends it, as before: the service decides), and an answer capped at 2,000 tokens, which is why a long report can arrive cut off and fail to read (a note).
- **Opening the tab from the contract bar does not start an audit.** `ccAudit()` only navigates; the overview says to press Run AI Audit.
- **A draft** can be audited (as before); the overview shows it as a draft with the reason it cannot be deployed. With no contract the page's own alert appears and nothing is asked of the AI.

## What changed

- `index.html`: only `#sec-auditor`. Every id, handler, option and default is kept, including the inline-styled report block the page's own renderer writes into; the intro text corrects the score claim.
- `app.css`: a short block scoped to `#sec-auditor`.
- `app.js`: the overview (`audRender`, `audRead`, `audFinish`, the alert pass-through), written with the shared row and step writers of Phase 12.0. It never calls the AI, never writes the form or the contract, and sets no HTML from text.

## Tests

`tests/auditor-tab-ui.mjs`, 94 checks, the AI simulated (valid report, score above 100, unknown severities, hostile text, invalid JSON, errors, unavailable, held while waiting): ids and handlers; the size limit and the answer cap equal in both AI services; nothing asked until Run is pressed and the contract bar's Audit only opens the tab; the exact request, the page's own report and the file; the overview through none, waiting, current, focus changed, contract changed and run again; the known mislabelled download; unavailable, failed, cut-off and failed-after-success, with the page's own alert shown unchanged and `alert` the very same function afterwards; no contract, a draft and a source over the limit; all 16 networks with the mainnet warning and every mode with no extra AI call; hostile text as text only; ten navigations leave the overview unchanged. Mutation checks: eleven changes to the code, all caught.

`tests/auditor-tab-browser.mjs` (written, not executed: Chromium cannot start in the authoring sandbox) checks the two columns, one column on a phone, a report with fourteen long findings staying inside the screen, and no sideways scroll.

## Limits

- The builders' "Review & Audit" stage still cannot complete: it would have to read this tab's state, which is a change to the shared engine and is left for a decision.
- The overview learns about an audit from the button, the results block and the alert the page already produces; a change to those would need this view changed too (the test file fails if it happens).
- The layout was verified by DOM and CSS only.
