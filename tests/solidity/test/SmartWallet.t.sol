// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/single/Wallet.sol" as SingleSrc;
import "../src/single/WalletZeroGuardian.sol" as ZeroGuardianSrc;
import "../src/portable/Wallet.sol" as PortableSrc;

interface Vm {
    function prank(address) external;
    function startPrank(address) external;
    function stopPrank() external;
    function deal(address, uint256) external;
    function warp(uint256) external;
    function expectRevert(bytes calldata) external;
    function expectRevert(bytes4) external;
    function expectRevert() external;
    function expectEmit(bool, bool, bool, bool) external;
    function addr(uint256) external returns (address);
    function sign(uint256, bytes32) external returns (uint8, bytes32, bytes32);
}

/// What the tests need from the generated wallet (same for the single and the portable build).
interface IW {
    error NotOwner();
    error NotAuthorised();
    error Reentrancy();
    error LengthMismatch();
    error InvalidSessionKey();
    error InvalidDuration();
    error InvalidTargets();
    error TargetNotAllowed(address target);
    error ForbiddenTarget();
    error ForbiddenCall(bytes4 selector);
    error InvalidCalldata();
    error DailyLimitExceeded(uint256 requested, uint256 available);
    error NotAContract(address target);
    error CallFailed();
    error InvalidGuardian();
    error InvalidOwner();
    error InvalidLimit();
    error InvalidDelay();
    error NotGuardian();
    error NotPendingOwner();
    error RecoveryAlreadyPending();
    error NoRecoveryPending();
    error RecoveryNotReady(uint256 activationTime);

    event Received(address indexed from, uint256 value);

    function owner() external view returns (address);
    function guardian() external view returns (address);
    function pendingOwner() external view returns (address);
    function DAILY_LIMIT() external view returns (uint256);
    function MAX_SESSION_DURATION() external view returns (uint256);
    function sessionGeneration() external view returns (uint256);
    function sessionKeys(address) external view returns (uint256);
    function isValidSessionKey(address) external view returns (bool);
    function isTargetAllowed(address, address) external view returns (bool);
    function remainingDailyAllowance() external view returns (uint256);
    function recoveryDelay() external view returns (uint256);
    function recoveryCandidate() external view returns (address);
    function recoveryStartedBy() external view returns (address);
    function recoveryActivationTime() external view returns (uint256);
    function execute(address, uint256, bytes calldata) external returns (bytes memory);
    function executeBatch(address[] calldata, uint256[] calldata, bytes[] calldata) external;
    function addSessionKey(address, uint256, address[] calldata) external;
    function revokeSessionKey(address) external;
    function initiateRecovery(address) external;
    function cancelRecovery() external;
    function executeRecovery() external;
    function setRecoveryDelay(uint256) external;
    function setGuardian(address) external;
    function transferOwnership(address) external;
    function acceptOwnership() external;
    function cancelOwnershipTransfer() external;
    function isValidSignature(bytes32, bytes calldata) external view returns (bytes4);
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4);
    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4);
    function supportsInterface(bytes4) external pure returns (bool);
}

contract Sink {
    uint256 public count;
    uint256 public received;
    function ping() external { count += 1; }
    function pay() external payable { received += msg.value; count += 1; }
    function boom() external pure { revert("sink says no"); }
}

contract Tok {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    function mint(address to, uint256 v) external { balanceOf[to] += v; }
    function transfer(address to, uint256 v) external returns (bool) { balanceOf[msg.sender] -= v; balanceOf[to] += v; return true; }
    function approve(address s, uint256 v) external returns (bool) { allowance[msg.sender][s] = v; return true; }
    function transferFrom(address f, address t, uint256 v) external returns (bool) { balanceOf[f] -= v; balanceOf[t] += v; return true; }
    function increaseAllowance(address s, uint256 v) external returns (bool) { allowance[msg.sender][s] += v; return true; }
    function setApprovalForAll(address, bool) external {}
    function safeTransferFrom(address, address, uint256) external {}
    function harmless() external pure returns (uint256) { return 7; }
}

contract Nft721 {
    function safeMint(address to, uint256 id) external {
        require(IW(to).onERC721Received(msg.sender, address(0), id, "") == 0x150b7a02, "rejected");
    }
}
contract Nft1155 {
    function mint(address to, uint256 id, uint256 amt) external {
        require(IW(to).onERC1155Received(msg.sender, address(0), id, amt, "") == 0xf23a6e61, "rejected");
    }
}

/// A target that calls back into the wallet while the wallet is still running a call.
contract Reenter {
    IW public wallet; bool public tried; bool public blocked;
    constructor(IW w) { wallet = w; }
    function attack() external {
        tried = true;
        try wallet.execute(address(this), 0, abi.encodeWithSignature("noop()")) {} catch (bytes memory err) {
            blocked = err.length >= 4 && bytes4(err) == IW.Reentrancy.selector;
            // pass the reason up so the test can see what the wallet answered
            assembly { revert(add(err, 32), mload(err)) }
        }
    }
    function attackBatch() external {
        address[] memory t = new address[](1); uint256[] memory v = new uint256[](1); bytes[] memory d = new bytes[](1);
        t[0] = address(this);
        try wallet.executeBatch(t, v, d) {} catch (bytes memory err) { assembly { revert(add(err, 32), mload(err)) } }
    }
    function noop() external {}
}

abstract contract WalletBase {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    uint256 constant OWNER_PK = 0xA11CE;
    uint256 constant OTHER_PK = 0xB0B;
    address OWNER; address KEY; address KEY2; address STRANGER; address NEWOWNER;
    IW w; Sink sink; Tok tok; uint256 L;

    function _deploy(address deployer) internal virtual returns (address);

    function setUp() public {
        OWNER = vm.addr(OWNER_PK); KEY = address(0xCA11); KEY2 = address(0xCA12); STRANGER = address(0xBAD); NEWOWNER = address(0x4E77);
        w = IW(_deploy(OWNER));
        sink = new Sink(); tok = new Tok();
        L = w.DAILY_LIMIT();
        vm.deal(address(w), 10_000 ether);
        vm.deal(OWNER, 1 ether);
    }

    function _targets(address a) internal pure returns (address[] memory t) { t = new address[](1); t[0] = a; }
    function _two(address a, address b) internal pure returns (address[] memory t) { t = new address[](2); t[0] = a; t[1] = b; }
    function _addKey(address key, address target, uint256 hrs) internal {
        vm.prank(OWNER); w.addSessionKey(key, hrs, _targets(target));
    }
    function _pay() internal pure returns (bytes memory) { return abi.encodeCall(Sink.pay, ()); }
    function _spendAs(address key, uint256 amount) internal { vm.prank(key); w.execute(address(sink), amount, _pay()); }
    function _canSpend(address key, uint256 amount) internal returns (bool ok) {
        vm.prank(key);
        try w.execute(address(sink), amount, _pay()) { ok = true; } catch { ok = false; }
    }

    // ---------------------------------------------------------------- basics

    function testConfiguredValues() public view {
        require(w.owner() == OWNER, "deployer is the owner");
        require(w.guardian() != address(0) && w.guardian() != OWNER, "guardian set");
        require(L == 100 ether, "100 native units of 18 decimals");
        require(w.recoveryDelay() == 2 days, "default recovery delay");
        require(w.MAX_SESSION_DURATION() == 30 days, "30 days");
        require(w.remainingDailyAllowance() == L, "bucket starts full");
    }

    function testOwnerIsNotLimited() public {
        vm.prank(OWNER); w.execute(address(sink), 5000 ether, _pay());
        require(sink.received() == 5000 ether, "owner spent far more than the daily limit");
    }

    function testStrangerCannotExecute() public {
        vm.prank(STRANGER); vm.expectRevert(IW.NotAuthorised.selector); w.execute(address(sink), 0, abi.encodeCall(Sink.ping, ()));
    }

    function testCallRevertReasonPassesThrough() public {
        vm.prank(OWNER); vm.expectRevert(bytes("sink says no")); w.execute(address(sink), 0, abi.encodeCall(Sink.boom, ()));
    }

    function testCallWithDataToNonContractReverts() public {
        vm.prank(OWNER); vm.expectRevert(abi.encodeWithSelector(IW.NotAContract.selector, address(0x1234)));
        w.execute(address(0x1234), 0, hex"12345678");
    }

    function testOwnerCanSendPlainNative() public {
        vm.prank(OWNER); w.execute(address(0x1234), 1 ether, "");
        require(address(0x1234).balance == 1 ether, "native sent");
    }

    // ---------------------------------------------------------- daily limit

    function testSessionKeyRespectsTheLimit() public {
        _addKey(KEY, address(sink), 24);
        _spendAs(KEY, L);
        require(w.remainingDailyAllowance() == 0, "emptied");
        vm.prank(KEY); vm.expectRevert(abi.encodeWithSelector(IW.DailyLimitExceeded.selector, 1, 0));
        w.execute(address(sink), 1, _pay());
    }

    function testLimitRefillsEvenlyOverADay() public {
        _addKey(KEY, address(sink), 24);
        _spendAs(KEY, L);
        vm.warp(block.timestamp + 12 hours);
        require(w.remainingDailyAllowance() == L / 2, "half refilled after 12 hours");
        _spendAs(KEY, L / 2);
        vm.warp(block.timestamp + 1 days);
        require(w.remainingDailyAllowance() == L, "full after a day");
    }

    function testNoDoubleSpendAroundMidnight() public {
        _addKey(KEY, address(sink), 24);
        vm.warp((block.timestamp / 1 days + 1) * 1 days - 1);          // one second before UTC midnight
        _spendAs(KEY, L);
        vm.warp(block.timestamp + 2);                                   // just after midnight
        require(!_canSpend(KEY, L), "a calendar-day reset would have allowed this");
        require(!_canSpend(KEY, L / 100), "and almost nothing has refilled yet");
    }

    function testBatchCannotBypassTheLimit() public {
        _addKey(KEY, address(sink), 24);
        address[] memory t = new address[](3); uint256[] memory v = new uint256[](3); bytes[] memory d = new bytes[](3);
        for (uint256 i; i < 3; ++i) { t[i] = address(sink); v[i] = L / 2; d[i] = _pay(); }
        vm.prank(KEY); vm.expectRevert(abi.encodeWithSelector(IW.DailyLimitExceeded.selector, (L / 2) * 3, L));
        w.executeBatch(t, v, d);
        require(sink.count() == 0 && sink.received() == 0, "nothing happened");
        require(w.remainingDailyAllowance() == L, "nothing was charged");
    }

    function testBatchWithinTheLimitWorksAndIsCharged() public {
        _addKey(KEY, address(sink), 24);
        address[] memory t = new address[](2); uint256[] memory v = new uint256[](2); bytes[] memory d = new bytes[](2);
        for (uint256 i; i < 2; ++i) { t[i] = address(sink); v[i] = L / 4; d[i] = _pay(); }
        vm.prank(KEY); w.executeBatch(t, v, d);
        require(sink.count() == 2 && sink.received() == L / 2, "both calls ran");
        require(w.remainingDailyAllowance() == L - L / 2, "the sum was charged");
    }

    function testBatchIsAllOrNothing() public {
        _addKey(KEY, address(sink), 24);
        address[] memory t = new address[](2); uint256[] memory v = new uint256[](2); bytes[] memory d = new bytes[](2);
        t[0] = address(sink); d[0] = abi.encodeCall(Sink.ping, ());
        t[1] = address(sink); d[1] = abi.encodeCall(Sink.boom, ());
        vm.prank(KEY); vm.expectRevert(bytes("sink says no"));
        w.executeBatch(t, v, d);
        require(sink.count() == 0, "the first call was rolled back too");
    }

    function testBatchLengthMismatch() public {
        address[] memory t = new address[](2); uint256[] memory v = new uint256[](1); bytes[] memory d = new bytes[](2);
        vm.prank(OWNER); vm.expectRevert(IW.LengthMismatch.selector); w.executeBatch(t, v, d);
    }

    function testOwnerBatchIsNotLimited() public {
        address[] memory t = new address[](2); uint256[] memory v = new uint256[](2); bytes[] memory d = new bytes[](2);
        for (uint256 i; i < 2; ++i) { t[i] = address(sink); v[i] = 1000 ether; d[i] = _pay(); }
        vm.prank(OWNER); w.executeBatch(t, v, d);
        require(sink.received() == 2000 ether, "owner batch");
    }

    function testBatchSumOverflowIsNotABypass() public {
        _addKey(KEY, address(sink), 24);
        address[] memory t = new address[](2); uint256[] memory v = new uint256[](2); bytes[] memory d = new bytes[](2);
        t[0] = address(sink); t[1] = address(sink); v[0] = type(uint256).max; v[1] = 2; d[0] = _pay(); d[1] = _pay();
        vm.prank(KEY); vm.expectRevert();                                // arithmetic overflow
        w.executeBatch(t, v, d);
    }

    /// Whatever the pattern of spends and waits, a session key never gets more than a full bucket plus what refilled.
    function testFuzzBucketNeverOverspends(uint256 seed) public {
        _addKey(KEY, address(sink), 720);
        uint256 t0 = block.timestamp; uint256 spent;
        for (uint256 i; i < 24; ++i) {
            seed = uint256(keccak256(abi.encode(seed, i)));
            vm.warp(block.timestamp + seed % 9 hours);
            if (block.timestamp >= t0 + 29 days) break;                 // the key must stay valid
            uint256 amt = (seed >> 64) % (L * 2 / 3 + 1);
            if (_canSpend(KEY, amt)) spent += amt;
        }
        require(spent <= L + ((block.timestamp - t0) * L) / 1 days + 1, "spent more than the bucket allows");
    }

    function testFuzzBatchTotalIsChargedExactly(uint96 a, uint96 b) public {
        _addKey(KEY, address(sink), 24);
        uint256 x = uint256(a) % (L / 2 + 1); uint256 y = uint256(b) % (L / 2 + 1);
        address[] memory t = new address[](2); uint256[] memory v = new uint256[](2); bytes[] memory d = new bytes[](2);
        t[0] = address(sink); t[1] = address(sink); v[0] = x; v[1] = y; d[0] = _pay(); d[1] = _pay();
        vm.prank(KEY); w.executeBatch(t, v, d);
        require(w.remainingDailyAllowance() == L - x - y, "charged x + y");
    }

    // ---------------------------------------------------------- session keys

    function testSessionKeyOnlyCallsItsAllowlist() public {
        _addKey(KEY, address(sink), 24);
        vm.prank(KEY); w.execute(address(sink), 0, abi.encodeCall(Sink.ping, ()));
        vm.prank(KEY); vm.expectRevert(abi.encodeWithSelector(IW.TargetNotAllowed.selector, address(tok)));
        w.execute(address(tok), 0, abi.encodeCall(Tok.harmless, ()));
        vm.prank(KEY); vm.expectRevert(abi.encodeWithSelector(IW.TargetNotAllowed.selector, STRANGER));
        w.execute(STRANGER, 1, "");                                       // not even plain native to an outsider
    }

    function testSessionKeyCannotCallTheWallet() public {
        _addKey(KEY, address(sink), 24);
        vm.prank(KEY); vm.expectRevert(IW.ForbiddenTarget.selector);
        w.execute(address(w), 0, abi.encodeCall(IW.revokeSessionKey, (KEY)));
        vm.prank(KEY); vm.expectRevert(IW.ForbiddenTarget.selector);
        w.execute(address(w), 0, abi.encodeCall(IW.setGuardian, (KEY)));
    }

    function testSessionKeyCannotMoveOrApproveTokensEvenOnAllowlistedTokens() public {
        _addKey(KEY, address(tok), 24);
        bytes[7] memory calls = [
            abi.encodeCall(Tok.transfer, (KEY, 1)),
            abi.encodeCall(Tok.approve, (KEY, 1)),
            abi.encodeCall(Tok.transferFrom, (address(w), KEY, 1)),
            abi.encodeCall(Tok.increaseAllowance, (KEY, 1)),
            abi.encodeCall(Tok.setApprovalForAll, (KEY, true)),
            abi.encodeWithSelector(0x42842e0e, address(w), KEY, 1),
            abi.encodeWithSelector(0xd505accf, address(w), KEY, 1, 1, 27, bytes32(0), bytes32(0))
        ];
        for (uint256 i; i < calls.length; ++i) {
            bytes4 sel = bytes4(calls[i]);
            vm.prank(KEY); vm.expectRevert(abi.encodeWithSelector(IW.ForbiddenCall.selector, sel));
            w.execute(address(tok), 0, calls[i]);
        }
        vm.prank(KEY); require(abi.decode(w.execute(address(tok), 0, abi.encodeCall(Tok.harmless, ())), (uint256)) == 7, "other calls work");
        // the same blocks apply inside a batch
        address[] memory t = _targets(address(tok)); uint256[] memory v = new uint256[](1); bytes[] memory d = new bytes[](1);
        d[0] = calls[0];
        vm.prank(KEY); vm.expectRevert(abi.encodeWithSelector(IW.ForbiddenCall.selector, bytes4(calls[0])));
        w.executeBatch(t, v, d);
    }

    function testOwnerCanStillMoveTokens() public {
        tok.mint(address(w), 100);
        vm.prank(OWNER); w.execute(address(tok), 0, abi.encodeCall(Tok.transfer, (STRANGER, 40)));
        require(tok.balanceOf(STRANGER) == 40, "owner transfer");
    }

    function testShortCalldataIsRefusedForSessionKeys() public {
        _addKey(KEY, address(sink), 24);
        vm.prank(KEY); vm.expectRevert(IW.InvalidCalldata.selector);
        w.execute(address(sink), 0, hex"a9059c");
    }

    function testSessionKeyExpiresAndCanBeRevoked() public {
        _addKey(KEY, address(sink), 2);
        require(w.isValidSessionKey(KEY), "valid");
        vm.warp(block.timestamp + 2 hours);
        require(!w.isValidSessionKey(KEY), "expired");
        vm.prank(KEY); vm.expectRevert(IW.NotAuthorised.selector); w.execute(address(sink), 0, abi.encodeCall(Sink.ping, ()));
        _addKey(KEY2, address(sink), 24);
        vm.prank(OWNER); w.revokeSessionKey(KEY2);
        require(!w.isValidSessionKey(KEY2) && !w.isTargetAllowed(KEY2, address(sink)), "revoked");
        vm.prank(KEY2); vm.expectRevert(IW.NotAuthorised.selector); w.execute(address(sink), 0, abi.encodeCall(Sink.ping, ()));
    }

    function testSessionDurationIsCappedAtThirtyDays() public {
        vm.prank(OWNER); w.addSessionKey(KEY, 720, _targets(address(sink)));                  // exactly 30 days
        vm.prank(OWNER); vm.expectRevert(IW.InvalidDuration.selector); w.addSessionKey(KEY2, 721, _targets(address(sink)));
        vm.prank(OWNER); vm.expectRevert(IW.InvalidDuration.selector); w.addSessionKey(KEY2, 0, _targets(address(sink)));
        require(w.sessionKeys(KEY) == block.timestamp + 30 days, "30 days");
    }

    function testInvalidSessionKeysAndTargets() public {
        address[] memory ok = _targets(address(sink));
        address g = w.guardian();
        address[7] memory bad = [address(0), OWNER, g, address(w), w.pendingOwner(), address(0), address(0)];
        for (uint256 i; i < 4; ++i) {
            vm.prank(OWNER); vm.expectRevert(IW.InvalidSessionKey.selector); w.addSessionKey(bad[i], 24, ok);
        }
        vm.prank(OWNER); vm.expectRevert(IW.InvalidTargets.selector); w.addSessionKey(KEY, 24, new address[](0));
        vm.prank(OWNER); vm.expectRevert(IW.InvalidTargets.selector); w.addSessionKey(KEY, 24, _targets(address(0)));
        vm.prank(OWNER); vm.expectRevert(IW.InvalidTargets.selector); w.addSessionKey(KEY, 24, _targets(address(w)));
        vm.prank(OWNER); vm.expectRevert(IW.InvalidTargets.selector); w.addSessionKey(KEY, 24, _targets(KEY));
        address[] memory many = new address[](17);
        for (uint256 i; i < 17; ++i) many[i] = address(uint160(0x1000 + i));
        vm.prank(OWNER); vm.expectRevert(IW.InvalidTargets.selector); w.addSessionKey(KEY, 24, many);
        vm.prank(STRANGER); vm.expectRevert(IW.NotOwner.selector); w.addSessionKey(KEY, 24, ok);
        vm.prank(STRANGER); vm.expectRevert(IW.NotOwner.selector); w.revokeSessionKey(KEY);
    }

    function testReAddingAKeyReplacesItsAllowlist() public {
        _addKey(KEY, address(sink), 24);
        require(w.isTargetAllowed(KEY, address(sink)), "allowed");
        _addKey(KEY, address(tok), 24);
        require(!w.isTargetAllowed(KEY, address(sink)) && w.isTargetAllowed(KEY, address(tok)), "old allowlist is gone");
        vm.prank(KEY); vm.expectRevert(abi.encodeWithSelector(IW.TargetNotAllowed.selector, address(sink)));
        w.execute(address(sink), 0, abi.encodeCall(Sink.ping, ()));
    }

    function testRevokedKeyDoesNotKeepOldTargetsWhenAddedAgain() public {
        _addKey(KEY, address(sink), 24);
        vm.prank(OWNER); w.revokeSessionKey(KEY);
        _addKey(KEY, address(tok), 24);
        require(!w.isTargetAllowed(KEY, address(sink)), "the sink was not re-allowed by accident");
    }

    function testSessionKeysStopWorkingWhenTheOwnerChanges() public {
        _addKey(KEY, address(sink), 24);
        vm.prank(OWNER); w.transferOwnership(NEWOWNER);
        require(w.isValidSessionKey(KEY), "still valid until the transfer completes");
        vm.prank(NEWOWNER); w.acceptOwnership();
        require(!w.isValidSessionKey(KEY), "old owner's keys are dead");
        vm.prank(KEY); vm.expectRevert(IW.NotAuthorised.selector); w.execute(address(sink), 0, abi.encodeCall(Sink.ping, ()));
    }

    // -------------------------------------------------------------- recovery

    function testFullRecovery() public {
        address g = w.guardian();
        _addKey(KEY, address(sink), 24);
        vm.prank(g); w.initiateRecovery(NEWOWNER);
        require(w.recoveryCandidate() == NEWOWNER && w.recoveryStartedBy() == g, "recorded");
        require(w.recoveryActivationTime() == block.timestamp + 2 days, "delay applied");
        vm.expectRevert(abi.encodeWithSelector(IW.RecoveryNotReady.selector, w.recoveryActivationTime()));
        w.executeRecovery();
        vm.warp(block.timestamp + 2 days);
        vm.prank(STRANGER); w.executeRecovery();                          // anyone may finish it
        require(w.owner() == NEWOWNER, "new owner");
        require(w.recoveryCandidate() == address(0) && w.recoveryActivationTime() == 0, "cleared");
        require(!w.isValidSessionKey(KEY), "session keys of the old owner are dead");
        vm.prank(OWNER); vm.expectRevert(IW.NotOwner.selector); w.setGuardian(KEY);
        vm.prank(NEWOWNER); w.execute(address(sink), 1 ether, _pay());
    }

    function testOnlyTheGuardianStartsARecovery() public {
        vm.prank(OWNER); vm.expectRevert(IW.NotGuardian.selector); w.initiateRecovery(NEWOWNER);
        vm.prank(STRANGER); vm.expectRevert(IW.NotGuardian.selector); w.initiateRecovery(NEWOWNER);
    }

    function testRecoveryCandidateMustBeSensible() public {
        address g = w.guardian();
        address[4] memory bad = [address(0), OWNER, g, address(w)];
        for (uint256 i; i < 4; ++i) { vm.prank(g); vm.expectRevert(IW.InvalidOwner.selector); w.initiateRecovery(bad[i]); }
    }

    function testOwnerCanCancelARecovery() public {
        address g = w.guardian();
        vm.prank(g); w.initiateRecovery(NEWOWNER);
        vm.prank(OWNER); w.cancelRecovery();
        require(w.recoveryCandidate() == address(0), "cancelled");
        vm.warp(block.timestamp + 10 days);
        vm.expectRevert(IW.NoRecoveryPending.selector); w.executeRecovery();
        require(w.owner() == OWNER, "owner unchanged");
    }

    function testGuardianCanCancelAndRestart() public {
        address g = w.guardian();
        vm.prank(g); w.initiateRecovery(NEWOWNER);
        vm.prank(g); vm.expectRevert(IW.RecoveryAlreadyPending.selector); w.initiateRecovery(KEY);
        vm.prank(g); w.cancelRecovery();
        vm.prank(g); w.initiateRecovery(KEY);
        require(w.recoveryCandidate() == KEY, "restarted");
    }

    function testStrangersCannotCancel() public {
        vm.prank(w.guardian()); w.initiateRecovery(NEWOWNER);
        vm.prank(STRANGER); vm.expectRevert(IW.NotAuthorised.selector); w.cancelRecovery();
    }

    function testCancelWithoutRecovery() public {
        vm.prank(OWNER); vm.expectRevert(IW.NoRecoveryPending.selector); w.cancelRecovery();
    }

    function testExecuteRecoveryWithoutOneStarted() public {
        vm.expectRevert(IW.NoRecoveryPending.selector); w.executeRecovery();
    }

    function testChangingTheGuardianCancelsAPendingRecovery() public {
        address g = w.guardian();
        vm.prank(g); w.initiateRecovery(NEWOWNER);
        vm.prank(OWNER); w.setGuardian(address(0x6A2D));
        require(w.recoveryCandidate() == address(0) && w.guardian() == address(0x6A2D), "cancelled and replaced");
        vm.warp(block.timestamp + 5 days);
        vm.expectRevert(IW.NoRecoveryPending.selector); w.executeRecovery();
        vm.prank(g); vm.expectRevert(IW.NotGuardian.selector); w.initiateRecovery(NEWOWNER);   // the old guardian is out
    }

    function testGuardianChecks() public {
        vm.prank(OWNER); vm.expectRevert(IW.InvalidGuardian.selector); w.setGuardian(address(0));
        vm.prank(OWNER); vm.expectRevert(IW.InvalidGuardian.selector); w.setGuardian(OWNER);
        vm.prank(OWNER); vm.expectRevert(IW.InvalidGuardian.selector); w.setGuardian(address(w));
        vm.prank(STRANGER); vm.expectRevert(IW.NotOwner.selector); w.setGuardian(KEY);
    }

    function testRecoveryDelayIsConfigurableWithAMinimum() public {
        vm.prank(OWNER); w.setRecoveryDelay(1 days);
        vm.prank(OWNER); vm.expectRevert(IW.InvalidDelay.selector); w.setRecoveryDelay(1 days - 1);
        vm.prank(OWNER); vm.expectRevert(IW.InvalidDelay.selector); w.setRecoveryDelay(31 days);
        vm.prank(STRANGER); vm.expectRevert(IW.NotOwner.selector); w.setRecoveryDelay(3 days);
        vm.prank(w.guardian()); w.initiateRecovery(NEWOWNER);
        require(w.recoveryActivationTime() == block.timestamp + 1 days, "new delay used");
        vm.prank(OWNER); w.setRecoveryDelay(30 days);                      // does not move a recovery that already started
        require(w.recoveryActivationTime() == block.timestamp + 1 days, "pending recovery unchanged");
    }

    function testAcceptingOwnershipCancelsAPendingRecovery() public {
        vm.prank(w.guardian()); w.initiateRecovery(KEY);
        vm.prank(OWNER); w.transferOwnership(NEWOWNER);
        vm.prank(NEWOWNER); w.acceptOwnership();
        require(w.recoveryCandidate() == address(0), "the recovery was aimed at the old owner");
    }

    // ------------------------------------------------------------- ownership

    function testTwoStepOwnershipTransfer() public {
        vm.prank(OWNER); w.transferOwnership(NEWOWNER);
        require(w.owner() == OWNER && w.pendingOwner() == NEWOWNER, "nothing changes yet");
        vm.prank(STRANGER); vm.expectRevert(IW.NotPendingOwner.selector); w.acceptOwnership();
        vm.prank(OWNER); vm.expectRevert(IW.NotPendingOwner.selector); w.acceptOwnership();
        vm.prank(NEWOWNER); w.acceptOwnership();
        require(w.owner() == NEWOWNER && w.pendingOwner() == address(0), "transferred");
        vm.prank(OWNER); vm.expectRevert(IW.NotAuthorised.selector); w.execute(address(sink), 0, abi.encodeCall(Sink.ping, ()));
        vm.prank(NEWOWNER); w.execute(address(sink), 0, abi.encodeCall(Sink.ping, ()));
    }

    function testOwnershipTransferChecksAndCancel() public {
        address g = w.guardian();
        vm.prank(OWNER); vm.expectRevert(IW.InvalidOwner.selector); w.transferOwnership(address(0));
        vm.prank(OWNER); vm.expectRevert(IW.InvalidOwner.selector); w.transferOwnership(OWNER);
        vm.prank(OWNER); vm.expectRevert(IW.InvalidOwner.selector); w.transferOwnership(g);
        vm.prank(OWNER); vm.expectRevert(IW.InvalidOwner.selector); w.transferOwnership(address(w));
        vm.prank(STRANGER); vm.expectRevert(IW.NotOwner.selector); w.transferOwnership(NEWOWNER);
        vm.prank(OWNER); w.transferOwnership(NEWOWNER);
        vm.prank(OWNER); w.cancelOwnershipTransfer();
        vm.prank(NEWOWNER); vm.expectRevert(IW.NotPendingOwner.selector); w.acceptOwnership();
    }

    function testGuardianChangedToThePendingOwnerCannotAccept() public {
        vm.prank(OWNER); w.transferOwnership(NEWOWNER);
        vm.prank(OWNER); w.setGuardian(NEWOWNER);
        vm.prank(NEWOWNER); vm.expectRevert(IW.InvalidOwner.selector); w.acceptOwnership();
    }

    // ------------------------------------------------------------ reentrancy

    function testOwnerCallCannotBeReentered() public {
        Reenter r = new Reenter(w);
        vm.prank(OWNER); vm.expectRevert(IW.Reentrancy.selector);
        w.execute(address(r), 0, abi.encodeCall(Reenter.attack, ()));
        require(!r.tried(), "the attack was rolled back with everything else");
    }

    function testSessionKeyCallCannotBeReentered() public {
        Reenter r = new Reenter(w);
        _addKey(KEY, address(r), 24);
        vm.prank(KEY); vm.expectRevert(IW.Reentrancy.selector);
        w.execute(address(r), 0, abi.encodeCall(Reenter.attack, ()));
    }

    function testBatchCannotBeReentered() public {
        Reenter r = new Reenter(w);
        address[] memory t = _targets(address(r)); uint256[] memory v = new uint256[](1); bytes[] memory d = new bytes[](1);
        d[0] = abi.encodeCall(Reenter.attackBatch, ());
        vm.prank(OWNER); vm.expectRevert(IW.Reentrancy.selector);
        w.executeBatch(t, v, d);
    }

    // -------------------------------------------------------------- ERC-1271

    function _sig(uint256 pk, bytes32 h) internal returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, h);
        return abi.encodePacked(r, s, v);
    }

    function testErc1271OwnerSignature() public {
        bytes32 h = keccak256("hello");
        require(w.isValidSignature(h, _sig(OWNER_PK, h)) == 0x1626ba7e, "owner signature accepted");
        require(w.isValidSignature(keccak256("other"), _sig(OWNER_PK, h)) == 0xffffffff, "wrong hash");
        require(w.isValidSignature(h, _sig(OTHER_PK, h)) == 0xffffffff, "wrong signer");
    }

    function testErc1271RejectsMalleableAndMalformed() public {
        bytes32 h = keccak256("hello");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(OWNER_PK, h);
        uint256 n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
        bytes memory mirrored = abi.encodePacked(r, bytes32(n - uint256(s)), v == 27 ? uint8(28) : uint8(27));
        require(w.isValidSignature(h, mirrored) == 0xffffffff, "the mirrored form of a signature is refused");
        require(w.isValidSignature(h, abi.encodePacked(r, s)) == 0xffffffff, "64-byte form refused");
        require(w.isValidSignature(h, abi.encodePacked(r, s, uint8(v - 27))) == 0xffffffff, "v of 0/1 refused");
        require(w.isValidSignature(h, "") == 0xffffffff, "empty");
        require(w.isValidSignature(h, abi.encodePacked(bytes32(0), bytes32(uint256(1)), uint8(27))) == 0xffffffff, "garbage");
    }

    function testErc1271SessionKeysAndGuardianCannotSign() public {
        bytes32 h = keccak256("hello");
        uint256 sessionPk = 0x5E55;
        address sessionKey = vm.addr(sessionPk);
        vm.prank(OWNER); w.addSessionKey(sessionKey, 24, _targets(address(sink)));
        require(w.isValidSignature(h, _sig(sessionPk, h)) == 0xffffffff, "session key cannot sign for the wallet");
    }

    function testErc1271FollowsTheOwner() public {
        bytes32 h = keccak256("hello");
        vm.prank(OWNER); w.transferOwnership(vm.addr(OTHER_PK));
        vm.prank(vm.addr(OTHER_PK)); w.acceptOwnership();
        require(w.isValidSignature(h, _sig(OTHER_PK, h)) == 0x1626ba7e, "new owner signs");
        require(w.isValidSignature(h, _sig(OWNER_PK, h)) == 0xffffffff, "old owner no longer");
    }

    // ------------------------------------------------------------- receiving

    function testReceivesNativeAndEmitsAnEvent() public {
        vm.deal(STRANGER, 3 ether);
        uint256 before = address(w).balance;
        vm.expectEmit(true, false, false, true);
        emit IW.Received(STRANGER, 2 ether);
        vm.prank(STRANGER); (bool ok, ) = address(w).call{value: 2 ether}("");
        require(ok && address(w).balance == before + 2 ether, "received");
    }

    function testReceivesNfts() public {
        Nft721 n = new Nft721(); Nft1155 m = new Nft1155();
        n.safeMint(address(w), 1);
        m.mint(address(w), 1, 5);
        require(w.supportsInterface(0x01ffc9a7) && w.supportsInterface(0x150b7a02) && w.supportsInterface(0x4e2312e0), "interfaces");
        require(!w.supportsInterface(0xffffffff), "not everything");
    }
}

contract SingleWalletTest is WalletBase {
    function _deploy(address deployer) internal override returns (address a) {
        vm.prank(deployer);
        a = address(new SingleSrc.ArcSmartWallet());
    }

    function testConstructorRejectsAZeroGuardian() public {
        vm.prank(OWNER); vm.expectRevert(IW.InvalidGuardian.selector);
        new ZeroGuardianSrc.ArcSmartWallet();
    }

    function testConstructorRejectsTheDeployerAsGuardian() public {
        address g = w.guardian();
        vm.prank(g); vm.expectRevert(IW.InvalidGuardian.selector);
        new SingleSrc.ArcSmartWallet();
    }
}

contract PortableWalletTest is WalletBase {
    function _deploy(address deployer) internal override returns (address a) {
        vm.prank(deployer);
        a = address(new PortableSrc.ArcSmartWallet(100 ether));
    }

    function testLimitIsAConstructorArgument() public {
        vm.prank(OWNER); PortableSrc.ArcSmartWallet x = new PortableSrc.ArcSmartWallet(7);
        require(x.DAILY_LIMIT() == 7 && IW(address(x)).remainingDailyAllowance() == 7, "argument used");
    }

    function testAZeroLimitMeansSessionKeysCannotSendNative() public {
        vm.prank(OWNER); IW z = IW(address(new PortableSrc.ArcSmartWallet(0)));
        vm.deal(address(z), 5 ether);
        vm.prank(OWNER); z.addSessionKey(KEY, 24, _targets(address(sink)));
        vm.prank(KEY); vm.expectRevert(abi.encodeWithSelector(IW.DailyLimitExceeded.selector, 1, 0));
        z.execute(address(sink), 1, _pay());
        vm.prank(KEY); z.execute(address(sink), 0, abi.encodeCall(Sink.ping, ()));       // calls without value are fine
    }

    function testAnAbsurdLimitIsRefused() public {
        vm.prank(OWNER); vm.expectRevert(IW.InvalidLimit.selector);
        new PortableSrc.ArcSmartWallet(uint256(type(uint128).max) + 1);
    }

    function testHugeLimitStillWorks() public {
        vm.prank(OWNER); IW big = IW(address(new PortableSrc.ArcSmartWallet(type(uint128).max)));
        vm.warp(block.timestamp + 3 hours);
        require(big.remainingDailyAllowance() == type(uint128).max, "no overflow in the bucket maths");
    }

    function testConstructorRejectsTheDeployerAsGuardian() public {
        address g = w.guardian();
        vm.prank(g); vm.expectRevert(IW.InvalidGuardian.selector);
        new PortableSrc.ArcSmartWallet(100 ether);
    }
}
