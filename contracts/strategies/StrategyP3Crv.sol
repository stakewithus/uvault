pragma solidity 0.5.17;

import "../interfaces/curve/ICurveFi3.sol";
import "../interfaces/pickle/PickleJar.sol";
import "../interfaces/pickle/MasterChef.sol";

import "../IController.sol";
import "../StrategyBase.sol";
import "../UseUniswap.sol";

contract StrategyP3Crv is StrategyBase, UseUniswap {
    // DAI = 0 | USDC = 1 | USDT = 2
    uint internal underlyingIndex;
    // precision to convert 10 ** 18  to underlying decimals
    uint internal precisionDiv = 1;

    // Curve //
    // 3Crv
    address internal threeCrv;
    // ICurveFi3
    address internal curve;

    // Pickle //
    address internal jar;
    address internal chef;
    address internal pickle;
    // POOL ID for 3Crv jar
    uint private constant POOL_ID = 14;

    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public StrategyBase(_controller, _vault, _underlying) {}

    // TODO vulnerable to price manipulation
    function _totalAssets() private view returns (uint) {
        // multiplied by 10 ** 18
        uint pricePerShare = PickleJar(jar).getRatio();
        (uint shares, ) = MasterChef(chef).userInfo(POOL_ID, address(this));

        return shares.mul(pricePerShare).div(1e18).div(precisionDiv);
    }

    function totalAssets() external view returns (uint) {
        return _totalAssets();
    }

    function _depositUnderlying() private {
        // underlying to threeCrv
        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeApprove(curve, 0);
            IERC20(underlying).safeApprove(curve, underlyingBal);
            // mint threeCrv
            uint[3] memory amounts;
            amounts[underlyingIndex] = underlyingBal;
            ICurveFi3(curve).add_liquidity(amounts, 0);
            // Now we have 3Crv
        }

        // deposit 3Crv into Pickle
        uint threeBal = IERC20(threeCrv).balanceOf(address(this));
        if (threeBal > 0) {
            IERC20(threeCrv).safeApprove(jar, 0);
            IERC20(threeCrv).safeApprove(jar, threeBal);
            PickleJar(jar).deposit(threeBal);
        }

        // stake p3crv
        uint p3crvBal = IERC20(jar).balanceOf(address(this));
        if (p3crvBal > 0) {
            IERC20(jar).safeApprove(chef, 0);
            IERC20(jar).safeApprove(chef, p3crvBal);
            MasterChef(chef).deposit(POOL_ID, p3crvBal);
        }
    }

    /*
    @dev Only vault must call in order to correctly update vault.totalDebt
    */
    function deposit(uint _underlyingAmount) external onlyAuthorized {
        require(_underlyingAmount > 0, "underlying = 0");

        _increaseDebt(_underlyingAmount);
        _depositUnderlying();
    }

    function _withdrawUnderlying(uint _p3CrvAmount) private {
        // unstake
        MasterChef(chef).withdraw(POOL_ID, _p3CrvAmount);

        // withdraw threeCrv from  Pickle
        PickleJar(jar).withdraw(_p3CrvAmount);

        // withdraw underlying
        uint threeBal = IERC20(threeCrv).balanceOf(address(this));
        // creates threeCrv dust
        ICurveFi3(curve).remove_liquidity_one_coin(
            threeBal,
            int128(underlyingIndex),
            0
        );
        // Now we have underlying
    }

    /*
    @dev Only vault must call in order to correctly update vault.totalDebt
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
        T = total shares

        w / U = s / T
        s = w / U * T
        */
        (uint p3CrvBal, ) = MasterChef(chef).userInfo(POOL_ID, address(this));
        uint p3CrvAmount = _underlyingAmount.mul(p3CrvBal).div(totalUnderlying);

        if (p3CrvAmount > 0) {
            _withdrawUnderlying(p3CrvAmount);
        }

        // transfer underlying token to vault
        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            _decreaseDebt(underlyingBal);
        }
    }

    function _withdrawAll() private {
        (uint p3CrvBal, ) = MasterChef(chef).userInfo(POOL_ID, address(this));
        if (p3CrvBal > 0) {
            _withdrawUnderlying(p3CrvBal);
        }

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            _decreaseDebt(underlyingBal);
            totalDebt = 0;
        }
    }

    /*
    @dev Only vault must call in order to correctly update vault.totalDebt
    */
    function withdrawAll() external onlyAuthorized {
        _withdrawAll();
    }

    function _pickleToUnderlying() private {
        uint pickleBal = IERC20(pickle).balanceOf(address(this));
        if (pickleBal > 0) {
            _swap(pickle, underlying, pickleBal);
            // Now this contract has underlying token
        }
    }

    function harvest() external onlyAuthorized {
        _pickleToUnderlying();

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
    @dev Only vault must call in order to correctly update vault.totalDebt
    */
    function exit() external onlyAuthorized {
        // Pickle is minted on withdraw so here we
        // 1. Withdraw from MasterChef
        // 2. Sell Pickle
        // 3. Transfer underlying to vault
        _withdrawAll();

        _pickleToUnderlying();

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeTransfer(vault, underlyingBal);
        }
    }
}
