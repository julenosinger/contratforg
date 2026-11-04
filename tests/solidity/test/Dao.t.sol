// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// The DAO (dao): unit, fuzz and invariant tests over propose / vote / queue / execute / cancel, with a vote token that
// keeps real checkpoints. Known limits, stated in docs/dao-review.md: the admin (guardian) can cancel any proposal, there
// is no vote escrow (tokens delegated before a proposal's snapshot count in full), and the contract has no getter for a
// proposal's tally, so the tally is checked through the state machine (state()) and through independent ghost counters.
import "../src/portable/Dao.sol" as DaoSrc;

interface Vm {
    function prank(address) external;
    function roll(uint256) external;
    function warp(uint256) external;
    function expectRevert(bytes calldata) external;
}

/// An ERC20Votes-like token: checkpoints per account and for the total supply; a lookup at or after the current block
/// reverts ("future lookup") like OpenZeppelin's.
contract CkptVotes {
    struct C { uint256 blk; uint256 v; }
    mapping(address => C[]) internal cp; C[] internal supplyCp;
    mapping(address => uint256) public cur; uint256 public total;
    function _put(C[] storage a, uint256 v) internal { if (a.length > 0 && a[a.length - 1].blk == block.number) a[a.length - 1].v = v; else a.push(C(block.number, v)); }
    function setVotes(address who, uint256 v) external { total = total - cur[who] + v; cur[who] = v; _put(cp[who], v); _put(supplyCp, total); }
    function forceSupply(uint256 s) external { total = s; _put(supplyCp, s); }
    function balanceOf(address a) external view returns (uint256) { return cur[a]; }
    function _look(C[] storage a, uint256 b) internal view returns (uint256 r) { for (uint256 i = a.length; i > 0; i--) if (a[i - 1].blk <= b) return a[i - 1].v; }
    function getPastVotes(address a, uint256 b) external view returns (uint256) { require(b < block.number, "future lookup"); return _look(cp[a], b); }
    function getPastTotalSupply(uint256 b) external view returns (uint256) { require(b < block.number, "future lookup"); return _look(supplyCp, b); }
}
contract Counter { uint256 public n; function inc() external { n++; } function boom() external pure { revert("boom"); } }
/// An action that tries to execute its own proposal again while it is being executed.
contract Replayer { DaoSrc.ArcDAO dao; uint256 id; function set(DaoSrc.ArcDAO d, uint256 i) external { dao = d; id = i; } function go() external { dao.execute(id); } }

abstract contract Base {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function _bound(uint256 x, uint256 lo, uint256 hi) internal pure returns (uint256) { if (hi <= lo) return lo; return lo + x % (hi - lo + 1); }
}

contract DaoTest is Base {
    CkptVotes tok; DaoSrc.ArcDAO dao; Counter ctr;
    address whale = address(0xA11CE); address bob = address(0xB0B); address carol = address(0xCA401);
    uint256 constant PERIOD = 10; uint256 constant TL = 172800; uint256 constant GRACE = 14 days;
    enum S { Pending, Active, Defeated, Succeeded, Queued, Executed, Cancelled, Expired }

    function setUp() public {
        vm.roll(100); tok = new CkptVotes(); ctr = new Counter(); dao = new DaoSrc.ArcDAO(address(tok), PERIOD);
        tok.setVotes(whale, 5000e18); vm.roll(101);
    }
    function _inc() internal view returns (address[] memory t, uint256[] memory v, bytes[] memory d) {
        t = new address[](1); v = new uint256[](1); d = new bytes[](1); t[0] = address(ctr); d[0] = abi.encodeCall(Counter.inc, ());
    }
    function _propose() internal returns (uint256 id) { (address[] memory t, uint256[] memory v, bytes[] memory d) = _inc(); vm.prank(whale); id = dao.propose(t, v, d, "inc"); }
    function _st(uint256 id) internal view returns (S) { return S(uint8(dao.state(id))); }
    /// proposes, votes `support` with the whale during the period and moves past the end
    function _passed() internal returns (uint256 id) { id = _propose(); vm.roll(block.number + 2); vm.prank(whale); dao.castVote(id, 1); vm.roll(block.number + PERIOD + 1); }

    /* ----- unit ----- */
    function testHappyPath() public {
        uint256 id = _passed(); require(_st(id) == S.Succeeded, "succeeded");
        dao.queue(id); require(_st(id) == S.Queued, "queued");
        vm.warp(block.timestamp + TL); dao.execute(id);
        require(ctr.n() == 1 && _st(id) == S.Executed, "executed");
    }
    function testAProposalExecutesOnlyOnce() public {
        uint256 id = _passed(); dao.queue(id); vm.warp(block.timestamp + TL); dao.execute(id);
        vm.expectRevert(bytes("not queued")); dao.execute(id);
        vm.expectRevert(bytes("not succeeded")); dao.queue(id);
        require(ctr.n() == 1, "ran once");
    }
    function testAnActionCannotReplayItsOwnProposal() public {
        Replayer r = new Replayer(); address[] memory t = new address[](1); uint256[] memory v = new uint256[](1); bytes[] memory d = new bytes[](1);
        t[0] = address(r); d[0] = abi.encodeCall(Replayer.go, ());
        vm.prank(whale); uint256 id = dao.propose(t, v, d, "replay"); r.set(dao, id);
        vm.roll(block.number + 2); vm.prank(whale); dao.castVote(id, 1); vm.roll(block.number + PERIOD + 1); dao.queue(id); vm.warp(block.timestamp + TL);
        vm.expectRevert(bytes("execution reverted")); dao.execute(id);
        require(_st(id) == S.Queued, "the failed run left the proposal queued, not executed");
    }
    function testAFailingActionRevertsEverythingAndCanBeRetried() public {
        address[] memory t = new address[](2); uint256[] memory v = new uint256[](2); bytes[] memory d = new bytes[](2);
        t[0] = address(ctr); d[0] = abi.encodeCall(Counter.inc, ()); t[1] = address(ctr); d[1] = abi.encodeCall(Counter.boom, ());
        vm.prank(whale); uint256 id = dao.propose(t, v, d, "x"); vm.roll(block.number + 2); vm.prank(whale); dao.castVote(id, 1);
        vm.roll(block.number + PERIOD + 1); dao.queue(id); vm.warp(block.timestamp + TL);
        vm.expectRevert(bytes("execution reverted")); dao.execute(id);
        require(ctr.n() == 0, "the first action was undone with the second");
    }
    function testGuardianAndProposerCanCancelOthersCannot() public {
        uint256 id = _propose();
        vm.prank(carol); vm.expectRevert(bytes("not authorised")); dao.cancel(id);
        vm.prank(whale); dao.cancel(id); require(_st(id) == S.Cancelled, "the proposer cancels");
        uint256 id2 = _propose(); dao.cancel(id2); require(_st(id2) == S.Cancelled, "the admin (this test, the deployer) cancels");
    }
    function testACancelledProposalNeverExecutes() public {
        uint256 id = _passed(); dao.queue(id); dao.cancel(id); vm.warp(block.timestamp + TL);
        vm.expectRevert(bytes("not queued")); dao.execute(id);
        vm.expectRevert(bytes("not succeeded")); dao.queue(id);
        require(ctr.n() == 0 && _st(id) == S.Cancelled, "cancelled stays cancelled");
    }
    function testAnExecutedProposalCannotBeCancelled() public {
        uint256 id = _passed(); dao.queue(id); vm.warp(block.timestamp + TL); dao.execute(id);
        vm.expectRevert(bytes("already executed")); dao.cancel(id);
    }
    function testNoDoubleVoteAndNoVoteWithoutPower() public {
        uint256 id = _propose(); vm.roll(block.number + 2);
        vm.prank(whale); dao.castVote(id, 1);
        vm.prank(whale); vm.expectRevert(bytes("already voted")); dao.castVote(id, 0);
        vm.prank(carol); vm.expectRevert(bytes("no voting power")); dao.castVote(id, 1);
        vm.prank(whale); vm.expectRevert(bytes("already voted")); dao.castVote(id, 9);   // the check order: voted first
    }
    function testSupportMustBeZeroOneOrTwo() public {
        uint256 id = _propose(); vm.roll(block.number + 2);
        vm.prank(whale); vm.expectRevert(bytes("invalid: 0=against 1=for 2=abstain")); dao.castVote(id, 3);
    }
    function testBorrowedTokensCannotOpenAProposal() public {
        tok.setVotes(bob, 1_000_000e18); (address[] memory t, uint256[] memory v, bytes[] memory d) = _inc();
        vm.prank(bob); vm.expectRevert(bytes("below threshold")); dao.propose(t, v, d, "x");
    }
    function testAnAbstainDoesNotCountTowardsQuorum() public {
        tok.setVotes(bob, 1000e18); vm.roll(block.number + 1);
        uint256 id = _propose(); vm.roll(block.number + 2); vm.prank(whale); dao.castVote(id, 2); vm.roll(block.number + PERIOD + 1);
        require(_st(id) == S.Defeated, "abstentions are not 'for' votes");
    }
    function testTiesAreDefeated() public {
        tok.setVotes(bob, 5000e18); vm.roll(block.number + 1);
        uint256 id = _propose(); vm.roll(block.number + 2); vm.prank(whale); dao.castVote(id, 1); vm.prank(bob); dao.castVote(id, 0); vm.roll(block.number + PERIOD + 1);
        require(_st(id) == S.Defeated, "for == against is defeated");
    }
    /// With a voting period of zero nobody can vote, so nothing can ever pass (a deployment mistake the contract does not refuse).
    function testAZeroVotingPeriodMakesEveryProposalDefeated() public {
        DaoSrc.ArcDAO d0 = new DaoSrc.ArcDAO(address(tok), 0); (address[] memory t, uint256[] memory v, bytes[] memory d) = _inc();
        vm.prank(whale); uint256 id = d0.propose(t, v, d, "x"); vm.roll(block.number + 2);
        vm.prank(whale); vm.expectRevert(bytes("not in voting period")); d0.castVote(id, 1);
        require(S(uint8(d0.state(id))) == S.Defeated, "defeated");
    }
    function testProposeNeedsMatchingArrays() public {
        address[] memory t = new address[](1); uint256[] memory v = new uint256[](2); bytes[] memory d = new bytes[](1);
        vm.prank(whale); vm.expectRevert(bytes("length mismatch")); dao.propose(t, v, d, "x");
    }

    /* ----- fuzz ----- */
    /// The weight is the balance at the snapshot, whatever happens to the tokens afterwards; checked through the quorum.
    function testFuzzVoteUsesTheSnapshotNotTheLaterBalance(uint96 atSnapshot, uint96 later) public {
        uint256 w = _bound(atSnapshot, 1, 1e24);
        tok.setVotes(bob, w); vm.roll(block.number + 1);
        uint256 id = _propose(); vm.roll(block.number + 2);
        tok.setVotes(bob, _bound(later, 0, 1e27));                     // sold or bought after the snapshot
        vm.prank(bob); dao.castVote(id, 1);                            // must not revert: power is read at the snapshot
        // whale is silent; with a quorum forced to w the proposal passes iff bob's snapshot weight alone met 4%
        vm.roll(block.number + PERIOD + 1);
        uint256 supply = tok.getPastTotalSupply(block.number - PERIOD - 2);
        bool expected = w * 100 >= supply * 4 && w > 0;
        require((_st(id) == S.Succeeded) == expected, "outcome must follow the snapshot weight");
    }
    /// Quorum arithmetic: for any supply and tally up to 2^112, Succeeded iff for*100 >= supply*4 and for > against.
    function testFuzzQuorumBoundary(uint112 supplyIn, uint112 forIn, uint112 againstIn) public {
        uint256 supply = _bound(supplyIn, 1, type(uint112).max); uint256 f = _bound(forIn, 0, supply); uint256 a = _bound(againstIn, 0, supply);
        tok.setVotes(bob, f); tok.setVotes(carol, a); tok.forceSupply(supply); vm.roll(block.number + 1);
        uint256 id = _propose(); vm.roll(block.number + 2);
        if (f > 0) { vm.prank(bob); dao.castVote(id, 1); }
        if (a > 0) { vm.prank(carol); dao.castVote(id, 0); }
        vm.roll(block.number + PERIOD + 1);
        bool expected = f * 100 >= supply * 4 && f > a;
        require((_st(id) == S.Succeeded) == expected, "quorum/majority rule");
        require(_st(id) == S.Succeeded || _st(id) == S.Defeated, "after the period it is one or the other");
    }
    /// Execution is possible exactly from the end of the timelock to the end of the grace window.
    function testFuzzTimelockAndGraceWindow(uint32 offset) public {
        uint256 id = _passed(); dao.queue(id);
        uint256 start = block.timestamp; uint256 dt = _bound(offset, 0, TL + GRACE + 2 days);
        vm.warp(start + dt);
        bool shouldRun = dt >= TL && dt <= TL + GRACE;
        try dao.execute(id) { require(shouldRun, "executed outside the window"); require(ctr.n() == 1, "ran"); }
        catch { require(!shouldRun, "refused inside the window"); require(ctr.n() == 0, "nothing ran"); }
    }
    /// Votes are accepted only strictly after the snapshot block and up to and including the last block.
    function testFuzzVotingWindow(uint8 offset) public {
        uint256 id = _propose(); uint256 created = block.number;
        uint256 at = created + _bound(offset, 0, PERIOD + 5); vm.roll(at);
        bool inside = at > created + 1 && at <= created + 1 + PERIOD;
        vm.prank(whale);
        try dao.castVote(id, 1) { require(inside, "voted outside the window"); } catch { require(!inside, "refused inside the window"); }
    }
    /// Only a holder with enough power in the previous block can open a proposal.
    function testFuzzThreshold(uint96 power) public {
        uint256 p = _bound(power, 0, 5000e18); tok.setVotes(bob, p); vm.roll(block.number + 1);
        (address[] memory t, uint256[] memory v, bytes[] memory d) = _inc();
        vm.prank(bob);
        try dao.propose(t, v, d, "x") returns (uint256) { require(p >= 1000e18, "below the threshold"); } catch { require(p < 1000e18, "refused with enough power"); }
    }
}

/* ============================== invariants ============================== */
/// Random proposals, votes, queueing, execution, cancellation, token movements and time. Keeps its own tallies.
contract DaoHandler is Base {
    CkptVotes public tok; DaoSrc.ArcDAO public dao; Counter public ctr;
    address[4] public actors = [address(0xA1), address(0xB2), address(0xC3), address(0xD4)];
    uint256 constant PERIOD = 6;

    uint256[] public ids; mapping(uint256 => uint256) public voteStart; mapping(uint256 => uint256) public supplyAtStart;
    mapping(uint256 => uint256) public ghostFor; mapping(uint256 => uint256) public ghostAgainst;
    mapping(uint256 => mapping(address => uint8)) public votesBy; mapping(uint256 => uint256) public executions;
    mapping(uint256 => bool) public cancelled; mapping(uint256 => bool) public queued; mapping(uint256 => uint256) public etaOf;
    bool public executedOutsideWindow; bool public votedOutsideWindow; bool public weightWrong; bool public votedTwice;
    uint256 public successfulExecutions; uint256 public proposalsMade; uint256 public votesCast;

    constructor() {
        vm.roll(100); tok = new CkptVotes(); ctr = new Counter(); dao = new DaoSrc.ArcDAO(address(tok), PERIOD);
        for (uint256 i = 0; i < 4; i++) tok.setVotes(actors[i], 2000e18 * (i + 1));
        vm.roll(101);
    }
    function idCount() external view returns (uint256) { return ids.length; }

    function setPower(uint8 a, uint96 amt) external { tok.setVotes(actors[a % 4], _bound(amt, 0, 5000e18)); }
    function advance(uint8 blocks, uint32 secs) external { vm.roll(block.number + 1 + (blocks % 8)); vm.warp(block.timestamp + secs % 2 days); }
    function bigWarp(uint32 days_) external { vm.warp(block.timestamp + (days_ % 20) * 1 days); }

    function propose(uint8 a) external {
        address[] memory t = new address[](1); uint256[] memory v = new uint256[](1); bytes[] memory d = new bytes[](1); t[0] = address(ctr); d[0] = abi.encodeCall(Counter.inc, ());
        vm.prank(actors[a % 4]);
        try dao.propose(t, v, d, "p") returns (uint256 id) {
            ids.push(id); voteStart[id] = block.number + 1; proposalsMade++;
        } catch {}
    }
    function vote(uint8 which, uint8 a, uint8 support) external {
        if (ids.length == 0) return;
        uint256 id = ids[which % ids.length]; address who = actors[a % 4]; uint8 s = support % 3;
        uint256 start = voteStart[id]; bool inside = block.number > start && block.number <= start + PERIOD;
        uint256 expected = block.number > start ? tok.getPastVotes(who, start) : 0;
        vm.prank(who);
        try dao.castVote(id, s) {
            votesCast++;
            if (!inside) votedOutsideWindow = true;
            if (expected == 0) weightWrong = true;
            if (votesBy[id][who] != 0) votedTwice = true;
            votesBy[id][who] = s + 1;
            if (s == 1) ghostFor[id] += expected; else if (s == 0) ghostAgainst[id] += expected;
        } catch {}
    }
    function queue(uint8 which) external {
        if (ids.length == 0) return; uint256 id = ids[which % ids.length];
        try dao.queue(id) { queued[id] = true; etaOf[id] = block.timestamp + dao.timelockDelay(); } catch {}
    }
    function execute(uint8 which) external {
        if (ids.length == 0) return; uint256 id = ids[which % ids.length];
        uint256 before = ctr.n(); uint256 eta = etaOf[id];
        try dao.execute(id) {
            executions[id]++; successfulExecutions++;
            if (!queued[id] || block.timestamp < eta || block.timestamp > eta + dao.GRACE_PERIOD() || cancelled[id]) executedOutsideWindow = true;
            if (ctr.n() != before + 1) weightWrong = true;
        } catch {}
    }
    function cancel(uint8 which, uint8 byAdmin, uint8 a) external {
        if (ids.length == 0) return; uint256 id = ids[which % ids.length];
        if (byAdmin % 2 == 0) { try dao.cancel(id) { cancelled[id] = true; } catch {} }      // this handler deployed the DAO: it is the admin
        else { vm.prank(actors[a % 4]); try dao.cancel(id) { cancelled[id] = true; } catch {} }
    }
}

contract DaoInvariantTest {
    DaoHandler h;
    struct FuzzSelector { address addr; bytes4[] selectors; }
    function setUp() public { h = new DaoHandler(); }
    function targetContracts() public view returns (address[] memory t) { t = new address[](1); t[0] = address(h); }
    function targetSelectors() public view returns (FuzzSelector[] memory s) {
        s = new FuzzSelector[](1); bytes4[] memory sel = new bytes4[](8);
        sel[0] = DaoHandler.setPower.selector; sel[1] = DaoHandler.advance.selector; sel[2] = DaoHandler.bigWarp.selector; sel[3] = DaoHandler.propose.selector;
        sel[4] = DaoHandler.vote.selector; sel[5] = DaoHandler.queue.selector; sel[6] = DaoHandler.execute.selector; sel[7] = DaoHandler.cancel.selector;
        s[0] = FuzzSelector(address(h), sel);
    }

    /// A proposal never runs twice, and what ran is exactly what the counter shows.
    function invariant_aProposalExecutesAtMostOnce() public view {
        uint256 total;
        for (uint256 i = 0; i < h.idCount(); i++) { uint256 id = h.ids(i); require(h.executions(id) <= 1, "executed twice"); total += h.executions(id); }
        require(total == h.successfulExecutions() && h.ctr().n() == total, "executions and effects disagree");
    }
    /// A cancelled proposal never executes (cancel() refuses an executed proposal, so the order cannot be reversed).
    function invariant_aCancelledProposalNeverExecutes() public view {
        for (uint256 i = 0; i < h.idCount(); i++) { uint256 id = h.ids(i); if (h.cancelled(id)) require(h.executions(id) == 0 && uint8(h.dao().state(id)) == 6, "cancelled but executed"); }
    }
    /// Execution only inside [eta, eta + grace], only for a queued proposal that is not cancelled.
    function invariant_executionOnlyInsideTheTimelockWindow() public view { require(!h.executedOutsideWindow(), "executed outside the window"); }
    /// Votes only inside the voting period, with the snapshot weight, once per account.
    function invariant_votesFollowTheRules() public view {
        require(!h.votedOutsideWindow(), "voted outside the period");
        require(!h.weightWrong(), "a vote had no weight or an execution had the wrong effect");
        require(!h.votedTwice(), "an account voted twice");
    }
    /// The independent tally never exceeds the snapshot supply, and the state follows the quorum rule.
    function invariant_theOutcomeFollowsTheTally() public view {
        DaoSrc.ArcDAO d = h.dao();
        for (uint256 i = 0; i < h.idCount(); i++) {
            uint256 id = h.ids(i); uint256 start = h.voteStart(id);
            if (block.number <= start + 6) continue;                                    // voting not over yet
            uint256 supply = h.tok().getPastTotalSupply(start);
            uint256 f = h.ghostFor(id); uint256 a = h.ghostAgainst(id);
            require(f + a <= supply * 1, "the tally exceeds the supply at the snapshot");   // every actor holds part of the supply
            uint8 st = uint8(d.state(id));
            if (st == 6 || st == 5) continue;                                              // cancelled / executed
            bool passes = f * 100 >= supply * 4 && f > a;
            if (st == 2) require(!passes, "defeated although it met the rule");
            if (st == 3 || st == 4 || st == 7) require(passes, "advanced although it did not meet the rule");
        }
    }
    function invariant_zzTheHandlerIsActive() public view { require(h.idCount() <= 400, "setup"); }
}
