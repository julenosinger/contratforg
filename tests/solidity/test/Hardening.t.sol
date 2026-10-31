// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "../src/portable/Treasury.sol" as TreasurySrc;
import "../src/portable/Dao.sol" as DaoSrc;
import "../src/portable/Vault.sol" as VaultSrc;

interface Vm {
    function prank(address) external;
    function deal(address, uint256) external;
    function warp(uint256) external;
    function roll(uint256) external;
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
    function transfer(address t,uint a) external override returns(bool){ require(t != blocked, "blocked"); balanceOf[msg.sender]-=a; balanceOf[t]+=a; return true; }
}

abstract contract Base {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
}

/* ------------------------------ Treasury ------------------------------ */
contract TreasuryTest is Base {
    TreasurySrc.ArcTreasury t; address a; address b; address c;
    receive() external payable {}
    function setUp() public {
        t = new TreasurySrc.ArcTreasury(address(0));
        a = t.signerList(0); b = t.signerList(1); c = t.signerList(2);
        vm.deal(address(t), 100 ether);
    }
    function _stream(address recipient, uint total, uint start, uint dur) internal returns (uint id) {
        vm.prank(a); id = t.proposeStream(recipient, address(0), total, start, dur);
        vm.prank(b); t.approve(id);
    }
    function testSingleSignerCannotCreateOrDrainViaStream() public {
        // the old attack: one signer creates a stream to itself that is already fully vested
        vm.prank(a); uint id = t.proposeStream(a, address(0), 100 ether, 0, 1);
        require(t.streamsLength() == 0, "one approval creates nothing");
        vm.prank(a); vm.expectRevert(bytes("already approved")); t.approve(id);
        vm.expectRevert(bytes("not a signer")); t.proposeStream(a, address(0), 1, 0, 1);
        require(address(t).balance == 100 ether, "funds untouched");
        vm.prank(b); t.approve(id); // a second signer agrees, so it is a real multisig decision
        require(t.streamsLength() == 1, "created with threshold");
    }
    function testStreamsReserveFunds() public {
        uint id = _stream(address(0xBEEF), 80 ether, block.timestamp, 100);
        require(t.reserved(address(0)) == 80 ether && id == 1 || t.reserved(address(0)) == 80 ether, "reserved");
        // a payment of 50 would eat into the 80 owed to the stream
        vm.prank(a); uint p = t.propose(address(0), address(0xCAFE), 50 ether);
        vm.prank(b); vm.expectRevert(bytes("amount reserved for streams")); t.approve(p);
        require(address(0xCAFE).balance == 0, "nothing paid");
        // 20 is free, so it goes through
        vm.prank(a); uint q = t.propose(address(0), address(0xCAFE), 20 ether);
        vm.prank(b); t.approve(q);
        require(address(0xCAFE).balance == 20 ether, "free funds can be spent");
        // a second stream cannot promise money that is not there
        vm.prank(a); uint s2 = t.proposeStream(address(0xD00D), address(0), 10 ether, block.timestamp, 100);
        vm.prank(b); vm.expectRevert(bytes("not enough unreserved funds")); t.approve(s2);
    }
    function testWithdrawReleasesReservation() public {
        address r = address(0xBEEF);
        _stream(r, 80 ether, block.timestamp, 100);
        vm.warp(block.timestamp + 50);
        vm.prank(r); t.withdrawStream(0);
        require(r.balance == 40 ether && t.reserved(address(0)) == 40 ether, "half paid, half reserved");
        vm.warp(block.timestamp + 100);
        vm.prank(r); t.withdrawStream(0);
        require(r.balance == 80 ether && t.reserved(address(0)) == 0, "fully paid");
        vm.prank(address(0xBAD)); vm.expectRevert(bytes("not recipient")); t.withdrawStream(0);
    }
    function testTokenStreamAndPayment() public {
        Tok tok = new Tok(); tok.mint(address(t), 1000e6);
        vm.prank(a); uint id = t.proposeStream(address(0xBEEF), address(tok), 600e6, block.timestamp, 10);
        vm.prank(b); t.approve(id);
        vm.prank(a); uint p = t.propose(address(tok), address(0xCAFE), 500e6);
        vm.prank(b); vm.expectRevert(bytes("amount reserved for streams")); t.approve(p);
        vm.prank(a); uint q = t.propose(address(tok), address(0xCAFE), 400e6);
        vm.prank(b); t.approve(q);
        require(tok.balanceOf(address(0xCAFE)) == 400e6, "paid");
    }
    function testReplaceSignerAndStaleApprovals() public {
        address d = address(0xD1);
        vm.prank(a); uint pay = t.propose(address(0), address(0xCAFE), 10 ether); // a approves (1 of 2)
        vm.prank(b); uint rep = t.proposeReplaceSigner(a, d);                       // b approves (1 of 2)
        vm.prank(c); t.approve(rep);                                                // replaced
        require(!t.isSigner(a) && t.isSigner(d) && t.signerList(0) == d, "a replaced by d");
        require(t.approvalsOf(pay) == 0, "the removed signer's approval no longer counts");
        vm.prank(b); t.approve(pay);
        require(address(0xCAFE).balance == 0, "one valid approval is not enough");
        vm.prank(c); t.approve(pay);
        require(address(0xCAFE).balance == 10 ether, "two current signers approve");
        vm.prank(a); vm.expectRevert(bytes("not a signer")); t.propose(address(0), address(1), 1);
        vm.prank(b); vm.expectRevert(bytes("invalid new signer")); t.proposeReplaceSigner(c, d);
        vm.prank(b); vm.expectRevert(bytes("old signer unknown")); t.proposeReplaceSigner(a, address(0xE1));
    }
    function testBasicPaymentNeedsThreshold() public {
        vm.prank(a); uint p = t.propose(address(0), address(0xCAFE), 5 ether);
        require(address(0xCAFE).balance == 0, "one approval pays nothing");
        vm.prank(c); t.approve(p);
        require(address(0xCAFE).balance == 5 ether, "paid at threshold");
        vm.prank(b); vm.expectRevert(bytes("already executed")); t.approve(p);
        vm.prank(a); vm.expectRevert(bytes("zero amount")); t.propose(address(0), address(1), 0);
        vm.prank(a); vm.expectRevert(bytes("zero recipient")); t.propose(address(0), address(0), 1);
        vm.prank(a); vm.expectRevert(bytes("unknown proposal")); t.approve(999);
    }
    function testClosingAStreamFreesFundsOfAnUnpayableRecipient() public {
        Rejecter bad = new Rejecter();                                    // cannot receive native currency
        _stream(address(bad), 80 ether, block.timestamp, 100);
        vm.warp(block.timestamp + 50);
        vm.prank(address(bad)); vm.expectRevert(bytes("native transfer failed")); t.withdrawStream(0);
        require(t.reserved(address(0)) == 80 ether, "everything is stuck in reserve");
        address rescue = address(0x5C0E);
        vm.prank(a); uint id = t.proposeCloseStream(0, rescue);
        require(address(rescue).balance == 0, "one approval does nothing");
        vm.prank(b); t.approve(id);
        require(rescue.balance == 40 ether, "the vested half goes to the chosen address");
        require(t.reserved(address(0)) == 0, "nothing stays reserved");
        vm.prank(a); uint p = t.propose(address(0), address(0xCAFE), 60 ether);   // the unvested half is spendable again
        vm.prank(b); t.approve(p);
        require(address(0xCAFE).balance == 60 ether, "released funds can be used");
        vm.prank(address(bad)); vm.expectRevert(bytes("inactive stream")); t.withdrawStream(0);
        vm.prank(a); vm.expectRevert(bytes("inactive stream")); t.proposeCloseStream(0, rescue);
        vm.prank(a); vm.expectRevert(bytes("inactive stream")); t.proposeCloseStream(7, rescue);   // unknown stream
    }
    function testClosingBeforeStartReleasesEverything() public {
        _stream(address(0xBEEF), 50 ether, block.timestamp + 1000, 100);
        vm.prank(a); vm.expectRevert(bytes("zero payout address")); t.proposeCloseStream(0, address(0));
        vm.prank(a); uint id = t.proposeCloseStream(0, address(0xCAFE));
        vm.prank(b); t.approve(id);
        require(t.reserved(address(0)) == 0 && address(0xCAFE).balance == 0, "nothing vested, nothing paid, all released");
    }
    function testNoReturnTokenPayments() public {
        NoRetTok nt = new NoRetTok(); nt.mint(address(t), 100e6);
        vm.prank(a); uint p = t.propose(address(nt), address(0xCAFE), 40e6);
        vm.prank(b); t.approve(p);
        require(nt.balanceOf(address(0xCAFE)) == 40e6, "tokens that return nothing work");
    }
    function testGasTokenAliasMustUseNative() public {
        Tok usdcLike = new Tok(); usdcLike.mint(address(this), 1000e6);
        TreasurySrc.ArcTreasury t2 = new TreasurySrc.ArcTreasury(address(usdcLike)); // e.g. Arc, where the ERC-20 is the native money
        require(t2.gasTokenAlias() == address(usdcLike), "alias stored");
        vm.deal(address(t2), 10 ether);
        address s0 = t2.signerList(0);
        vm.prank(s0); vm.expectRevert(bytes("use native currency for this asset")); t2.propose(address(usdcLike), address(1), 1);
        vm.prank(s0); vm.expectRevert(bytes("use native currency for this asset")); t2.proposeStream(address(1), address(usdcLike), 1, 0, 1);
        vm.prank(s0); t2.propose(address(0), address(1), 1 ether);   // native is fine
        // other tokens are unaffected
        Tok other = new Tok(); other.mint(address(t2), 5e6);
        vm.prank(s0); t2.propose(address(other), address(1), 1e6);
    }
    function testFuzzReservedNeverExceedsOwedAndBalanceCovers(uint96 total, uint16 secs) public {
        uint tot = (uint(total) % 100 ether) + 1;
        uint dur = (uint(secs) % 1000) + 1;
        address r = address(0xBEEF);
        _stream(r, tot, block.timestamp, dur);
        vm.warp(block.timestamp + dur / 2);
        uint before = t.reserved(address(0));
        vm.prank(r); try t.withdrawStream(0) {} catch {}
        require(t.reserved(address(0)) <= before, "reservation only shrinks");
        require(address(t).balance >= t.reserved(address(0)), "balance always covers what is owed");
    }
}

/* -------------------------------- DAO --------------------------------- */
contract VotesTok {
    struct CP { uint block_; uint v; }
    mapping(address => CP[]) cps; CP[] supplyCps;
    function _push(CP[] storage a, uint v) internal { if (a.length > 0 && a[a.length-1].block_ == block.number) a[a.length-1].v = v; else a.push(CP(block.number, v)); }
    function _at(CP[] storage a, uint b) internal view returns (uint r) { for (uint i = 0; i < a.length; i++) { if (a[i].block_ <= b) r = a[i].v; else break; } }
    function setVotes(address who, uint v) external { _push(cps[who], v); uint total; _push(supplyCps, _at(supplyCps, block.number) + v); total; }
    function balanceOf(address who) external view returns (uint) { return _at(cps[who], block.number); }
    function getPastVotes(address who, uint b) external view returns (uint) { require(b < block.number, "future"); return _at(cps[who], b); }
    function getPastTotalSupply(uint b) external view returns (uint) { require(b < block.number, "future"); return _at(supplyCps, b); }
}
contract Rejecter { }
contract Counter { uint public n; function inc() external { n++; } }

contract DaoTest is Base {
    VotesTok tok; DaoSrc.ArcDAO dao; Counter ctr;
    address whale = address(0xA11CE); address other = address(0xB0B);
    function setUp() public {
        vm.roll(100);
        tok = new VotesTok(); ctr = new Counter();
        dao = new DaoSrc.ArcDAO(address(tok), 10);
        tok.setVotes(whale, 5000e18); tok.setVotes(other, 100e18);
        vm.roll(101);
    }
    function _proposal() internal view returns (address[] memory t, uint[] memory v, bytes[] memory d) {
        t = new address[](1); v = new uint[](1); d = new bytes[](1);
        t[0] = address(ctr); d[0] = abi.encodeCall(Counter.inc, ());
    }
    function testBorrowedTokensCannotPropose() public {
        address borrower = address(0xF1A5);
        tok.setVotes(borrower, 1_000_000e18);   // received in this very block (a flash loan)
        (address[] memory t, uint[] memory v, bytes[] memory d) = _proposal();
        vm.prank(borrower); vm.expectRevert(bytes("below threshold")); dao.propose(t, v, d, "x");
        vm.prank(other); vm.expectRevert(bytes("below threshold")); dao.propose(t, v, d, "x"); // 100 < 1000
        vm.prank(whale); dao.propose(t, v, d, "ok");                                           // held since earlier blocks
    }
    function testLifecycleAndExpiry() public {
        (address[] memory t, uint[] memory v, bytes[] memory d) = _proposal();
        vm.prank(whale); uint id = dao.propose(t, v, d, "inc");
        vm.roll(block.number + 2);
        vm.prank(whale); dao.castVote(id, 1);
        vm.roll(block.number + 20);
        require(uint8(dao.state(id)) == 3, "succeeded");
        dao.queue(id);
        require(uint8(dao.state(id)) == 4, "queued");
        vm.expectRevert(bytes("timelock active")); dao.execute(id);
        vm.warp(block.timestamp + 172800 + 1);
        dao.execute(id);
        require(ctr.n() == 1 && uint8(dao.state(id)) == 5, "executed");
    }
    function testQueuedProposalExpires() public {
        (address[] memory t, uint[] memory v, bytes[] memory d) = _proposal();
        vm.prank(whale); uint id = dao.propose(t, v, d, "inc");
        vm.roll(block.number + 2); vm.prank(whale); dao.castVote(id, 1);
        vm.roll(block.number + 20); dao.queue(id);
        vm.warp(block.timestamp + 172800 + 14 days + 1);
        require(uint8(dao.state(id)) == 7, "expired");
        vm.expectRevert(bytes("not queued")); dao.execute(id);
        require(ctr.n() == 0, "not executed");
    }
    function testGraceWindowIsExecutable() public {
        (address[] memory t, uint[] memory v, bytes[] memory d) = _proposal();
        vm.prank(whale); uint id = dao.propose(t, v, d, "inc");
        vm.roll(block.number + 2); vm.prank(whale); dao.castVote(id, 1);
        vm.roll(block.number + 20); dao.queue(id);
        vm.warp(block.timestamp + 172800 + 14 days);   // last second of the window
        dao.execute(id);
        require(ctr.n() == 1, "executed inside the window");
    }
}

/* ------------------------------- Vault -------------------------------- */
contract VaultTest is Base {
    Tok asset; VaultSrc.ArcYieldVault v;
    address attacker = address(0xA77); address victim = address(0x71C7); address alice = address(0xA11CE);
    function setUp() public {
        asset = new Tok(); v = new VaultSrc.ArcYieldVault(address(asset));
        address[3] memory us = [attacker, victim, alice];
        for (uint i = 0; i < 3; i++) { asset.mint(us[i], 1_000_000_000e6); vm.prank(us[i]); asset.approve(address(v), type(uint).max); }
    }
    function testInflationAttackNoLongerWorks() public {
        uint attackerStart = asset.balanceOf(attacker);
        vm.prank(attacker); v.deposit(1, attacker);
        vm.prank(attacker); asset.transfer(address(v), 1_000_000e6);       // donation to inflate the share price
        vm.prank(victim); uint shares = v.deposit(1_999_999e6, victim);
        require(shares > 1e12, "victim receives meaningful shares");
        vm.prank(victim); uint back = v.redeem(shares, victim);
        require(back >= 1_999_999e6 * 99 / 100, "victim keeps (almost) everything");
        uint aShares = v.balanceOf(attacker);
        vm.prank(attacker); v.redeem(aShares, attacker);
        require(asset.balanceOf(attacker) < attackerStart, "the attack loses money");
    }
    function testFeeOnlyOnGainNotOnPrincipal() public {
        vm.prank(alice); uint sA = v.deposit(100e6, alice);
        asset.mint(address(v), 100e6);                                      // yield doubles the share price
        vm.prank(victim); uint sB = v.deposit(200e6, victim);               // enters at the higher price
        vm.prank(victim); uint out = v.redeem(sB, victim);
        require(out >= 200e6 - 2, "no fee on principal (only rounding dust)");
        require(v.accruedFees() <= 2, "nothing earned from a fresh deposit");
        vm.prank(alice); uint outA = v.redeem(sA, alice);
        require(outA > 180e6 && outA < 200e6, "alice pays the fee on her 100 gain (about 10)");
        require(v.accruedFees() >= 9e6, "fee accrued");
        uint ownerBefore = asset.balanceOf(v.owner());
        uint claimed = v.claimFees();
        require(asset.balanceOf(v.owner()) - ownerBefore == claimed && v.accruedFees() == 0, "fee paid to the owner on claim");
        vm.expectRevert(bytes("no fees")); v.claimFees();
    }
    function testSlippageGuards() public {
        vm.prank(alice); uint s = v.deposit(100e6, alice);
        uint q = v.convertToShares(100e6);
        vm.prank(victim); vm.expectRevert(bytes("slippage exceeded")); v.depositWithMin(100e6, victim, q + 1e12);
        vm.prank(victim); v.depositWithMin(100e6, victim, q - 1);
        uint a = v.convertToAssets(s);
        vm.prank(alice); vm.expectRevert(bytes("slippage exceeded")); v.redeemWithMin(s, alice, a + 1e6);
        vm.prank(alice); v.redeemWithMin(s, alice, a - 1);
    }
    function testGuardsAndCap() public {
        vm.prank(alice); vm.expectRevert(bytes("zero deposit")); v.deposit(0, alice);
        vm.prank(alice); vm.expectRevert(bytes("zero receiver")); v.deposit(1e6, address(0));
        vm.prank(alice); vm.expectRevert(bytes("insufficient shares")); v.redeem(1, alice);
        vm.prank(alice); vm.expectRevert(bytes("not owner")); v.setDepositCap(1);
        vm.prank(v.owner()); v.setDepositCap(150e6);
        vm.prank(alice); v.deposit(100e6, alice);
        vm.prank(alice); vm.expectRevert(bytes("exceeds deposit cap")); v.deposit(100e6, alice);
    }
    function testDepositForAnotherReceiverGivesThemTheCostBasis() public {
        vm.prank(alice); v.deposit(100e6, victim);
        require(v.costBasisOf(victim) == 100e6 && v.costBasisOf(alice) == 0, "basis follows the shares");
    }
    function testFuzzDepositRedeemNeverProfits(uint64 dep, uint64 yieldAmt) public {
        uint amount = (uint(dep) % 1_000_000e6) + 1e6;
        vm.prank(alice); v.deposit(10_000e6, alice);                         // existing holder
        asset.mint(address(v), uint(yieldAmt) % 100_000e6);                  // some yield
        uint before = asset.balanceOf(victim);
        vm.prank(victim); uint s = v.deposit(amount, victim);
        vm.prank(victim); v.redeem(s, victim);
        require(asset.balanceOf(victim) <= before, "round trip never makes money");
        require(before - asset.balanceOf(victim) <= amount / 1e6 + 3, "and loses at most dust");
    }
    function testBlockedFeeRecipientCannotTrapWithdrawals() public {
        BlockTok b = new BlockTok(); VaultSrc.ArcYieldVault v2 = new VaultSrc.ArcYieldVault(address(b));
        b.mint(alice, 100e6); vm.prank(alice); b.approve(address(v2), type(uint).max);
        vm.prank(alice); uint s = v2.deposit(100e6, alice);
        b.mint(address(v2), 100e6);                       // yield
        b.setBlocked(v2.owner());                         // the fee address gets blocked by the token issuer
        vm.prank(alice); uint out = v2.redeem(s, alice);  // still works
        require(out > 180e6, "holder is paid");
        vm.expectRevert(bytes("token transfer failed")); v2.claimFees();
        require(v2.accruedFees() > 0, "fees stay accrued");
        address newOwner = address(0x5AFE);
        vm.prank(v2.owner()); v2.transferOwnership(newOwner); // the fee address can be rotated (two steps)
        vm.prank(address(0xBAD)); vm.expectRevert(bytes("not pending owner")); v2.acceptOwnership();
        vm.prank(newOwner); v2.acceptOwnership();
        v2.claimFees();
        require(b.balanceOf(newOwner) > 9e6, "fees reach the new owner");
        vm.expectRevert(bytes("not owner")); v2.transferOwnership(address(1));
    }
    function testNoReturnTokenWorks() public {
        NoRetTok n = new NoRetTok(); VaultSrc.ArcYieldVault v2 = new VaultSrc.ArcYieldVault(address(n));
        n.mint(alice, 100e6); vm.prank(alice); n.approve(address(v2), type(uint).max);
        vm.prank(alice); uint s = v2.deposit(100e6, alice);
        vm.prank(alice); v2.redeem(s, alice);
        require(n.balanceOf(alice) >= 100e6 - 1, "round trip");
    }
    function testFeeOnTransferTokenIsPricedByWhatArrived() public {
        FeeTok f = new FeeTok(); VaultSrc.ArcYieldVault v2 = new VaultSrc.ArcYieldVault(address(f));
        f.mint(alice, 100e6); vm.prank(alice); f.approve(address(v2), type(uint).max);
        vm.prank(alice); v2.deposit(100e6, alice);
        require(v2.costBasisOf(alice) == 90e6 && v2.totalAssets() == 90e6, "basis is what the vault received");
        uint held = v2.balanceOf(alice);
        vm.prank(alice); uint out = v2.redeem(held, alice);
        require(out <= 90e6, "cannot take out more than arrived");
    }
}
