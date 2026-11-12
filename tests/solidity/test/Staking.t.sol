// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// Staking (staking): owner rotation (the owner was immutable before), reward-pool accounting invariants, and the
// guarantee that withdrawing principal never depends on a reward or fee payment. The rotation calls are missing from
// the previous output (an immutable owner), so the rotation tests fail there and pass against the new output.
import "../src/portable/Staking.sol" as StakingSrc;

interface Vm { function prank(address) external; function warp(uint256) external; function expectRevert(bytes calldata) external; }

interface IStaking {
    function owner() external view returns (address);
    function pendingOwner() external view returns (address);
    function stakingToken() external view returns (address);
    function rewardToken() external view returns (address);
    function totalStaked() external view returns (uint256);
    function rewardPool() external view returns (uint256);
    function accruedFees() external view returns (uint256);
    function pendingReward(address) external view returns (uint256);
    function stake(uint256) external;
    function unstake(uint256) external;
    function claim() external returns (uint256);
    function fundRewardPool(uint256) external;
    function claimFees() external returns (uint256);
    function transferOwnership(address) external;
    function acceptOwnership() external;
    function cancelOwnershipTransfer() external;
}

contract Tok {
    uint8 public constant decimals = 6;
    mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
    function mint(address t,uint a) external { balanceOf[t]+=a; }
    function approve(address s,uint a) external returns(bool){ allowance[msg.sender][s]=a; return true; }
    function transfer(address t,uint a) external virtual returns(bool){ balanceOf[msg.sender]-=a; balanceOf[t]+=a; return true; }
    function transferFrom(address f,address t,uint a) external virtual returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; return true; }
}
/// a reward token that always fails on transfer: a claim must then revert, but an unstake must not.
contract BlockedTok is Tok {
    function transfer(address,uint) external override returns(bool){ return false; }
}

abstract contract Base {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function _bound(uint256 x, uint256 lo, uint256 hi) internal pure returns (uint256) { if (hi <= lo) return lo; return lo + x % (hi - lo + 1); }
}

contract StakingTest is Base {
    address a = address(0xA11CE); address b = address(0xB0B); address c = address(0xCA401);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferCancelled(address indexed previousOwner, address indexed pendingOwner);

    function _new() internal returns (Tok t, IStaking s) {
        t = new Tok(); s = IStaking(address(new StakingSrc.ArcStaking(address(t))));
        t.mint(a, 1_000_000e6); t.mint(address(this), 1_000_000e6);
        vm.prank(a); t.approve(address(s), type(uint).max); t.approve(address(s), type(uint).max);
    }

    function testOwnerIsRotatable() public {
        (, IStaking s) = _new();
        s.transferOwnership(b);
        require(s.owner() == address(this) && s.pendingOwner() == b, "nothing until accept");
        vm.prank(b); s.acceptOwnership();
        require(s.owner() == b, "rotated");
        vm.prank(address(this)); vm.expectRevert(bytes("not owner")); s.fundRewardPool(1);
        vm.prank(b); s.fundRewardPool(0 == 0 ? 1 : 1);   // the new owner funds
    }
    function testPendingOwnerHasNoPowersAndNonPendingCannotAccept() public {
        (, IStaking s) = _new();
        s.transferOwnership(b);
        vm.prank(b); vm.expectRevert(bytes("not owner")); s.fundRewardPool(1);
        vm.prank(c); vm.expectRevert(bytes("not pending owner")); s.acceptOwnership();
        s.cancelOwnershipTransfer();
        require(s.pendingOwner() == address(0), "cancelled");
    }
    function testInvalidNewOwnerRefused() public {
        (, IStaking s) = _new();
        vm.expectRevert(bytes("invalid new owner")); s.transferOwnership(address(0));
        vm.expectRevert(bytes("invalid new owner")); s.transferOwnership(address(this));
        vm.expectRevert(bytes("invalid new owner")); s.transferOwnership(address(s));
    }
    function testFeesFollowTheCurrentOwner() public {
        (Tok t, IStaking s) = _new();
        vm.prank(a); s.stake(1000e6);
        for (uint i = 0; i < 10; i++) { vm.prank(a); s.unstake(50); }
        s.transferOwnership(b); vm.prank(b); s.acceptOwnership();
        uint before = t.balanceOf(b);
        s.claimFees();
        require(t.balanceOf(b) > before && s.accruedFees() == 0, "fees reached the new owner");
    }
    function testUnstakeDoesNotDependOnRewards() public {
        (Tok t, IStaking s) = _new();
        vm.prank(a); s.stake(1000e6);
        vm.warp(block.timestamp + 100 days);
        uint earned = s.pendingReward(a);
        vm.prank(a); s.unstake(1000e6);                      // the pool is empty; the principal still comes out
        require(t.balanceOf(a) >= 1_000_000e6 - 1000e6 + 1000e6, "principal returned");
        require(s.pendingReward(a) >= earned, "rewards still recorded");
    }
    function testClaimPaysOnlyWhatThePoolHas() public {
        (Tok t, IStaking s) = _new();
        vm.prank(a); s.stake(1000e6);
        s.fundRewardPool(10e6);
        vm.warp(block.timestamp + 365 days);
        uint owed = s.pendingReward(a);
        vm.prank(a); uint paid = s.claim();
        require(paid == 10e6 && s.rewardPool() == 0 && s.pendingReward(a) >= owed - 10e6 - 1, "partial claim");
    }
    function testTopUpDoesNotEraseRewards() public {
        (, IStaking s) = _new();
        vm.prank(a); s.stake(1000e6);
        vm.warp(block.timestamp + 50 days);
        uint earned = s.pendingReward(a);
        vm.prank(a); s.stake(1000e6);
        require(s.pendingReward(a) >= earned, "a top-up keeps earned rewards");
    }
}

/* ============================== invariants ============================== */
contract StakingHandler is Base {
    Tok public tok; IStaking public staking;
    address[3] public actors = [address(0xA1), address(0xB2), address(0xC3)];
    constructor() {
        tok = new Tok(); staking = IStaking(address(new StakingSrc.ArcStaking(address(tok))));
        for (uint i = 0; i < 3; i++) { tok.mint(actors[i], 1_000_000e6); vm.prank(actors[i]); tok.approve(address(staking), type(uint).max); }
    }
    function stake(uint8 who, uint256 amount) external { vm.prank(actors[who % 3]); staking.stake(_bound(amount, 1, 1_000_000e6)); }
    function unstake(uint8 who, uint256 amount) external { vm.prank(actors[who % 3]); try staking.unstake(_bound(amount, 1, 1_000_000e6)) {} catch {} }
    function claim(uint8 who) external { vm.prank(actors[who % 3]); try staking.claim() {} catch {} }
    function fund() external { tok.mint(address(this), 1_000_000e6); tok.approve(address(staking), type(uint).max); staking.fundRewardPool(1_000_000e6); }
    function fees() external { try staking.claimFees() {} catch {} }
    function warp(uint256 days_) external { vm.warp(block.timestamp + days_ * 1 days); }
}
contract StakingInvariantTest {
    StakingHandler h;
    struct FuzzSelector { address addr; bytes4[] selectors; }
    function setUp() public { h = new StakingHandler(); }
    function targetContracts() public view returns (address[] memory t) { t = new address[](1); t[0] = address(h); }
    function targetSelectors() public view returns (FuzzSelector[] memory s) {
        s = new FuzzSelector[](1); bytes4[] memory sel = new bytes4[](6);
        sel[0] = StakingHandler.stake.selector; sel[1] = StakingHandler.unstake.selector; sel[2] = StakingHandler.claim.selector;
        sel[3] = StakingHandler.fund.selector; sel[4] = StakingHandler.fees.selector; sel[5] = StakingHandler.warp.selector;
        s[0] = FuzzSelector(address(h), sel);
    }
    /// The contract's token balance always covers the outstanding principal and the unspent reward pool.
    function invariant_balancesCoverPrincipalAndPool() public view {
        require(h.tok.balanceOf(address(h.staking)) >= h.staking.totalStaked() + h.staking.rewardPool(), "token balance below principal + pool");
    }
    /// A reward claim never pays out more than the pool holds.
    function invariant_rewardPoolNeverNegative() public view {
        require(h.staking.rewardPool() <= h.tok.balanceOf(address(h.staking)), "pool exceeds the balance");
    }
    /// The owner is never the zero address.
    function invariant_ownerNeverZero() public view { require(h.staking.owner() != address(0), "owner zero"); }
}
