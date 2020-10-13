pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../interfaces/curve/Gauge.sol";
import "../interfaces/curve/Minter.sol";
import "../interfaces/uniswap/Uniswap.sol";
import "../IController.sol";
import "../IStrategy.sol";
import "../BaseStrategy.sol";

/* potential hacks?
- front running?
- slippage when withdrawing all from strategy
*/

// @dev This is an abstract contract
contract StrategyStableToCurve is IStrategy, BaseStrategy {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    address public underlying;
    // DAI = 0 | USDC = 1 | USDT = 2
    uint256 internal underlyingIndex;

    // Curve //
    // cDAI/cUSDC or 3Crv
    address internal cUnderlying;
    // ICurveFi2 or ICurvFi3
    address internal pool;
    // Gauge
    address internal gauge;
    // Minter
    address internal minter;
    // DAO
    address internal crv;

    // DEX related addresses
    address internal uniswap;
    // used for crv <> weth <> underlying route
    address internal weth;

    constructor(
        address _controller,
        address _vault,
        address _underlying,
        address _cUnderlying,
        address _pool,
        address _gauge,
        address _minter,
        address _crv,
        address _uniswap,
        address _weth,
        uint256 _underlyingIndex
    ) public BaseStrategy(_controller, _vault) {
        underlying = _underlying;
        cUnderlying = _cUnderlying;
        pool = _pool;
        gauge = _gauge;
        minter = _minter;
        crv = _crv;
        uniswap = _uniswap;
        weth = _weth;
        underlyingIndex = _underlyingIndex;
    }

    function _calcWithdrawOneCoin(uint _gaugeAmount) internal view returns (uint);

    function _totalAssets() private view returns (uint) {
        uint gaugeBal = Gauge(gauge).balanceOf(address(this));
        // return ICurveFi2(pool).calc_withdraw_one_coin(gaugeBal, int128(underlyingIndex));
        return _calcWithdrawOneCoin(gaugeBal);
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
            // uint[2] memory amounts;
            // amounts[underlyingIndex] = underlyingBal;
            // ICurveFi2(pool).add_liquidity(amounts , 0);
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

    function _withdrawUnderlying(uint _cUsdAmount) private {
        // withdraw cUnderlying from  Gauge
        Gauge(gauge).withdraw(_cUsdAmount);

        // withdraw underlying
        uint cBal = IERC20(cUnderlying).balanceOf(address(this));
        IERC20(cUnderlying).safeApprove(pool, 0);
        IERC20(cUnderlying).safeApprove(pool, cBal);
        // NOTE: creates cUnderlying dust so we donate it
        _removeLiquidityOneCoin(cBal);
        // ICurveFi2(pool).remove_liquidity_one_coin(cBal, int128(underlyingIndex), 0, true);
        // Now we have underlying
    }

    /*
    @notice Withdraw undelying token to vault
    @param _underlyingAmount Amount of underlying token to withdraw
    @dev Controller and vault should implement guard agains slippage
    */
    function withdraw(uint _underlyingAmount) external onlyVaultOrController {
        require(_underlyingAmount > 0, "underlying = 0");
        uint totalUnderlying = _totalAssets();
        require(_underlyingAmount <= totalUnderlying, "underlying > total");

        // calculate cUnderlying amount to withdraw from underlying
        /*
        u = amount of underlying to withdraw
        U = total underlying redeemable from cUnderlying in Gauge
        c = amount of cUnderlying to withdraw
        C = total amount of cUnderlying in Gauge

        u / U = c / C
        c = u / U * C
        */
        uint gaugeBal = Gauge(gauge).balanceOf(address(this));
        uint cUsdAmount = _underlyingAmount.mul(gaugeBal).div(totalUnderlying);

        if (cUsdAmount > 0) {
            _withdrawUnderlying(cUsdAmount);
        }

        // transfer underlying token to vault
        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeTransfer(vault, underlyingBal);
        }
    }

    function _withdrawAll() private {
        // gauge balance is same unit as cUnderlying
        uint gaugeBal = Gauge(gauge).balanceOf(address(this));
        if (gaugeBal > 0) {
            _withdrawUnderlying(gaugeBal);
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
    function withdrawAll() external onlyVaultOrController {
        _withdrawAll();
    }

    /*
    @notice Claim CRV and swap for underlying token
    */
    function _crvToUnderlying() private {
        Minter(minter).mint(gauge);

        uint crvBal = IERC20(crv).balanceOf(address(this));
        if (crvBal > 0) {
            // use Uniswap to exchange CRV for underlying
            IERC20(crv).safeApprove(uniswap, 0);
            IERC20(crv).safeApprove(uniswap, crvBal);

            // route crv > weth > underlying
            address[] memory path = new address[](3);
            path[0] = crv;
            path[1] = weth;
            path[2] = underlying;

            Uniswap(uniswap).swapExactTokensForTokens(crvBal, uint(0), path, address(this), now.add(1800));
            // NOTE: Now this contract has underlying token
        }
    }

    /*
    @notice Claim CRV, swap for underlying, transfer performance fee to treasury,
            deposit remaning underlying
    */
    function harvest() external onlyController {
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
    function exit() external onlyVaultOrController {
        _crvToUnderlying();
        _withdrawAll();
    }

    function sweep(address _token) external onlyAdmin {
        require(_token != underlying, "token = underlying");
        require(_token != cUnderlying, "token = cUnderlying");
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}