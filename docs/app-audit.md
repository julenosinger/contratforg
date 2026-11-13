# ContractForge: app review

Status of every item as of **2026-11-02**. The first review (2026-10-30) was done by reading the code; since then the
code has changed a lot and has automated tests, so each item below says whether it is fixed or still open.

Scope: `contractforge-deploy/` (HTML, CSS and the JavaScript files), `api/ai.js`, `functions/api/ai.js`, `_headers`,
`vercel.json`, `wrangler.toml`. Nothing has been checked with a real wallet on a live mainnet, and none of the
generated contracts has had an independent audit (see `docs/mainnet-gate.md`).

## What the app is

A no-backend page (plus one small AI proxy function) that generates Solidity from forms and from an AI chat
(section 15, `docs/ai-chat.md`), compiles it in the
browser (self-hosted solc-js, sha256-verified against `vendor/MANIFEST.json` before it runs), deploys with an
injected wallet (self-hosted ethers 5.7.2), and has an ABI playground, a simulated Test Lab, deploy history and a
mainnet gate by maturity.

## Must fix (functional or security)

| # | Item | Status 2026-11-02 |
|---|---|---|
| 1 | AI calls from the browser with no key | **Fixed.** The browser calls `/api/ai`, which holds the key. Hardened in phase 2: same-origin only (a missing Origin is refused), rate limit per IP, only `{action, payload}` from the client, prompts and model on the server, generic errors. **Open:** `ANTHROPIC_API_KEY` must be set, and without Redis, KV or the Cloudflare binding the rate limit is in memory and weak. |
| 2 | Third-party scripts without integrity | **Fixed (phase 6).** solc-js and ethers are self-hosted under `vendor/` (see `docs/supply-chain.md`), sha256-verified against `vendor/MANIFEST.json` before they run, and `script-src` is now `'self' 'wasm-unsafe-eval'` with no external host. |
| 3 | Weak CSP (`unsafe-inline`, `unsafe-eval`) | **Fixed (phase 5).** `script-src` dropped `'unsafe-inline'` and `'unsafe-eval'` (only `'wasm-unsafe-eval'` remains for the WebAssembly compiler); `style-src` keeps `'unsafe-inline'` for inline `style` attributes (see `docs/phase5.md`). |
| 4 | `innerHTML` with unescaped values | **Mostly fixed.** Deploy history, log lines and the other places listed in the first review are escaped. **Open:** a full sweep of every `innerHTML` use has not been done. |
| 5 | `0x…dEaD` placeholders | **Fixed (phase 2).** Required fields, a DRAFT state that switches off compile, deploy, copy, download, publish, test and Multi-deploy on every network, and a regex guard at deploy time. |
| 6 | Arc Mainnet CCTP addresses empty | **Partly fixed.** The CCTP V2 addresses for Arc and the other networks are in the code (checked on the Arc networks) and are used by the portable and crosschain modes. **Open:** the legacy V1 form (single-network mode) still takes the addresses by hand. |
| 7 | solc on the main thread | **Fixed.** It runs in a Web Worker, with the main thread as a fallback. |

## Should improve

| Item | Status 2026-11-02 |
|---|---|
| Split the file | **Fixed in part.** `index.html` is small; the code is in `app.css`, `app.js`, `multichain.js`, `multideploy.js`, `playground.js`, `lab.js`, `ui.js`, `maturity.js`, `required.js`. `app.js` is still large. No build step. |
| Network config in one place | **Open.** Some text still repeats network data by hand. |
| Arc Testnet RPC and explorer | **Fixed.** `rpc.testnet.arc.io` and `explorer.testnet.arc.io`; the CSP allows both RPC hosts. |
| Public RPCs | **Open.** The user cannot set their own RPC. |
| Token amounts and decimals | **Partly fixed.** Portable mode reads the token's decimals; the wallet limit names its unit. Other forms should still say which unit they expect. |
| Wallet UX (WalletConnect, EIP-6963) | **Partly fixed.** Injected wallets only; the WalletConnect v1 button and its CDN loader were removed in phase 6 (v1 is discontinued). WalletConnect v2 and EIP-6963 remain open (v2 needs an external `projectId`). |
| Transaction safety | **Fixed for mainnets.** An in-page summary with typed network confirmation replaces `confirm()`; experimental contracts need an extra tick and phrase. Testnets deploy without a summary on purpose. |
| Accessibility | **Partly fixed.** Menu items, network buttons and cards are reachable by keyboard, with focus rings. Not every clickable `div` was converted. |
| Tests | **Fixed.** There is a test suite (see below). The earlier statement "there are none" is obsolete. |
| Housekeeping | **Fixed.** The stale `sitemap.xml` was removed. Both `vercel.json` and the Cloudflare files remain and are both maintained. |

## Tests that exist today

Run from `tests/` with `npm test` (needs `npm install`): compilation of every generator in every multichain mode and
four networks, golden files for single-network output (and a check that none contains a placeholder address), the
maturity table checked against the repository, the AI proxy (both platforms), multichain behaviour, navigation, the
mainnet gate, required fields and the wallet limit (`ui.mjs`), the ABI playground against a local node, the Test Lab,
and the compiler loader. `npm run test:swap` and `npm run test:portable` run the Foundry suites (fuzz included).
`python3 tests/mutation-check.py` switches 17 guards off one at a time and expects a failure each time.

## Does not need (consider removing)

| Item | Status 2026-11-02 |
|---|---|
| Contract Analytics (section 16) | **Open.** Still present; `eth_getLogs` on public RPCs is unreliable for large ranges. |
| QR code via `api.qrserver.com` | **Open.** Still present. |
| CoinGecko price lookup | **Open.** Still present; the manual price field exists. |
| Chains without USDC/CCTP/verification (Robinhood, BNB) | **Open.** Kept on purpose. Templates that need a token now say so instead of inventing one. |
| Wizard network picker duplicate | **Open.** |
| Dead fallback placeholders | **Fixed.** See item 5. |
| Two host configs | **Open by choice.** Both Vercel and Cloudflare are kept. |

## Added since the first review

- **Maturity levels and a mainnet gate** (`docs/mainnet-gate.md`): every contract is stamped with its level; experimental
  contracts cannot be deployed to a mainnet without a tick and a typed phrase; reviewed ones show a banner.
- **Per-network default** for the smart wallet's daily limit.
- **ABI Playground v2 and the Test Lab**, **multichain modes**, and the security reviews in `docs/generators-review.md`,
  `docs/swap-amm-review.md` and `docs/smart-wallet-review.md`.
