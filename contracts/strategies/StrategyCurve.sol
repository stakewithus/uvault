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
    // cDAI/cUSDC or 3Crv
    address internal cUnderlying;
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
        uint cUnderlyingBal = Gauge(gauge).balanceOf(address(this));
        return cUnderlyingBal.mul(_getVirtualPrice()).div(1e18);
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
        // underlying to cUnderlying
        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeApprove(pool, 0);
            IERC20(underlying).safeApprove(pool, underlyingBal);
            // mint cUnderlying
            _addLiquidity(underlyingBal);
        }

        // stake cUnderlying into Gauge
        uint cBal = IERC20(cUnderlying).balanceOf(address(this));
        if (cBal > 0) {
            IERC20(cUnderlying).safeApprove(gauge, 0);
            IERC20(cUnderlying).safeApprove(gauge, cBal);
            Gauge(gauge).deposit(cBal);
        }
    }

    /*
    @notice Deposit underlying token into this strategy
    @param _underlyingAmount Amount of underlying token to deposit
    */
    function deposit(uint _underlyingAmount) external onlyVault {
        require(_underlyingAmount > 0, "underlying = 0");

        IERC20(underlying).safeTransferFrom(vault, address(this), _underlyingAmount);
        _depositUnderlying();
    }

    function _removeLiquidityOneCoin(uint _cAmount) internal;

    function _withdrawUnderlying(uint _cUnderlyingAmount) private {
        // withdraw cUnderlying from  Gauge
        Gauge(gauge).withdraw(_cUnderlyingAmount);

        // withdraw underlying
        uint cBal = IERC20(cUnderlying).balanceOf(address(this));
        // creates cUnderlying dust
        _removeLiquidityOneCoin(cBal);
        // Now we have underlying
    }

    /*
    @notice Withdraw undelying token to vault
    @param _underlyingAmount Amount of underlying token to withdraw
    @dev Controller and vault should implement guard agains slippage
    */
    function withdraw(uint _underlyingAmount) external onlyAuthorized {
        require(_underlyingAmount > 0, "underlying = 0");
        uint totalUnderlying = _totalAssets();
        require(_underlyingAmount <= totalUnderlying, "underlying > total");

        // calculate shares to withdraw
        /*
        w = amount of underlying to withdraw
        U = total underlying redeemable in Curve
        s = shares to withdraw
        T = total shares in Gauge

        w / U = s / T
        s = w / U * T
        */
        uint cUnderlyingBal = Gauge(gauge).balanceOf(address(this));
        uint cUnderlyingAmount = _underlyingAmount.mul(cUnderlyingBal).div(
            totalUnderlying
        );

        if (cUnderlyingAmount > 0) {
            _withdrawUnderlying(cUnderlyingAmount);
        }

        // transfer underlying token to vault
        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeTransfer(vault, underlyingBal);
        }
    }

    function _withdrawAll() private {
        // gauge balance is same unit as cUnderlying
        uint cUnderlyingBal = Gauge(gauge).balanceOf(address(this));
        if (cUnderlyingBal > 0) {
            _withdrawUnderlying(cUnderlyingBal);
        }

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeTransfer(vault, underlyingBal);
        }
    }

    /*
    @notice Withdraw all underlying to vault
    @dev This function does not claim CRV
    @dev Controller and vault should implement guard agains slippage
    */
    function withdrawAll() external onlyAuthorized {
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
    function harvest() external onlyAuthorized {
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

            // deposit remaining underlying for cUnderlying
            _depositUnderlying();
        }
    }

    /*
    @notice Exit strategy by harvesting CRV to underlying token and then
            withdrawing all underlying to vault
    @dev Must return all underlying token to vault
    @dev Controller and vault should implement guard agains slippage
    */
    function exit() external onlyAuthorized {
        _crvToUnderlying();
        _withdrawAll();
    }
}
