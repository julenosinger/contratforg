// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "../src/portable/Staking.sol" as StakingSrc;
import "../src/portable/Escrow.sol" as EscrowSrc;
import "../src/portable/Vesting.sol" as VestingSrc;
import "../src/portable/Paywall.sol" as PaywallSrc;
import "../src/portable/Nft.sol" as NftSrc;
import "../src/portable/Multisend.sol" as MultiSrc;

interface Vm {
    function prank(address) external;
    function warp(uint256) external;
    function expectRevert(bytes calldata) external;
}
contract Tok {
    uint8 public constant decimals = 6;
    mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
    function mint(address t,uint a) external { balanceOf[t]+=a; }
    function approve(address s,uint a) external returns(bool){ allowance[msg.sender][s]=a; return true; }
    function transfer(address t,uint a) external virtual returns(bool){ balanceOf[msg.sender]-=a; balanceOf[t]+=a; return true; }
    function transferFrom(address f,address t,uint a) external virtual returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; return true; }
}
contract NoRetTok {
    uint8 public constant decimals = 6;
    mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
    function mint(address t,uint a) external { balanceOf[t]+=a; }
    function approve(address s,uint a) external { allowance[msg.sender][s]=a; }
    function transfer(address t,uint a) external { balanceOf[msg.sender]-=a; balanceOf[t]+=a; }
    function transferFrom(address f,address t,uint a) external { allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; }
}
contract FeeTok is Tok {
    function transferFrom(address f,address t,uint a) external override returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a - a/10; return true; }
}
contract BlockTok is Tok {
    address public blocked;
    function setBlocked(address a) external { blocked = a; }
    function transferFrom(address f,address t,uint a) external override returns(bool){ require(t != blocked, "blocked"); allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; return true; }
}
contract Receiver { function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) { return 0x150b7a02; } }
contract NotReceiver { }

contract RestTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address alice = address(0xA11CE); address bob = address(0xB0B);

    /* ---------------- staking ---------------- */
    function _staking() internal returns (Tok t, StakingSrc.ArcStaking s) {
        t = new Tok(); s = new StakingSrc.ArcStaking(address(t));
        t.mint(alice, 10_000e6); t.mint(address(this), 10_000e6);
        vm.prank(alice); t.approve(address(s), type(uint).max);
        t.approve(address(s), type(uint).max);
    }
    function testStakingUnderfundedPoolKeepsTheDebt() public {
        (Tok t, StakingSrc.ArcStaking s) = _staking();
        vm.prank(alice); s.stake(1000e6);
        s.fundRewardPool(10e6);
        vm.warp(block.timestamp + 365 days);
        uint owed = s.pendingReward(alice);
        require(owed >= 119e6 && owed <= 121e6, "about 12% of 1000 after a year");
        vm.prank(alice); uint paid = s.claim();
        require(paid == 10e6 && s.rewardPool() == 0, "pays what the pool has");
        require(s.pendingReward(alice) >= owed - 10e6 - 1, "the rest is still owed");
        s.fundRewardPool(500e6);
        vm.prank(alice); uint paid2 = s.claim();
        require(paid + paid2 >= owed - 1 && paid + paid2 <= owed + 1e6, "and is paid once the pool is topped up");
        t; // silence
    }
    function testStakingFullWithdrawalDoesNotEraseRewards() public {
        (, StakingSrc.ArcStaking s) = _staking();
        vm.prank(alice); s.stake(1000e6);
        vm.warp(block.timestamp + 100 days);
        uint before = s.pendingReward(alice);
        vm.prank(alice); s.unstake(1000e6);                  // no reward pool at all: principal still comes out
        (uint amt,,, ) = s.positions(alice);
        require(amt == 0, "stake is gone");
        require(s.pendingReward(alice) >= before, "but the earned rewards are still recorded");
        s.fundRewardPool(1000e6);
        vm.prank(alice); require(s.claim() >= before, "and can be claimed later");
    }
    function testStakingTopUpKeepsEarlierRewards() public {
        (, StakingSrc.ArcStaking s) = _staking();
        vm.prank(alice); s.stake(1000e6);
        vm.warp(block.timestamp + 50 days);
        uint earned = s.pendingReward(alice);
        vm.prank(alice); s.stake(1000e6);
        require(s.pendingReward(alice) >= earned, "a top-up does not reset earned rewards");
    }
    function testStakingExitFeeRoundsUpAndIsCollectedSeparately() public {
        (Tok t, StakingSrc.ArcStaking s) = _staking();
        vm.prank(alice); s.stake(1000e6);
        uint fees;
        for (uint i = 0; i < 10; i++) { vm.prank(alice); s.unstake(50); fees = s.accruedFees(); }   // tiny early exits
        require(fees >= 10, "every small early exit pays at least 1 unit (no way around the fee)");
        uint beforeOwner = t.balanceOf(s.owner());
        s.claimFees();
        require(t.balanceOf(s.owner()) == beforeOwner + fees && s.accruedFees() == 0, "fees reach the owner on claim");
        vm.warp(block.timestamp + 31 days);
        vm.prank(alice); s.unstake(100e6);
        require(s.accruedFees() == 0, "no fee after the lock period");
    }
    function testStakingCreditsOnlyWhatArrives() public {
        FeeTok t = new FeeTok(); StakingSrc.ArcStaking s = new StakingSrc.ArcStaking(address(t));
        t.mint(alice, 1000e6); vm.prank(alice); t.approve(address(s), type(uint).max);
        vm.prank(alice); s.stake(1000e6);
        require(s.totalStaked() == 900e6, "a fee-on-transfer token is credited with the received amount");
    }
    function testStakingNoReturnTokenWorks() public {
        NoRetTok t = new NoRetTok(); StakingSrc.ArcStaking s = new StakingSrc.ArcStaking(address(t));
        t.mint(alice, 1000e6); vm.prank(alice); t.approve(address(s), type(uint).max);
        vm.prank(alice); s.stake(1000e6);
        vm.warp(block.timestamp + 31 days);
        vm.prank(alice); s.unstake(1000e6);
        require(t.balanceOf(alice) == 1000e6, "USDT-style tokens work");
    }

    /* ---------------- escrow ---------------- */
    function testEscrowTimeoutStartsAtFunding() public {
        Tok t = new Tok(); EscrowSrc.ArcEscrow e = new EscrowSrc.ArcEscrow(address(t));
        require(e.deadline() == 0, "no deadline before funding");
        vm.warp(block.timestamp + 400 days);                 // funded long after deployment
        address buyer = e.buyer();
        t.mint(buyer, 1000e6); vm.prank(buyer); t.approve(address(e), type(uint).max);
        vm.prank(buyer); e.fund();
        require(e.deadline() == block.timestamp + 14 days, "the timeout counts from funding");
        vm.expectRevert(bytes("not authorized / not expired")); e.resolveToBuyer();     // a stranger cannot refund early
        vm.warp(block.timestamp + 14 days + 1);
        e.resolveToBuyer();                                   // after the timeout anyone can trigger the refund
        require(t.balanceOf(buyer) == 1000e6, "refunded to the buyer");
    }

    /* ---------------- vesting ---------------- */
    function testVestingOnlyTheFunderFundsAndVestingStartsAtFunding() public {
        Tok t = new Tok(); VestingSrc.ArcVesting v = new VestingSrc.ArcVesting(address(t));
        address funder = v.funder();
        t.mint(funder, 1_000_000e6); t.mint(bob, 1_000_000e6);
        vm.prank(funder); t.approve(address(v), type(uint).max);
        vm.prank(bob); t.approve(address(v), type(uint).max);
        vm.prank(bob); vm.expectRevert(bytes("only funder")); v.fund();
        vm.warp(block.timestamp + 400 days);                  // funding happens late
        vm.prank(funder); v.fund();
        require(v.vestedAmount() == 0, "nothing is vested at the moment of funding, even if deployment was long ago");
        vm.warp(block.timestamp + 365 days);
        require(v.vestedAmount() == v.totalAmount(), "fully vested one period after funding");
    }

    /* ---------------- subscription ---------------- */
    function testSubscriptionPriceProtectionAndBeneficiary() public {
        Tok t = new Tok(); PaywallSrc.ArcSubscription p = new PaywallSrc.ArcSubscription(address(t));
        t.mint(alice, 1000e6); vm.prank(alice); t.approve(address(p), type(uint).max);
        uint price = p.pricePerPeriod();
        address o = p.owner();
        vm.prank(o); p.setPrice(price * 100);                 // the owner raises the price
        vm.prank(alice); vm.expectRevert(bytes("price too high")); p.subscribeAtMost(price);
        require(t.balanceOf(alice) == 1000e6, "nothing was charged");
        vm.prank(alice); p.subscribeAtMost(price * 100);
        require(p.isActive(alice), "subscribed at the price she accepted");
        vm.prank(o); vm.expectRevert(bytes("zero beneficiary")); p.setBeneficiary(address(0));
    }

    /* ---------------- nft ---------------- */
    function testNftIsAFullErc721() public {
        Tok t = new Tok(); NftSrc.ArcOriginals n = new NftSrc.ArcOriginals(address(t));
        t.mint(alice, 1000e6); vm.prank(alice); t.approve(address(n), type(uint).max);
        require(n.supportsInterface(0x01ffc9a7) && n.supportsInterface(0x80ac58cd) && n.supportsInterface(0x5b5e139f) && n.supportsInterface(0x2a55205a), "ERC-165 for 721, metadata, 2981");
        require(!n.supportsInterface(0xffffffff), "and nothing else");
        vm.prank(alice); uint id = n.mint();
        require(n.ownerOf(id) == alice, "owner");
        vm.expectRevert(bytes("nonexistent token")); n.ownerOf(999);
        vm.prank(alice); vm.expectRevert(bytes("transfer to zero address")); n.transferFrom(alice, address(0), id);
        vm.prank(alice); vm.expectRevert(bytes("approve to caller")); n.setApprovalForAll(alice, true);
        vm.prank(alice); vm.expectRevert(bytes("approval to current owner")); n.approve(alice, id);
        vm.prank(bob); vm.expectRevert(bytes("not token owner")); n.approve(bob, id);
        vm.prank(alice); n.setApprovalForAll(bob, true);
        require(n.isApprovedForAll(alice, bob), "operator approval");
        vm.prank(bob); n.transferFrom(alice, bob, id);        // an operator can move it
        require(n.ownerOf(id) == bob && n.balanceOf(alice) == 0 && n.balanceOf(bob) == 1, "moved");
        Receiver r = new Receiver(); NotReceiver nr = new NotReceiver();
        vm.prank(bob); n.safeTransferFrom(bob, address(r), id);
        require(n.ownerOf(id) == address(r), "safe transfer to a receiver contract works");
    }
    function testNftSafeTransferRefusesNonReceivers() public {
        Tok t = new Tok(); NftSrc.ArcOriginals n = new NftSrc.ArcOriginals(address(t));
        t.mint(alice, 1000e6); vm.prank(alice); t.approve(address(n), type(uint).max);
        vm.prank(alice); uint id = n.mint();
        NotReceiver nr = new NotReceiver();
        vm.prank(alice); vm.expectRevert(bytes("")); n.safeTransferFrom(alice, address(nr), id);
        require(n.ownerOf(id) == alice, "the token stayed with the owner");
        vm.prank(alice); n.transferFrom(alice, address(nr), id);   // a plain transfer is still allowed (ERC-721)
    }

    /* ---------------- multisend ---------------- */
    function _batch(uint n, uint each) internal pure returns (address[] memory r, uint[] memory a) {
        r = new address[](n); a = new uint[](n);
        for (uint i; i < n; i++) { r[i] = address(uint160(0x1000 + i)); a[i] = each; }
    }
    function testMultisendNeverHoldsTheTokens() public {
        Tok t = new Tok(); MultiSrc.ArcMultiSend m = new MultiSrc.ArcMultiSend();
        t.mint(alice, 1000e6); vm.prank(alice); t.approve(address(m), type(uint).max);
        (address[] memory r, uint[] memory a) = _batch(5, 10e6);
        vm.prank(alice); m.multiSendToken(address(t), r, a);
        require(t.balanceOf(address(m)) == 0, "the contract holds nothing");
        require(t.balanceOf(r[4]) == 10e6 && t.balanceOf(alice) == 950e6, "each recipient is paid by the sender directly");
    }
    function testMultisendFeeOnTransferCannotTouchOtherBalances() public {
        FeeTok t = new FeeTok(); MultiSrc.ArcMultiSend m = new MultiSrc.ArcMultiSend();
        t.mint(address(m), 777e6);                            // someone left tokens in the contract
        t.mint(alice, 1000e6); vm.prank(alice); t.approve(address(m), type(uint).max);
        (address[] memory r, uint[] memory a) = _batch(3, 10e6);
        vm.prank(alice); m.multiSendToken(address(t), r, a);
        require(t.balanceOf(address(m)) == 777e6, "balances already in the contract are never used");
        require(t.balanceOf(r[0]) == 9e6, "recipients simply receive what the token delivers");
    }
    function testMultisendNoReturnTokenAndBlockedRecipient() public {
        NoRetTok n = new NoRetTok(); MultiSrc.ArcMultiSend m = new MultiSrc.ArcMultiSend();
        n.mint(alice, 100e6); vm.prank(alice); n.approve(address(m), type(uint).max);
        (address[] memory r, uint[] memory a) = _batch(2, 1e6);
        vm.prank(alice); m.multiSendToken(address(n), r, a);
        require(n.balanceOf(r[1]) == 1e6, "USDT-style token works");
        BlockTok b = new BlockTok(); b.mint(alice, 100e6); vm.prank(alice); b.approve(address(m), type(uint).max);
        b.setBlocked(r[1]);
        vm.prank(alice); vm.expectRevert(bytes("transferFrom failed")); m.multiSendToken(address(b), r, a);
        require(b.balanceOf(alice) == 100e6 && b.balanceOf(r[0]) == 0, "one failing recipient reverts the whole batch");
        (address[] memory big, uint[] memory ba) = _batch(201, 1);
        vm.prank(alice); vm.expectRevert(bytes("too many recipients")); m.multiSendToken(address(b), big, ba);
    }
}
