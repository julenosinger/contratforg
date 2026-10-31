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
