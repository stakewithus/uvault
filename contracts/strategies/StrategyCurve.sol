pragma solidity 0.5.17;

import "../interfaces/curve/Gauge.sol";
import "../interfaces/curve/Minter.sol";
import "../IController.sol";
import "../StrategyBase.sol";
import "../UseUniswap.sol";

/* potential hacks?
- front running?
- slippage when withdrawing all from strategy
*/

// @dev This is an abstract contract
contract StrategyCurve is StrategyBase, UseUniswap {
    // DAI = 0 | USDC = 1 | USDT = 2
    uint internal underlyingIndex;

    // Curve //
    // liquidity provider token (cDAI/cUSDC or 3Crv)
    address internal lp;
    // ICurveFi2 or ICurveFi3
    address internal pool;
    // Gauge
    address internal gauge;
    // Minter
    address internal minter;
    // DAO
    address internal crv;

    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public StrategyBase(_controller, _vault, _underlying) {}

    function _getVirtualPrice() internal view returns (uint);

    function _totalAssets() private view returns (uint) {
        uint lpBal = Gauge(gauge).balanceOf(address(this));
        uint pricePerShare = _getVirtualPrice();

        return lpBal.mul(pricePerShare).div(1e18);
    }

    /*
    @notice Returns amount of underlying stable coin locked in this contract
    */
    function totalAssets() external view returns (uint) {
        return _totalAssets();
    }

    function _addLiquidity(uint _underlyingAmount) internal;

    /*
    @notice Deposits underlying to Gauge
    */
    function _depositUnderlying() private {
        // underlying to lp
        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeApprove(pool, 0);
            IERC20(underlying).safeApprove(pool, underlyingBal);
            // mint lp
            _addLiquidity(underlyingBal);
        }

        // stake lp into Gauge
        uint lpBal = IERC20(lp).balanceOf(address(this));
        if (lpBal > 0) {
            IERC20(lp).safeApprove(gauge, 0);
            IERC20(lp).safeApprove(gauge, lpBal);
            Gauge(gauge).deposit(lpBal);
        }
    }

    /*
    @notice Deposit underlying token into this strategy
    @param _underlyingAmount Amount of underlying token to deposit
    @dev Only vault must call in order to correctly update vault.totalDebt
    */
    function deposit(uint _underlyingAmount) external onlyVault {
        require(_underlyingAmount > 0, "underlying = 0");

        _increaseDebt(_underlyingAmount);
        _depositUnderlying();
    }

    function _removeLiquidityOneCoin(uint _lpAmount) internal;

    function _withdrawUnderlying(uint _lpAmount) private {
        // withdraw lp from  Gauge
        Gauge(gauge).withdraw(_lpAmount);

        // withdraw underlying
        uint lpBal = IERC20(lp).balanceOf(address(this));
        // creates lp dust
        _removeLiquidityOneCoin(lpBal);
        // Now we have underlying
    }

    /*
    @notice Withdraw undelying token to vault
    @param _underlyingAmount Amount of underlying token to withdraw
    @dev Vault should implement guard agains slippage
    @dev Only vault must call in order to correctly update vault.totalDebt
    */
    function withdraw(uint _underlyingAmount) external onlyVault {
        require(_underlyingAmount > 0, "underlying = 0");
        uint totalUnderlying = _totalAssets();
        require(_underlyingAmount <= totalUnderlying, "underlying > total");

        // calculate shares to withdraw
        /*
        w = amount of underlying to withdraw
        U = total underlying redeemable in Curve
        s = shares to withdraw
        T = total shares staked in Gauge

        w / U = s / T
        s = w / U * T
        */
        uint lpBal = Gauge(gauge).balanceOf(address(this));
        uint lpAmount = _underlyingAmount.mul(lpBal).div(totalUnderlying);

        if (lpAmount > 0) {
            _withdrawUnderlying(lpAmount);
        }

        // transfer underlying token to vault
        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            _decreaseDebt(underlyingBal);
        }
    }

    function _withdrawAll() private {
        // gauge balance is same unit as lp
        uint lpBal = Gauge(gauge).balanceOf(address(this));
        if (lpBal > 0) {
            _withdrawUnderlying(lpBal);
        }

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            _decreaseDebt(underlyingBal);
            totalDebt = 0;
        }
    }

    /*
    @notice Withdraw all underlying to vault
    @dev This function does not claim CRV
    @dev Vault should implement guard agains slippage
    @dev Only vault must call in order to correctly update vault.totalDebt
    */
    function withdrawAll() external onlyVault {
        _withdrawAll();
    }

    /*
    @notice Claim CRV and swap for underlying token
    */
    function _crvToUnderlying() private {
        Minter(minter).mint(gauge);

        uint crvBal = IERC20(crv).balanceOf(address(this));
        if (crvBal > 0) {
            _swap(crv, underlying, crvBal);
            // Now this contract has underlying token
        }
    }

    /*
    @notice Claim CRV, swap for underlying, transfer performance fee to treasury,
            deposit remaning underlying
    */
    function harvest() external onlyAdminOrController {
        _crvToUnderlying();

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            // transfer fee to treasury
            uint fee = underlyingBal.mul(performanceFee).div(PERFORMANCE_FEE_MAX);
            if (fee > 0) {
                address treasury = IController(controller).treasury();
                require(treasury != address(0), "treasury = zero address");

                IERC20(underlying).safeTransfer(treasury, fee);
            }

            uint totalUnderlying = _totalAssets();
            if (totalUnderlying >= totalDebt) {
                // transfer to Vault and increase debt upon strategy.deposit
                IERC20(underlying).safeTransfer(vault, underlyingBal.sub(fee));
            } else {
                // deposit remaining underlying for lp
                _depositUnderlying();
            }
        }
    }

    /*
    @notice Exit strategy by harvesting CRV to underlying token and then
            withdrawing all underlying to vault
    @dev Must return all underlying token to vault
    @dev Vault should implement guard agains slippage
    @dev Only vault must call in order to correctly update vault.totalDebt
    */
    function exit() external onlyVault {
        _crvToUnderlying();
        _withdrawAll();
    }
}
