// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../StrategyERC20_V3.sol";
import "../interfaces/uniswap/Uniswap.sol";
import "../interfaces/curve/LiquidityGaugeV2.sol";
import "../interfaces/curve/Minter.sol";
import "../interfaces/curve/StableSwapIb.sol";

contract StrategyCurveIb is StrategyERC20_V3 {
    event Deposit(uint amount);
    event Withdraw(uint amount);
    event Harvest(uint profit);
    event Skim(uint profit);

    // Uniswap //
    address private constant UNISWAP = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    address internal constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address internal constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address internal constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    // DAI = 0 | USDC = 1 | USDT = 2
    uint private immutable UNDERLYING_INDEX;
    // precision to convert 10 ** 18  to underlying decimals
    uint[3] private PRECISION_DIV = [1, 1e12, 1e12];
    // precision div of underlying token (used to save gas)
    uint private immutable PRECISION_DIV_UNDERLYING;

    // Curve //
    // StableSwap
    address private constant SWAP = 0x2dded6Da1BF5DBdF597C45fcFaa3194e53EcfeAF;
    // liquidity provider token
    address private constant LP = 0x5282a4eF67D9C33135340fB3289cc1711c13638C;
    // LiquidityGaugeV2
    address private constant GAUGE = 0xF5194c3325202F456c95c1Cf0cA36f8475C1949F;
    // Minter
    address private constant MINTER = 0xd061D61a4d941c39E5453435B6345Dc261C2fcE0;
    // CRV
    address private constant CRV = 0xD533a949740bb3306d119CC777fa900bA034cd52;

    // prevent slippage from deposit / withdraw
    uint public slippage = 100;
    uint private constant SLIPPAGE_MAX = 10000;

    /*
    Numerator used to update totalDebt if
    totalAssets() is <= totalDebt * delta / DELTA_MIN
    */
    uint public delta = 10050;
    uint private constant DELTA_MIN = 10000;

    // enable to claim LiquidityGaugeV2 rewards
    bool public shouldClaimRewards;

    constructor(
        address _controller,
        address _vault,
        address _underlying,
        uint _underlyingIndex,
        address _keeper
    ) public StrategyERC20_V3(_controller, _vault, _underlying, _keeper) {
        UNDERLYING_INDEX = _underlyingIndex;
        PRECISION_DIV_UNDERLYING = PRECISION_DIV[_underlyingIndex];

        // Infinite approvals should be safe as long as only small amount
        // of underlying is stored in this contract.

        // Approve StableSwapIb.add_liquidity
        IERC20(DAI).safeApprove(SWAP, type(uint).max);
        IERC20(USDC).safeApprove(SWAP, type(uint).max);
        IERC20(USDT).safeApprove(SWAP, type(uint).max);
        // Approve LiquidityGaugeV2.deposit
        IERC20(LP).safeApprove(GAUGE, type(uint).max);

        // These tokens are never held by this contract
        // so the risk of them getting stolen is minimal
        IERC20(CRV).safeApprove(UNISWAP, type(uint).max);
    }

    /*
    @notice Set max slippage for deposit and withdraw from Curve pool
    @param _slippage Max amount of slippage allowed
    */
    function setSlippage(uint _slippage) external onlyAdmin {
        require(_slippage <= SLIPPAGE_MAX, "slippage > max");
        slippage = _slippage;
    }

    /*
    @notice Set delta, used to calculate difference between totalAsset and totalDebt
    @param _delta Numerator of delta / DELTA_MIN
    */
    function setDelta(uint _delta) external onlyAdmin {
        require(_delta >= DELTA_MIN, "delta < min");
        delta = _delta;
    }

    /*
    @notice Activate or decactivate LiquidityGaugeV2.claim_rewards()
    */
    function setShouldClaimRewards(bool _shouldClaimRewards) external onlyAdmin {
        shouldClaimRewards = _shouldClaimRewards;
    }

    function _totalAssets() private view returns (uint) {
        uint lpBal = LiquidityGaugeV2(GAUGE).balanceOf(address(this));
        uint pricePerShare = StableSwapIb(SWAP).get_virtual_price();

        return lpBal.mul(pricePerShare) / (PRECISION_DIV_UNDERLYING * 1e18);
    }

    function totalAssets() external view override returns (uint) {
        return _totalAssets();
    }

    function _increaseDebt(uint _amount) private returns (uint) {
        // USDT has transfer fee so we need to check balance after transfer
        uint balBefore = IERC20(underlying).balanceOf(address(this));
        IERC20(underlying).safeTransferFrom(vault, address(this), _amount);
        uint balAfter = IERC20(underlying).balanceOf(address(this));

        uint diff = balAfter.sub(balBefore);
        totalDebt = totalDebt.add(diff);

        return diff;
    }

    function _decreaseDebt(uint _amount) private returns (uint) {
        // USDT has transfer fee so we need to check balance after transfer
        uint balBefore = IERC20(underlying).balanceOf(address(this));
        IERC20(underlying).safeTransfer(vault, _amount);
        uint balAfter = IERC20(underlying).balanceOf(address(this));

        uint diff = balBefore.sub(balAfter);
        if (diff >= totalDebt) {
            totalDebt = 0;
        } else {
            totalDebt -= diff;
        }

        return diff;
    }

    /*
    @notice Deposit underlying token into Curve
    @param _token Address of underlying token
    @param _index Index of underlying token
    */
    function _deposit(address _token, uint _index) private {
        // deposit underlying token, get LP
        uint bal = IERC20(_token).balanceOf(address(this));
        if (bal > 0) {
            // mint LP
            uint[3] memory amounts;
            amounts[_index] = bal;

            /*
            shares = underlying amount * precision div * 1e18 / price per share
            */
            uint pricePerShare = StableSwapIb(SWAP).get_virtual_price();
            uint shares = bal.mul(PRECISION_DIV[_index]).mul(1e18).div(pricePerShare);
            uint min = shares.mul(SLIPPAGE_MAX - slippage) / SLIPPAGE_MAX;

            uint lpAmount = StableSwapIb(SWAP).add_liquidity(amounts, min, true);

            // stake into LiquidityGaugeV2
            if (lpAmount > 0) {
                LiquidityGaugeV2(GAUGE).deposit(lpAmount);
            }
        }
    }

    function deposit(uint _amount) external override onlyAuthorized {
        require(_amount > 0, "deposit = 0");

        uint diff = _increaseDebt(_amount);
        _deposit(underlying, UNDERLYING_INDEX);

        emit Deposit(diff);
    }

    function _getTotalShares() private view returns (uint) {
        return LiquidityGaugeV2(GAUGE).balanceOf(address(this));
    }

    function _getShares(
        uint _amount,
        uint _total,
        uint _totalShares
    ) private pure returns (uint) {
        /*
        calculate shares to withdraw

        w = amount of underlying to withdraw
        U = total redeemable underlying
        s = shares to withdraw
        P = total shares deposited into external liquidity pool

        w / U = s / P
        s = w / U * P
        */
        if (_total > 0) {
            // avoid rounding errors and cap shares to be <= total shares
            if (_amount >= _total) {
                return _totalShares;
            }
            return _amount.mul(_totalShares) / _total;
        }
        return 0;
    }

    /*
    @notice Withdraw underlying token from Curve
    @param _amount Amount of underlying token to withdraw
    @return Actual amount of underlying token that was withdrawn
    */
    function _withdraw(uint _amount) private returns (uint) {
        require(_amount > 0, "withdraw = 0");

        uint total = _totalAssets();

        if (_amount >= total) {
            _amount = total;
        }

        uint totalShares = _getTotalShares();
        uint shares = _getShares(_amount, total, totalShares);

        if (shares > 0) {
            // withdraw LP from LiquidityGaugeV2
            LiquidityGaugeV2(GAUGE).withdraw(shares);

            uint min = _amount.mul(SLIPPAGE_MAX - slippage) / SLIPPAGE_MAX;
            // withdraw creates LP dust
            return
                StableSwapIb(SWAP).remove_liquidity_one_coin(
                    shares,
                    int128(UNDERLYING_INDEX),
                    min,
                    true
                );
            // Now we have underlying
        }
        return 0;
    }

    function withdraw(uint _amount) external override onlyAuthorized {
        uint available = _withdraw(_amount);
        uint diff;
        if (available > 0) {
            diff = _decreaseDebt(available);
        }

        emit Withdraw(diff);
    }

    function _withdrawAll() private {
        _withdraw(type(uint).max);

        // There may be dust so re-calculate balance
        uint bal = IERC20(underlying).balanceOf(address(this));
        if (bal > 0) {
            IERC20(underlying).safeTransfer(vault, bal);
            totalDebt = 0;
        }

        emit Withdraw(bal);
    }

    function withdrawAll() external override onlyAuthorized {
        _withdrawAll();
    }

    /*
    @notice Returns address and index of token with lowest balance in Curve pool
    */
    function _getMostPremiumToken() private view returns (address, uint) {
        uint[3] memory balances;
        balances[0] = StableSwapIb(SWAP).balances(0); // DAI
        balances[1] = StableSwapIb(SWAP).balances(1).mul(1e12); // USDC
        balances[2] = StableSwapIb(SWAP).balances(2).mul(1e12); // USDT

        // DAI
        if (balances[0] <= balances[1] && balances[0] <= balances[2]) {
            return (DAI, 0);
        }

        // USDC
        if (balances[1] <= balances[0] && balances[1] <= balances[2]) {
            return (USDC, 1);
        }

        return (USDT, 2);
    }

    /*
    @dev Uniswap fails with zero address so no check is necessary here
    */
    function _swap(
        address _from,
        address _to,
        uint _amount
    ) private {
        // create dynamic array with 3 elements
        address[] memory path = new address[](3);
        path[0] = _from;
        path[1] = WETH;
        path[2] = _to;

        Uniswap(UNISWAP).swapExactTokensForTokens(
            _amount,
            1,
            path,
            address(this),
            block.timestamp
        );
    }

    function _claimRewards(address _token) private {
        if (shouldClaimRewards) {
            LiquidityGaugeV2(GAUGE).claim_rewards();
            // Rewarded tokens will be managed by admin via calling sweep()
        }

        // claim CRV
        Minter(MINTER).mint(GAUGE);

        uint crvBal = IERC20(CRV).balanceOf(address(this));
        // Swap only if CRV >= 1, otherwise swap may fail
        if (crvBal >= 1e18) {
            _swap(CRV, _token, crvBal);
            // Now this contract has token
        }
    }

    /*
    @notice Claim CRV and deposit most premium token into Curve
    */
    function harvest() external override onlyAuthorized {
        (address token, uint index) = _getMostPremiumToken();

        _claimRewards(token);

        uint bal = IERC20(token).balanceOf(address(this));
        if (bal > 0) {
            // transfer fee to treasury
            uint fee = bal.mul(performanceFee) / PERFORMANCE_FEE_MAX;
            if (fee > 0) {
                address treasury = IController(controller).treasury();
                require(treasury != address(0), "treasury = zero address");

                IERC20(token).safeTransfer(treasury, fee);
            }

            _deposit(token, index);

            emit Harvest(bal.sub(fee));
        }
    }

    function skim() external override onlyAuthorized {
        uint total = _totalAssets();
        require(total > totalDebt, "total underlying < debt");

        uint profit = total - totalDebt;

        // protect against price manipulation
        uint max = totalDebt.mul(delta) / DELTA_MIN;
        if (total <= max) {
            /*
            total underlying is within reasonable bounds, probaly no price
            manipulation occured.
            */

            /*
            If we were to withdraw profit followed by deposit, this would
            increase the total debt roughly by the profit.

            Withdrawing consumes high gas, so here we omit it and
            directly increase debt, as if withdraw and deposit were called.
            */
            totalDebt = totalDebt.add(profit);
        } else {
            /*
            Possible reasons for total underlying > max
            1. total debt = 0
            2. total underlying really did increase over max
            3. price was manipulated
            */
            uint amountWithdrawn = _withdraw(profit);
            if (amountWithdrawn > 0) {
                IERC20(underlying).safeTransfer(vault, amountWithdrawn);
            }
        }

        emit Skim(profit);
    }

    function exit() external override onlyAuthorized {
        if (forceExit) {
            return;
        }
        _claimRewards(underlying);
        _withdrawAll();
    }

    function sweep(address _token) external override onlyAdmin {
        require(_token != underlying, "protected token");
        require(_token != GAUGE, "protected token");
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
