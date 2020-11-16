// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../interfaces/pickle/PickleJar.sol";
import "../interfaces/pickle/MasterChef.sol";

import "../StrategyBase.sol";
import "../UseUniswap.sol";

contract StrategyPdaiDai is StrategyBase, UseUniswap {
    address internal constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

    // Pickle //
    address private constant JAR = 0x6949Bb624E8e8A90F87cD2058139fcd77D2F3F87;
    address private constant CHEF = 0xbD17B1ce622d73bD438b9E658acA5996dc394b0d;
    address private constant PICKLE = 0x429881672B9AE42b8EbA0E26cD9C73711b891Ca5;

    // POOL ID for PDAI JAR
    uint private constant POOL_ID = 16;

    constructor(address _controller, address _vault)
        public
        StrategyBase(_controller, _vault, DAI)
    {
        // Assets that cannot be swept by admin
        assets[PICKLE] = true;
    }

    // TODO security: vulnerable to price manipulation?
    function _totalAssets() internal view override returns (uint) {
        // getRatio() is multiplied by 10 ** 18
        uint pricePerShare = PickleJar(JAR).getRatio();
        (uint shares, ) = MasterChef(CHEF).userInfo(POOL_ID, address(this));

        return shares.mul(pricePerShare).div(1e18);
    }

    function _depositUnderlying() internal override {
        // deposit DAI into PICKLE
        uint bal = IERC20(underlying).balanceOf(address(this));
        if (bal > 0) {
            IERC20(underlying).safeApprove(JAR, 0);
            IERC20(underlying).safeApprove(JAR, bal);
            PickleJar(JAR).deposit(bal);
        }

        // stake pDai
        uint pDaiBal = IERC20(JAR).balanceOf(address(this));
        if (pDaiBal > 0) {
            IERC20(JAR).safeApprove(CHEF, 0);
            IERC20(JAR).safeApprove(CHEF, pDaiBal);
            MasterChef(CHEF).deposit(POOL_ID, pDaiBal);
        }
    }

    function _getTotalShares() internal view override returns (uint) {
        (uint pDaiBal, ) = MasterChef(CHEF).userInfo(POOL_ID, address(this));
        return pDaiBal;
    }

    function _withdrawUnderlying(uint _pDaiAmount) internal override {
        // unstake
        MasterChef(CHEF).withdraw(POOL_ID, _pDaiAmount);

        // withdraw DAI from  PICKLE
        PickleJar(JAR).withdraw(_pDaiAmount);
        // Now we have underlying
    }

    function _swapPickle() private {
        uint pickleBal = IERC20(PICKLE).balanceOf(address(this));
        if (pickleBal > 0) {
            _swap(PICKLE, underlying, pickleBal);
            // Now this contract has underlying token
        }
    }

    /*
    @notice Sell PICKLE and deposit most premium token into CURVE
    */
    function harvest() external override onlyAuthorized {
        _swapPickle();

        uint bal = IERC20(underlying).balanceOf(address(this));
        if (bal > 0) {
            // transfer fee to treasury
            uint fee = bal.mul(performanceFee).div(PERFORMANCE_FEE_MAX);
            if (fee > 0) {
                address treasury = IController(controller).treasury();
                require(treasury != address(0), "treasury = zero address");

                IERC20(underlying).safeTransfer(treasury, fee);
            }

            _depositUnderlying();
        }
    }

    /*
    @dev Caller should implement guard agains slippage
    */
    function exit() external override onlyAuthorized {
        // PICKLE is minted on withdraw so here we
        // 1. Withdraw from MasterChef
        // 2. Sell PICKLE
        // 3. Transfer underlying to vault
        _withdrawAll();
        _swapPickle();

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeTransfer(vault, underlyingBal);
        }
    }
}
