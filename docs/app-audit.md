# ContractForge: app review

Scope: `contractforge-deploy/index.html` (about 5,000 lines, one file), `_headers`, `vercel.json`, `wrangler.toml`.
Method: reading the code. Nothing was run against a wallet or a live chain, and the Solidity templates the app generates were not compiled or audited here.

## What the app is

A single-page, no-backend tool. It generates Solidity from forms, compiles in the browser (solc-js from binaries.soliditylang.org), and deploys with an injected wallet (ethers 5.7.2 from cdnjs). It also has an "AI audit" and "AI to Solidity" feature, a gas estimator, an ABI playground, deploy history in `localStorage`, and source verification via explorer APIs.

## Must fix (functional or security)

1. **AI features probably do not work.** The audit, AI to Solidity and test generation call `https://api.anthropic.com/v1/messages` straight from the browser with no API key and no version header (3 places). Anthropic requires a key. A key placed in browser code would be public, so the right fix is a small server function (Vercel or Cloudflare) that holds the key and forwards the request. Until then these buttons should be hidden or show a clear "not configured" message.
2. **Third-party scripts run without integrity checks.** ethers (cdnjs) and solc-js (soliditylang.org) are loaded with no `integrity` hash, and the CSP allows `unsafe-inline` and `unsafe-eval`. A compromised CDN could replace the transaction-signing code. Add Subresource Integrity to the ethers tag, or self-host ethers in `contractforge-deploy/`. Pin the solc build and check its hash.
3. **CSP is weak.** It is only in `_headers` and `vercel.json`, uses `default-src` with `unsafe-inline` and `unsafe-eval`, and has no `frame-ancestors` or `connect-src` split. The inline script blocks the clean fix. Moving the JS and CSS into separate files would let you drop `unsafe-inline`.
4. **`innerHTML` with unescaped values.** Most user and AI text goes through `escapeHtml`, which is good. Some spots insert values directly: deploy history (`entry.network`, `entry.address`, `explorerUrl` inside an `onclick`), the network bar, and log lines that include `e.message`. `localStorage` content and wallet or RPC error text should be escaped or built with `textContent`.
5. **Mainnet guard on the CCTP generator.** If the TokenMessenger, MessageTransmitter or USDC fields are empty, the generated contract uses `0x…dEaD`. Several other templates also fall back to `0x…dEaD` for signers and buyers. On a mainnet this can lock funds. Block generation or deploy on mainnet when any of these is a placeholder.
6. **Arc Mainnet CCTP addresses are empty.** Fill them from the Arc or Circle docs once confirmed.
7. **Compile and deploy runs on the main thread.** solc-js freezes the page for seconds. Move it to a Web Worker.

## Should improve

- **Split the file.** One 230 KB HTML file with inline CSS and JS is hard to edit, review and cache. Split into `index.html`, `app.css`, and a few JS modules (`networks.js`, `generators/*.js`, `deploy.js`, `ai.js`). This also unlocks a strict CSP. It can be done with no build step.
- **Network config in one place.** Chain data lives in the `NETWORKS` object, but the section 13 text, the footer and select options repeat it by hand. Generate those from `NETWORKS`.
- **Arc Testnet RPC and explorer.** The app uses `rpc.testnet.arc.network` and `testnet.arcscan.app`. Current Arc docs list `rpc.testnet.arc.io` and `explorer.testnet.arc.io`. Check which are live and update, including the CSP.
- **Public RPCs.** `eth.llamarpc.com`, `rpc.sepolia.org` and others are free endpoints and rate limit. Let the user set their own RPC per network.
- **Token amounts and decimals.** Native gas on Arc has 18 decimals and ERC-20 USDC has 6. Several forms take "amount" fields; each should say which unit it expects and convert in one helper.
- **Wallet UX.** Only injected wallets (`window.ethereum`) are supported. No WalletConnect, no EIP-6963 discovery, so with several wallets installed the wrong one may answer.
- **Transaction safety.** Show a pre-deploy summary (network, chain ID, constructor args, estimated cost) in the page instead of `confirm()`, and on mainnet require typing the network name.
- **Accessibility.** Clickable `div`s (network buttons, nav items, pills) are not keyboard reachable. Use `button` elements.
- **Tests.** There are none. Add a small script that loads each generator, compiles the output with solc, and fails on errors. It would also catch generator regressions.
- **Housekeeping.** Remove the stale `robots.txt` and `sitemap.xml` URL (`contractforge.pages.dev`) or point it at your real domain. Keep either `wrangler.toml` or `vercel.json` per host, not both confused.

## Does not need (consider removing)

- **Contract Analytics (section 16).** It scans logs with `eth_getLogs` from public RPCs, and ranges that large often fail or return partial data. It looks reliable but is not.
- **QR code via api.qrserver.com.** It sends your configuration URL to a third party and adds a CSP exception. A local QR library or removing the feature is safer.
- **CoinGecko price lookup.** It adds another third-party call and a CSP entry just for USD cost. Make it optional or drop it; the manual price field already exists.
- **Chains with no USDC, CCTP or verification support.** Robinhood Chain and BNB (USDC listed with 18 decimals) add rows nobody can use fully. Keep only the chains you actually test.
- **Generic "Wizard" duplicates.** The wizard reimplements the network picker. Reuse the main one.
- **Dead fallback placeholders.** The `0x…dEaD` defaults hide missing input. Require the field instead.
- **Two host configs.** Pick one primary host. Keeping Cloudflare and Vercel files is fine only if both are tested.

## Suggested order

1. Server function for the AI calls (or hide the buttons).
2. Self-host ethers, add SRI, pin solc.
3. Escape the remaining `innerHTML` spots.
4. Block placeholders on mainnet.
5. Split the HTML into files, then tighten the CSP.
6. Add the compile test.
