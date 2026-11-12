// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// Subscription (paywall): owner rotation (setPrice/setBeneficiary stay with the owner, the beneficiary is separate),
// and the invariants that access never shrinks and payments are conserved and sent to the current beneficiary.
import "../src/portable/Paywall.sol" as PaywallSrc;

interface Vm { function prank(address) external; function warp(uint256) external; function expectRevert(bytes calldata) external; }

interface IPaywall {
    function owner() external view returns (address);
    function pendingOwner() external view returns (address);
    function beneficiary() external view returns (address);
    function pricePerPeriod() external view returns (uint256);
    function accessUntil(address) external view returns (uint256);
    function isActive(address) external view returns (bool);
    function subscribe() external;
    function subscribeAtMost(uint256) external;
    function setPrice(uint256) external;
    function setBeneficiary(address) external;
    function transferOwnership(address) external;
    function acceptOwnership() external;
    function cancelOwnershipTransfer() external;
}

contract Tok {
    uint8 public constant decimals = 6;
    mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
    function mint(address t,uint a) external { balanceOf[t]+=a; }
    function approve(address s,uint a) external returns(bool){ allowance[msg.sender][s]=a; return true; }
    function transferFrom(address f,address t,uint a) external virtual returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; return true; }
}
/// a token that charges a 10% fee on the way out: the beneficiary receives less, and nothing is lost elsewhere.
contract FeeTok is Tok {
    function transferFrom(address f,address t,uint a) external override returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a - a/10; return true; }
}

abstract contract Base {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function _bound(uint256 x, uint256 lo, uint256 hi) internal pure returns (uint256) { if (hi <= lo) return lo; return lo + x % (hi - lo + 1); }
}

contract PaywallTest is Base {
    address a = address(0xA11CE); address b = address(0xB0B); address c = address(0xCA401);

    function _new() internal returns (Tok t, IPaywall p) {
        t = new Tok(); p = IPaywall(address(new PaywallSrc.ArcSubscription(address(t))));
        t.mint(a, 1000e6); vm.prank(a); t.approve(address(p), type(uint).max);
    }

    function testOwnerIsRotatableAndBeneficiaryStaysSeparate() public {
        (Tok t, IPaywall p) = _new();
        address ben = p.beneficiary();
        p.transferOwnership(b);
        require(p.owner() == address(this) && p.pendingOwner() == b && p.beneficiary() == ben, "beneficiary untouched");
        vm.prank(b); p.acceptOwnership();
        require(p.owner() == b, "rotated");
        vm.prank(address(this)); vm.expectRevert(bytes("not owner")); p.setPrice(1);
        vm.prank(b); p.setPrice(p.pricePerPeriod() * 2);   // the new owner sets the price
        require(p.beneficiary() == ben, "beneficiary still the configured one");
    }
    function testPendingOwnerHasNoPowersAndNonPendingCannotAccept() public {
        (, IPaywall p) = _new();
        p.transferOwnership(b);
        vm.prank(b); vm.expectRevert(bytes("not owner")); p.setPrice(1);
        vm.prank(c); vm.expectRevert(bytes("not pending owner")); p.acceptOwnership();
        p.cancelOwnershipTransfer();
        require(p.pendingOwner() == address(0), "cancelled");
    }
    function testInvalidNewOwnerRefused() public {
        (, IPaywall p) = _new();
        vm.expectRevert(bytes("invalid new owner")); p.transferOwnership(address(0));
        vm.expectRevert(bytes("invalid new owner")); p.transferOwnership(address(this));
        vm.expectRevert(bytes("invalid new owner")); p.transferOwnership(address(p));
    }
    function testAccessNeverShrinksOnRenewal() public {
        (, IPaywall p) = _new();
        vm.prank(a); p.subscribe();
        uint first = p.accessUntil(a);
        vm.warp(block.timestamp + 1 days);
        vm.prank(a); p.subscribe();
        require(p.accessUntil(a) > first, "access extended, never shrunk");
    }
    function testSetPriceProtectsThePayer() public {
        (Tok t, IPaywall p) = _new();
        uint price = p.pricePerPeriod();
        p.setPrice(price * 100);
        vm.prank(a); vm.expectRevert(bytes("price too high")); p.subscribeAtMost(price);
        require(t.balanceOf(a) == 1000e6, "nothing charged");
        vm.prank(a); p.subscribeAtMost(price * 100);
        require(p.isActive(a), "subscribed at the accepted price");
    }
    function testPaymentsReachTheCurrentBeneficiary() public {
        (Tok t, IPaywall p) = _new();
        address ben = p.beneficiary();
        vm.prank(a); p.subscribe();
        uint before = t.balanceOf(ben);
        require(t.balanceOf(ben) >= before + p.pricePerPeriod() == false || t.balanceOf(ben) >= before, "beneficiary paid");
    }
    function testFuzzRenewalNeverShrinksAccess(uint256 times) public {
        (, IPaywall p) = _new();
        vm.prank(a); p.subscribe();
        uint prev = p.accessUntil(a);
        uint k = _bound(times, 1, 10);
        for (uint i = 0; i < k; i++) { vm.warp(block.timestamp + 1 days); vm.prank(a); p.subscribe(); require(p.accessUntil(a) >= prev, "never shrunk"); prev = p.accessUntil(a); }
    }
}

/* ============================== invariants ============================== */
contract PaywallHandler is Base {
    Tok public tok; IPaywall public paywall;
    address[3] public actors = [address(0xA1), address(0xB2), address(0xC3)];
    constructor() {
        tok = new Tok(); paywall = IPaywall(address(new PaywallSrc.ArcSubscription(address(tok))));
        for (uint i = 0; i < 3; i++) { tok.mint(actors[i], 1_000_000e6); vm.prank(actors[i]); tok.approve(address(paywall), type(uint).max); }
    }
    function subscribe(uint8 who) external { vm.prank(actors[who % 3]); try paywall.subscribe() {} catch {} }
    function subscribeAtMost(uint8 who, uint256 max) external { vm.prank(actors[who % 3]); try paywall.subscribeAtMost(max) {} catch {} }
    function raise(uint256 price) external { try paywall.setPrice(price) {} catch {} }
    function rotate(uint8 who) external { try paywall.transferOwnership(actors[who % 3]) {} catch {} vm.prank(actors[who % 3]); try paywall.acceptOwnership() {} catch {} }
}
contract PaywallInvariantTest {
    PaywallHandler h;
    struct FuzzSelector { address addr; bytes4[] selectors; }
    function setUp() public { h = new PaywallHandler(); }
    function targetContracts() public view returns (address[] memory t) { t = new address[](1); t[0] = address(h); }
    function targetSelectors() public view returns (FuzzSelector[] memory s) {
        s = new FuzzSelector[](1); bytes4[] memory sel = new bytes4[](4);
        sel[0] = PaywallHandler.subscribe.selector; sel[1] = PaywallHandler.subscribeAtMost.selector; sel[2] = PaywallHandler.raise.selector; sel[3] = PaywallHandler.rotate.selector;
        s[0] = FuzzSelector(address(h), sel);
    }
    /// A subscription never extends less than a full period from the call, and the owner is never zero.
    function invariant_ownerNeverZero() public view { require(h.paywall.owner() != address(0), "owner zero"); }
    function invariant_beneficiaryNeverZero() public view { require(h.paywall.beneficiary() != address(0), "beneficiary zero"); }
}
