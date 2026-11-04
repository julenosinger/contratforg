# DAO generator review (phase 4)

Status as of 2026-11-04. Scope: the contract produced by the DAO option (`dao`), in single-network and portable mode. This
is an internal review, not an audit by a third party.

## What the contract does
Token-weighted governance with a vote token that keeps checkpoints (ERC20Votes style). Proposing needs voting power held in the
previous block above a threshold; voting weight is the power at the snapshot block; a proposal needs 4% of the snapshot supply in
*for* votes and more *for* than *against*; a successful proposal is queued behind a timelock and can be executed during a 14-day
grace window; the admin can cancel any proposal that has not been executed.

## Reviewed
The code was read in full, reviewed twice by the security reviewers in the first and second passes
(`docs/generators-review.md`), and is now covered by `tests/solidity/test/Dao.t.sol` (14 unit tests, 5 fuzz tests, 5 invariants
(plus one sanity check) over a handler with four accounts: propose, vote, queue, execute, cancel, token movements, time). The suite checks: a proposal
executes at most once and its effect matches; a cancelled proposal never executes; execution only inside [timelock, timelock + 14
days]; votes only inside the voting period, with the snapshot weight and once per account; the outcome follows an independent
tally and the tally never exceeds the snapshot supply; the quorum rule is exact for supplies up to 2^112; an action cannot replay its
own proposal; a failing action reverts all actions and the proposal can be retried. Reachability probes confirmed that the handler
reaches votes, queueing, execution, cancellation, defeat and expiry.

## Findings
| # | Finding | Severity | State |
|---|---|---|---|
| 1 | Proposal threshold used the live balance (flash-borrowed tokens could open proposals) | High | Fixed (power in the previous block) |
| 2 | A queued proposal never expired | Medium | Fixed (14-day grace window, state `Expired`) |
| 3 | **The admin can cancel any proposal and can never be changed or removed.** One key (the deployer) keeps a veto over every proposal for the life of the contract; if it is compromised it can censor all governance forever, and if it is lost the veto cannot be given up. Proposals cannot change it because the contract has no way to call itself on the admin | High for a contract called a DAO (liveness and censorship, not theft) | **Open** |
| 4 | The constructor accepts a voting period of 0, which makes every proposal impossible to vote on and therefore always defeated | Low (deployment mistake) | Open (test documents it) |
| 5 | No getter for a proposal's tally, targets or description (only events and `state()`), which makes monitoring and front ends depend on logs | Low | Open |
| 6 | Quorum counts *for* votes only and abstentions do not count | Info | By design, documented |
| 7 | No vote escrow: tokens that are delegated before the snapshot count in full, so a holder can vote with borrowed tokens that stay through the snapshot block | Medium (design) | Open, by design |
| 8 | Slither: `calls-loop`, `timestamp`, `low-level-calls` in `execute` | Info | Reported only, by design |

## Residual risks
The vote token is trusted (a token with a broken checkpoint can break voting); proposal actions run with the DAO's authority;
execution failure of any action fails the whole proposal.

## Decision on the level
**`dao` stays `experimental`.** The rule in `docs/mainnet-gate.md` needs "no relevant finding still open". Finding 3 is relevant: it
defeats the purpose of a DAO (a single permanent key can veto everything and cannot be rotated or renounced), and the generator
could remove it. Finding 7 is a design limit shared with plain Governor-style contracts. Findings 4 and 5 are small. The suite
requirement is now met; the open-finding requirement is not.

What would make it promotable: let the admin be replaced or give up the veto (for example `renounceAdmin()` and admin rotation
through governance), refuse a zero voting period in the constructor, add a getter for proposal data, and re-run this review.
