// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "../src/portable/Amm.sol" as AmmSrc;
import "../src/Fac.sol" as FacSrc;

interface Vm {
    function prank(address) external;
    function expectRevert(bytes calldata) external;
    function warp(uint256) external;
}
contract Tok {
    uint8 public constant decimals = 6;
    mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
    function mint(address t,uint a) external { balanceOf[t]+=a; }
    function approve(address s,uint a) external returns(bool){ allowance[msg.sender][s]=a; return true; }
    function transfer(address t,uint a) external virtual returns(bool){ balanceOf[msg.sender]-=a; balanceOf[t]+=a; return true; }
    function transferFrom(address f,address t,uint a) external virtual returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; return true; }
}
/// Takes 1% on every transfer() (what leaves the pool) but nothing on transferFrom() (what enters it).
contract TaxOutTok is Tok {
    function transfer(address t,uint a) external override returns(bool){ balanceOf[msg.sender]-=a; balanceOf[t]+=a - a/100; return true; }
}

/// Delivers the full amount but charges the sender (the pool) an extra 1%.
contract SurchargeTok is Tok {
    function transfer(address t,uint a) external override returns(bool){ balanceOf[msg.sender]-=a + a/100; balanceOf[t]+=a; return true; }
}

contract LpTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    Tok A; Tok B; AmmSrc.ArcSwapAMM amm;
    address alice = address(0xA11CE); address bob = address(0xB0B);
    uint dl = type(uint).max;

    function setUp() public {
        A = new Tok(); B = new Tok();
        amm = new AmmSrc.ArcSwapAMM(address(A), address(B));
        A.mint(alice, 1_000_000e6); B.mint(alice, 1_000_000e6);
        vm.prank(alice); A.approve(address(amm), type(uint).max);
        vm.prank(alice); B.approve(address(amm), type(uint).max);
        vm.prank(alice); amm.addLiquidity(1000e6, 1000e6, 0, 0, dl);
    }

    function testSharesAreAnErc20() public {
        require(keccak256(bytes(amm.name())) == keccak256("ContractForge LP"), "name");
        require(amm.decimals() == 18, "decimals");
        require(amm.totalSupply() == amm.totalShares(), "totalSupply");
        require(amm.balanceOf(alice) == amm.shares(alice) && amm.balanceOf(alice) > 0, "balanceOf");
        require(amm.balanceOf(address(0)) == 1000, "minimum liquidity stays locked");
        require(amm.balanceOf(alice) + 1000 == amm.totalSupply(), "supply adds up");
    }

    function testTransferMovesThePosition() public {
        uint s = amm.balanceOf(alice);
        vm.prank(alice); require(amm.transfer(bob, s / 2), "transfer");
        require(amm.balanceOf(bob) == s / 2 && amm.balanceOf(alice) == s - s / 2, "balances");
        require(amm.totalSupply() == s + 1000, "supply unchanged by a transfer");
        // bob now owns a redeemable position
        vm.prank(bob); (uint a0, uint a1) = amm.removeLiquidity(s / 2, 0, 0, dl);
        require(A.balanceOf(bob) == a0 && B.balanceOf(bob) == a1 && a0 > 0 && a1 > 0, "bob redeemed");
    }

    function testApproveAndTransferFrom() public {
        uint s = amm.balanceOf(alice);
        vm.prank(alice); amm.approve(bob, 100);
        vm.prank(bob); vm.expectRevert(bytes("insufficient allowance")); amm.transferFrom(alice, bob, 101);
        vm.prank(bob); amm.transferFrom(alice, bob, 60);
        require(amm.allowance(alice, bob) == 40 && amm.balanceOf(bob) == 60, "allowance spent");
        vm.prank(alice); amm.approve(bob, type(uint).max);
        vm.prank(bob); amm.transferFrom(alice, bob, 10);
        require(amm.allowance(alice, bob) == type(uint).max, "infinite allowance is kept");
        require(amm.balanceOf(alice) == s - 70, "alice paid");
    }

    function testTransferGuards() public {
        vm.prank(alice); vm.expectRevert(bytes("invalid recipient")); amm.transfer(address(0), 1);
        vm.prank(bob); vm.expectRevert(bytes("insufficient shares")); amm.transfer(alice, 1);
        uint over = amm.balanceOf(alice) + 1;
        vm.prank(alice); vm.expectRevert(bytes("insufficient shares")); amm.transfer(bob, over);
    }

    function testFuzzTransfersNeverChangeSupply(uint96 amt) public {
        uint s = amm.balanceOf(alice);
        uint v = uint(amt) % (s + 1);
        uint supply = amm.totalSupply();
        vm.prank(alice); amm.transfer(bob, v);
        require(amm.totalSupply() == supply, "supply");
        require(amm.balanceOf(alice) + amm.balanceOf(bob) == s, "conserved");
    }

    function testOutgoingTaxIsRejected() public {
        TaxOutTok t = new TaxOutTok(); Tok good = new Tok();
        AmmSrc.ArcSwapAMM p = new AmmSrc.ArcSwapAMM(address(t), address(good));
        t.mint(alice, 1_000_000e6); good.mint(alice, 1_000_000e6);
        vm.prank(alice); t.approve(address(p), type(uint).max);
        vm.prank(alice); good.approve(address(p), type(uint).max);
        vm.prank(alice); p.addLiquidity(1000e6, 1000e6, 0, 0, dl);          // entering the pool is untaxed, so this works
        // paying out the taxed token: the user would get less than the pool says, so the call reverts
        vm.prank(alice); vm.expectRevert(bytes("unsupported token (fee on transfer)")); p.swapBtoA(10e6, 0, dl);
        uint sh = p.balanceOf(alice);
        vm.prank(alice); vm.expectRevert(bytes("unsupported token (fee on transfer)")); p.removeLiquidity(sh, 0, 0, dl);
        // paying out the good token still works
        vm.prank(alice); p.swapAtoB(10e6, 0, dl);
    }

    function testSenderSurchargeIsRejected() public {
        SurchargeTok t = new SurchargeTok(); Tok good = new Tok();
        AmmSrc.ArcSwapAMM p = new AmmSrc.ArcSwapAMM(address(t), address(good));
        t.mint(alice, 1_000_000e6); good.mint(alice, 1_000_000e6);
        vm.prank(alice); t.approve(address(p), type(uint).max);
        vm.prank(alice); good.approve(address(p), type(uint).max);
        vm.prank(alice); p.addLiquidity(1000e6, 1000e6, 0, 0, dl);
        vm.prank(alice); vm.expectRevert(bytes("unsupported token (fee on transfer)")); p.swapBtoA(10e6, 0, dl);
        uint sh = p.balanceOf(alice);
        vm.prank(alice); vm.expectRevert(bytes("unsupported token (fee on transfer)")); p.removeLiquidity(sh / 2, 0, 0, dl);
    }

    function testFactoryPairSharesAreErc20() public {
        FacSrc.ArcSwapAMMFactory f = new FacSrc.ArcSwapAMMFactory();
        address pa = f.createPair(address(A), address(B));
        A.mint(address(this), 100e6); B.mint(address(this), 100e6);
        A.approve(pa, type(uint).max); B.approve(pa, type(uint).max);
        FacSrc.ArcSwapAMMPair pair = FacSrc.ArcSwapAMMPair(pa);
        pair.addLiquidity(100e6, 100e6, 0, 0, dl);
        uint s = pair.balanceOf(address(this));
        require(s > 0 && pair.totalSupply() == s + 1000, "pair shares");
        pair.transfer(bob, s);
        require(pair.balanceOf(bob) == s, "transferable");
    }
}
