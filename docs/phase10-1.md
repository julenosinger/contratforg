# Phase 10.1: Deploy History

The tab (section 10) now has a summary, filters and richer rows. The records are untouched: same storage key (`contractforge_deploy_history`), same shape (`name, address, network, abi, txHash, timestamp`), newest first, same indexes. The Home page, the Playground (which looks records up by address AND by position) and the builders' "Deployment" stages read them as before.

## What changed

- **Summary cards:** deployments, networks, live (mainnet) deployments and the latest one.
- **Filters (view only):** All / Testnets / Mainnets, a network list built from the records, and a search by name or address. A count says "Showing X of Y". Filters decide only what is DRAWN: every button carries the index the record has in storage, so removing, opening in the Playground or copying always acts on the right record, even when others are hidden. Filter state is not stored.
- **Rows:** the network's real label with its kind and chain id (LIVE and a side marker on the 9 mainnets), the contract name, the FULL address with Copy, the transaction hash (a link to the network explorer only when it is a valid hash), the relative time and the exact date, and the original Explorer, Playground and remove buttons. An unknown network shows its key as text with no Explorer button; a bad or missing hash says so; an unreadable timestamp says "unknown time" (no "NaN").
- **Honest notes:** records with an invalid address are counted and said not to be shown. When the list holds 50 records the page says that a new deployment is not recorded until some are removed (see below).
- **Kept as they were:** Clear All (it still asks first), Export JSON (always the FULL list, not the filtered one), the intro text and the empty message.

## Defects found

- The 50-record limit keeps the OLDEST fifty and drops new ones (`slice(-50)` on a newest-first list). Writing 52 records leaves C1 to C50. This is unchanged (changing it is a decision for you, and it would alter what is kept); the tab now tells you when you are at the limit, and a test locks the behaviour so the change cannot happen by accident.
- Storage that is not a list (for example `{"a":1}`) made the Home page fail. `loadDeployHistory()` now reads it as an empty list; valid data reads exactly as before.
- Found while testing this phase: a network list that kept the first network when none was chosen (fixed before it shipped; the test now covers it).

## Safety

Rows are built with `textContent` (no markup from storage); the two stale approvals for the old row template and the old sidebar selector were removed from the innerHTML lint list. No attribute holds stored text (network filter options carry positions, not keys). Hostile names, networks, addresses and hashes were tested as text.

## Tests

`history-ui.mjs` (134 checks): ids and handlers, all 16 networks (LIVE only on the 9 mainnets, a link where the network has an explorer), the scope, network and search filters, buttons on storage indexes while filtered, Copy, Playground, Export (full list), Clear (asks first), the Home and Swap-builder readers, the 50-record behaviour, corrupted and odd records, hostile text, time display, redraw on opening the tab and repeated navigation, scoped CSS. `creation-tabs-audit.mjs` gained the history facts. `history-browser.mjs` was written for the real layout (desktop, tablet, phone) and was NOT executed: Chromium cannot start in this sandbox.

## Limits

The layout was not seen in a browser. The relative times are fresh when the tab opens or the list is redrawn, not continuously.
