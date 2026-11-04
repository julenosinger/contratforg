// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// Phase 4, achado A.2: the privileged setters announce their change with the old and the new value.
// Written first against the old generator output, where all three tests failed ("log != expected log").
import "../src/portable/Nft.sol" as NftSrc;
import "../src/portable/Paywall.sol" as PaywallSrc;
import "../src/portable/Vault.sol" as VaultSrc;

interface Vm { function expectEmit(bool, bool, bool, bool) external; }
contract Tok {
    uint8 public constant decimals = 6;
    mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
    function mint(address t,uint a) external { balanceOf[t]+=a; }
    function approve(address s,uint a) external returns(bool){ allowance[msg.sender][s]=a; return true; }
    function transfer(address t,uint a) external returns(bool){ balanceOf[msg.sender]-=a; balanceOf[t]+=a; return true; }
    function transferFrom(address f,address t,uint a) external returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; return true; }
}

contract Phase4EventsTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event DepositCapUpdated(uint256 oldCap, uint256 newCap);

    function testNftSetMintPriceEmits() public {
        Tok t = new Tok(); NftSrc.ArcOriginals n = new NftSrc.ArcOriginals(address(t));
        uint256 old = n.mintPrice();
        vm.expectEmit(false, false, false, true); emit MintPriceUpdated(old, 77e6);
        n.setMintPrice(77e6);
        require(n.mintPrice() == 77e6, "price changed");
    }

    function testSubscriptionSetPriceEmits() public {
        Tok t = new Tok(); PaywallSrc.ArcSubscription p = new PaywallSrc.ArcSubscription(address(t));
        uint256 old = p.pricePerPeriod();
        vm.expectEmit(false, false, false, true); emit PriceUpdated(old, 12e6);
        p.setPrice(12e6);
        require(p.pricePerPeriod() == 12e6, "price changed");
    }

    function testVaultSetDepositCapEmits() public {
        Tok t = new Tok(); VaultSrc.ArcYieldVault v = new VaultSrc.ArcYieldVault(address(t));
        uint256 old = v.depositCap();
        vm.expectEmit(false, false, false, true); emit DepositCapUpdated(old, 500e6);
        v.setDepositCap(500e6);
        require(v.depositCap() == 500e6, "cap changed");
    }
}
