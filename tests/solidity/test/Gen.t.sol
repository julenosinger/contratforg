// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "../src/Amm.sol" as AmmSrc;
import "../src/Fac.sol" as FacSrc;
import "../src/Book.sol" as BookSrc;

interface Vm {
    function etch(address,bytes calldata) external;
    function warp(uint256) external;
    function expectRevert(bytes calldata) external;
    function expectRevert() external;
}

contract Tok {
    mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
    function mint(address t,uint a) external { balanceOf[t]+=a; }
    function approve(address s,uint a) external returns(bool){ allowance[msg.sender][s]=a; return true; }
    function transfer(address t,uint a) external virtual returns(bool){ balanceOf[msg.sender]-=a; balanceOf[t]+=a; return true; }
    function transferFrom(address f,address t,uint a) external virtual returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; return true; }
}
// USDT style: no return values
contract NoRetTok {
    mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
    function mint(address t,uint a) external { balanceOf[t]+=a; }
    function approve(address s,uint a) external { allowance[msg.sender][s]=a; }
    function transfer(address t,uint a) external { balanceOf[msg.sender]-=a; balanceOf[t]+=a; }
    function transferFrom(address f,address t,uint a) external { allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; }
}
// 1% fee on transfer
contract FeeTok is Tok {
    function transferFrom(address f,address t,uint a) external override returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a - a/100; return true; }
}
// calls back into the pool when it sends tokens out
contract ReentTok is Tok {
    address public target; bytes public data;
    function arm(address t, bytes calldata d) external { target=t; data=d; }
    function transfer(address t,uint a) external override returns(bool){
        balanceOf[msg.sender]-=a; balanceOf[t]+=a;
        if (target != address(0)) { (bool ok, bytes memory r) = target.call(data); if(!ok){ assembly { revert(add(r,32), mload(r)) } } }
        return true;
    }
}

contract User {
    function approve(address a, address b, address spender) external { Tok(a).approve(spender, type(uint).max); Tok(b).approve(spender, type(uint).max); }
}

abstract contract Base {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant USDC = 0x3600000000000000000000000000000000000000;
    address constant EURC = 0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1;
    function etchTok(address at, bytes memory code) internal { vm.etch(at, code); }
    function fund(address who, address amm) internal {
        Tok(USDC).mint(who, 1e30); Tok(EURC).mint(who, 1e30);
    }
}

contract AmmTest is Base {
    AmmSrc.ArcSwapAMM amm; uint dl = type(uint).max;
    function setUp() public {
        Tok t = new Tok(); etchTok(USDC, address(t).code); etchTok(EURC, address(t).code);
        amm = new AmmSrc.ArcSwapAMM();
        Tok(USDC).mint(address(this),1e30); Tok(EURC).mint(address(this),1e30);
        Tok(USDC).approve(address(amm), type(uint).max); Tok(EURC).approve(address(amm), type(uint).max);
    }
    function testFirstDepositLocksMinimum() public {
        (,,uint s) = amm.addLiquidity(100e6,100e6,0,0,dl);
        require(amm.shares(address(0)) == 1000 && amm.totalShares() == s + 1000, "min locked");
        require(s == 100e6 - 1000, "shares");
    }
    function testTinyFirstDepositRejected() public {
        vm.expectRevert(bytes("insufficient initial liquidity"));
        amm.addLiquidity(1,1,0,0,dl);
    }
    function testExcessIsNotTaken() public {
        amm.addLiquidity(100e6,100e6,0,0,dl);
        uint b0 = Tok(EURC).balanceOf(address(this));
        (uint a, uint b,) = amm.addLiquidity(100e6,1000e6,0,0,dl);
        require(a == 100e6 && b == 100e6, "ratio");
        require(b0 - Tok(EURC).balanceOf(address(this)) == 100e6, "only needed pulled");
    }
    function testDepositSlippageProtects() public {
        amm.addLiquidity(100e6,100e6,0,0,dl);
        amm.swapAtoB(100e6,0,dl);               // skew pool (front-run)
        vm.expectRevert(bytes("slippage exceeded"));
        amm.addLiquidity(100e6,100e6,99e6,99e6,dl); // victim expected ~1:1
    }
    function testSwapEmptyPoolReverts() public {
        vm.expectRevert(bytes("insufficient output"));
        amm.swapAtoB(50e6,0,dl);
    }
    function testDeadline() public {
        vm.warp(1000);
        vm.expectRevert(bytes("expired"));
        amm.addLiquidity(100e6,100e6,0,0,999);
    }
    function testSwapSlippage() public {
        amm.addLiquidity(1000e6,1000e6,0,0,dl);
        uint q = amm.getAmountOut(10e6,true);
        vm.expectRevert(bytes("slippage exceeded"));
        amm.swapAtoB(10e6,q+1,dl);
        uint out = amm.swapAtoB(10e6,q,dl);
        require(out == q, "quote");
    }
    function testRemoveAll() public {
        (,,uint s) = amm.addLiquidity(100e6,100e6,0,0,dl);
        (uint a,uint b) = amm.removeLiquidity(s,0,0,dl);
        require(a > 99e6 && b > 99e6 && a <= 100e6 && b <= 100e6, "refund");
        require(amm.reserveA() > 0 && amm.totalShares() == 1000, "min stays");
        // pool still usable after full exit
        amm.addLiquidity(50e6,50e6,0,0,dl);
    }
    // fuzz: a swap round trip never makes money
    function testFuzzRoundTrip(uint96 seed, uint96 inSeed) public {
        amm.addLiquidity(1_000_000e6, 1_000_000e6, 0, 0, dl);
        uint amountIn = (uint(inSeed) % 500_000e6) + 1;
        uint b;
        try amm.swapAtoB(amountIn,0,dl) returns (uint o) { b = o; } catch { return; } // dust swaps revert
        if (b == 0) return;
        uint a2;
        try amm.swapBtoA(b,0,dl) returns (uint o2) { a2 = o2; } catch { return; }
        require(a2 <= amountIn, "free money");
        seed;
    }
    // fuzz: k never decreases
    function testFuzzK(uint96 x, uint96 y) public {
        amm.addLiquidity(1_000_000e6, 3_000_000e6, 0, 0, dl);
        uint k0 = amm.reserveA() * amm.reserveB();
        uint i1 = (uint(x) % 400_000e6)+1; amm.swapAtoB(i1,0,dl);
        uint i2 = (uint(y) % 400_000e6)+1; try amm.swapBtoA(i2,0,dl) {} catch {}
        require(amm.reserveA()*amm.reserveB() >= k0, "k decreased");
    }
    // fuzz: add/remove can't extract value
    function testFuzzAddRemove(uint96 a, uint96 b) public {
        amm.addLiquidity(1_000e6, 2_000e6, 0, 0, dl);
        uint ia = (uint(a) % 100_000e6) + 1e6; uint ib = (uint(b) % 100_000e6) + 1e6;
        uint a0 = Tok(USDC).balanceOf(address(this)); uint b0 = Tok(EURC).balanceOf(address(this));
        (,,uint s) = amm.addLiquidity(ia, ib, 0, 0, dl);
        amm.removeLiquidity(s,0,0,dl);
        require(Tok(USDC).balanceOf(address(this)) <= a0 && Tok(EURC).balanceOf(address(this)) <= b0, "extracted value");
    }
}

contract AmmTokenQuirks is Base {
    uint dl = type(uint).max;
    function testFeeOnTransferRejected() public {
        FeeTok f = new FeeTok(); Tok t = new Tok();
        etchTok(USDC, address(f).code); etchTok(EURC, address(t).code);
        AmmSrc.ArcSwapAMM amm = new AmmSrc.ArcSwapAMM();
        Tok(USDC).mint(address(this),1e30); Tok(EURC).mint(address(this),1e30);
        Tok(USDC).approve(address(amm), type(uint).max); Tok(EURC).approve(address(amm), type(uint).max);
        vm.expectRevert(bytes("unsupported token (fee on transfer)"));
        amm.addLiquidity(100e6,100e6,0,0,dl);
    }
    function testNoReturnTokenWorks() public {
        NoRetTok n = new NoRetTok(); etchTok(USDC, address(n).code); etchTok(EURC, address(n).code);
        AmmSrc.ArcSwapAMM amm = new AmmSrc.ArcSwapAMM();
        NoRetTok(USDC).mint(address(this),1e30); NoRetTok(EURC).mint(address(this),1e30);
        NoRetTok(USDC).approve(address(amm), type(uint).max); NoRetTok(EURC).approve(address(amm), type(uint).max);
        amm.addLiquidity(100e6,100e6,0,0,dl);
        require(amm.swapAtoB(1e6,0,dl) > 0, "swap");
    }
    function testReentrancyBlocked() public {
        Tok t = new Tok(); ReentTok r = new ReentTok();
        etchTok(USDC, address(t).code); etchTok(EURC, address(r).code);
        AmmSrc.ArcSwapAMM amm = new AmmSrc.ArcSwapAMM();
        Tok(USDC).mint(address(this),1e30); ReentTok(EURC).mint(address(this),1e30);
        Tok(USDC).approve(address(amm), type(uint).max); ReentTok(EURC).approve(address(amm), type(uint).max);
        amm.addLiquidity(1000e6,1000e6,0,0,dl);
        // when the pool sends EURC out, the token calls back into the pool
        ReentTok(EURC).arm(address(amm), abi.encodeCall(amm.swapAtoB, (1e6, 0, dl)));
        vm.expectRevert(bytes("token transfer failed")); // inner "reentrant call" revert bubbles up through the token
        amm.swapAtoB(10e6,0,dl);
    }
    function testConstructorRejectsMissingToken() public {
        // USDC address has no code in this test
        vm.expectRevert(bytes("token is not a contract"));
        new AmmSrc.ArcSwapAMM();
    }
}

contract FactoryTest is Base {
    uint dl = type(uint).max;
    function testPairLifecycle() public {
        Tok t = new Tok(); etchTok(USDC, address(t).code); etchTok(EURC, address(t).code);
        FacSrc.ArcSwapAMMFactory f = new FacSrc.ArcSwapAMMFactory();
        address p = f.createPair(USDC, EURC);
        require(f.getPair(EURC, USDC) == p && f.allPairsLength() == 1, "registry");
        vm.expectRevert(bytes("pair exists")); f.createPair(EURC, USDC);
        vm.expectRevert(bytes("zero address")); f.createPair(address(0), EURC);
        FacSrc.ArcSwapAMMPair pair = FacSrc.ArcSwapAMMPair(p);
        Tok(USDC).mint(address(this),1e30); Tok(EURC).mint(address(this),1e30);
        Tok(USDC).approve(p, type(uint).max); Tok(EURC).approve(p, type(uint).max);
        pair.addLiquidity(1000e6,1000e6,0,0,dl);
        uint out = pair.swap0to1(10e6,0,dl);
        require(out > 0, "swap");
        require(pair.swap1to0(out,0,dl) <= 10e6, "roundtrip");
        vm.expectRevert(bytes("invalid tokens")); new FacSrc.ArcSwapAMMPair(address(0), USDC);
    }
}

contract Taker {
    function approve(address spender) external { Tok(0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1).approve(spender, type(uint).max); }
    function fill(BookSrc.Orderbook b, uint id, uint amt) external { b.fillOrder(id, amt); }
}

contract BookTest is Base {
    BookSrc.Orderbook book;
    function setUp() public {
        Tok t = new Tok(); etchTok(USDC, address(t).code); etchTok(EURC, address(t).code);
        book = new BookSrc.Orderbook();
        Tok(USDC).mint(address(this),1e30); Tok(EURC).mint(address(this),1e30);
        Tok(USDC).approve(address(book), type(uint).max); Tok(EURC).approve(address(book), type(uint).max);
    }
    function testFillCannotBeFree() public {
        uint id = book.createOrder(1_000_000e6, 1); // price 1e-6 B per A
        Taker tk = new Taker();
        Tok(EURC).mint(address(tk), 10e6);
        tk.approve(address(book));
        uint b0 = Tok(EURC).balanceOf(address(tk));
        tk.fill(book, id, 1);                       // would round to 0 B before the fix
        require(b0 - Tok(EURC).balanceOf(address(tk)) >= 1, "free fill");
    }
    function testFillAndCancel() public {
        uint id = book.createOrder(100e6, 2e6);     // 2 B per A
        book.fillOrder(id, 40e6);
        (, uint left,, bool active) = book.orders(id);
        require(left == 60e6 && active, "partial");
        uint a0 = Tok(USDC).balanceOf(address(this));
        book.cancelOrder(id);
        require(Tok(USDC).balanceOf(address(this)) - a0 == 60e6, "refund");
        vm.expectRevert(bytes("inactive order")); book.fillOrder(id, 1);
    }
}
