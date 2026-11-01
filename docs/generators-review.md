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
| MultiSend | The contract held the tokens during the batch | Tokens go straight from the sender to each recipient |
| Order book | Tiny partial fills avoided the protocol fee | The fee rounds up |
| ERC-20 | The owner could mint to the zero address | Refused |
| CCTP bridge | USDC burned for a recipient blocked on the destination chain cannot be recovered | Documented in the contract |

Known limits (by design): token addresses and parties are the values you enter, so check them before deploying; the order-book and
multisend contracts assume plain tokens such as USDC; the bridge only burns, the mint on the other chain is completed with Circle's attestation.
