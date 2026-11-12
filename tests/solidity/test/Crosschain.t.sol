// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// Crosschain V1 (crosschain): owner rotation (the owner was fixed before) plus a couple of unit checks. The CCTP
// addresses are hard-coded in the source, so the messenger/transmitter are not mocked here; the rotation is the
// phase-7 deliverable, and the template stays experimental (see docs/phase7.md).
import "../src/single/Crosschain.sol" as CcSrc;
import "../src/single/CrosschainResume.sol" as CcR;

interface Vm { function prank(address) external; function expectRevert(bytes calldata) external; }

interface ICrosschain {
    function owner() external view returns (address);
    function pendingOwner() external view returns (address);
    function sendCrossChain(uint256, uint32, bytes32) external returns (uint64);
    function transferOwnership(address) external;
    function acceptOwnership() external;
    function cancelOwnershipTransfer() external;
}

contract CrosschainTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address a = address(0xA11CE); address b = address(0xB0B); address c = address(0xCA401);

    function testOwnerIsRotatable() public {
        ICrosschain x = ICrosschain(address(new CcSrc.ArcCrossPay()));
        require(x.owner() == address(this), "owner is the deployer");
        x.transferOwnership(b);
        require(x.owner() == address(this) && x.pendingOwner() == b, "nothing until accept");
        vm.prank(b); x.acceptOwnership();
        require(x.owner() == b && x.pendingOwner() == address(0), "rotated");
    }
    function testPendingOwnerHasNoPowersAndNonPendingCannotAccept() public {
        ICrosschain x = ICrosschain(address(new CcSrc.ArcCrossPay()));
        x.transferOwnership(b);
        vm.prank(b); vm.expectRevert(bytes("not owner")); x.transferOwnership(c);
        vm.prank(c); vm.expectRevert(bytes("not pending owner")); x.acceptOwnership();
        vm.prank(b); x.acceptOwnership();
        vm.prank(b); x.cancelOwnershipTransfer();
        require(x.pendingOwner() == address(0), "cancelled");
    }
    function testInvalidNewOwnerRefused() public {
        ICrosschain x = ICrosschain(address(new CcSrc.ArcCrossPay()));
        vm.expectRevert(bytes("invalid new owner")); x.transferOwnership(address(0));
        vm.expectRevert(bytes("invalid new owner")); x.transferOwnership(address(this));
        vm.expectRevert(bytes("invalid new owner")); x.transferOwnership(address(x));
    }
    function testZeroAmountRefusedBeforeAnyTokenCall() public {
        ICrosschain x = ICrosschain(address(new CcSrc.ArcCrossPay()));
        vm.expectRevert(bytes("zero amount")); x.sendCrossChain(0, 1, bytes32(uint256(1)));
    }
    function testResumeVariantAlsoRotates() public {
        ICrosschain x = ICrosschain(address(new CcR.ArcCrossPay()));
        x.transferOwnership(b); vm.prank(b); x.acceptOwnership();
        require(x.owner() == b, "the resume variant rotates too");
    }
}
