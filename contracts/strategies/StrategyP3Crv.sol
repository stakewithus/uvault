// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

import "../interfaces/curve/ICurveFi3.sol";
import "../interfaces/pickle/PickleJar.sol";
import "../interfaces/pickle/MasterChef.sol";

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
    function _totalAssets() internal override view returns (uint) {
        // multiplied by 10 ** 18
        uint pricePerShare = PickleJar(jar).getRatio();
        (uint shares, ) = MasterChef(chef).userInfo(POOL_ID, address(this));

        return shares.mul(pricePerShare).div(1e18).div(precisionDiv);
    }

    function _depositUnderlying() internal override {
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

    function _getTotalShares() internal override view returns (uint) {
        (uint p3CrvBal, ) = MasterChef(chef).userInfo(POOL_ID, address(this));
        return p3CrvBal;
    }

    function _withdrawUnderlying(uint _p3CrvAmount) internal override {
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

    function _harvest() internal override {
        uint pickleBal = IERC20(pickle).balanceOf(address(this));
        if (pickleBal > 0) {
            _swap(pickle, underlying, pickleBal);
            // Now this contract has underlying token
        }
    }

    /*
    @dev Caller should implement guard agains slippage
    */
    function exit() external override onlyAuthorized {
        // Pickle is minted on withdraw so here we
        // 1. Withdraw from MasterChef
        // 2. Sell Pickle
        // 3. Transfer underlying to vault
        _withdrawAll();
        _harvest();

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeTransfer(vault, underlyingBal);
        }
    }
}
