// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// Phase 5, item E: three more events. NFT setBaseURI announces BaseURIUpdated(old, new); subscription setBeneficiary announces
// BeneficiaryUpdated(old, new) (both addresses indexed); the factory's PairCreated now indexes token0 and token1. Written first against
// the previous generator output, where all three failed.
import "../src/portable/Nft.sol" as NftSrc;
import "../src/portable/Paywall.sol" as PaywallSrc;
import "../src/Fac.sol" as FacSrc;

interface Vm {
    function expectEmit(bool, bool, bool, bool) external;
    function recordLogs() external;
    struct Log { bytes32[] topics; bytes data; address emitter; }
    function getRecordedLogs() external returns (Log[] memory);
}
contract Tok {
    uint8 public constant decimals = 6;
    mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
    function mint(address t,uint a) external { balanceOf[t]+=a; }
    function approve(address s,uint a) external returns(bool){ allowance[msg.sender][s]=a; return true; }
    function transfer(address t,uint a) external returns(bool){ balanceOf[msg.sender]-=a; balanceOf[t]+=a; return true; }
    function transferFrom(address f,address t,uint a) external returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; return true; }
}

contract Phase5EventsTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    event BaseURIUpdated(string oldURI, string newURI);
    event BeneficiaryUpdated(address indexed oldBeneficiary, address indexed newBeneficiary);
    event PairCreated(address indexed token0, address indexed token1, address pair);

    function testNftSetBaseURIEmits() public {
        NftSrc.ArcOriginals n = new NftSrc.ArcOriginals(address(new Tok()));
        string memory old = n.baseURI();
        vm.expectEmit(false, false, false, true); emit BaseURIUpdated(old, "ipfs://new/");
        n.setBaseURI("ipfs://new/");
        require(keccak256(bytes(n.baseURI())) == keccak256("ipfs://new/"), "changed");
    }
    function testSubscriptionSetBeneficiaryEmits() public {
        PaywallSrc.ArcSubscription p = new PaywallSrc.ArcSubscription(address(new Tok()));
        address old = p.beneficiary(); address next = address(0xBEEF1);
        vm.expectEmit(true, true, false, true); emit BeneficiaryUpdated(old, next);
        p.setBeneficiary(next);
        require(p.beneficiary() == next, "changed");
    }
    function testPairCreatedIndexesBothTokens() public {
        FacSrc.ArcSwapAMMFactory f = new FacSrc.ArcSwapAMMFactory();
        address a = address(new Tok()); address b = address(new Tok());
        (address t0, address t1) = a < b ? (a, b) : (b, a);
        address predicted = address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xd6), bytes1(0x94), address(f), bytes1(0x01))))));
        vm.expectEmit(true, true, false, true); emit PairCreated(t0, t1, predicted);
        vm.recordLogs();
        address pair = f.createPair(b, a);
        require(pair == predicted, "predicted address");
        Vm.Log[] memory logs = vm.getRecordedLogs();
        Vm.Log memory l = logs[logs.length - 1];
        require(l.emitter == address(f) && l.topics.length == 3 && l.data.length == 32, "the tokens are topics now and only the pair is data");
        require(l.topics[0] == keccak256("PairCreated(address,address,address)"), "event signature is unchanged");
        require(address(uint160(uint256(l.topics[1]))) == t0 && address(uint160(uint256(l.topics[2]))) == t1, "token0 and token1 in the topics");
    }
}
