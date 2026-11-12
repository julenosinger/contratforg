# Treasury, DAO and Vault generators: review and fixes

Reviewed at the deepest level in three rounds (the round cap). Findings are about the contracts the generators produce.

## Treasury
| Found | Fix |
| --- | --- |
| One signer could create a stream to themselves, already fully vested, and drain the treasury | Stream creation is now a proposal that needs the normal threshold (`proposeStream`) |
| Streams promised money without reserving it, and normal payments could spend it | Stream totals are reserved per asset; payments and new streams can only use unreserved funds |
| Native USDC and the USDC ERC-20 on Arc are the same money but were tracked separately | The ERC-20 address of the gas token (`gasTokenAlias`) is refused for payments and streams; use the native currency. It is a constructor argument in the portable modes |
| No way to replace a lost or compromised signer | `proposeReplaceSigner`, threshold-approved. Approvals from a replaced signer stop counting |
| A stream to an unpayable recipient locked its funds forever | `proposeCloseStream`: the vested, unpaid part goes to an address the signers choose and the rest is released |
| Duplicate or zero signers, tokens that return nothing | Rejected in the constructor; token calls accept tokens with no return value |

## DAO
| Found | Fix |
| --- | --- |
| Proposal threshold used the live balance, so borrowed tokens could open proposals | It now needs voting power held in the previous block |
| Queued proposals could be executed forever | 14 day execution window; later they are `Expired` |

Still true: the admin can cancel any proposal (a guardian key), only "for" votes count towards quorum, and a holder who buys and delegates tokens before the voting snapshot can still vote (no vote escrow).

## Vault
| Found | Fix |
| --- | --- |
| First depositor could inflate the share price and take later deposits | Virtual shares (1e12 per asset unit) |
| Performance fee was charged on principal for later depositors | Each holder's cost basis is tracked; the fee applies to the gain only |
| No slippage protection | `depositWithMin`, `redeemWithMin` |
| A blocked fee address could block every profitable withdrawal | Fees accrue and are collected with `claimFees()`; two-step `transferOwnership` / `acceptOwnership` |
| The "stake in external pool" strategy never generated any code | Removed. Yield is manual: assets sent to the vault raise the share price |

## Tests
`tests/solidity/test/Hardening.t.sol` (Foundry, with fuzzing) covers each fix. Run `npm run test:portable` in `tests/`.

## Second pass: the remaining generators

| Contract | Found | Fix |
| --- | --- | --- |
| Staking | An underfunded reward pool erased earned rewards when a position changed, and a reward-payment failure could block withdrawing principal; small exits avoided the fee | Rewards accrue into a per-user balance and are paid as the pool allows; `unstake` never pays rewards; fees round up and are collected with `claimFees()`; fee-on-transfer and no-return tokens handled |
| Smart wallet | An owner signature (ERC-1271) was valid on every wallet of that owner; session keys could reach token transfers through other entry points (ERC-777 `send`, ERC-1363, `multicall`, vault `withdraw`) of an allowlisted contract | The owner signs `replaySafeHash(hash)`, which binds the wallet address and chain id; those entry points are blocked too, and the documentation now says plainly that this is a list of known selectors: never allowlist token contracts; cancelling an ownership transfer emits an event |
| NFT | Not a complete ERC-721 (no safe transfers, no operator approvals, no ERC-165, transfers to the zero address, self-approvals) | Full ERC-721 + metadata + ERC-2981 interface ids; reverts for unknown tokens, the zero address and self-approvals |
| Escrow | The refund timeout started at deployment, so a late deposit could be refunded at once | The timeout starts when the buyer funds |
| Vesting | Anyone could fund; vesting started at deployment | Only the deployer funds, and vesting starts at funding |
| Subscription | The owner could raise the price just before a payment | `subscribeAtMost(maxPrice)`; the beneficiary cannot be the zero address |
| MultiSend | The contract held the tokens during the batch; a token address without a contract looked like a successful batch; a gas-burning native recipient could use up the whole transaction | Tokens go straight from the sender to each recipient; the token must be a contract; each native payment gets at most 200,000 gas (`NATIVE_TRANSFER_GAS`) |
| Order book | Tiny partial fills avoided the protocol fee | The fee rounds up |
| ERC-20 | The owner could mint to the zero address | Refused |
| CCTP bridge | USDC burned for a recipient blocked on the destination chain cannot be recovered | Documented in the contract |

Known limits (by design): token addresses and parties are the values you enter, so check them before deploying; the order-book and
multisend contracts assume plain tokens such as USDC; the bridge only burns, the mint on the other chain is completed with Circle's attestation.

## Phase 4 (2026-11-04): ERC-721 and MultiSend reviewed for promotion

Both templates now have a dedicated Foundry suite with fuzz tests and invariants, so they were reviewed against the rule in
`docs/mainnet-gate.md`. This is an internal review, not an audit by a third party.

### ERC-721 collection (`erc721`, `ArcOriginals`)
- **Reviewed:** the full contract (mint, approvals, operators, safe transfers, ERC-165 and ERC-2981, price and base URI setters), the
  second-pass review, and `tests/solidity/test/Nft.t.sol` (supply stops at `MAX_SUPPLY`, ids are sequential, transfers need the
  owner, the approved address or an operator, approvals are cleared by transfers, safe transfers check the receiver, no self-approval
  or transfer to zero, ERC-165 ids; invariants over a five-token collection and a second one with a payment token that calls `mint()` back).
- **Findings:** `mint` paid before updating state and had no guard (**fixed in phase 4**: checks-effects-interactions plus `nonReentrant`,
  tested red then green); `setMintPrice` emitted no event (**fixed in phase 4**); `setBaseURI` still emits no event (**open, Low**);
  the default base URI is an example domain that the owner must replace (**by design**, documented in the form).
- **Residual risks:** the contract is hand-written, not OpenZeppelin; the owner is the deployer and cannot be rotated; royalties are
  only signalled (ERC-2981), not enforced; the payment token is trusted to behave like USDC.
- **Decision:** nothing relevant is open, suite requirement met: **reviewed**.

### MultiSend (`multisend`, `ArcMultiSend`)
- **Reviewed:** the token and native batch functions, the gas cap per native payment, the refund of change, and
  `tests/solidity/test/Multisend.t.sol` (fuzzed conservation of value for token and native batches, atomicity, limits, a rejecting
  recipient, a gas-burning recipient, a re-entering recipient; invariants that the contract never holds funds and that the total held
  by the sender, the contract and the recipients never changes).
- **Findings:** tokens were pulled into the contract first (**fixed earlier**: each payment goes straight from the sender); a
  non-contract token silently "succeeded" and a gas-burning recipient could consume the transaction (**fixed earlier**: code check and
  `NATIVE_TRANSFER_GAS`); the batch is atomic, so one failing recipient reverts everything (**by design**, documented).
- **Residual risks:** a recipient that needs more than 200,000 gas to receive native currency cannot be paid; fee-on-transfer tokens
  deliver less than listed; native currency forced into the contract by other means stays there; scale differs between native
  (18 decimals) and USDC (6) on Arc.
- **Decision:** nothing relevant is open, suite requirement met: **reviewed**.

### NFT owner rotation (phase 5, 2026-11-04)
Decision: the NFT is kept at `reviewed` **because the same weakness that kept the DAO experimental is now fixed here too**, not because it is
acceptable here. The owner receives every mint payment and the royalties and sets the price and the base URI; a key that could never be
replaced would mean a lost key freezes the price and a compromised key cannot be contained. `ArcOriginals` now has
`transferOwnership` / `acceptOwnership` (two steps; a pending owner has no powers; never the zero address; events
`OwnershipTransferStarted` and `OwnershipTransferred`). There is deliberately no renounce: the owner is also the payee, so a zero owner
would burn every payment. Tests: `Phase5Nft.t.sol` (three unit tests that failed against the previous output, and a fuzz test).
The other generated contracts with a fixed owner (subscription, ERC-20, staking) have the same weakness; they are experimental and it is listed in `docs/phase5.md`.

## Phase 7 (2026-11-10): ERC-20, subscription, staking and CCTP V1 — owner rotation + fuzz

The four templates that still had a fixed owner (recorded in `docs/phase5.md` section 4) now get the same two-step rotation
as the NFT (`pendingOwner`; `transferOwnership(newOwner)` onlyOwner; `acceptOwnership()`; `cancelOwnershipTransfer()`; events
`OwnershipTransferStarted`/`OwnershipTransferred`/`OwnershipTransferCancelled`; the new owner cannot be zero, the current owner or the
contract). ABI changes are additive only. Each one is reviewed against the `mainnet-gate.md` rule.

### ERC-20 (`erc20`, `ArcDollar`) — promoted to `reviewed`
- **Reviewed:** the owner role (mint; burn is public self-burn), the cap and the initial supply. The rotation plus an irreversible
  `renounceOwnership()` (sets the owner to zero and clears any pending owner, so minting stops and the supply is fixed; a pending owner
  can never act, and no one can mint after a renounce). `tests/solidity/test/Erc20.t.sol` — unit, fuzz and invariants (the sum of balances
  always equals `totalSupply`, and the owner never becomes zero without a renounce).
- **Findings (all fixed here):** a fixed, non-rotatable owner (a lost key would freeze minting; a compromised key could mint past the cap)
  — fixed by the rotation and the renounce.
- **Residual risks:** the owner can still mint up to the cap while it holds the role; `cap` and the initial supply are fixed at generation;
  `renounceOwnership()` is irreversible. These are documented limits, not findings.

### Subscription (`paywall`, `ArcSubscription`) — promoted to `reviewed`
- **Reviewed:** the owner role (`setPrice`/`setBeneficiary`), with the beneficiary kept as a separate address the owner configures.
  `tests/solidity/test/Paywall.t.sol` — unit, fuzz and invariants (access never shrinks on renewal, the beneficiary is never zero, and
  `setPrice` protects the payer via `subscribeAtMost`).
- **Findings (all fixed here):** a fixed, non-rotatable owner — fixed by the rotation.
- **Residual risks:** the beneficiary is a single address set by the owner (not a multisig); the token is trusted to behave like USDC.

### Staking (`staking`, `ArcStaking`) — promoted to `reviewed`
- **Reviewed:** the owner role (`fundRewardPool`/`claimFees`) becomes rotatable without changing the economy. The `owner` was `immutable`
  and is now a normal slot; the reward pool, the fee accounting and the staking math are untouched.
  `tests/solidity/test/Staking.t.sol` — unit, fuzz and invariants (the contract's token balance always covers the outstanding principal
  plus the reward pool, and a reward claim never pays more than the pool). `Rest.t.sol` keeps the existing economy tests (an underfunded
  pool keeps the debt; a full withdrawal does not erase rewards; a top-up keeps earlier rewards; the exit fee rounds up and is collected
  separately; a fee-on-transfer and a no-return token are credited correctly).
- **Findings (all fixed here):** a fixed, immutable owner — fixed by the rotation.
- **Residual risks:** the APY, lock period and exit fee are fixed at generation; the reward pool is only as full as the owner funds it.

### CCTP V1 (`crosschain`) — stays `experimental`
- **Reviewed:** the owner role (used only in `markResolved`) is now rotatable; `tests/solidity/test/Crosschain.t.sol` has unit and rotation
  tests. The CCTP addresses are hard-coded in the source, so the messenger/transmitter are not mocked and the burn/mint path is not
  exercised in Foundry.
- **Why it stays experimental:** the rule needs a dedicated Foundry suite **with fuzz or invariant tests**, and the V1 form has no
  meaningful on-chain state to fuzz (its state is the `pendingBurns`/escrow arrays, which only grow through calls that hit the hard-coded
  CCTP contracts). It is also the legacy form — the V2 bridge (`bridge`) is the current path. Recorded as experimental with this exact reason.

