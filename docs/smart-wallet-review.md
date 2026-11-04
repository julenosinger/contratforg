# Smart Wallet generator: review and fixes

Scope: `genSimpleSmartWallet` (menu: Smart wallet). Other templates were not touched.
Tests: `tests/solidity/test/SmartWallet.t.sol` (single and portable builds, with fuzzing), `tests/golden/*/simple-smartwallet.sol`.

## Decision on ERC-4337 (5 lines)
1. The old template said "ERC-4337" but had no `validateUserOp`, so an EntryPoint could never use it.
2. The default EntryPoint (v0.6) could not be confirmed on the target chains: this work ran without network access, and the repository only says "check it exists".
3. I did not invent addresses or ship an interface nobody can call.
4. The template is now "Smart Wallet (guardian recovery)": every mention of ERC-4337, the `entryPoint` role, the form field and the constructor argument were removed (UI, wizard, contract, docs).
5. If you later confirm an EntryPoint on Arc, `validateUserOp` can be added as a separate change (it needs its own tests).

## Found (Encontrado) and Fix (Correção)

| Found | Fix |
| --- | --- |
| `executeBatch` ignored the daily limit, so a session key could drain the wallet | `execute` and `executeBatch` share one limit. A batch is charged the sum of its values; anything that fails reverts the whole batch. The owner is not limited. |
| The limit only covered native value; a session key could `approve` / `transfer` tokens and call anything | Every session key has an allowlist of contracts it may call (at most 16), can never call the wallet itself, and can never call token `transfer`, `transferFrom`, `approve`, `increaseAllowance`, `permit`, `setApprovalForAll` or NFT `safeTransferFrom` (blocked by selector, even on allowlisted targets). Calls with 1 to 3 bytes of data are refused. |
| Daily bucket by calendar day allowed twice the limit around midnight | Token bucket: the limit refills evenly over 24 hours, so there is no double spend at the day change (tested). |
| Session keys could be set for any length, to any address, and survived an owner change | At most 30 days (and the form's maximum, default 24 h); a key cannot be zero, the owner, the guardian, the pending owner, the recovery candidate or the wallet; keys of the old owner stop working after recovery or an ownership change. Adding a key again replaces its allowlist (no stale permissions). |
| The owner could not veto a recovery; `setGuardian` left a pending recovery alive | `cancelRecovery` (owner and guardian). `executeRecovery` needs a recovery that was started, not cancelled, past its delay, by the guardian that is still in place. `setGuardian` and a completed ownership transfer cancel any pending recovery. Only one recovery at a time. |
| Fixed 2 day recovery delay | `recoveryDelay`, 1 to 30 days, set at generation (default 2) and adjustable by the owner. Changing it does not move a recovery already started. |
| One-step owner change through recovery only | `transferOwnership` / `acceptOwnership` (two steps), `cancelOwnershipTransfer`. |
| Claimed ERC-4337 but did not implement it | Claim removed (see the decision above). |
| Limit written as `N * 10**6` ("USDC 6-dec") and typed in USDC | The form takes whole units of the network's gas token (label follows the network: USDC on Arc, ETH on Ethereum). It is converted with the network's native decimals (18 on Arc). Portable mode: constructor argument in the smallest native unit. The comment and the UI no longer say "6 decimals". |
| No reentrancy guard, `require` strings, unchecked revert data | `nonReentrant` on `execute` / `executeBatch`, custom errors, low-level calls that pass the target's revert reason through, calls with data to a non-contract refused. |
| No input checks in the constructor | Guardian must not be zero or the deployer; limit must fit in 128 bits; delay 1 to 30 days. The generator also refuses an empty or malformed guardian. |
| No ERC-1271, no NFT support, `receive` was silent | `isValidSignature` for the owner (ECDSA, 65 bytes, low-`s`, `v` 27/28; session keys cannot sign), `onERC721Received`, `onERC1155Received`, `onERC1155BatchReceived`, ERC-165, and `Received` event. |
| Solidity `^0.8.24` | `pragma solidity 0.8.24` (exact), no external dependencies. |

## Tests
- 109 Foundry tests for the wallet (56 on the single build and 53 on the portable build, same suite), in a run of 175 that also covers the other templates. Fuzz: the bucket never allows more than a full bucket plus the refill, and a batch is charged exactly the sum.
- Mutation check: 8 deliberate bugs (batch without limit, no selector block, setGuardian keeping a recovery, keys surviving an owner change, session key calling the wallet, no reentrancy guard, malleable signatures, recovery without delay) were each caught by the suite.
- Slither on the generated contract: only expected notes (`arbitrary-send-eth` is the purpose of a wallet, `calls-loop` is the batch, `timestamp`, `assembly` for revert bubbling, `low-level-calls`, a long constant). In portable mode it also notes that `DAILY_LIMIT` could be immutable (gas only; it is shared with the other templates' constructor-argument helper).
- The forge suite runs offline with solc 0.8.28, so the dump scripts relax the exact pragma for it. The exact `0.8.24` build is compiled by `compile-generators.mjs` with the real 0.8.24 compiler.

## Residual risks
- The owner key has no limit: if it is stolen, everything is. Use a hardware wallet or a multisig as owner.
- The guardian can take over the wallet if the owner does not notice and cancel within the delay. Choose a guardian you trust and watch `RecoveryInitiated`. A guardian that is lost cannot be replaced by anyone but the owner.
- Session keys are only as safe as the contracts on their allowlist; the selector blocklist covers well-known token functions, not every possible transfer-like function (for example ERC-777 `send`). Keep allowlists short.
- Up to the daily limit can leave the wallet at once through a stolen session key, then refills continuously.
- USDC/EURC are issuer-controlled: the issuer can block this address, which would lock the tokens.
- No ERC-4337, no gas sponsorship, no multi-owner or social-recovery with several guardians.
- The generated contract has not been audited by an independent firm.

## Decisions that need your validation
- No ERC-4337 (conservative, see above).
- Session keys can never move tokens (instead of per-token limits).
- One shared native limit for all session keys, as a refilling bucket (instead of a calendar day or one limit per key).
- Default limit 100 whole units of the gas token (also 100 ETH on Ethereum); lower it for non-stablecoin networks.
- The guardian cannot be removed, only replaced.

## Phase 5 (2026-11-04): session keys are limited to exact (target, function) pairs

The weakness named in "Residual risks" above (the allowlist was by contract, so any function of an allowlisted contract that was not on the
blocked list was open to a session key) is fixed by changing the permission model. **This changes the ABI.**

| Before | Now |
|---|---|
| `addSessionKey(key, hours, address[] targets)` | `addSessionKey(key, hours, Permission[] permissions)` with `struct Permission { address target; bytes4 selector; }` |
| `isTargetAllowed(key, target)` | `isCallAllowed(key, target, selector)` |
| `error TargetNotAllowed(address)`, `InvalidTargets()` | `error CallNotAllowed(address target, bytes4 selector)`, `InvalidPermissions()` |
| `MAX_SESSION_TARGETS = 16` | `MAX_SESSION_PERMISSIONS = 32` |
| `SessionKeyAdded(key, expiry, address[] targets)` | `SessionKeyAdded(key, expiry, Permission[] permissions)` (`SessionKeyRevoked` unchanged) |

Rules, in the order they are checked for a session key: the key must be valid (granted, not expired, not revoked, owner unchanged); the target cannot be the
wallet; a call with data needs its first four bytes, which must not be `0x00000000` and must not be on the blocked list (**the blocked list wins**, so a
blocked function is always reported as `ForbiddenCall`); then the exact pair `(target, selector)` must have been granted. A plain native transfer
(no data) is its own permission: the pair `(target, 0x00000000)`, and it is charged to the daily limit like before. A pair whose selector is on the
blocked list is refused already when it is granted. Storage: one slot per pair (`keccak(key, target, selector) => grant version`), so granting 32 pairs
costs 32 storage writes and a check costs one read; re-granting a key, revoking it, expiry and an owner change invalidate every pair at once through
the grant version. In `executeBatch` the rule applies to every call and a refused call reverts the whole batch.

Session keys are granted after deployment, so single, portable and multi-chain builds are identical here; the Playground and the Test Lab accept
the pairs as JSON, for example `[["0xTARGET","0xa9059cbb"]]` (verified: they parse and validate `(address,bytes4)[]`).

Tests (`SmartWallet.t.sol`, run against the single and the portable build): right target with the wrong function is refused; right function on the
wrong target is refused; plain native needs its own pair; selector zero cannot call a function; the blocked list beats the allowlist (at grant and at call);
revocation and expiry remove every pair and a re-grant does not bring old pairs back; batches apply the rule per call; the event carries the pairs;
a fuzz test: whatever target, selector and bytes a key tries, a call only goes through if its exact pair was granted. Against the previous generator
output 67 of the 135 tests in that file failed (the new signature does not exist there).

Residual: a granted pair is trusted. If the owner grants a function that itself moves the wallet's tokens or ether elsewhere (for example a vault's
`withdraw` with a receiver argument), a session key can do it. The blocked list is only the second line. The level stays `reviewed`: the finding that
mattered is closed, the suite has fuzz tests, and this limit is the owner's explicit choice and is stated in the level reason.

