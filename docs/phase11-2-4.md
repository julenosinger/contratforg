# Phase 11.2.4 — CI recovery & generator regression certification

Status: 2026-11-16. Corrective phase over the baseline `b8d97b8`: root-cause and fix the pre-existing ERC-20 (7),
Paywall (1) and Share UI (3) failures reported by the first real CI run, without touching the certified Vault.

## HEADs

- **Initial:** `b8d97b8` (baseline; `main` == `origin/main`, clean tree except untracked `tests/*.log`).
- **Final:** `9210659` (this phase's single fix commit).

## Modified files

- `tests/dump-portable-sources.mjs` — generate the three portable ERC-20 variants with `s_supply = '0'`.
- `tests/solidity/test/Erc20.t.sol` — fix one genuine test bug (missing `vm.prank(b)`).
- `tests/solidity/test/Paywall.t.sol` — fix one genuine test bug (prank consumed by a view-call argument).
- `contractforge-deploy/app.js` — pin the Share & Export / QR number formatting to `en-US`.
- `tests/share-ui.mjs` — align one expected value with the pinned locale.
- `docs/phase11-2-4.md` (this file).

No Vault source, Vault test, Vault generator, `SHARE_OFFSET`, cap normalization, fee logic, cost-basis, deposit/redeem,
or Single/Portable generation was modified.

## Root causes and classification

### ERC-20 — 7 failures (all in `Erc20.t.sol`)

**Six failures were a test-harness mismatch, not a production defect.** The portable ERC-20 generator honours the form's
`Initial supply` default of `1000000` and mints `1000000 * 10**18` to the deployer in the constructor. `Erc20.t.sol`
was written against a zero initial supply: every supply assertion (`testBurnReducesSupply` "burned",
`testFuzzMintRespectsCap` "exceeds cap", `testFuzzTransferConservesFunds` "supply constant", `testOnlyOwnerMints`
"minted by the owner", `testRenounceOwnershipFixesTheSupply` "supply fixed at the renounce",
`invariant_supplyConservation` "balances do not add up to the supply") fails because the supply starts at 1M, not 0.
For `Erc20Cap` (cap `1000`) the constructor itself reverts "exceeds cap" because `1000000 * 10**18 > 1000 * 10**18`.

Classification: **test-harness defect** (the dump never set `s_supply`), *not* a generator or economic change. Fix:
set `s_supply = '0'` before generating `Erc20`, `Erc20Burn` and `Erc20Cap` in `dump-portable-sources.mjs`. The
generator's `1000000` default is a deliberate, user-configurable product default and is left untouched.

**One failure was a genuine test bug.** `testOwnerNeverZeroWithoutRenounce` rotated ownership to `b`, then called
`transferOwnership(c)` as `address(this)` — but `address(this)` was no longer the owner, so it reverted "not owner".
The second rotation now pranks the current owner `b` first. Classification: **test bug**; the contract's two-step
ownership is correct.

### Paywall — 1 failure (`testOwnerIsRotatableAndBeneficiaryStaysSeparate`)

`vm.prank(b); p.setPrice(p.pricePerPeriod() * 2);` — the argument `p.pricePerPeriod()` is itself an external view
call, and `vm.prank` applies only to the *next* call. The prank was consumed by the `pricePerPeriod()` read, so
`setPrice` ran as `address(this)` and reverted "not owner". The identical Staking test passed because it used a
literal argument (`s.fundRewardPool(1)`). Classification: **test bug**. Fix: read the price first
(`uint256 newPrice = p.pricePerPeriod() * 2;`) then `vm.prank(b); p.setPrice(newPrice);`. The contract's `onlyOwner`
`setPrice` is correct and untouched.

### Share UI — 3 failures (local-only, `pt-BR` locale)

`toLocaleString()` with no locale argument emits the environment's thousands separator. This machine is `pt-BR`, so
`2953` renders `2.953` and `3987` renders `3.987`; the tests assert the en-US `2,953` / `[\d,]+` forms. The CI runner
(`C.UTF-8`) already produced `2,953`, which is why the node job passed before and the three failures only surfaced
locally. Classification: **test/implementation locale fragility** — the Share & Export UI is entirely English, so its
numbers should be deterministic. Fix: pin `toLocaleString('en-US')` in `generateQR`, the "Share link" rows and the
"QR code" row of `app.js`, and mirror the same pin in the one test expected value. No security check (CSP, XSS,
URL validation) was weakened; the QR service is still never contacted for an over-long link.

## Before / after results

### Foundry (CI, `forge` job)

- Before (`b8d97b8`, run `43933434299`): **356 passed, 8 failed** (7 Erc20 + 1 Paywall).
- After (`9210659`, run `43937669556`): **364 passed, 0 failed, 0 skipped** — both `test:swap` and `test:portable`
  runs. Vault remains green: `Hardening.t.sol:VaultTest` 9, `VaultRuntime.t.sol:VaultConstructorTest` 11,
  `VaultRuntime.t.sol:VaultCapEnforcementTest` 4 (incl. the genuine Single/Portable equivalence test).

### Node (CI, `node` job)

- Before: job `success` on CI (the 3 share-ui failures were local-only).
- After: `success`; `share-ui.mjs` 100 passed / 0 failed; every suite green.

### Slither / actionlint

- Both `success` (Slither triage unchanged; the Vault variants stay named `ArcYieldVault`).

### Local

- `node compile-foundry-tests.mjs`: 20 passed, 0 failed (all `.t.sol` compile under solc 0.8.24, including the two
  edited files).
- `node share-ui.mjs`: 100 passed, 0 failed (was 97/3 on this `pt-BR` machine).
- `node creation-tabs-audit.mjs`: 302 passed; `node xss.mjs`: 43 passed; `node csp.mjs`: 248 passed.

## GitHub Actions execution links

- Final run: https://github.com/julenosinger/contratforg/actions/runs/43937669556 (commit `9210659`)
  — forge success, slither success, node success, actionlint success.
- Baseline run: https://github.com/julenosinger/contratforg/actions/runs/43933434299 (commit `b8d97b8`).

Foundry v1.7.1; Foundry solc 0.8.28 (`foundry.toml`); app solc 0.8.24.

## CI reliability notes

- `.github/workflows/` (installed in 11.2.3) is preserved; no `continue-on-error`, no skipping, no disabled assertions,
  no removed tests, no broad suppression.
- `test:swap` and `test:portable` still duplicate the same Foundry run under two names (documented in
  `tests/package.json`); left as-is to avoid churn.

## Remaining risks / failures

- None in scope. The untracked `tests/*.log` files are local artifacts and are not part of the repository.
- No formal third-party security audit is implied; the tests demonstrate behaviour.
