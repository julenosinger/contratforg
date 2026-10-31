// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @title ArcSwapAMMPair — individual constant-product pair
/// @dev Constant-product (x*y=k) pool. 30 bps fee stays in the reserves for liquidity providers.
///      Safe-by-default: slippage limits and deadlines on every call, minimum liquidity locked on the
///      first deposit, deposits taken at the pool ratio (no donated excess), reentrancy guard, and
///      fee-on-transfer tokens are rejected (on the way in and on the way out). Liquidity shares are a
///      standard ERC-20 token, so they can be transferred and shown by wallets. Tokens sent to the pool
///      directly (not through these functions) are not tracked and cannot be recovered. Not for rebasing
///      tokens, and a pool is only as safe as the two tokens in it.
contract ArcSwapAMMPair {
    IERC20 public immutable token0;
    IERC20 public immutable token1;
    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public constant FEE_BPS = 30;
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    uint256 public totalShares;
    mapping(address => uint256) public shares;
    mapping(address => mapping(address => uint256)) public allowance;
    string public constant name = "ContractForge LP";
    string public constant symbol = "CF-LP";
    uint8 public constant decimals = 18;
    address public factory;
    uint256 private _locked = 1;

    event LiquidityAdded(address indexed provider, uint256 amount0, uint256 amount1, uint256 sharesMinted);
    event LiquidityRemoved(address indexed provider, uint256 amount0, uint256 amount1, uint256 sharesBurned);
    event Swap(address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    modifier nonReentrant() {
        require(_locked == 1, "reentrant call");
        _locked = 2;
        _;
        _locked = 1;
    }

    modifier ensure(uint256 deadline) {
        require(block.timestamp <= deadline, "expired");
        _;
    }

    constructor(address _token0, address _token1) {
        require(_token0 != address(0) && _token0 != _token1, "invalid tokens");
        require(_token0.code.length > 0 && _token1.code.length > 0, "token is not a contract");
        factory = msg.sender;
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    /// @notice Add liquidity at the current pool ratio. Only the amounts actually needed are pulled.
    /// @param amount0Desired Max amount of token0 to deposit
    /// @param amount1Desired Max amount of token1 to deposit
    /// @param amount0Min Revert if less than this token0 would be deposited
    /// @param amount1Min Revert if less than this token1 would be deposited
    /// @param deadline Unix time after which the call reverts
    function addLiquidity(
        uint256 amount0Desired,
        uint256 amount1Desired,
        uint256 amount0Min,
        uint256 amount1Min,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256 amount0, uint256 amount1, uint256 mintedShares) {
        require(amount0Desired > 0 && amount1Desired > 0, "zero amounts");

        if (totalShares == 0) {
            (amount0, amount1) = (amount0Desired, amount1Desired);
        } else {
            uint256 amount1Optimal = (amount0Desired * reserve1) / reserve0;
            if (amount1Optimal <= amount1Desired) {
                (amount0, amount1) = (amount0Desired, amount1Optimal);
            } else {
                uint256 amount0Optimal = (amount1Desired * reserve0) / reserve1;
                (amount0, amount1) = (amount0Optimal, amount1Desired);
            }
        }
        require(amount0 >= amount0Min && amount1 >= amount1Min, "slippage exceeded");

        if (totalShares == 0) {
            mintedShares = _sqrt(amount0 * amount1);
            require(mintedShares > MINIMUM_LIQUIDITY, "insufficient initial liquidity");
            mintedShares -= MINIMUM_LIQUIDITY;
            totalShares = MINIMUM_LIQUIDITY;      // locked forever, keeps the pool from ever being empty
            shares[address(0)] = MINIMUM_LIQUIDITY;
            emit Transfer(address(0), address(0), MINIMUM_LIQUIDITY);
        } else {
            uint256 s0 = (amount0 * totalShares) / reserve0;
            uint256 s1 = (amount1 * totalShares) / reserve1;
            mintedShares = s0 < s1 ? s0 : s1;
        }
        require(mintedShares > 0, "insufficient liquidity minted");

        reserve0 += amount0;
        reserve1 += amount1;
        totalShares += mintedShares;
        shares[msg.sender] += mintedShares;

        emit Transfer(address(0), msg.sender, mintedShares);
        emit LiquidityAdded(msg.sender, amount0, amount1, mintedShares);
        _pull(token0, amount0);
        _pull(token1, amount1);
    }

    /// @notice Burn shares and receive the proportional amount of both tokens.
    function removeLiquidity(
        uint256 shareAmount,
        uint256 amount0Min,
        uint256 amount1Min,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256 amount0, uint256 amount1) {
        require(shareAmount > 0 && shares[msg.sender] >= shareAmount, "insufficient shares");
        amount0 = (reserve0 * shareAmount) / totalShares;
        amount1 = (reserve1 * shareAmount) / totalShares;
        require(amount0 > 0 && amount1 > 0, "insufficient liquidity burned");
        require(amount0 >= amount0Min && amount1 >= amount1Min, "slippage exceeded");

        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        reserve0 -= amount0;
        reserve1 -= amount1;

        emit Transfer(msg.sender, address(0), shareAmount);
        emit LiquidityRemoved(msg.sender, amount0, amount1, shareAmount);
        _push(token0, msg.sender, amount0);
        _push(token1, msg.sender, amount1);
    }

    /// @notice Swap token0 -> token1
    function swap0to1(uint256 amountIn, uint256 minAmountOut, uint256 deadline)
        external nonReentrant ensure(deadline) returns (uint256 amountOut)
    {
        require(amountIn > 0, "zero amount");
        amountOut = _quote(amountIn, reserve0, reserve1);
        require(amountOut > 0, "insufficient output");
        require(amountOut >= minAmountOut, "slippage exceeded");

        reserve0 += amountIn;
        reserve1 -= amountOut;

        emit Swap(msg.sender, address(token0), amountIn, amountOut);
        _pull(token0, amountIn);
        _push(token1, msg.sender, amountOut);
    }

    /// @notice Swap token1 -> token0
    function swap1to0(uint256 amountIn, uint256 minAmountOut, uint256 deadline)
        external nonReentrant ensure(deadline) returns (uint256 amountOut)
    {
        require(amountIn > 0, "zero amount");
        amountOut = _quote(amountIn, reserve1, reserve0);
        require(amountOut > 0, "insufficient output");
        require(amountOut >= minAmountOut, "slippage exceeded");

        reserve1 += amountIn;
        reserve0 -= amountOut;

        emit Swap(msg.sender, address(token1), amountIn, amountOut);
        _pull(token1, amountIn);
        _push(token0, msg.sender, amountOut);
    }

    /* ---- Liquidity shares as a standard ERC-20 token ---- */

    function totalSupply() external view returns (uint256) { return totalShares; }

    function balanceOf(address account) external view returns (uint256) { return shares[account]; }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transferShares(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= value, "insufficient allowance");
            allowance[from][msg.sender] = allowed - value;
        }
        _transferShares(from, to, value);
        return true;
    }

    function _transferShares(address from, address to, uint256 value) private {
        require(to != address(0), "invalid recipient");
        require(shares[from] >= value, "insufficient shares");
        shares[from] -= value;
        shares[to] += value;
        emit Transfer(from, to, value);
    }

    /// @notice Expected output for an input amount at the current reserves (0 if the pool is empty).
    function getAmountOut(uint256 amountIn, bool zeroToOne) external view returns (uint256) {
        return zeroToOne ? _quote(amountIn, reserve0, reserve1) : _quote(amountIn, reserve1, reserve0);
    }

    function _quote(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) private pure returns (uint256) {
        if (amountIn == 0 || reserveIn == 0 || reserveOut == 0) return 0;
        uint256 amountInWithFee = amountIn * (10000 - FEE_BPS);
        return (amountInWithFee * reserveOut) / (reserveIn * 10000 + amountInWithFee);
    }

    /// @dev Pull exactly `amount` from the caller; rejects tokens that take a fee on transfer.
    function _pull(IERC20 token, uint256 amount) private {
        uint256 balBefore = token.balanceOf(address(this));
        _call(address(token), abi.encodeCall(IERC20.transferFrom, (msg.sender, address(this), amount)));
        require(token.balanceOf(address(this)) - balBefore == amount, "unsupported token (fee on transfer)");
    }

    /// @dev Pay out exactly the amount; reverts if the recipient receives less (token that taxes outgoing transfers).
    function _push(IERC20 token, address to, uint256 amount) private {
        uint256 balBefore = token.balanceOf(to);
        _call(address(token), abi.encodeCall(IERC20.transfer, (to, amount)));
        uint256 balAfter = token.balanceOf(to);
        require(balAfter >= balBefore && balAfter - balBefore == amount, "unsupported token (fee on transfer)");
    }

    /// @dev Works with tokens that return nothing (e.g. USDT) as well as tokens that return a bool.
    function _call(address token, bytes memory data) private {
        (bool ok, bytes memory ret) = token.call(data);
        require(ok && (ret.length == 0 || abi.decode(ret, (bool))), "token transfer failed");
    }

    function _sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) { z = x; x = (y / x + x) / 2; }
        } else if (y != 0) { z = 1; }
    }
}

/// @title ArcSwapAMMFactory — creates pairs on demand
/// @notice Generated by ContractForge for Arc Mainnet (chainId 5042)
contract ArcSwapAMMFactory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address token0, address token1, address pair);

    function createPair(address tokenX, address tokenY) external returns (address pair) {
        require(tokenX != tokenY, "identical tokens");
        require(tokenX != address(0) && tokenY != address(0), "zero address");
        require(getPair[tokenX][tokenY] == address(0), "pair exists");
        (address token0, address token1) = tokenX < tokenY ? (tokenX, tokenY) : (tokenY, tokenX);
        pair = address(new ArcSwapAMMPair(token0, token1));
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair);
    }

    function allPairsLength() external view returns (uint256) { return allPairs.length; }
}