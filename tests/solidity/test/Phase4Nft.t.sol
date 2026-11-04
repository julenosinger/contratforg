// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// Phase 4, achado A.1: the NFT mint is safe against a payment token that calls back (checks-effects-interactions
// plus a reentrancy guard). Written first against the old generator output, where three of these tests failed.
import "../src/portable/Nft.sol" as NftSrc;
import "../src/portable/NftOne.sol" as NftOneSrc;

interface Vm {
    function prank(address) external;
    function expectRevert(bytes calldata) external;
}
interface IMint { function mint() external returns (uint256); function totalSupply() external view returns (uint256); function ownerOf(uint256) external view returns (address); }

contract Tok {
    uint8 public constant decimals = 6;
    mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
    function mint(address t,uint a) external { balanceOf[t]+=a; }
    function approve(address s,uint a) external returns(bool){ allowance[msg.sender][s]=a; return true; }
    function transfer(address t,uint a) external virtual returns(bool){ balanceOf[msg.sender]-=a; balanceOf[t]+=a; return true; }
    function transferFrom(address f,address t,uint a) external virtual returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; return true; }
}

/// A hostile payment token: while it is asked to move the payment it calls mint() again. It pays for that second
/// mint out of its own pocket, so only the contract under test can stop it.
contract ReentrantPayTok is Tok {
    address public target; bool inside; bool public reentered; bool public reentryRefused;
    function arm(address t) external { target = t; }
    function transferFrom(address f,address t,uint a) external override returns(bool){
        if (target != address(0) && !inside) {
            inside = true;
            (bool ok,) = target.call(abi.encodeWithSignature("mint()"));
            if (ok) reentered = true; else reentryRefused = true;
            inside = false;
        }
        if (f != address(this)) allowance[f][msg.sender] -= a;
        balanceOf[f] -= a; balanceOf[t] += a; return true;
    }
}

/// Records what the NFT looks like at the moment it is asked to move the payment.
contract ObserverTok is Tok {
    address public nft; uint public supplySeen; address public ownerSeen; bool public called;
    function watch(address n) external { nft = n; }
    function transferFrom(address f,address t,uint a) external override returns(bool){
        called = true;
        supplySeen = IMint(nft).totalSupply();
        try IMint(nft).ownerOf(1) returns (address o) { ownerSeen = o; } catch { ownerSeen = address(0); }
        allowance[f][msg.sender] -= a; balanceOf[f] -= a; balanceOf[t] += a; return true;
    }
}

contract Phase4NftTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant ALICE = address(0xA11CE);

    /* ------------------------------ A.1 NFT mint ------------------------------ */

    function testMintCannotExceedMaxSupplyThroughAHostilePaymentToken() public {
        ReentrantPayTok t = new ReentrantPayTok();
        NftOneSrc.ArcOriginals n = new NftOneSrc.ArcOriginals(address(t));    // exactly one token can exist
        t.arm(address(n)); t.mint(ALICE, 1e9); t.mint(address(t), 1e9);
        vm.prank(ALICE); t.approve(address(n), type(uint256).max);
        vm.prank(ALICE); n.mint();
        require(n.totalSupply() <= n.MAX_SUPPLY(), "supply went past MAX_SUPPLY");
        require(n.balanceOf(ALICE) + n.balanceOf(address(t)) == n.totalSupply(), "tokens and supply disagree");
    }

    function testMintRefusesAReentrantCall() public {
        ReentrantPayTok t = new ReentrantPayTok();
        NftSrc.ArcOriginals n = new NftSrc.ArcOriginals(address(t));
        t.arm(address(n)); t.mint(ALICE, 1e9); t.mint(address(t), 1e9);
        vm.prank(ALICE); t.approve(address(n), type(uint256).max);
        vm.prank(ALICE); n.mint();
        require(!t.reentered(), "a nested mint() succeeded");
        require(t.reentryRefused(), "the nested mint() was not refused");
        require(n.totalSupply() == 1 && n.balanceOf(ALICE) == 1, "the outer mint must still complete once");
    }

    function testMintUpdatesStateBeforeTheTokenIsPaid() public {
        ObserverTok t = new ObserverTok();
        NftSrc.ArcOriginals n = new NftSrc.ArcOriginals(address(t));
        t.watch(address(n)); t.mint(ALICE, 1e9);
        vm.prank(ALICE); t.approve(address(n), type(uint256).max);
        vm.prank(ALICE); n.mint();
        require(t.called(), "the payment was never requested");
        require(t.supplySeen() == 1, "totalSupply was not updated before the payment (checks-effects-interactions)");
        require(t.ownerSeen() == ALICE, "ownership was not recorded before the payment");
    }

    function testMintStillWorksNormally() public {
        Tok t = new Tok(); NftSrc.ArcOriginals n = new NftSrc.ArcOriginals(address(t));
        t.mint(ALICE, 1e9); vm.prank(ALICE); t.approve(address(n), type(uint256).max);
        vm.prank(ALICE); uint256 id = n.mint();
        require(id == 1 && n.ownerOf(1) == ALICE && n.balanceOf(ALICE) == 1 && n.totalSupply() == 1, "normal mint");
        require(t.balanceOf(address(this)) == n.mintPrice(), "the owner is paid the price");
    }

    function testMintStillRevertsWhenPaymentFails() public {
        Tok t = new Tok(); NftSrc.ArcOriginals n = new NftSrc.ArcOriginals(address(t));
        vm.prank(ALICE); vm.expectRevert(hex"4e487b710000000000000000000000000000000000000000000000000000000000000011");   // no allowance: the token underflows
        n.mint();
        require(n.totalSupply() == 0 && n.balanceOf(ALICE) == 0, "a failed payment leaves no trace");
    }
}
