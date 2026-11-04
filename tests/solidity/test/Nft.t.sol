// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// The ERC-721 collection (erc721): fuzz tests and invariants for supply, ownership, approvals and safe transfers,
// including a hostile payment token that calls mint() back.
import "../src/portable/NftFive.sol" as FiveSrc;
import "../src/portable/Nft.sol" as NftSrc;

interface Vm { function prank(address) external; function expectRevert(bytes calldata) external; function expectRevert() external; }
interface INft {
    function mint() external returns (uint256);
    function totalSupply() external view returns (uint256);
    function MAX_SUPPLY() external view returns (uint256);
    function ownerOf(uint256) external view returns (address);
    function balanceOf(address) external view returns (uint256);
    function getApproved(uint256) external view returns (address);
    function isApprovedForAll(address, address) external view returns (bool);
    function approve(address, uint256) external;
    function setApprovalForAll(address, bool) external;
    function transferFrom(address, address, uint256) external;
    function safeTransferFrom(address, address, uint256) external;
    function supportsInterface(bytes4) external view returns (bool);
}
contract Tok {
    uint8 public constant decimals = 6;
    mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
    function mint(address t,uint a) external { balanceOf[t]+=a; }
    function approve(address s,uint a) external returns(bool){ allowance[msg.sender][s]=a; return true; }
    function transferFrom(address f,address t,uint a) external virtual returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; return true; }
}
/// calls mint() on the collection while it is being paid (and pays for that call itself)
contract HostileTok is Tok {
    address public nft; bool inside; uint public attempts;
    function arm(address n) external { nft = n; }
    function transferFrom(address f,address t,uint a) external override returns(bool){
        if (nft != address(0) && !inside) { inside = true; attempts++; (bool ok,) = nft.call(abi.encodeWithSignature("mint()")); ok; inside = false; }
        if (f != address(this)) allowance[f][msg.sender] -= a;
        balanceOf[f] -= a; balanceOf[t] += a; return true;
    }
}
contract GoodReceiver { function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) { return 0x150b7a02; } }
contract BadReceiver { function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) { return 0xdeadbeef; } }
contract NoReceiver {}

abstract contract Base {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function _bound(uint256 x, uint256 lo, uint256 hi) internal pure returns (uint256) { if (hi <= lo) return lo; return lo + x % (hi - lo + 1); }
}

contract NftFuzzTest is Base {
    Tok tok; INft nft; address a = address(0xA11CE); address b = address(0xB0B); address c = address(0xCA401);
    function setUp() public {
        tok = new Tok(); nft = INft(address(new FiveSrc.ArcOriginals(address(tok))));
        address[3] memory who = [a, b, c];
        for (uint i = 0; i < 3; i++) { tok.mint(who[i], 1e12); vm.prank(who[i]); tok.approve(address(nft), type(uint).max); }
    }
    function _mintTo(address who) internal returns (uint256 id) { vm.prank(who); id = nft.mint(); }

    function testSupplyStopsAtMaxSupply() public {
        for (uint i = 0; i < 5; i++) _mintTo(a);
        vm.prank(a); vm.expectRevert(bytes("sold out")); nft.mint();
        require(nft.totalSupply() == 5 && nft.balanceOf(a) == 5, "five minted");
    }
    function testTokenIdsAreSequentialAndOwned() public {
        for (uint i = 1; i <= 3; i++) { uint id = _mintTo(i % 2 == 0 ? a : b); require(id == i && nft.ownerOf(id) == (i % 2 == 0 ? a : b), "id and owner"); }
        vm.expectRevert(bytes("nonexistent token")); nft.ownerOf(4);
        vm.expectRevert(bytes("nonexistent token")); nft.ownerOf(0);
    }
    /// Only the owner, the approved address or an operator can move a token; everybody else is refused.
    function testFuzzTransferNeedsAuthorisation(address caller, address to, uint8 how) public {
        uint256 id = _mintTo(a);
        address operator = address(0x0BE7); address approved = address(0xA77);
        if (how % 3 == 1) { vm.prank(a); nft.approve(approved, id); }
        if (how % 3 == 2) { vm.prank(a); nft.setApprovalForAll(operator, true); }
        bool allowed = caller == a || (how % 3 == 1 && caller == approved) || (how % 3 == 2 && caller == operator);
        bool toOk = to != address(0);
        vm.prank(caller);
        try nft.transferFrom(a, to, id) {
            require(allowed && toOk, "an unauthorised transfer succeeded");
            require(nft.ownerOf(id) == to && nft.getApproved(id) == address(0), "owner moved and approval cleared");
        } catch { require(!(allowed && toOk), "an authorised transfer was refused"); }
    }
    /// A transfer from somebody who is not the owner never works, even for an operator of another owner.
    function testFuzzCannotTransferFromTheWrongOwner(address from) public {
        uint256 id = _mintTo(a); vm.prank(a); nft.setApprovalForAll(b, true);
        if (from == a) return;
        vm.prank(b); try nft.transferFrom(from, c, id) { require(false, "moved a token from a non-owner"); } catch {}
    }
    function testApprovalsAreClearedByATransfer() public {
        uint256 id = _mintTo(a); vm.prank(a); nft.approve(b, id);
        vm.prank(a); nft.transferFrom(a, c, id);
        require(nft.getApproved(id) == address(0), "cleared");
        vm.prank(b); vm.expectRevert(bytes("not authorized")); nft.transferFrom(c, b, id);
    }
    function testSafeTransferChecksTheReceiver() public {
        uint256 id = _mintTo(a);
        GoodReceiver good = new GoodReceiver(); BadReceiver bad = new BadReceiver(); NoReceiver none = new NoReceiver();
        vm.prank(a); vm.expectRevert(); nft.safeTransferFrom(a, address(none), id);
        vm.prank(a); vm.expectRevert(bytes("unsafe recipient")); nft.safeTransferFrom(a, address(bad), id);
        vm.prank(a); nft.safeTransferFrom(a, address(good), id);
        require(nft.ownerOf(id) == address(good), "delivered to a contract that accepts");
    }
    function testNoTransferToZeroAndNoSelfApproval() public {
        uint256 id = _mintTo(a);
        vm.prank(a); vm.expectRevert(); nft.transferFrom(a, address(0), id);
        vm.prank(a); vm.expectRevert(bytes("approval to current owner")); nft.approve(a, id);
        vm.prank(a); vm.expectRevert(); nft.setApprovalForAll(a, true);
    }
    function testInterfaces() public view {
        require(nft.supportsInterface(0x01ffc9a7) && nft.supportsInterface(0x80ac58cd) && nft.supportsInterface(0x5b5e139f) && nft.supportsInterface(0x2a55205a), "erc165, 721, metadata, 2981");
        require(!nft.supportsInterface(0xffffffff), "not 0xffffffff");
    }
    /// With the default 10,000 supply and a hostile token, a nested mint is refused and the supply stays consistent.
    function testFuzzHostileTokenCannotReenter(uint8 mints) public {
        HostileTok h = new HostileTok(); INft n = INft(address(new NftSrc.ArcOriginals(address(h))));
        h.arm(address(n)); h.mint(address(h), 1e15);
        uint256 k = _bound(mints, 1, 6);
        for (uint i = 0; i < k; i++) { h.mint(a, 1e9); vm.prank(a); h.approve(address(n), type(uint).max); vm.prank(a); n.mint(); }
        require(n.totalSupply() == k && n.balanceOf(a) == k, "only the outer mints happened");
        require(n.balanceOf(address(h)) == 0, "the token never got a nested mint");
    }
}

/* ============================== invariants ============================== */
contract NftHandler is Base {
    HostileTok public hostile; Tok public good; INft public nft; INft public nftHostile;
    address[4] public actors = [address(0xA1), address(0xB2), address(0xC3), address(0xD4)];
    uint256 public mintedGood; uint256 public mintedHostile;
    constructor() {
        good = new Tok(); nft = INft(address(new FiveSrc.ArcOriginals(address(good))));
        hostile = new HostileTok(); nftHostile = INft(address(new FiveSrc.ArcOriginals(address(hostile))));
        hostile.arm(address(nftHostile)); hostile.mint(address(hostile), 1e18);
        for (uint i = 0; i < 4; i++) {
            good.mint(actors[i], 1e15); hostile.mint(actors[i], 1e15);
            vm.prank(actors[i]); good.approve(address(nft), type(uint).max); vm.prank(actors[i]); hostile.approve(address(nftHostile), type(uint).max);
        }
    }
    function mint(uint8 a, bool onHostile) external {
        INft n = onHostile ? nftHostile : nft; vm.prank(actors[a % 4]);
        try n.mint() { if (onHostile) mintedHostile++; else mintedGood++; } catch {}
    }
    function transfer(uint8 from, uint8 to, uint8 idx, bool onHostile) external {
        INft n = onHostile ? nftHostile : nft; uint256 s = n.totalSupply(); if (s == 0) return; uint256 id = 1 + idx % s;
        vm.prank(actors[from % 4]); try n.transferFrom(actors[from % 4], actors[to % 4], id) {} catch {}
        vm.prank(actors[from % 4]); try n.transferFrom(n.ownerOf(id), actors[to % 4], id) {} catch {}    // an operator or approved caller, when allowed
    }
    function approve(uint8 owner, uint8 spender, uint8 idx, bool all) external {
        uint256 s = nft.totalSupply(); if (s == 0) return; uint256 id = 1 + idx % s;
        vm.prank(actors[owner % 4]); if (all) { try nft.setApprovalForAll(actors[spender % 4], idx % 2 == 0) {} catch {} } else { try nft.approve(actors[spender % 4], id) {} catch {} }
    }
}
contract NftInvariantTest {
    NftHandler h;
    struct FuzzSelector { address addr; bytes4[] selectors; }
    function setUp() public { h = new NftHandler(); }
    function targetContracts() public view returns (address[] memory t) { t = new address[](1); t[0] = address(h); }
    function targetSelectors() public view returns (FuzzSelector[] memory s) {
        s = new FuzzSelector[](1); bytes4[] memory sel = new bytes4[](3);
        sel[0] = NftHandler.mint.selector; sel[1] = NftHandler.transfer.selector; sel[2] = NftHandler.approve.selector;
        s[0] = FuzzSelector(address(h), sel);
    }
    function _check(INft n, uint256 minted) internal view {
        require(n.totalSupply() <= n.MAX_SUPPLY(), "supply above MAX_SUPPLY");
        require(n.totalSupply() == minted, "supply and mints disagree");
        uint256 held;
        for (uint256 i = 0; i < 4; i++) held += n.balanceOf(h.actors(i));
        require(held == n.totalSupply(), "balances do not add up to the supply");
        for (uint256 id = 1; id <= n.totalSupply(); id++) {
            address o = n.ownerOf(id); require(o != address(0), "a minted token has no owner");
            bool known; for (uint256 i = 0; i < 4; i++) if (h.actors(i) == o) known = true; require(known, "owner outside the accounts");
        }
        require(n.totalSupply() == 5 || n.MAX_SUPPLY() == 5, "setup");
    }
    /// No collection ever holds more tokens than MAX_SUPPLY, balances add up, every minted id has exactly one owner.
    function invariant_supplyAndOwnership() public view { _check(h.nft(), h.mintedGood()); }
    /// The same with a payment token that calls mint() back on every payment.
    function invariant_supplyAndOwnershipWithAHostileToken() public view {
        _check(h.nftHostile(), h.mintedHostile());
        require(h.nftHostile().balanceOf(address(h.hostile())) == 0, "the hostile token got a token through re-entry");
    }
}
