// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// MultiSend (multisend): conservation of value and "never holds funds" as fuzz tests and invariants, with recipients that
// revert, re-enter or burn gas. Atomic by design: one failing payment reverts the whole batch.
import "../src/portable/Multisend.sol" as MsSrc;

interface Vm { function prank(address) external; function deal(address, uint256) external; function expectRevert(bytes calldata) external; function expectRevert() external; }
interface IMs {
    function multiSendToken(address, address[] calldata, uint256[] calldata) external;
    function multiSendNative(address[] calldata, uint256[] calldata) external payable;
    function MAX_RECIPIENTS() external view returns (uint256);
    function NATIVE_TRANSFER_GAS() external view returns (uint256);
}
contract Tok {
    uint8 public constant decimals = 6;
    mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
    function mint(address t,uint a) external { balanceOf[t]+=a; }
    function approve(address s,uint a) external returns(bool){ allowance[msg.sender][s]=a; return true; }
    function transferFrom(address f,address t,uint a) external returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; return true; }
}
contract Rejecter { receive() external payable { revert("no"); } }
contract Burner { receive() external payable { for (uint i; i < 1e9; i++) {} } }
contract Reentrant {
    IMs ms; bool public tried; bool public ok_;
    function set(IMs m) external { ms = m; }
    receive() external payable {
        if (tried) return; tried = true;
        address[] memory r = new address[](1); uint[] memory a = new uint[](1); r[0] = address(this); a[0] = 1;
        try ms.multiSendNative{value: 1}(r, a) { ok_ = true; } catch {}
    }
}
contract Taker { receive() external payable {} }

abstract contract Base {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function _bound(uint256 x, uint256 lo, uint256 hi) internal pure returns (uint256) { if (hi <= lo) return lo; return lo + x % (hi - lo + 1); }
}

contract MultisendFuzzTest is Base {
    IMs ms; Tok tok; address sender = address(0x5E4D);
    function setUp() public { ms = IMs(address(new MsSrc.ArcMultiSend())); tok = new Tok(); vm.deal(sender, 1e30); }
    function _list(uint8 n, uint96 seed, uint96 max) internal pure returns (address[] memory r, uint256[] memory a, uint256 total) {
        uint256 k = _bound(n, 1, 20); r = new address[](k); a = new uint256[](k);
        for (uint256 i = 0; i < k; i++) {
            r[i] = address(uint160(0x1000 + (uint256(keccak256(abi.encode(seed, i))) % 7)));      // few recipients, so duplicates happen
            a[i] = _bound(uint256(keccak256(abi.encode(seed, i, "a"))), 0, max); total += a[i];
        }
    }
    /// What leaves the sender is exactly what the recipients receive; the contract keeps nothing.
    function testFuzzTokenBatchConservesValue(uint8 n, uint96 seed) public {
        (address[] memory r, uint256[] memory a, uint256 total) = _list(n, seed, 1e12);
        tok.mint(sender, total + 5); vm.prank(sender); tok.approve(address(ms), type(uint).max);
        uint256 before; for (uint i = 0; i < 7; i++) before += tok.balanceOf(address(uint160(0x1000 + i)));
        vm.prank(sender); ms.multiSendToken(address(tok), r, a);
        uint256 afterSum; for (uint i = 0; i < 7; i++) afterSum += tok.balanceOf(address(uint160(0x1000 + i)));
        require(afterSum - before == total, "recipients received the sum");
        require(tok.balanceOf(sender) == 5, "the sender paid exactly the total");
        require(tok.balanceOf(address(ms)) == 0, "the contract holds no tokens");
    }
    /// Short allowance: nothing moves at all.
    function testFuzzTokenBatchIsAtomic(uint8 n, uint96 seed) public {
        (address[] memory r, uint256[] memory a, uint256 total) = _list(n, seed, 1e12);
        if (total == 0) return;
        tok.mint(sender, total); vm.prank(sender); tok.approve(address(ms), total - 1);
        vm.prank(sender); try ms.multiSendToken(address(tok), r, a) { require(false, "a batch went through with too little allowance"); } catch {}
        require(tok.balanceOf(sender) == total, "nothing was taken");
        for (uint i = 0; i < 7; i++) require(tok.balanceOf(address(uint160(0x1000 + i))) == 0, "nothing was paid");
    }
    function testFuzzNativeBatchConservesValue(uint8 n, uint96 seed, uint96 extra) public {
        (address[] memory r, uint256[] memory a, uint256 total) = _list(n, seed, 1e18);
        for (uint i = 0; i < 7; i++) vm.deal(address(uint160(0x1000 + i)), 0);
        uint256 sent = total + _bound(extra, 0, 1e18);
        uint256 senderBefore = sender.balance;
        vm.prank(sender); ms.multiSendNative{value: sent}(r, a);
        uint256 got; for (uint i = 0; i < 7; i++) got += address(uint160(0x1000 + i)).balance;
        require(got == total, "recipients received the sum");
        require(senderBefore - sender.balance == total, "the sender paid only the total: the change came back");
        require(address(ms).balance == 0, "the contract holds nothing");
    }
    function testFuzzNativeBatchRefusesTooLittleValue(uint8 n, uint96 seed) public {
        (address[] memory r, uint256[] memory a, uint256 total) = _list(n, seed, 1e18);
        if (total == 0) return;
        vm.prank(sender); try ms.multiSendNative{value: total - 1}(r, a) { require(false, "underfunded batch went through"); } catch {}
        require(address(ms).balance == 0, "nothing stuck");
    }
    function testMoreRecipientsThanTheLimitIsRefused() public {
        uint256 n = ms.MAX_RECIPIENTS() + 1; address[] memory r = new address[](n); uint[] memory a = new uint[](n);
        vm.prank(sender); vm.expectRevert(bytes("too many recipients")); ms.multiSendNative(r, a);
        vm.prank(sender); vm.expectRevert(bytes("too many recipients")); ms.multiSendToken(address(tok), r, a);
    }
    function testLengthMismatchIsRefused() public {
        address[] memory r = new address[](2); uint[] memory a = new uint[](1);
        vm.prank(sender); vm.expectRevert(bytes("length mismatch")); ms.multiSendNative(r, a);
        vm.prank(sender); vm.expectRevert(bytes("length mismatch")); ms.multiSendToken(address(tok), r, a);
    }
    function testATokenWithoutCodeIsRefused() public {
        address[] memory r = new address[](1); uint[] memory a = new uint[](1); r[0] = address(0x1000); a[0] = 1;
        vm.prank(sender); vm.expectRevert(bytes("token is not a contract")); ms.multiSendToken(address(0xBEEF), r, a);
    }
    function testARejectingRecipientRevertsTheWholeBatch() public {
        Rejecter bad = new Rejecter(); address[] memory r = new address[](2); uint[] memory a = new uint[](2);
        r[0] = address(0x1000); a[0] = 5; r[1] = address(bad); a[1] = 5;
        vm.prank(sender); vm.expectRevert(bytes("native transfer failed")); ms.multiSendNative{value: 10}(r, a);
        require(address(0x1000).balance == 0 && address(ms).balance == 0, "the first payment was undone");
    }
    function testAGasBurningRecipientCostsAtMostTheCap() public {
        Burner bad = new Burner(); address[] memory r = new address[](1); uint[] memory a = new uint[](1); r[0] = address(bad); a[0] = 5;
        uint256 g = gasleft();
        vm.prank(sender); try ms.multiSendNative{value: 5}(r, a) { require(false, "a burner was paid"); } catch {}
        require(g - gasleft() < ms.NATIVE_TRANSFER_GAS() + 100_000, "the burner consumed more than the cap");
    }
    function testAReenteringRecipientOnlyGetsItsOwnShare() public {
        Reentrant bad = new Reentrant(); bad.set(ms); address[] memory r = new address[](2); uint[] memory a = new uint[](2);
        r[0] = address(bad); a[0] = 100; r[1] = address(0x1001); a[1] = 100;
        vm.deal(address(bad), 0);
        vm.prank(sender); ms.multiSendNative{value: 250}(r, a);
        require(address(0x1001).balance == 100, "the other recipient was paid in full");
        require(address(ms).balance == 0, "nothing left in the contract");
        // the recipient may have re-entered with its own money; it never receives more than 100 from this batch
        require(address(bad).balance <= 100, "the re-entering recipient received more than its share");
    }
}

/* ============================== invariants ============================== */
contract MsHandler is Base {
    IMs public ms; Tok public tok; address public sender = address(0x5E4D);
    address[6] public targets;       // 4 plain receivers, 1 rejecter, 1 re-entering receiver
    uint256 public totalInTokens; uint256 public totalInNative; uint256 public batches; uint256 public failedBatches;
    constructor() {
        ms = IMs(address(new MsSrc.ArcMultiSend())); tok = new Tok();
        for (uint i = 0; i < 4; i++) targets[i] = address(new Taker());
        targets[4] = address(new Rejecter()); Reentrant re = new Reentrant(); re.set(ms); targets[5] = address(re);
        tok.mint(sender, 1e30); vm.prank(sender); tok.approve(address(ms), type(uint).max); vm.deal(sender, 1e30);
        totalInTokens = tok.balanceOf(sender); totalInNative = sender.balance;
    }
    function _build(uint8 n, uint96 seed) internal view returns (address[] memory r, uint256[] memory a) {
        uint256 k = _bound(n, 1, 12); r = new address[](k); a = new uint256[](k);
        for (uint256 i = 0; i < k; i++) { r[i] = targets[uint256(keccak256(abi.encode(seed, i))) % 6]; a[i] = _bound(uint256(keccak256(abi.encode(seed, i, "v"))), 0, 1e15); }
    }
    function sendTokens(uint8 n, uint96 seed) external { (address[] memory r, uint256[] memory a) = _build(n, seed); batches++; vm.prank(sender); try ms.multiSendToken(address(tok), r, a) {} catch { failedBatches++; } }
    function sendNative(uint8 n, uint96 seed, uint96 extra) external {
        (address[] memory r, uint256[] memory a) = _build(n, seed); uint256 t; for (uint i = 0; i < a.length; i++) t += a[i]; batches++;
        vm.prank(sender); try ms.multiSendNative{value: t + _bound(extra, 0, 1e15)}(r, a) {} catch { failedBatches++; }
    }
    function tokenSum() external view returns (uint256 s) { s = tok.balanceOf(sender) + tok.balanceOf(address(ms)); for (uint i = 0; i < 6; i++) s += tok.balanceOf(targets[i]); }
    function nativeSum() external view returns (uint256 s) { s = sender.balance + address(ms).balance; for (uint i = 0; i < 6; i++) s += targets[i].balance; }
}
contract MultisendInvariantTest {
    MsHandler h;
    struct FuzzSelector { address addr; bytes4[] selectors; }
    function setUp() public { h = new MsHandler(); }
    function targetContracts() public view returns (address[] memory t) { t = new address[](1); t[0] = address(h); }
    function targetSelectors() public view returns (FuzzSelector[] memory s) {
        s = new FuzzSelector[](1); bytes4[] memory sel = new bytes4[](2); sel[0] = MsHandler.sendTokens.selector; sel[1] = MsHandler.sendNative.selector;
        s[0] = FuzzSelector(address(h), sel);
    }
    /// The contract never ends a batch holding tokens or native currency.
    function invariant_theContractHoldsNothing() public view { require(h.tok().balanceOf(address(h.ms())) == 0 && address(h.ms()).balance == 0, "the contract kept funds"); }
    /// Value is conserved: what the sender, the contract and the recipients hold in total never changes.
    function invariant_valueIsConserved() public view {
        require(h.tokenSum() == h.totalInTokens(), "tokens appeared or vanished");
        require(h.nativeSum() == h.totalInNative(), "native currency appeared or vanished");
    }
}
