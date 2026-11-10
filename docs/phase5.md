# Phase 5: secure the app surface (DAO admin, NFT owner, wallet permissions, Slither pin, events, innerHTML, CSP)

Status as of 2026-11-10. Everything here is an internal review. **No template has had an independent audit.**
Starting point: the commit `6899f8e` (end of phase 4). The phase-5 work is a series of small commits: `b4316ef`
(DAO), `c9d18e5` (NFT), `2c6b29a` (smart wallet), `e99e472` (Slither pin), `c4727e0` (events), `27e63a5`
(mutation coverage), `18384b0` and `2c4a86c` (innerHTML and CSP). This document records what each one fixed,
the test that fails before and passes after, and the decisions that remain open.

## 1. Findings fixed (red-green)

Each test was written first and run against the previous generator output.

| Finding | Correction | Red-green test | Evidence |
|---|---|---|---|
| **DAO** (finding 3 of `docs/dao-review.md`): the admin could cancel any proposal and could never be changed or removed — one permanent single-key veto | Two-step `transferAdmin` / `acceptAdmin` (a pending admin has no powers, never to zero), an irreversible `renounceAdmin()`, a minimum voting period of one block, and proposal getters (`proposalCore`, `proposalVotes`, `proposalActions`, `proposalDescription`, `hasVoted`) | `Dao.t.sol` (14 unit, 5 fuzz, 5 invariants + 1 sanity check). Against the previous output the new functions do not exist, so the tests fail at run time; against the new output they pass | `docs/dao-review.md` (findings 3, 4, 5); commit `b4316ef`; promoted to `reviewed` |
| **NFT** (the owner receives every mint payment and the royalties and sets the price and the base URI, and could never be rotated) | Two-step `transferOwnership` / `acceptOwnership` (a pending owner has no powers, never the zero address; events `OwnershipTransferStarted` / `OwnershipTransferred`). There is deliberately no renounce: the owner is also the payee, so a zero owner would burn every payment | `Phase5Nft.t.sol` (three unit tests, written against the previous output where they fail, plus a fuzz test) | `docs/generators-review.md` "NFT owner rotation (phase 5)"; commit `c9d18e5`; the level stays `reviewed` |
| **Smart wallet** (a session key's permission was a list of *contracts*, so any function of an allowlisted contract that was not on the blocked list was open) | Session keys are limited to exact `(target, selector)` pairs (`struct Permission { address target; bytes4 selector; }`); the blocked list wins; plain native transfer is its own pair `(target, 0x00000000)`. This changes the ABI | `SmartWallet.t.sol` (run against the single and the portable build). Against the previous output 67 of the 135 tests in the file fail (the new signature does not exist there) | `docs/smart-wallet-review.md` "Phase 5"; commit `2c6b29a`; the level stays `reviewed` |
| **Slither triage** (entries were keyed by detector + contract + function, not by the code: a later change to the same function could keep hiding a real finding) | Every triage entry is pinned to a hash of the function's code; `slither-check.mjs` fails when the code changed and names the entry; re-pinning touches only one entry at a time | `slither-pin.mjs` (needs slither and solc 0.8.24; skips with a notice when slither is missing, fails with `REQUIRE_SLITHER=1`) | commit `e99e472`; `tests/slither-pin.mjs` |
| **Missing events** (NFT `setBaseURI`, subscription `setBeneficiary`, factory `PairCreated` token0/token1) | `BaseURIUpdated(old, new)`, `BeneficiaryUpdated(old, new)` (both addresses indexed), `PairCreated` indexes `token0` and `token1` | `Phase5Events.t.sol` (`vm.expectEmit`); all three fail against the previous output | commit `c4727e0` |
| **innerHTML** (untrusted values — an RPC error, a wallet address, an imported ABI, an AI answer, localStorage, a shared link — reached `innerHTML` unescaped) | Every such value goes through `escapeHtml`, and a lint (`innerhtml-lint.mjs`) pins every dynamic `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write` to a hash and a written reason, so a new or changed sink fails the run | `xss.mjs` (31 checks: hostile payloads across every source, none may become markup or run) + `innerhtml-lint.mjs` (74 sinks, 48 approved) | commits `18384b0`, `2c4a86c`; section 4 below |
| **CSP** (`script-src` still had `'unsafe-inline'` and `'unsafe-eval'`) | `script-src` no longer has `'unsafe-inline'`; it has `'self'`, the three hosts the page loads scripts from, and `'wasm-unsafe-eval'` (solc is WebAssembly). `style-src` keeps `'unsafe-inline'` (section 5). The page has no inline handlers or inline scripts | `csp.mjs` (static checks) + `csp-browser.mjs` (loads the page under the real policy in Chromium and fails on any violation, console error, or a broken main flow) | commit `2c4a86c`; section 5 below |
| **Nightly fuzz** (long fuzz/invariant runs that a push job cannot afford) | `ci/workflows/fuzz-nightly.yml` (scheduled and manual, 20000 fuzz / 1000 invariant runs, failures kept as artifacts) | — (runs `npm run test:portable` with raised counts) | commit `2c4a86c` |

Golden files: only the DAO, NFT, smart wallet and event changes touched the generated output, and `node golden.mjs --update`
was run so the golden files match. The mutation check (section 2) removes each correction again and a test fails every time.

## 2. Mutation coverage

`tests/mutation-check.py` grew to 40 mutations (17 before phase 4, 10 in phase 4, 13 in phase 5). The phase-5 ones undo each
new guard and expect the Foundry suite to fail: the DAO admin handed over without an accept step, a renounce that leaves a
pending admin, a voting period of zero accepted again, a pending admin that can already cancel, an NFT ownership offered to
the zero address, anyone able to accept the ownership, the wallet permission check ignoring the function, the blocked list
stopping, a blocked function granted, each of the three new events removed, the `PairCreated` tokens unindexed, and the
Slither pin no longer breaking on a changed function. Result at the end of phase 5: **uncaught mutations: 0**.

## 3. Promotion decision for the DAO, and the NFT rotation decision

**DAO: `experimental` → `reviewed`.** The rule in `docs/mainnet-gate.md` needs three things: a review document, a dedicated
Foundry suite with fuzz or invariant tests, and no relevant open finding. `docs/dao-review.md` exists and `Dao.t.sol` has fuzz
and invariants. The finding that had kept it experimental (finding 3, the permanent single-key veto) is fixed and tested.
What stays open does not defeat the purpose of the contract for someone using it as documented: finding 7 (no vote escrow) is
a design limit shared with plain Governor-style contracts, and finding 6 (only *for* votes count) is by design. While an admin
exists it is a guardian who can veto; the operator can end that with `renounceAdmin()` or hand the role to a multisig with the
two-step transfer. The level reason in `maturity.js` says this.

**NFT: stays `reviewed`, with a two-step owner rotation and no renounce.** The same weakness that had kept the DAO
experimental (a key that can never be replaced) was fixed here too, not because it is acceptable. The owner is also the
payee — it receives every mint payment and the royalties — so a renounce (which would set the owner to the zero address and
burn every payment) is deliberately not offered. A lost key freezes the price and base URI, and a compromised key can be
handed over in two steps; the zero owner is refused in `transferOwnership`.

## 4. Templates with a fixed owner/admin without rotation

Read from the generators, not presumed. A "fixed" role is one the deployer holds with no way to offer, hand over or renounce it.

| Template | Role | Can it be rotated? | Maturity |
|---|---|---|---|
| `erc20` | `owner` (onlyOwner `mint`/`burn`) | No | experimental |
| `paywall` (subscription) | `owner` (onlyOwner `setPrice`/`setBeneficiary`) | No | experimental |
| `staking` | `owner` (`immutable`; `fundRewardPool`, `claimFees`) | No | experimental |
| `crosschain` (CCTP V1 form) | `owner` (constructor sets it; used only in `markResolved`) | No | experimental |

`docs/generators-review.md` names the first three ("subscription, ERC-20, staking"); the CCTP V1 form's fixed owner is a new
finding recorded here. All four are `experimental`, so none blocks a promotion: the DAO, NFT, vault and smart wallet (the
reviewed templates with a privileged role) all have a two-step rotation, and the bridge (CCTP V2) has no owner at all.

## 5. innerHTML classification and CSP

### innerHTML

After the sweep, `contractforge-deploy/` has **74 `innerHTML`-style sinks**: 26 are plain string literals (no data at all) and
48 are dynamic and pinned in `tests/innerhtml-approved.json`, each to a hash of the statement with a category and a written
reason. The categories: **E** — every untrusted value goes through `escapeHtml` (or is passed as a text node); **C** — only
program constants (NETWORKS, template tables, numbers it computed); **N** — only numbers, or values validated as an address
or hex. As of this phase the split is **33 E / 12 C / 3 N**. `xss.mjs` drives the E sinks with hostile payloads
(`<img onerror>`, `<script>`, `<svg onload>`, attribute breakouts, `javascript:` URLs) and asserts nothing becomes markup or
runs. Changing an approved statement (for example a new interpolation) changes its hash and fails the lint until it is
reviewed again. One entry (`ui.js:73`, the home "recent deployments" rows) was recategorised `C` → `E` in this phase: it
interpolates localStorage history (`e.name`, `e.address`, `e.network`, `e.timestamp`) which it escapes, so the "only
constants" reason was wrong. The statement and its hash are unchanged.

The 48 approved dynamic sinks, case by case (`xss.mjs` covers every E sink and section 11b the hostile score and the QR URL):

| file:line | interpolated values | why it is safe |
|---|---|---|
| app.js:223 | `net.label`, `net.isMainnet` | constant (NETWORKS table) |
| app.js:342 | `addr` (wallet address), `net.label` | `escapeHtml` on the address slices; the label is constant |
| app.js:477 | `msg` (RPC/wallet log) | `escapeHtml(msg)` |
| app.js:517 | `t.name`, `t.desc`, `t.tags`, index | constant (SIMPLE_TEMPLATES) |
| app.js:652 | the generated form | constant (template table + network defaults) |
| app.js:2502 | `filename` | `escapeHtml(filename)` |
| app.js:2826 | `score`, `color`, `cx/cy/r/dash` | number: `Math.max(0, Math.min(100, report.score\|\|0))` turns any hostile value into NaN |
| app.js:2853 | `sev`, `f.title`, `f.description`, `f.recommendation`, `f.lineHint` | `sev` is enum-validated (`AUDIT_SEVERITIES`); the rest `escapeHtml` |
| app.js:2936 | `entry.network`, `entry.name` (deploy history) | `escapeHtml` |
| app.js:3001 | `msg` | `escapeHtml(msg)` |
| app.js:3099 | `msg` | `escapeHtml(msg)` |
| app.js:3303 | `qrUrl` | `encodeURIComponent(url)` inside a fixed `https://` URL, so no quote or angle survives |
| app.js:4242 | `s.name`, `s.sub` | constant (WIZARD_SUBTYPES) |
| app.js:4287 | `net.label` | constant (NETWORKS) |
| app.js:4295 | `net.label` | constant (NETWORKS) |
| app.js:4441 | `k.value`, `k.label`, `k.sub` | `escapeHtml`; the values are `toLocaleString`/`toFixed` numbers and constants |
| app.js:4445 | `v`, `maxB` | numbers (event bucket counts) |
| app.js:4446 | `i`, `lookback` | `lookback` is parsed to an integer; the rest is the index |
| app.js:4484 | `h.address`, `h.name`, `h.network` (history pills) | `h.address` is `isAddr`-validated then `escapeHtml`; name and network `escapeHtml` |
| app.js:4509 | `pendingSource.name`, `Number(testCount)` | `escapeHtml`; the count is `Number(...)\|\|0` |
| lab.js:95 | `msg` | `escapeHtml(msg)` |
| lab.js:246 | balances table | `escapeHtml`; balances are formatted numbers |
| lab.js:287 | `LAB.txs` (fn, kind, by, args, result, gas, events) | `escapeHtml` |
| lab.js:320 | constructor arguments | `escapeHtml` |
| lab.js:561 | the lab panel html | `escapeHtml` on every outside value |
| lab.js:567 | `LAB_NAMES`, index | constant (five fixed account names) |
| maturity.js:125 | `matBadgeFor(card.dataset.id)` | constant template id; the badge text is `escapeHtml`-ed inside `matBadgeHtml` |
| maturity.js:132 | `MAT_SECTION_TEMPLATE[sec]()` | constant (fixed section → template table) |
| multichain.js:225 | `net.label`, ctor args | `escapeHtml` |
| multichain.js:252 | `MC_MODES` | constant (mode table) |
| multideploy.js:186 | the multi-deploy panel (labels, ctor args) | `escapeHtml` |
| playground.js:270 | `item.name`, `item.type`, `outStr` (imported ABI) | `escapeHtml` |
| playground.js:301 | `msg` | `escapeHtml(msg)` |
| playground.js:328 | `n.label` | `escapeHtml` |
| playground.js:419 | the playground panel html | `escapeHtml` |
| playground.js:447 | call history | `escapeHtml` |
| ui.js:33 | `net.label`, `net.chainIdDec`, `MC_MODES[..].label` | `escapeHtml` |
| ui.js:61 | `pendingSource.name` | `escapeHtml` |
| ui.js:73 | `e.name`, `e.address`, `net.label`, `timeAgo(e.timestamp)` (localStorage) | `escapeHtml`; `e.address` also `isAddr`-filtered |
| ui.js:85 | `MC_MODES` | constant |
| ui.js:90 | `n.label` (NETWORKS) | `escapeHtml` |
| ui.js:128 | `all.length`, `main`, `GENERATOR_VERSION` | numbers and a constant |
| ui.js:184 | `pendingSource.name` | `escapeHtml` |
| ui.js:284 | `opts.name`, `opts.info.reason`, `opts.nets` (gate) | `escapeHtml` |
| ui.js:338 | network label, ctor args | `escapeHtml` |
| ui.js:384 | `opts.tag`, title, rows | `escapeHtml` |
| ui.js:414 | network label | `escapeHtml` |
| ui.js:553 | `uiDeployResults` | `escapeHtml` |

### CSP

`script-src` is `'self' https://cdnjs.cloudflare.com https://binaries.soliditylang.org https://cdn.jsdelivr.net
'wasm-unsafe-eval'` — no `'unsafe-inline'`, no `'unsafe-eval'`. The page has no inline event handlers and no inline
`<script>`, so the only remaining inline-code allowance is `'wasm-unsafe-eval'` for solc's WebAssembly build. The policy is
written in both `vercel.json` and `contractforge-deploy/_headers` (Cloudflare), and `csp.mjs` asserts the two are identical.
`csp-browser.mjs` loads the page under the real `_headers` policy in Chromium and walks the main flow (navigate with the
`data-on*` handlers, connect a wallet, switch to Arc Mainnet, generate an escrow, pass the experimental gate, compile with
solc in a worker, reach the deploy summary, run it in the Test Lab) and fails on any `securitypolicyviolation` or console
error. That browser run was executed against the local Chromium (11 checks passed); it has not been run on a hosted runner.
In summary: script-src drops 'unsafe-inline' and 'unsafe-eval' (only 'wasm-unsafe-eval' remains), while
style-src keeps 'unsafe-inline' for the inline style attributes documented in section 6.

## 6. Directives that stay loose, and why

| Directive | What is allowed | Why it stays, with proof |
|---|---|---|
| `style-src 'self' 'unsafe-inline'` | inline `style` attributes | The page uses inline `style="…"` in `index.html` (dozens of elements: `style="display:none;"`, layout, colours) and builds more in JS (the network chip colour, the audit ring `stroke="${color}"`, the analytics bars `height:${…}px`). Inline style attributes can only be allowed with `'unsafe-inline'` (a nonce or hash does not cover `style` attributes), so removing it would need a large refactor. No `<style>` element or `style` element content is added by the app. |
| `script-src` third-party hosts: `cdnjs.cloudflare.com`, `binaries.soliditylang.org`, `cdn.jsdelivr.net` | scripts from three CDNs | `cdnjs.cloudflare.com` serves ethers 5.7.2 with an `integrity` hash (`index.html`, line 925). `binaries.soliditylang.org` is the primary source of the solc-js compiler and `cdn.jsdelivr.net` the fallback (`app.js`: `https://binaries.soliditylang.org/emscripten-wasm32/list.json`, `…/solc-emscripten-wasm32-v…js`, `https://cdn.jsdelivr.net/npm/solc@…/soljson.js`); `cdn.jsdelivr.net` also serves the WalletConnect provider (`app.js`: `@walletconnect/web3-provider@1.8.0`). These hosts are a residual trust point: a compromised CDN could serve a malicious compiler or library. The compiler and the WalletConnect script have no `integrity` hash. |
| `img-src … https://api.qrserver.com` | the QR image | The Share panel renders a QR of the configuration URL (`app.js`: `https://api.qrserver.com/v1/create-qr-code/?…data=${encodeURIComponent(url)}`). The data is `encodeURIComponent`-ed inside the fixed URL, so it cannot carry markup. |
| `connect-src … https://api.coingecko.com` (plus the RPC and explorer origins from `NETWORKS`) | the price lookup and chain access | The gas estimator fetches the price from CoinGecko (`app.js`: `https://api.coingecko.com/api/v3/simple/price?…`). `connect-src` also lists the RPC and explorer origins read from `NETWORKS`; `csp.mjs` asserts every `connect-src` origin is used and none is unused. |

`csp.mjs` checks each of these: the two header files carry the same policy, `script-src` has no `'unsafe-inline'`, `style-src`
keeps `'unsafe-inline'` and this document says why, no wildcard sources, no plain `http:` sources, no `javascript:` URL and no
inline handlers in the page or the markup the scripts build, every `data-on*` call names an app function, and every allowed
`https://` host is actually used.

## 7. Out of scope / new findings (not fixed)

| Severity | Where | Finding | Suggestion |
|---|---|---|---|
| Medium (design) | `crosschain` (CCTP V1 form) | a fixed, non-rotatable `owner` (used only in `markResolved`) | two-step rotation like the NFT, or drop the owner and let only the burn's own sender mark it resolved; the template is experimental |
| Info | `erc20`, `paywall`, `staking` | fixed owner/admin with no rotation (section 4) | the same two-step pattern as the NFT; they are experimental |
| Info | solc and WalletConnect | loaded from `binaries.soliditylang.org` / `cdn.jsdelivr.net` without an `integrity` hash | pin and hash, or self-host |
| Info | `connect-src` third-party RPCs | public RPC endpoints are trusted for balance, gas and logs | allow the user to set their own RPC, and keep the hosts explicit |

## 8. Decisões que preciso da sua validação

1. **The DAO is `reviewed`** with the guardian admin still present by default. The veto can be ended with `renounceAdmin()` or handed to a multisig. If you consider the guardian itself unacceptable, the promotion is a one-line change in `maturity.js`, but the label would then say "reviewed" for a contract whose default deployment keeps a veto key.
2. **The NFT has no renounce**, only a two-step rotation, because the owner is the payee. If you would rather have a renounce that redirects payments somewhere else, that is a separate design change.
3. **`style-src 'unsafe-inline'` stays.** Removing it means moving every inline `style` attribute (static and JS-built) to classes or a nonce; it is a UI refactor, not a security fix on its own.
4. **Third-party script hosts stay** (ethers, solc, WalletConnect). The compiler and WalletConnect have no `integrity` hash; pinning them is listed above.
5. **The CCTP V1 form's fixed owner** is recorded as a finding, not fixed (Solidity is out of scope for this phase).
6. **`ui.js:73` was recategorised `C` → `E`** in the approved list (done); the statement and its hash are unchanged, only the category and the reason, because the statement already escaped every external value. `xss.mjs` section 11 now also passes the `info` argument the experimental gate actually reads (the old call was missing it, so that check was passing vacuously).

## 9. Phase 5.5 (finishing) — housekeeping recorded here

- **jsdom `^26.0.0` → `30.1.3`**: `npm install jsdom@30.1.3 && npm test` passes with the same counts, so the upgrade is kept (lockfile updated). `.github/dependabot.yml` now groups minor and patch releases into one PR; a semver-major bump (like jsdom 26 → 30) still opens its own PR for a by-hand validation.
- **CSP is now tested on every run**: `csp.mjs` is in `npm test`, and the CI node job runs `npx playwright install --with-deps chromium` then `node csp-browser.mjs` with `REQUIRE_BROWSER=1`.
- **`tests/node_modules_pw`** (a committed symlink to `/tmp/pw/node_modules`) was removed and the name is ignored in `tests/.gitignore`.
