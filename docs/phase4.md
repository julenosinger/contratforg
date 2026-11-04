# Phase 4: fix the open findings, earn promotions with tests

Status as of 2026-11-04. Everything here is an internal review. **No template has had an independent audit.**
Starting point: the commit `f2d4c89` (end of phase 3).

## 1. Findings fixed (red-green)

Each test was written first and run against the old generator output.

| Finding | Correction | Red-green test | Evidence |
|---|---|---|---|
| A.1 `ArcOriginals.mint` paid before it updated the state and had no guard (Slither `reentrancy-no-eth`): a payment token that calls back could mint past `MAX_SUPPLY` | State is recorded before the payment (checks-effects-interactions) and `mint` is `nonReentrant`; same events and same revert reasons in normal use | `Phase4Nft.t.sol`: a one-token collection with a re-entering token; the nested call is refused; the state is already updated when the token is called; two tests pin the normal behaviour | Old code: `[FAIL: supply went past MAX_SUPPLY]`, `[FAIL: a nested mint() succeeded]`, `[FAIL: totalSupply was not updated before the payment (checks-effects-interactions)]`. New code: all pass (205 tests in total at that point) |
| A.2 `ArcSubscription.setPrice`, `ArcOriginals.setMintPrice`, `ArcYieldVault.setDepositCap` changed privileged parameters without an event | `PriceUpdated(old, new)`, `MintPriceUpdated(old, new)`, `DepositCapUpdated(old, new)`, emitted before the write | `Phase4Events.t.sol` with `vm.expectEmit` | Old code: three times `[FAIL: log != expected log]`. New code: pass |

Golden files: only the ERC-721, Subscription and Vault files changed (12 files, four networks each); the NFT triage entry was removed.
The mutation check (below) removes each correction and each event again and a test fails every time.

## 2. New suites (B)

`foundry.toml`: fuzz 256 runs; invariants 64 runs x 100 calls, `fail_on_revert = false`. The whole Foundry suite (274 tests, 25 suites) takes
about 10 seconds on the sandbox; a hosted runner will differ. Eight different fuzz seeds were run and pass. A different seed found
one test artefact (see section 6), which is why the seed variation matters.

| Suite | Contents |
|---|---|
| `Factory.t.sol` (21) | unit (sorted tokens, symmetric `getPair`, duplicate pair refused in either order, identical / zero / non-contract tokens refused, `PairCreated`, `allPairsLength`); fuzz (random creation orders never give two pairs for one set of tokens; only contracts can be tokens); invariants over three pairs and three accounts (a swap never lowers k, reserves never exceed balances, account shares + locked minimum = `totalShares`, a funded pair never has an empty side); hostile tokens (fee-on-transfer, sender surcharge, returns false, returns nothing, re-enters) and the proof that a dishonest token only hurts its own pair. Changing the sign of the swap fee breaks the invariants |
| `Dao.t.sol` (25) | 14 unit, 5 fuzz (snapshot weight, exact quorum rule for supplies up to 2^112, timelock and grace window, voting window, proposal threshold), 5 invariants + 1 sanity check (a proposal executes at most once; a cancelled one never executes; execution only inside the window; votes only in the period, with snapshot weight, once per account; the outcome follows an independent tally). Reachability probes confirmed the handler reaches votes, queueing, execution, cancellation, defeat and expiry |
| `Nft.t.sol` (10) | supply, ids, transfer authority (fuzzed), wrong-owner transfers, approvals cleared, safe transfers, interfaces, hostile payment token; invariants for a five-token collection and for one with a re-entering token (probes confirmed sold-out and the re-entry attempt are reached) |
| `Multisend.t.sol` (12) | fuzzed conservation of value for token and native batches, atomicity, limits, rejecting / gas-burning / re-entering recipients; invariants: the contract never holds funds, value is conserved |

## 3. Promotions (C): the rule applied to every template

Rule (`docs/mainnet-gate.md`): a review document in `docs/` + a dedicated Foundry suite with fuzz or invariant tests + no relevant finding open.
"Relevant" is defined there: it can defeat the purpose of the contract for someone using it as documented, and the generator could remove it.

| Template | Before | After | Why |
|---|---|---|---|
| `swap-amm-factory` | experimental | **reviewed** | `Factory.t.sol` (fuzz + invariants), `swap-amm-review.md` phase 4 section; nothing relevant open. Anyone can create a pair and a dishonest token hurts only its own pair: a residual risk of every permissionless AMM that the operator manages by choosing tokens to list; it does not stop honest pairs from working and the contract cannot remove it |
| `erc721` | experimental | **reviewed** | `Nft.t.sol`, `generators-review.md` phase 4 section; the relevant finding (mint reentrancy) is fixed. Open: Low (`setBaseURI` has no event) |
| `multisend` | experimental | **reviewed** | `Multisend.t.sol`, same document; the earlier findings are fixed. Atomic batches and the 200,000 gas cap are documented limits |
| `dao` | experimental | **experimental** | `Dao.t.sol` has fuzz and invariants and `dao-review.md` exists, but **finding 3 is open and relevant**: the admin can cancel any proposal forever and can never be replaced or removed. For a contract called a DAO that is a permanent single-key veto and a governance liveness risk, and the generator could remove it. The zero voting period (Low) and the missing tally getter (Low) are also open |
| `smartwallet`, `swap-amm-single`, `treasury`, `vault` | reviewed | reviewed | unchanged |
| `staking`, `escrow`, `vesting`, `paywall`, `erc20`, `swap-orderbook`, `crosschain`, `bridge`, `ai`, `imported` | experimental | experimental | see section 7 |

Golden files: only the stamp line changed, in 20 files (factory 4, ERC-721 4, MultiSend 12). The maturity test checks every claim against the repository.

## 4. Mutation check

`tests/mutation-check.py` now has 27 mutations (17 before, 10 new): undoing checks-effects-interactions in `mint`, removing its
`nonReentrant`, removing each of the three new events, letting `createPair` create a second pair for the same tokens, letting a DAO
proposal execute twice, letting an account vote twice, accepting a token without code in MultiSend, and removing the gas cap of its
native payments. A Foundry mutation only counts when a test fails (a broken build does not). Result: **uncaught mutations: 0**.

## 5. Playground without anvil (D)

`tests/playground.mjs` used to print "anvil not found: playground tests skipped" and exit 0. With `REQUIRE_ANVIL=1` it now exits 1;
without it, it still skips locally with a clearer message. Checked three ways (no anvil / no variable: exit 0; no anvil / variable:
exit 1; anvil present: 55 passed). `ci/workflows/ci.yml` sets the variable on the `npm test` step. **`.github/workflows/` does not
exist in the repository, so the file that changed is `ci/workflows/ci.yml`; copy it to `.github/workflows/ci.yml` for it to take effect.**

## 6. Slither: re-evaluation (E)

Baseline before this phase (37 -> 35 files; phase 3): High 20, Medium 27, Low 114, Informational 51, Optimization 105.
After (87 sources, 37 distinct files; the new files are the one- and five-token NFT variants): **High 20 (20 triaged), Medium 23 (23 triaged),
Low 98, Informational 51, Optimization 115**. No entry is stale, no new High or Medium finding. The Medium count drops by the five NFT reentrancy
findings and the Low count drops with the three missing-event findings and the NFT's `reentrancy-benign`.

### Critical assessment of the triage (23 entries)

| Entries | Verdict | Notes |
|---|---|---|
| `arbitrary-send-erc20` escrow `fund` | **Solid** | `fund` requires `msg.sender == buyer` and pulls from the buyer |
| `arbitrary-send-eth` MultiSend `multiSendNative` | **Solid** | the caller's own `msg.value`; the contract holds nothing (proved by the invariants) |
| `arbitrary-send-eth` smart wallet `_call` | **Weak assumption** | the wallet's purpose; but session keys are limited by a *denylist* of known token-moving selectors plus an allow-list the owner writes. If the owner allow-lists a contract that can move the wallet's assets through a function the list does not know, a session key can too. The reason now says so (`smart-wallet-review.md` has the detail) |
| `reentrancy-balance` and `incorrect-equality` in the pool, pair, order book `createOrder`, vault `_deposit` (12 entries) | **Solid** | the balance reads are the point (they reject fee-on-transfer tokens) and every external entry point that moves tokens is `nonReentrant`; share transfers do not call out |
| `divide-before-multiply` `addLiquidity` (pool, pair) | **Mostly solid, imprecise before** | rounding only costs the depositor and the fuzz tests and invariants show no free value, but the old reason said "below one unit", which is not proved. Rewritten |
| `divide-before-multiply` `fillOrder` (order book) | **Thin evidence** | the order book is experimental and only has a unit test for "a tiny fill is never free", no fuzz of the rounding. Rewritten to say so |
| `incorrect-equality` `ret.length == 0` (vault `_call`, treasury `_callToken`) | **Solid** | not a balance comparison |
| `reentrancy-no-eth` staking `stake` | **Solid but not enough to promote** | `stake` is `nonReentrant`; staking has no fuzz suite |

Weaknesses of the mechanism itself:
- An entry is keyed by detector + contract (+ function), **not by the code**. If a later change to the same function introduced a real problem of
  the same kind, the entry would keep hiding it. Pinning each entry to a hash of the function or the file would fix that (future work).
- Entries that rest on "the token is trusted" would be weak; after the NFT fix none of the 23 does.
- Contract names collide (the order book is generated as `ArcSwapAMM`), so some entries rely on the function name to stay specific.

### Low and Informational findings worth fixing later (not fixed)
- `reentrancy-events` (11 places): events emitted after external calls (CCTP V1 form, MultiSend native, treasury deposits and payments): the
  order of logs can mislead monitoring. Emit before the call.
- `unindexed-event-address` (escrow, factory `PairCreated`): token addresses are not indexed, so a client cannot filter pairs by token.
- `missing-zero-check` (treasury constructor): the gas-token alias is allowed to be zero on purpose; fine, but document it in the NatSpec.
- `calls-loop`, `timestamp`, `low-level-calls`, `assembly`, `too-many-digits`: by design.
- `return-bomb` (MultiSend native): mitigated by the gas cap and tested.
- `constable-states` / `immutable-states` (about 25): gas savings only.

## 7. What is missing to promote each remaining template

| Template | Missing |
|---|---|
| `dao` | admin rotation or a way to give up the veto; a non-zero voting period check; a getter for proposal data; then re-run `dao-review.md`. Suite requirement is already met |
| `staking` | fuzz and invariants for reward accounting (accrued rewards are conserved, claims never exceed the pool, unstake never depends on rewards); a review section |
| `escrow` | state-machine invariants (funded once, released or refunded once, funds conserved); the deadline-from-funding behaviour as a fuzz test; a review section |
| `vesting` | fuzz that vested is monotonic and never above the total, releases never above vested, the cliff; funding only by the funder; a review section |
| `paywall` (subscription) | fuzz for `accessUntil` arithmetic and `subscribeAtMost`; the missing event on `setBeneficiary`; a review section |
| `erc20` | everything: no review document of its own and no suite (supply, cap, burn, allowance invariants) |
| `swap-orderbook` | fuzz of the rounding and fee; invariants (custody equals the open orders); a review section |
| `crosschain` (CCTP V1 form) | legacy form, no review and no suite; reviewing or retiring it |
| `bridge` (CCTP V2 helper) | unit tests exist; needs a review document and a decision on burns to blocked recipients (not recoverable) |
| `ai`, `imported` | never: their origin cannot be checked |

## 8. Out of scope / new findings (not fixed)

| Severity | Where | Finding | Suggestion |
|---|---|---|---|
| Low | NFT `setBaseURI` | no event | emit `BaseURIUpdated` |
| Low | Subscription `setBeneficiary` | no event | emit `BeneficiaryUpdated(old, new)` |
| Info | NFT `transferFrom` / `approve` checks | `msg.sender == getApproved(id)` is true for `address(0)` when nothing is approved; no transaction can have that sender, so it is not reachable on a real chain | none needed; a fuzz run with another seed reported it as a test artefact and the test now skips it |
| High (design) | DAO | permanent, non-replaceable admin veto (finding 3 of `dao-review.md`) | see section 7 |
| Low | DAO | zero voting period accepted; no getter for tallies and proposal data | see section 7 |
| Medium (design) | Smart wallet | session-key protection is a denylist | allow-list by target and selector (`smart-wallet-review.md`) |
| Medium | Slither triage | entries keyed by name, not by code | pin to a hash |
| Info | CI | the workflows live in `ci/workflows/` until copied to `.github/workflows/` | copy them (`ci/README.md`) |
| Info | Tests | the mutation script leaves generated sources mutated; fixed here by regenerating them at the end | done |

## 9. Decisões que precisam da minha validação

1. **The DAO stays experimental** because I count finding 3 (permanent single-key veto) as relevant. You listed the DAO as a likely promotion; if you consider
   the guardian a documented design choice, promotion is a one-line change in `maturity.js` plus the tables, but the label would then say "reviewed" for a
   contract whose admin can never be replaced.
2. **The AMM factory is reviewed** although a dishonest token can hurt its own pair (design of any permissionless AMM). The level reason says so.
3. **NFT and MultiSend are reviewed.** You asked only for the DAO and the factory as candidates and "if there is energy" for the NFT and MultiSend; the rule was met,
   so I promoted them. Say if you want them back to experimental.
4. **My definition of "relevant"** (in `docs/mainnet-gate.md`).
5. **Fuzz and invariant settings** (256 / 64 x 100) are a compromise for CI time.
6. **The weakest triage reasons** were rewritten, not removed; the smart wallet one still depends on the owner's discipline.
7. **`ci/workflows/ci.yml` must be copied to `.github/workflows/ci.yml`** (and the other two, if not done yet) for `REQUIRE_ANVIL=1` to apply.
