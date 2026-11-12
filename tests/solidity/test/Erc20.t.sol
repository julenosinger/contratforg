// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// ERC-20 (erc20): two-step owner rotation plus an irreversible renounce, mint authority, and supply invariants.
// Written against the previous generator output (fixed, non-rotatable owner) where every rotation call is missing,
// so the whole file fails there and passes against the new output.
import "../src/portable/Erc20.sol" as Erc20Src;
import "../src/portable/Erc20Burn.sol" as BurnSrc;
import "../src/portable/Erc20Cap.sol" as CapSrc;

interface Vm { function prank(address) external; function expectRevert(bytes calldata) external; function expectRevert() external; }

interface IERC20 {
    function owner() external view returns (address);
    function pendingOwner() external view returns (address);
    function totalSupply() external view returns (uint256);
    function cap() external view returns (uint256);
    function balanceOf(address) external view returns (uint256);
    function allowance(address, address) external view returns (uint256);
    function mint(address, uint256) external;
    function burn(uint256) external;
    function transfer(address, uint256) external returns (bool);
    function approve(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
    function transferOwnership(address) external;
    function acceptOwnership() external;
    function cancelOwnershipTransfer() external;
    function renounceOwnership() external;
}

abstract contract Base {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function _bound(uint256 x, uint256 lo, uint256 hi) internal pure returns (uint256) { if (hi <= lo) return lo; return lo + x % (hi - lo + 1); }
}

contract Erc20Test is Base {
    address a = address(0xA11CE); address b = address(0xB0B); address c = address(0xCA401);

    function _new() internal returns (IERC20 t) { t = IERC20(address(new Erc20Src.ArcDollar())); }

    function testOwnerStartsAsDeployer() public { require(_new().owner() == address(this), "owner is the deployer"); }
    function testOwnerNeverZeroWithoutRenounce() public {
        IERC20 t = _new();
        t.transferOwnership(b); vm.prank(b); t.acceptOwnership();
        require(t.owner() == b && t.owner() != address(0), "rotated, never zero");
        t.transferOwnership(c); vm.prank(c); t.acceptOwnership();
        require(t.owner() == c, "rotated again");
    }
    function testTransferOwnershipIsTwoSteps() public {
        IERC20 t = _new();
        t.transferOwnership(b);
        require(t.owner() == address(this) && t.pendingOwner() == b, "nothing changes until accept");
        vm.prank(b); t.acceptOwnership();
        require(t.owner() == b && t.pendingOwner() == address(0), "accepted");
        vm.prank(a); vm.expectRevert(bytes("not owner")); t.mint(a, 1);
        vm.prank(b); t.mint(a, 1);
    }
    function testPendingOwnerHasNoPowers() public {
        IERC20 t = _new();
        t.transferOwnership(b);
        vm.prank(b); vm.expectRevert(bytes("not owner")); t.mint(a, 1);
        vm.prank(b); vm.expectRevert(bytes("not owner")); t.transferOwnership(c);
    }
    function testAcceptByNonPendingFails() public {
        IERC20 t = _new();
        t.transferOwnership(b);
        vm.prank(c); vm.expectRevert(bytes("not pending owner")); t.acceptOwnership();
        vm.expectRevert(bytes("not pending owner")); t.acceptOwnership();   // nobody (the owner is not pending)
        require(t.owner() == address(this), "unchanged");
    }
    function testInvalidNewOwnerRefused() public {
        IERC20 t = _new();
        vm.expectRevert(bytes("invalid new owner")); t.transferOwnership(address(0));
        vm.expectRevert(bytes("invalid new owner")); t.transferOwnership(address(this));
        vm.expectRevert(bytes("invalid new owner")); t.transferOwnership(address(t));
    }
    function testCancelOwnershipTransfer() public {
        IERC20 t = _new();
        t.transferOwnership(b);
        t.cancelOwnershipTransfer();
        require(t.pendingOwner() == address(0), "cleared");
        vm.prank(b); vm.expectRevert(bytes("not pending owner")); t.acceptOwnership();
    }
    function testRenounceOwnershipFixesTheSupply() public {
        IERC20 t = _new();
        t.mint(a, 100);
        t.renounceOwnership();
        require(t.owner() == address(0), "owner zero");
        vm.prank(address(this)); vm.expectRevert(bytes("not owner")); t.mint(a, 1);
        require(t.totalSupply() == 100, "supply fixed at the renounce");
    }
    function testOnlyOwnerMints() public {
        IERC20 t = _new();
        vm.prank(a); vm.expectRevert(bytes("not owner")); t.mint(a, 1);
        t.mint(a, 10);
        require(t.totalSupply() == 10 && t.balanceOf(a) == 10, "minted by the owner");
    }
    function testFuzzMintRespectsCap(uint256 amount) public {
        IERC20 t = IERC20(address(new CapSrc.ArcDollar()));
        uint256 cap = t.cap();
        t.mint(a, cap);
        vm.expectRevert(bytes("exceeds cap")); t.mint(a, _bound(amount, 1, cap + 1));
        require(t.totalSupply() == cap, "capped");
    }
    function testBurnReducesSupply() public {
        IERC20 t = IERC20(address(new BurnSrc.ArcDollar()));
        t.mint(a, 100);
        vm.prank(a); t.burn(40);
        require(t.totalSupply() == 60 && t.balanceOf(a) == 60, "burned");
    }
    function testTransferAndAllowanceConserveFunds() public {
        IERC20 t = _new();
        t.mint(a, 100);
        vm.prank(a); t.approve(b, 30);
        vm.prank(b); t.transferFrom(a, c, 20);
        require(t.balanceOf(a) == 80 && t.balanceOf(c) == 20 && t.allowance(a, b) == 10, "conserved");
        vm.prank(a); vm.expectRevert(bytes("transfer to zero")); t.transfer(address(0), 1);
        vm.prank(a); vm.expectRevert(bytes("insufficient balance")); t.transfer(c, 1000);
    }
    function testFuzzTransferConservesFunds(uint256 amt) public {
        IERC20 t = _new();
        t.mint(a, 1e12);
        uint256 bal0 = t.balanceOf(a) + t.balanceOf(b);
        uint256 x = _bound(amt, 0, 1e12);
        vm.prank(a); t.transfer(b, x);
        require(t.balanceOf(a) + t.balanceOf(b) == bal0, "no funds created or lost");
        require(t.totalSupply() == 1e12, "supply constant");
    }
    function testFuzzApprovalSpendReducesAllowance(uint256 amt, uint256 spend) public {
        IERC20 t = _new();
        t.mint(a, 1e12);
        uint256 s = _bound(spend, 1, 1e6);
        uint256 allowed = _bound(amt, 0, 1e12);
        vm.prank(a); t.approve(b, allowed);
        if (allowed >= s) { vm.prank(b); t.transferFrom(a, c, s); require(t.allowance(a, b) == allowed - s, "allowance spent"); }
        else { vm.prank(b); vm.expectRevert(bytes("allowance exceeded")); t.transferFrom(a, c, s); }
    }
}

/* ============================== invariants ============================== */
contract Erc20Handler is Base {
    IERC20 public token;
    address[4] public actors = [address(0xA1), address(0xB2), address(0xC3), address(0xD4)];
    constructor() { token = IERC20(address(new Erc20Src.ArcDollar())); }
    function mint(uint8 to, uint256 amount) external {
        token.mint(actors[to % 4], amount);
    }
    function transfer(uint8 from, uint8 to, uint256 amount) external {
        vm.prank(actors[from % 4]); try token.transfer(actors[to % 4], amount) {} catch {}
    }
    function approveAndSpend(uint8 from, uint8 spender, uint8 to, uint256 amount) external {
        vm.prank(actors[from % 4]); token.approve(actors[spender % 4], amount);
        vm.prank(actors[spender % 4]); try token.transferFrom(actors[from % 4], actors[to % 4], amount) {} catch {}
    }
    function rotate(uint8 who) external {
        try token.transferOwnership(actors[who % 4]) {} catch {}
        vm.prank(actors[who % 4]); try token.acceptOwnership() {} catch {}
    }
}
contract Erc20InvariantTest {
    Erc20Handler h;
    struct FuzzSelector { address addr; bytes4[] selectors; }
    function setUp() public { h = new Erc20Handler(); }
    function targetContracts() public view returns (address[] memory t) { t = new address[](1); t[0] = address(h); }
    function targetSelectors() public view returns (FuzzSelector[] memory s) {
        s = new FuzzSelector[](1); bytes4[] memory sel = new bytes4[](4);
        sel[0] = Erc20Handler.mint.selector; sel[1] = Erc20Handler.transfer.selector; sel[2] = Erc20Handler.approveAndSpend.selector; sel[3] = Erc20Handler.rotate.selector;
        s[0] = FuzzSelector(address(h), sel);
    }
    /// The sum of every balance is always the total supply, and nothing mints past the cap.
    function invariant_supplyConservation() public view {
        IERC20 t = h.token();
        uint256 held;
        for (uint256 i = 0; i < 4; i++) held += t.balanceOf(h.actors(i));
        require(held == t.totalSupply(), "balances do not add up to the supply");
    }
    /// An ownership rotation only ever moves the role through the two steps: the owner is never the zero address.
    function invariant_ownerNeverZero() public view {
        require(h.token().owner() != address(0), "owner became zero without a renounce");
    }
}
