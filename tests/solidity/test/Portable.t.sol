// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "../src/portable/Escrow.sol" as EscrowSrc;
import "../src/portable/Vesting.sol" as VestingSrc;
import "../src/portable/Paywall.sol" as PaywallSrc;
import "../src/portable/Nft.sol" as NftSrc;
import "../src/portable/Vault.sol" as VaultSrc;
import "../src/portable/Staking.sol" as StakingSrc;
import "../src/portable/Dao.sol" as DaoSrc;
import "../src/portable/Wallet.sol" as WalletSrc;
import "../src/portable/Amm.sol" as AmmSrc;
import "../src/portable/Book.sol" as BookSrc;
import "../src/portable/Bridge.sol" as BridgeSrc;

interface Vm {
    function prank(address) external;
    function expectRevert(bytes calldata) external;
}

contract DTok {
    uint8 public immutable decimals;
    mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
    constructor(uint8 d) { decimals = d; }
    function mint(address t,uint a) external { balanceOf[t]+=a; }
    function approve(address s,uint a) external returns(bool){ allowance[msg.sender][s]=a; return true; }
    function transfer(address t,uint a) external returns(bool){ balanceOf[msg.sender]-=a; balanceOf[t]+=a; return true; }
    function transferFrom(address f,address t,uint a) external returns(bool){ allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; return true; }
}

abstract contract P {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    DTok t6; DTok t18;
    function setUp() public virtual { t6 = new DTok(6); t18 = new DTok(18); }
}

contract ScalingTest is P {
    function testEscrowAmountFollowsDecimals() public {
        EscrowSrc.ArcEscrow e6 = new EscrowSrc.ArcEscrow(address(t6));
        EscrowSrc.ArcEscrow e18 = new EscrowSrc.ArcEscrow(address(t18));
        require(e6.amount() > 0 && e6.amount() % 1e6 == 0, "6dp");
        require(e18.amount() == e6.amount() * 1e12, "18dp is 1e12 larger");
        require(address(e6.token()) == address(t6), "token stored");
    }
    function testEscrowFlow() public {
        EscrowSrc.ArcEscrow e = new EscrowSrc.ArcEscrow(address(t18));
        address buyer = e.buyer(); address seller = e.seller();
        t18.mint(buyer, e.amount());
        vm.prank(buyer); t18.approve(address(e), type(uint).max);
        vm.prank(buyer); e.fund();
        vm.prank(buyer); e.release();
        require(t18.balanceOf(seller) == e.amount(), "seller paid");
    }
    function testEscrowRejectsNonContract() public {
        vm.expectRevert(bytes("token is not a contract"));
        new EscrowSrc.ArcEscrow(address(0xBEEF));
    }
    function testVestingScales() public {
        VestingSrc.ArcVesting v6 = new VestingSrc.ArcVesting(address(t6));
        VestingSrc.ArcVesting v18 = new VestingSrc.ArcVesting(address(t18));
        require(v6.totalAmount() > 0 && v18.totalAmount() == v6.totalAmount() * 1e12, "scaled");
    }
    function testPaywallScalesAndCharges() public {
        PaywallSrc.ArcSubscription p = new PaywallSrc.ArcSubscription(address(t18));
        require(p.pricePerPeriod() > 0 && p.pricePerPeriod() % 1e18 == 0, "price in 18dp");
        t18.mint(address(this), p.pricePerPeriod());
        t18.approve(address(p), type(uint).max);
        p.subscribe();
        require(p.isActive(address(this)), "active");
    }
    function testNftPriceScalesAndMints() public {
        NftSrc.ArcOriginals n = new NftSrc.ArcOriginals(address(t18));
        require(n.mintPrice() == 10e18, "10 tokens in 18dp");
        t18.mint(address(this), 10e18); t18.approve(address(n), type(uint).max);
        require(n.mint() == 1 && n.ownerOf(1) == address(this), "minted");
    }
    function testVaultDeposit() public {
        VaultSrc.ArcYieldVault v = new VaultSrc.ArcYieldVault(address(t6));
        t6.mint(address(this), 1000e6); t6.approve(address(v), type(uint).max);
        require(v.deposit(100e6, address(this)) == 100e6, "shares");
    }
    function testStakingStake() public {
        StakingSrc.ArcStaking s = new StakingSrc.ArcStaking(address(t6));
        t6.mint(address(this), 1000e6); t6.approve(address(s), type(uint).max);
        s.stake(100e6);
        require(s.totalStaked() == 100e6, "staked");
    }
}

contract ConfigTest is P {
    function testDaoGetsVotingPeriodAndToken() public {
        DaoSrc.ArcDAO d = new DaoSrc.ArcDAO(address(t18), 12345);
        require(d.VOTING_PERIOD() == 12345 && address(d.token()) == address(t18), "config");
        vm.expectRevert(bytes("token is not a contract"));
        new DaoSrc.ArcDAO(address(0xBEEF), 1);
    }
    function testWalletGetsEntryPointAndLimit() public {
        address ep = address(0xE17);
        WalletSrc.ArcSmartWallet w = new WalletSrc.ArcSmartWallet(ep, 777);
        require(w.entryPoint() == ep && w.DAILY_LIMIT() == 777, "config");
    }
    function testAmmUsesConstructorTokens() public {
        AmmSrc.ArcSwapAMM a = new AmmSrc.ArcSwapAMM(address(t6), address(t18));
        t6.mint(address(this), 1e30); t18.mint(address(this), 1e30);
        t6.approve(address(a), type(uint).max); t18.approve(address(a), type(uint).max);
        a.addLiquidity(1000e6, 1000e18, 0, 0, type(uint).max);
        require(a.swapAtoB(10e6, 0, type(uint).max) > 0, "swap");
        vm.expectRevert(bytes("identical tokens")); new AmmSrc.ArcSwapAMM(address(t6), address(t6));
        vm.expectRevert(bytes("token is not a contract")); new AmmSrc.ArcSwapAMM(address(t6), address(0xBEEF));
    }
    function testOrderbookUsesConstructorTokens() public {
        BookSrc.Orderbook b = new BookSrc.Orderbook(address(t6), address(t18));
        t6.mint(address(this), 100e6); t6.approve(address(b), type(uint).max);
        require(b.createOrder(100e6, 2e6) == 0, "order");
        vm.expectRevert(bytes("identical tokens")); new BookSrc.Orderbook(address(t6), address(t6));
    }
}

contract MockMessenger {
    uint public lastAmount; uint32 public lastDomain; bytes32 public lastRecipient; address public lastToken;
    bytes32 public lastCaller; uint public lastMaxFee; uint32 public lastFinality;
    function depositForBurn(uint256 amount, uint32 d, bytes32 r, address t, bytes32 c, uint256 mf, uint32 f) external {
        DTok(t).transferFrom(msg.sender, address(this), amount); // like the real one: needs the allowance
        lastAmount = amount; lastDomain = d; lastRecipient = r; lastToken = t; lastCaller = c; lastMaxFee = mf; lastFinality = f;
    }
}
contract MockTransmitter { function localDomain() external pure returns (uint32) { return 26; } }

contract BridgeTest is P {
    function testBridgeBurnsWithCorrectParams() public {
        MockMessenger m = new MockMessenger(); MockTransmitter tr = new MockTransmitter();
        BridgeSrc.ArcCrossPay b = new BridgeSrc.ArcCrossPay(address(m), address(tr), address(t6));
        require(b.localDomain() == 26, "domain read from the transmitter");
        t6.mint(address(this), 500e6); t6.approve(address(b), type(uint).max);
        address recipient = address(0xCAFE);
        b.bridgeUSDC(100e6, 6, recipient, 1e4, 1000);
        require(m.lastAmount() == 100e6 && m.lastDomain() == 6 && m.lastToken() == address(t6), "burn args");
        require(m.lastRecipient() == bytes32(uint256(uint160(recipient))), "recipient padded");
        require(m.lastCaller() == bytes32(0) && m.lastMaxFee() == 1e4 && m.lastFinality() == 1000, "fee and finality");
        require(t6.balanceOf(address(b)) == 0 && t6.allowance(address(b), address(m)) == 0, "bridge keeps nothing");
        require(t6.balanceOf(address(this)) == 400e6, "caller paid");
    }
    function testBridgeGuards() public {
        MockMessenger m = new MockMessenger(); MockTransmitter tr = new MockTransmitter();
        BridgeSrc.ArcCrossPay b = new BridgeSrc.ArcCrossPay(address(m), address(tr), address(t6));
        t6.mint(address(this), 500e6); t6.approve(address(b), type(uint).max);
        vm.expectRevert(bytes("zero amount")); b.bridgeUSDC(0, 6, address(1), 0, 2000);
        vm.expectRevert(bytes("zero recipient")); b.bridgeUSDC(1e6, 6, address(0), 0, 2000);
        vm.expectRevert(bytes("same chain")); b.bridgeUSDC(1e6, 26, address(1), 0, 2000);
        vm.expectRevert(bytes("fee too high")); b.bridgeUSDC(1e6, 6, address(1), 1e6, 2000);
        vm.expectRevert(bytes("not a contract")); new BridgeSrc.ArcCrossPay(address(0xBEEF), address(tr), address(t6));
    }
}
