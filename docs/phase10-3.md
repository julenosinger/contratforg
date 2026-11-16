# Phase 10.3: Share & Export

The tab (section 13) keeps its three jobs (the share link, the export files, the QR code) and its ids and handlers (`shareUrl`, `export_format`, `qrBox`, `generateShareUrl()`, `copyShareUrl()`, `exportArtifact()`, `generateQR()`), and gains an overview of what each one really contains. `generateShareUrl`, `copyShareUrl`, `loadFromUrlHash` and the Hardhat and Foundry builders are unchanged.

## What the audit found

- **The link holds the network, the name and the FULL source** (base64 after the `#`, which a browser does not send to a server). A generated ERC-20 is a 6,390-character link, a DAO 12,354. Opening a link switches the app to the network inside it and loads the source as an `imported` contract (the template named in a link is never trusted; imported code is "experimental").
- **The QR code could never work for a generated contract, and it still sent the source out.** A QR code holds at most 2,953 characters; every generated contract's link is longer. `generateQR` requested the image from api.qrserver.com anyway, which received the whole link, source included, and showed a broken image. It now refuses a link that cannot fit, without contacting the service, and says why. A short link is requested exactly as before.
- **Exports of an ABI or bytecode that was never compiled were saved as empty files** (`[]`, or a script with an empty ABI and `""` as bytecode), because the page only checked that there was source. It now refuses with the page's own message ("No content to export. Ensure the contract is compiled first.") for the ABI, full and Hardhat formats. The Foundry script needs no compile and is saved as before.
- **The compiled ABI and bytecode are not tied to the source on screen** (`__lastCompiledABI` / `__lastCompiledBytecode` belong to the last compile). The overview calls the artifact "compiled from this exact source" only when a deployment made on this page proves it (a run that began with this source and a result whose creation-bytecode hash equals the artifact); otherwise it is shown as unverified. "Full artifact" mixes the source on screen with the last compile; the page now says so.
- **Scripts:** Hardhat embeds the ABI and bytecode and uses your Hardhat signer; Foundry needs `../src/<Name>.sol` and reads `PRIVATE_KEY`; both leave a placeholder for constructor arguments. On a mainnet the page cautions that running them broadcasts real transactions.

## What changed

- Two columns: Share URL, Export artifacts (with a line that describes the chosen format) and QR code (with a visible notice about who draws the image and what it receives); on the right the Share & Export Overview (contract, network with the mainnet warning, mode, link state and size, what opening it does, whether the QR fits, the compiled artifact, constructor arguments) and "Good to know".
- The overview marks a link as out of date when the network or the contract changed after it was generated.
- `generateQR` and `exportArtifact` each got one guard (above). No other function changed.

## Tests

`share-ui.mjs` (100 checks): ids, handlers and formats; all 16 networks (mainnet warning and where the link starts); the link's exact content and its round trip into a fresh page (untrusted template and network ignored); out-of-date detection; the QR (no request for a long link, the exact request for a short one); the exact content and names of all four files, and the refusals; the artifact proof (exact, different bytecode, changed source); the constructor note, hostile text, no storage writes and repeated navigation. `creation-tabs-audit.mjs` gained the share facts. `share-browser.mjs` was written for the real layout and was NOT executed: Chromium cannot start in this sandbox.

## Decision still open

The QR code still uses an outside service for short links. Drawing it locally would remove that, at the cost of adding a small QR generator to the app (a new dependency), so it is left to you; the page tells users plainly what the service receives.

## Limits

The layout was not seen in a browser. A link is long by nature (it carries the source); some apps may cut very long links, and the page cannot know which.
