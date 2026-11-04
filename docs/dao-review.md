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
| 3 | The admin could cancel any proposal and could never be changed or removed (one permanent veto key) | High (design) | **Fixed in phase 5 (2026-11-04)**: `transferAdmin` / `acceptAdmin` (two steps, a pending admin has no powers, never to zero) and an irreversible `renounceAdmin()`; after a renounce only a proposal's own proposer can cancel. Tests: unit + invariants (the admin changes only through the two steps; never zero without a renounce; after a renounce nothing is vetoable). The guardian role itself remains while an admin exists: it is now a choice the operator can end |
| 4 | The constructor accepted a voting period of 0 (every proposal impossible to vote on) | Low | **Fixed in phase 5**: `require(VOTING_PERIOD >= 1)`; the generator and the form also refuse it |
| 5 | No getter for a proposal's tally, actions or description | Low | **Fixed in phase 5**: `proposalCore`, `proposalVotes`, `proposalActions`, `proposalDescription`, `hasVoted` (additive ABI change) |
| 6 | Quorum counts *for* votes only and abstentions do not count | Info | By design, documented |
| 7 | No vote escrow: tokens that are delegated before the snapshot count in full, so a holder can vote with borrowed tokens that stay through the snapshot block | Medium (design) | Open, by design |
| 8 | Slither: `calls-loop`, `timestamp`, `low-level-calls` in `execute` | Info | Reported only, by design |

## Residual risks
The vote token is trusted (a token with a broken checkpoint can break voting); proposal actions run with the DAO's authority;
execution failure of any action fails the whole proposal.

## Decision on the level (updated 2026-11-04, phase 5)
**`dao` is promoted to `reviewed`.** The rule in `docs/mainnet-gate.md` needs a review document, a dedicated suite with fuzz or invariant tests,
and no relevant finding still open. Findings 3, 4 and 5 are fixed and tested (the previous reason for keeping it experimental was exactly
finding 3). What stays open does not defeat the purpose of the contract for someone using it as documented: finding 7 (no vote escrow) is a
design limit shared with plain Governor-style contracts, finding 6 is by design, and while an admin exists it is a guardian who can veto;
the operator can end that with `renounceAdmin()` or hand it to a multisig with the two-step transfer. The label means "reviewed
internally, NOT audited", and the level reason says that the default deployment keeps a guardian key.

ABI change (additive): new functions `transferAdmin`, `acceptAdmin`, `renounceAdmin`, `pendingAdmin`, `proposalCore`, `proposalVotes`,
`proposalActions`, `proposalDescription`, `hasVoted`; new events `AdminTransferStarted`, `AdminTransferred`, `AdminRenounced`; the constructor now
reverts for a voting period of 0. Existing functions and events keep their signatures; contracts already deployed are not affected.
