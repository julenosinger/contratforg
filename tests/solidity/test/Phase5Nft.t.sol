// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// Phase 5, item B: the NFT owner (who receives the mint payments and the royalties and sets the price and the base URI) can be
// handed over in two steps and can never become the zero address. There is no renounce: the owner is also the payee, so a
// zero owner would burn every payment. The new calls go through INftOwner so these tests compile, and fail at run time,
// against the previous generator output (red-green).
import "../src/portable/Nft.sol" as NftSrc;

interface Vm {
    function prank(address) external;
    function expectRevert(bytes calldata) external;
    function expectEmit(bool, bool, bool, bool) external;
}
interface INftOwner {
    function owner() external view returns (address);
    function pendingOwner() external view returns (address);
    function transferOwnership(address) external;
    function acceptOwnership() external;
    function setMintPrice(uint256) external;
    function mint() external returns (uint256);
    function royaltyInfo(uint256, uint256) external view returns (address, uint256);
}
contract Tok {
    uint8 public constant decimals = 6;
    mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
    function mint(address t,uint a) external { balanceOf[t]+=a; }
    function approve(address s,uint a) external returns(bool){ allowance[msg.sender][s]=a; return true; }
    function transfer(address t,uint a) external returns(bool){ balanceOf[msg.sender]-=a; balanceOf[t]+=a; return true; }
    function transferFrom(address f,address t,uint a) external returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; return true; }
}

contract NftOwnerTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    Tok tok; INftOwner nft;
    address bob = address(0xB0B); address carol = address(0xCA401); address minter = address(0xA11CE);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function setUp() public {
        tok = new Tok(); nft = INftOwner(address(new NftSrc.ArcOriginals(address(tok))));
        tok.mint(minter, 1_000e6); vm.prank(minter); tok.approve(address(nft), type(uint256).max);
    }

    function testOwnershipIsHandedOverInTwoSteps() public {
        vm.expectEmit(true, true, false, true); emit OwnershipTransferStarted(address(this), bob); nft.transferOwnership(bob);
        require(nft.owner() == address(this) && nft.pendingOwner() == bob, "nothing changes until bob accepts");
        vm.prank(bob); vm.expectRevert(bytes("not owner")); nft.setMintPrice(1);                  // a pending owner has no powers
        vm.prank(carol); vm.expectRevert(bytes("not pending owner")); nft.acceptOwnership();
        vm.expectEmit(true, true, false, true); emit OwnershipTransferred(address(this), bob); vm.prank(bob); nft.acceptOwnership();
        require(nft.owner() == bob && nft.pendingOwner() == address(0), "bob owns it now");
        vm.expectRevert(bytes("not owner")); nft.setMintPrice(1);                                   // the old owner lost the powers
        vm.prank(bob); nft.setMintPrice(7);
        vm.prank(bob); vm.expectRevert(bytes("not pending owner")); nft.acceptOwnership();         // cannot accept twice
    }
    function testPaymentsAndRoyaltiesFollowTheNewOwner() public {
        nft.transferOwnership(bob); vm.prank(bob); nft.acceptOwnership();
        uint256 before = tok.balanceOf(bob); vm.prank(minter); uint256 id = nft.mint();
        require(tok.balanceOf(bob) == before + 10e6, "the mint price goes to the new owner");
        (address receiver,) = nft.royaltyInfo(id, 1000); require(receiver == bob, "royalties go to the new owner");
    }
    function testOnlyTheOwnerStartsATransferAndNeverToZero() public {
        vm.prank(carol); vm.expectRevert(bytes("not owner")); nft.transferOwnership(carol);
        vm.expectRevert(bytes("new owner is the zero address")); nft.transferOwnership(address(0));
        nft.transferOwnership(bob); nft.transferOwnership(carol);                                  // a second offer replaces the first
        vm.prank(bob); vm.expectRevert(bytes("not pending owner")); nft.acceptOwnership();
        vm.prank(carol); nft.acceptOwnership(); require(nft.owner() == carol, "carol");
    }
    /// Whatever sequence of offers and acceptances, the owner is never zero and only changes when the pending account accepts.
    function testFuzzOwnerOnlyChangesThroughTheTwoSteps(address a, address b, uint8 mode) public {
        if (a == address(0) || b == address(0)) return;
        address start = nft.owner();
        try nft.transferOwnership(a) {} catch {}
        require(nft.owner() == start, "an offer does not change the owner");
        vm.prank(b);
        try nft.acceptOwnership() {
            require(b == a, "someone who was not offered the role took it");
            require(nft.owner() == a, "the accepted offer applies");
        } catch { require(nft.owner() == start, "a refused acceptance leaves the owner"); }
        require(nft.owner() != address(0), "the owner is never zero");
        if (mode % 2 == 0) { address o = nft.owner(); vm.prank(o); try nft.transferOwnership(b) {} catch {} require(nft.owner() == o, "still the same owner"); }
    }
}
