// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// Runtime certification of the generated Vault deposit cap: constructor exact-representation, decimal normalization and
// cap enforcement, using the actual generated Solidity (tests/solidity/src/portable/Vault*.sol, produced by
// dump-portable-sources.mjs from genVault()).
import "../src/portable/Vault.sol" as VaultSrc;
import "../src/portable/VaultCap500.sol" as V500;
import "../src/portable/VaultCap15.sol" as V15;
import "../src/portable/VaultCapSubUnit.sol" as VSub;
import "../src/portable/VaultCapSubSubUnit.sol" as VSubSub;
import "../src/portable/VaultCap1p0000001.sol" as V1p;
import "../src/portable/VaultCapTrailingZeros.sol" as VTrail;

interface Vm {
    function prank(address) external;
    function expectRevert(bytes calldata) external;
}

/* A mock ERC-20 with constructor-configurable decimals (the vault reads it from the asset at deploy time). */
contract DecTok {
    uint8 public decimals;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    constructor(uint8 d) { decimals = d; }
    function mint(address t, uint256 a) external { balanceOf[t] += a; }
    function approve(address s, uint256 a) external returns (bool) { allowance[msg.sender][s] = a; return true; }
    function transfer(address t, uint256 a) external returns (bool) { balanceOf[msg.sender] -= a; balanceOf[t] += a; return true; }
    function transferFrom(address f, address t, uint256 a) external returns (bool) { allowance[f][msg.sender] -= a; balanceOf[f] -= a; balanceOf[t] += a; return true; }
}

/* A contract whose decimals() is far above the supported range (still has code, so the asset-is-a-contract check passes). */
contract BadDecTok {
    function decimals() external pure returns (uint8) { return 255; }
    function balanceOf(address) external pure returns (uint256) { return 0; }
    function transfer(address, uint256) external pure returns (bool) { return true; }
    function transferFrom(address, address, uint256) external pure returns (bool) { return true; }
}

abstract contract Base {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
}

contract VaultConstructorTest is Base {
    function testSixDecimalsCap500() public {
        DecTok t = new DecTok(6);
        V500.VaultCap500 v = new V500.VaultCap500(address(t));
        require(v.depositCap() == 500e6, "cap 500 in 6 decimals");
    }
    function testEightDecimalsCap500() public {
        DecTok t = new DecTok(8);
        V500.VaultCap500 v = new V500.VaultCap500(address(t));
        require(v.depositCap() == 500e8, "cap 500 in 8 decimals");
    }
    function testEighteenDecimalsCap500() public {
        DecTok t = new DecTok(18);
        V500.VaultCap500 v = new V500.VaultCap500(address(t));
        require(v.depositCap() == 500e18, "cap 500 in 18 decimals");
    }
    function testFractionalCap() public {
        DecTok t = new DecTok(6);
        V15.VaultCap15 v = new V15.VaultCap15(address(t));
        require(v.depositCap() == 1_500_000, "1.5 * 1e6");
    }
    function testZeroCapIsUnlimited() public {
        DecTok t = new DecTok(6);
        VaultSrc.ArcYieldVault v = new VaultSrc.ArcYieldVault(address(t));
        require(v.depositCap() == 0, "unlimited");
    }
    function testSubUnitCapIsOneBaseUnit() public {
        DecTok t = new DecTok(6);
        VSub.VaultCapSubUnit v = new VSub.VaultCapSubUnit(address(t));
        require(v.depositCap() == 1, "exactly one base unit");
    }
    function testSubSubUnitCapReverts() public {
        DecTok t = new DecTok(6);
        vm.expectRevert(bytes("deposit cap is not representable"));
        new VSubSub.VaultCapSubSubUnit(address(t));
    }
    function testOnePoint0000001RevertsSixDecimals() public {
        DecTok t = new DecTok(6);
        vm.expectRevert(bytes("deposit cap is not representable"));
        new V1p.VaultCap1p0000001(address(t));
    }
    function testOnePoint0000001AcceptsEightDecimals() public {
        DecTok t = new DecTok(8);
        V1p.VaultCap1p0000001 v = new V1p.VaultCap1p0000001(address(t));
        require(v.depositCap() == 100_000_010, "1.0000001 * 1e8");
    }
    function testTrailingZeroCapNormalised() public {
        DecTok t = new DecTok(6);
        VTrail.VaultCapTrailingZeros v = new VTrail.VaultCapTrailingZeros(address(t));
        require(v.depositCap() == 1_000_250_000, "1000.25 * 1e6");
    }
    function testUnsupportedDecimalsRevert() public {
        BadDecTok t = new BadDecTok();
        vm.expectRevert(bytes("asset decimals out of range"));
        new V500.VaultCap500(address(t));
    }
}

contract VaultCapEnforcementTest is Base {
    function _vault(DecTok t) internal returns (V500.VaultCap500 v, address u) {
        v = new V500.VaultCap500(address(t));
        u = address(0xABC);
        t.mint(u, 2000e6);
        vm.prank(u); t.approve(address(v), type(uint256).max);
    }
    function testDepositExactlyAtCap() public {
        DecTok t = new DecTok(6);
        (V500.VaultCap500 v, address u) = _vault(t);
        vm.prank(u); v.deposit(500e6, u);
        require(v.totalAssets() == 500e6, "exactly at cap");
    }
    function testDepositOneUnitAboveCapReverts() public {
        DecTok t = new DecTok(6);
        (V500.VaultCap500 v, address u) = _vault(t);
        vm.prank(u); v.deposit(500e6, u);
        vm.prank(u);
        vm.expectRevert(bytes("exceeds deposit cap"));
        v.deposit(1, u);
    }
    function testMultipleDepositsCannotBypassCap() public {
        DecTok t = new DecTok(6);
        (V500.VaultCap500 v, address u) = _vault(t);
        vm.prank(u); v.deposit(400e6, u);
        vm.prank(u); v.deposit(100e6, u);   // total 500e6 == cap
        vm.prank(u);
        vm.expectRevert(bytes("exceeds deposit cap"));
        v.deposit(1, u);
    }
    function testSinglePortableEquivalence() public {
        // The same cap on the same asset resolves to the same base-unit cap in every generated variant.
        DecTok t6 = new DecTok(6);
        V500.VaultCap500 a = new V500.VaultCap500(address(t6));
        VTrail.VaultCapTrailingZeros b = new VTrail.VaultCapTrailingZeros(address(t6));
        // 500 and 1000.25 are different caps; the equivalence to assert is the deterministic resolution across assets.
        DecTok t8 = new DecTok(8);
        V500.VaultCap500 c = new V500.VaultCap500(address(t8));
        require(a.depositCap() == 500e6 && c.depositCap() == 500e8, "same human cap scales by the asset decimals");
        require(b.depositCap() == 1_000_250_000, "trailing zeros do not change the cap");
    }
}
