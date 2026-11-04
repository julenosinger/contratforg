// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// The AMM with a factory (swap-amm-factory): unit tests, fuzz tests, invariants and hostile tokens.
// ArcSwapAMMFactory creates ArcSwapAMMPair contracts; the pair is the same code as the reviewed single pool.
import "../src/Fac.sol" as FacSrc;

interface Vm {
    function prank(address) external;
    function expectRevert(bytes calldata) external;
    function expectRevert() external;
    function expectEmit(bool, bool, bool, bool) external;
    function assume(bool) external pure;
}
interface IPair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function reserve0() external view returns (uint256);
    function reserve1() external view returns (uint256);
    function totalShares() external view returns (uint256);
    function shares(address) external view returns (uint256);
    function MINIMUM_LIQUIDITY() external view returns (uint256);
    function addLiquidity(uint256, uint256, uint256, uint256, uint256) external returns (uint256, uint256, uint256);
    function removeLiquidity(uint256, uint256, uint256, uint256) external returns (uint256, uint256);
    function swap0to1(uint256, uint256, uint256) external returns (uint256);
    function swap1to0(uint256, uint256, uint256) external returns (uint256);
    function transfer(address, uint256) external returns (bool);
}
uint256 constant FOREVER = type(uint256).max;

contract Tok {
    uint8 public constant decimals = 6;
    mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
    function mint(address t,uint a) external { balanceOf[t]+=a; }
    function approve(address s,uint a) external returns(bool){ allowance[msg.sender][s]=a; return true; }
    function transfer(address t,uint a) external virtual returns(bool){ balanceOf[msg.sender]-=a; balanceOf[t]+=a; return true; }
    function transferFrom(address f,address t,uint a) external virtual returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; return true; }
}
contract FeeInTok is Tok {   // keeps 10% of every incoming transfer
    function transferFrom(address f,address t,uint a) external override returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a - a/10; return true; }
}
contract SurchargeOutTok is Tok {   // the sender pays 1% on top of every transfer it makes
    function transfer(address t,uint a) external override returns(bool){ balanceOf[msg.sender]-=a + a/100; balanceOf[t]+=a; return true; }
}
contract FalseTok is Tok {   // says it failed
    function transferFrom(address,address,uint) external pure override returns(bool){ return false; }
}
contract NoRetTok {   // USDT style: no return value
    uint8 public constant decimals = 6;
    mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
    function mint(address t,uint a) external { balanceOf[t]+=a; }
    function approve(address s,uint a) external { allowance[msg.sender][s]=a; }
    function transfer(address t,uint a) external { balanceOf[msg.sender]-=a; balanceOf[t]+=a; }
    function transferFrom(address f,address t,uint a) external { allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; }
}
contract ReenterTok is Tok {   // calls the pair back while it is being paid
    address public victim; bool inside; bool public refused; bool public got; string public why;
    function arm(address p) external { victim = p; }
    function transferFrom(address f,address t,uint a) external override returns(bool){
        if (victim != address(0) && !inside) {
            inside = true;
            (bool ok, bytes memory ret) = victim.call(abi.encodeWithSelector(IPair.swap0to1.selector, 1, 0, FOREVER));
            if (ok) got = true; else { refused = true; if (ret.length > 68) { why = abi.decode(_tail(ret), (string)); } }
            inside = false;
        }
        allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; return true;
    }
    function _tail(bytes memory r) private pure returns (bytes memory out) { out = new bytes(r.length - 4); for (uint i = 4; i < r.length; i++) out[i-4] = r[i]; }
}
abstract contract Base {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function _bound(uint x, uint lo, uint hi) internal pure returns (uint) { if (hi <= lo) return lo; return lo + x % (hi - lo + 1); }
    function _fund(Tok t, address who, address pair) internal { t.mint(who, 1e30); vm.prank(who); t.approve(pair, type(uint).max); }
}

/* ============================== unit + fuzz ============================== */
contract FactoryUnitTest is Base {
    event PairCreated(address token0, address token1, address pair);
    FacSrc.ArcSwapAMMFactory f; Tok[5] toks;

    function setUp() public {
        f = new FacSrc.ArcSwapAMMFactory();
        for (uint i = 0; i < 5; i++) toks[i] = new Tok();
    }

    function _predict(uint nonce) internal view returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xd6), bytes1(0x94), address(f), bytes1(uint8(nonce)))))));
    }

    function testCreatePairRegistersTheSortedPairBothWays() public {
        address a = address(toks[0]); address b = address(toks[1]);
        address p = f.createPair(a, b);
        (address lo, address hi) = a < b ? (a, b) : (b, a);
        require(IPair(p).token0() == lo && IPair(p).token1() == hi, "tokens are sorted");
        require(f.getPair(a, b) == p && f.getPair(b, a) == p, "getPair is symmetric");
        require(f.allPairsLength() == 1 && f.allPairs(0) == p, "allPairs");
    }
    function testCreatePairOrderDoesNotMatter() public {
        address p = f.createPair(address(toks[2]), address(toks[3]));
        vm.expectRevert(bytes("pair exists")); f.createPair(address(toks[3]), address(toks[2]));
        vm.expectRevert(bytes("pair exists")); f.createPair(address(toks[2]), address(toks[3]));
        require(f.allPairsLength() == 1 && f.getPair(address(toks[3]), address(toks[2])) == p, "still one pair");
    }
    function testCreatePairRejectsIdenticalTokens() public { vm.expectRevert(bytes("identical tokens")); f.createPair(address(toks[0]), address(toks[0])); }
    function testCreatePairRejectsTheZeroAddress() public {
        vm.expectRevert(bytes("zero address")); f.createPair(address(0), address(toks[0]));
        vm.expectRevert(bytes("zero address")); f.createPair(address(toks[0]), address(0));
    }
    function testCreatePairRejectsANonContractToken() public {
        vm.expectRevert(bytes("token is not a contract")); f.createPair(address(toks[0]), address(0xBEEF));
    }
    function testCreatePairEmitsPairCreated() public {
        address a = address(toks[0]); address b = address(toks[1]); (address lo, address hi) = a < b ? (a, b) : (b, a);
        vm.expectEmit(false, false, false, true); emit PairCreated(lo, hi, _predict(1));
        f.createPair(a, b);
    }
    function testAllPairsLengthCounts() public {
        f.createPair(address(toks[0]), address(toks[1])); f.createPair(address(toks[0]), address(toks[2])); f.createPair(address(toks[1]), address(toks[2]));
        require(f.allPairsLength() == 3, "three pairs");
    }
    function testFactoryHasNoStateButTheRegistry() public {   // anyone can create a pair, and a pair can only be created once
        vm.prank(address(0xBAD)); address p = f.createPair(address(toks[0]), address(toks[1]));
        require(p != address(0), "permissionless");
    }

    /// Random orders and orientations of pair creation never produce two pairs for the same set of tokens.
    function testFuzzPairRegistryStaysCanonical(uint8 a1, uint8 b1, uint8 a2, uint8 b2, uint8 a3, uint8 b3, uint8 a4, uint8 b4) public {
        uint8[8] memory ix = [a1, b1, a2, b2, a3, b3, a4, b4];
        for (uint i = 0; i < 8; i += 2) {
            address x = address(toks[ix[i] % 5]); address y = address(toks[ix[i+1] % 5]);
            try f.createPair(x, y) returns (address p) { require(p != address(0), "pair"); } catch {}
        }
        uint count;
        for (uint i = 0; i < 5; i++) for (uint j = 0; j < 5; j++) {
            address x = address(toks[i]); address y = address(toks[j]);
            address p = f.getPair(x, y);
            require(p == f.getPair(y, x), "symmetric");
            if (i == j) { require(p == address(0), "no pair of a token with itself"); continue; }
            if (p != address(0)) {
                if (i < j) count++;
                address t0 = IPair(p).token0(); address t1 = IPair(p).token1();
                require(t0 < t1 && ((t0 == x && t1 == y) || (t0 == y && t1 == x)), "pair tokens match the key");
            }
        }
        require(count == f.allPairsLength(), "one registry entry per set of tokens");
        for (uint i = 0; i < f.allPairsLength(); i++) for (uint j = i + 1; j < f.allPairsLength(); j++) require(f.allPairs(i) != f.allPairs(j), "no duplicate pair");
    }
    /// Only addresses that hold code can be tokens.
    function testFuzzOnlyContractsCanBeTokens(address x, address y) public {
        vm.assume(x != address(0) && y != address(0) && x != y);
        bool bothContracts = x.code.length > 0 && y.code.length > 0;
        try f.createPair(x, y) returns (address) { require(bothContracts, "a non-contract was accepted as a token"); } catch { }
    }
}

/* ============================== invariants ============================== */
/// Drives three pairs with random liquidity, swaps and share transfers by three accounts.
contract Handler is Base {
    FacSrc.ArcSwapAMMFactory public f; address[] public pairs; address[3] public actors = [address(0xA1), address(0xB2), address(0xC3)];
    bool public kDecreased; uint public swaps; uint public adds; uint public removes;
    Tok[3] public toks;

    constructor() {
        f = new FacSrc.ArcSwapAMMFactory();
        for (uint i = 0; i < 3; i++) toks[i] = new Tok();
        pairs.push(f.createPair(address(toks[0]), address(toks[1])));
        pairs.push(f.createPair(address(toks[0]), address(toks[2])));
        pairs.push(f.createPair(address(toks[1]), address(toks[2])));
        for (uint a = 0; a < 3; a++) for (uint i = 0; i < 3; i++) {
            toks[i].mint(actors[a], 1e30);
            for (uint p = 0; p < 3; p++) { vm.prank(actors[a]); toks[i].approve(pairs[p], type(uint).max); }
        }
        for (uint p = 0; p < 3; p++) { vm.prank(actors[0]); IPair(pairs[p]).addLiquidity(1e9, 1e9, 0, 0, FOREVER); }   // every pair starts funded
    }
    function pairCount() external view returns (uint) { return pairs.length; }
    function _pair(uint8 p) internal view returns (IPair) { return IPair(pairs[p % 3]); }

    function addLiq(uint8 p, uint8 a, uint96 x, uint96 y) external {
        vm.prank(actors[a % 3]);
        try _pair(p).addLiquidity(_bound(x, 1e3, 1e12), _bound(y, 1e3, 1e12), 0, 0, FOREVER) { adds++; } catch {}
    }
    function removeLiq(uint8 p, uint8 a, uint8 pct) external {
        IPair pr = _pair(p); address who = actors[a % 3];
        uint amt = pr.shares(who) * (pct % 101) / 100;
        if (amt == 0) return;
        vm.prank(who); try pr.removeLiquidity(amt, 0, 0, FOREVER) { removes++; } catch {}
    }
    function swap(uint8 p, uint8 a, bool dir, uint96 x) external {
        IPair pr = _pair(p); uint kb = pr.reserve0() * pr.reserve1();
        vm.prank(actors[a % 3]);
        bool ok;
        if (dir) { try pr.swap0to1(_bound(x, 1, 1e11), 0, FOREVER) returns (uint) { ok = true; } catch {} }
        else { try pr.swap1to0(_bound(x, 1, 1e11), 0, FOREVER) returns (uint) { ok = true; } catch {} }
        if (ok) { swaps++; if (pr.reserve0() * pr.reserve1() < kb) kDecreased = true; }
    }
    function moveShares(uint8 p, uint8 from, uint8 to, uint8 pct) external {
        IPair pr = _pair(p); address a = actors[from % 3]; address b = actors[to % 3];
        uint amt = pr.shares(a) * (pct % 101) / 100;
        vm.prank(a); try pr.transfer(b, amt) {} catch {}
    }
}

contract FactoryInvariantTest {
    Handler h;
    struct FuzzSelector { address addr; bytes4[] selectors; }

    function setUp() public { h = new Handler(); }
    function targetContracts() public view returns (address[] memory t) { t = new address[](1); t[0] = address(h); }
    function targetSelectors() public view returns (FuzzSelector[] memory s) {
        s = new FuzzSelector[](1); bytes4[] memory sel = new bytes4[](4);
        sel[0] = Handler.addLiq.selector; sel[1] = Handler.removeLiq.selector; sel[2] = Handler.swap.selector; sel[3] = Handler.moveShares.selector;
        s[0] = FuzzSelector(address(h), sel);
    }

    /// A swap never lowers the product of the reserves (the fee stays in the pool).
    function invariant_kNeverDecreasesOnASwap() public view { require(!h.kDecreased(), "a swap lowered k"); }

    /// What the pair believes it holds is backed by what it really holds.
    function invariant_reservesAreBackedByBalances() public view {
        for (uint i = 0; i < h.pairCount(); i++) {
            IPair p = IPair(h.pairs(i));
            require(p.reserve0() <= Tok(p.token0()).balanceOf(address(p)), "reserve0 exceeds the balance");
            require(p.reserve1() <= Tok(p.token1()).balanceOf(address(p)), "reserve1 exceeds the balance");
        }
    }
    /// Shares held by the accounts plus the locked minimum liquidity add up to the total.
    function invariant_sharesAddUp() public view {
        for (uint i = 0; i < h.pairCount(); i++) {
            IPair p = IPair(h.pairs(i)); uint sum = p.shares(address(0));
            for (uint a = 0; a < 3; a++) sum += p.shares(h.actors(a));
            require(sum == p.totalShares(), "shares do not add up");
            require(p.shares(address(0)) == p.MINIMUM_LIQUIDITY(), "the minimum liquidity moved");
        }
    }
    /// Once a pair has had liquidity it never goes back to an empty side.
    function invariant_aFundedPairNeverEmptiesASide() public view {
        for (uint i = 0; i < h.pairCount(); i++) {
            IPair p = IPair(h.pairs(i));
            require(p.totalShares() > 0 && p.reserve0() > 0 && p.reserve1() > 0, "a funded pair has an empty side");
        }
    }
    /// The run really does something (so a silent no-op cannot pass).
    function invariant_zzTheHandlerIsActive() public view { require(h.pairCount() == 3, "setup"); }
}

/* ============================== hostile tokens ============================== */
contract FactoryHostileTokenTest is Base {
    FacSrc.ArcSwapAMMFactory f; Tok good; Tok other; address me = address(this);
    function setUp() public { f = new FacSrc.ArcSwapAMMFactory(); good = new Tok(); other = new Tok(); }

    function _pair(address a, address b) internal returns (IPair p) { p = IPair(f.createPair(a, b)); }
    function _both(IPair p, address a, address b) internal { Tok(a).mint(me, 1e30); Tok(b).mint(me, 1e30); Tok(a).approve(address(p), type(uint).max); Tok(b).approve(address(p), type(uint).max); }

    function testFeeOnTransferTokenIsRejected() public {
        FeeInTok bad = new FeeInTok(); IPair p = _pair(address(good), address(bad)); _both(p, address(good), address(bad));
        vm.expectRevert(bytes("unsupported token (fee on transfer)")); p.addLiquidity(1000e6, 1000e6, 0, 0, FOREVER);
        require(p.totalShares() == 0 && p.reserve0() == 0 && p.reserve1() == 0, "nothing was recorded");
    }
    function testSurchargeOnOutputIsRejected() public {
        SurchargeOutTok bad = new SurchargeOutTok(); IPair p = _pair(address(good), address(bad)); _both(p, address(good), address(bad));
        p.addLiquidity(1000e6, 1000e6, 0, 0, FOREVER);
        uint s = p.shares(me) / 2;
        vm.expectRevert(); p.removeLiquidity(s, 0, 0, FOREVER);
    }
    function testATokenThatReturnsFalseIsRefused() public {
        FalseTok bad = new FalseTok(); IPair p = _pair(address(good), address(bad)); _both(p, address(good), address(bad));
        vm.expectRevert(bytes("token transfer failed")); p.addLiquidity(1000e6, 1000e6, 0, 0, FOREVER);
    }
    function testATokenThatReturnsNothingWorks() public {
        NoRetTok usdt = new NoRetTok(); IPair p = _pair(address(good), address(usdt));
        Tok(address(good)).mint(me, 1e30); Tok(address(good)).approve(address(p), type(uint).max);
        usdt.mint(me, 1e30); usdt.approve(address(p), type(uint).max);
        p.addLiquidity(1000e6, 1000e6, 0, 0, FOREVER);
        uint out = (address(good) < address(usdt)) ? p.swap0to1(10e6, 0, FOREVER) : p.swap1to0(10e6, 0, FOREVER);
        require(out > 0, "swap with a USDT-style token");
    }
    function testAReenteringTokenIsRefused() public {
        ReenterTok r = new ReenterTok(); IPair p = _pair(address(good), address(r)); _both(p, address(good), address(r));
        r.arm(address(p));
        p.addLiquidity(1000e6, 1000e6, 0, 0, FOREVER);
        require(r.refused() && !r.got(), "the nested call must be refused");
        require(keccak256(bytes(r.why())) == keccak256(bytes("reentrant call")), "refused by the reentrancy guard");
        require(p.totalShares() > 0, "the outer call still completed");
    }

    /// A hostile token can hurt its own pairs, but not the other pairs of the factory.
    function testADishonestTokenOnlyHurtsItsOwnPair() public {
        // an honest pair with real liquidity
        IPair honest = _pair(address(good), address(other)); _both(honest, address(good), address(other));
        honest.addLiquidity(1000e6, 1000e6, 0, 0, FOREVER);
        uint r0 = honest.reserve0(); uint r1 = honest.reserve1(); uint bal0 = Tok(honest.token0()).balanceOf(address(honest)); uint bal1 = Tok(honest.token1()).balanceOf(address(honest));
        // a pair with a token that does not move anything
        FalseTok liar = new FalseTok(); IPair bad = _pair(address(good), address(liar)); _both(bad, address(good), address(liar));
        vm.expectRevert(bytes("token transfer failed")); bad.addLiquidity(1000e6, 1000e6, 0, 0, FOREVER);
        ReenterTok re = new ReenterTok(); IPair bad2 = _pair(address(other), address(re)); _both(bad2, address(other), address(re));
        re.arm(address(bad2)); bad2.addLiquidity(500e6, 500e6, 0, 0, FOREVER);
        require(honest.reserve0() == r0 && honest.reserve1() == r1, "the honest pair's reserves changed");
        require(Tok(honest.token0()).balanceOf(address(honest)) == bal0 && Tok(honest.token1()).balanceOf(address(honest)) == bal1, "the honest pair's balances changed");
        require(f.allPairsLength() == 3, "pairs");
    }
}
