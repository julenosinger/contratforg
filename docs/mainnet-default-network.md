# Mainnet-first default network — Arc Mainnet by default, user control always

Status: 2026-11-18. A network-default configuration change: Arc Mainnet is now the network the app opens on, while every
other network, deployment mode, wallet integration, mainnet safety gate and UI behavior is preserved.

## Initial / final HEAD

- Initial: `98ca866` (latest `origin/main` at the start of this phase — the Phase 11.3 header-layout fix).
- Final: see the commit for this phase.

## Root cause of the testnet-first initialization

The default was hardcoded in two places in `contractforge-deploy/app.js`:

```javascript
let activeNetwork = 'arc';          // Arc Testnet
let netFilter = 'testnet';
```

and the sidebar placeholders in `index.html` mirrored it (`Arc Testnet`, `5042002`, and a `testnet` banner class). The
network selector, the sidebar, the header banner and the deploy overview all render from these two variables on load, so
the app opened on Arc Testnet.

## Exact modified files

- `contractforge-deploy/app.js` — `activeNetwork = 'arcMain'`, `netFilter = 'mainnet'` (the only two production lines).
- `contractforge-deploy/index.html` — sidebar placeholders (`Arc Mainnet`, `5042`) and the banner's initial `mainnet` class.
- `tests/mainnet-default-network.mjs` — new regression suite (40 checks).
- `tests/package.json` — added `node mainnet-default-network.mjs` to the `test` script (so CI runs it).
- Test updates that asserted the old default (see below).
- `tests/fixtures/overview-views.json` — regenerated: only the four "empty" view hashes changed (the default network label).
- `docs/mainnet-default-network.md` — this file.

No Solidity generator, no Vault/Treasury/Swap economics, no wallet signing, no network config, no deployment logic, no
CSP/XSS rule was touched.

## New default behavior

On fresh load: `activeNetwork === 'arcMain'` and `netFilter === 'mainnet'`. Arc Mainnet (chain 5042, `0x13b2`,
`https://rpc.mainnet.arc.io`, `https://explorer.arc.io`, USDC gas) is the active network; the sidebar shows
`Arc Mainnet · 5042 · USDC`; the header banner is a mainnet banner naming Arc Mainnet; `body.mainnet-mode` is set; the
wallet stays disconnected and no balance is shown until the user connects.

## Wallet synchronization policy (unchanged)

The default network is a UI default only. On load the app does **not** connect a wallet, does **not** call any
`wallet_switchEthereumChain`, and reads no balance. Wallet behavior is unchanged:

- Manual connection still calls `switchWalletNetwork()` (the existing "sync the wallet to the app's network on connect").
- `accountsChanged` and `chainChanged` still work: the app follows the wallet's chain.
- `accountsChanged([])` still disconnects.
- The gas estimator still reads `window.ethereum.chainId` and reports a chain mismatch.

## Mainnet safety (verified, unchanged)

Because the default is now a mainnet, the existing protections are what stop a mistaken deploy:

- `deployCompiled` refuses a mainnet deploy without the maturity confirmation (`matIsApproved`).
- `compileAndDeploy` still requires a connected wallet, a non-draft contract, and the maturity gate.
- The in-app "Switch to … MAINNET" dialog (`#switchConfirm`) is still mandatory for every mainnet selection.
- A mismatched wallet chain is reported, never silently ignored.

## Test results

New suite (run locally):

- `mainnet-default-network.mjs` — **40 passed, 0 failed**.

Existing suites updated for the new default, then green:

- `ui` 376 · `deploy-overview-ui` 240 · `builder-core` 59 · `treasury-builder-ui` 121 · `vault-builder-ui` 356 ·
  `multisend-builder-ui` 312 · `simple-builder-ui` 1581 · `wizard-builder-ui` 295 · `share-ui` 100 ·
  `overview-views-snapshot` 67 (fixture regenerated).

Browser suites (real Chromium): `header-layout-stability` 156 · `csp-browser` 11 · `share-browser` 27 — all green, so the
mainnet label and banner do not introduce any header layout shift (the header-layout-stability suite already asserts that
network switching never moves the header).

## Regression comparison

The only test edits are assertions that named the old default (`Arc Testnet (5042002)`, `netFilter = 'testnet'`, or the
"network change → back to `arc`" round-trip, now `arcMain`), plus the fixture. No existing passing test was weakened or
removed; the counts above all increased or held.

Known, unrelated, pre-existing issues (present on `98ca866`, out of scope):

- `analysis-tabs-audit`, `gas-tab-ui` and `analytics-tab-ui` show locale-dependent thousands separators (`500.000` vs
  `500,000`) on non-en-US machines; they pass on the CI runner's `C.UTF-8` locale.
- `header-home-browser` "phone: the Actions menu opens inside the screen" (contract-bar menu, pre-existing).

## Remaining limitations

- No formal third-party security audit is implied; the tests demonstrate behavior.
- The wallet is not auto-connected or auto-switched on load; the user's manual action remains the only trigger.

## CI

Final GitHub Actions run: see the push for this commit (the `node` job runs the new suite through `npm test`).
Foundry v1.7.1 · Foundry solc 0.8.28 · app solc 0.8.24.
