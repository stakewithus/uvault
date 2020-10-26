pragma solidity 0.5.17;

import "../interfaces/curve/ICurveFi3.sol";
import "../interfaces/uniswap/Uniswap.sol";
import "../interfaces/pickle/PickleJar.sol";
import "../interfaces/pickle/MasterChef.sol";

import "../IController.sol";
import "../IStrategy.sol";
import "../BaseStrategy.sol";

contract StrategyStableToPickle is IStrategy, BaseStrategy {
    address public underlying;
    // DAI = 0 | USDC = 1 | USDT = 2
    uint internal underlyingIndex;

    // Curve //
    // 3Crv
    address internal threeCrv;
    // ICurveFi3
    address internal pool;

    // Pickle //
    // 0x1bb74b5ddc1f4fc91d6f9e7906cf68bc93538e33
    address internal jar;
    // 0xbd17b1ce622d73bd438b9e658aca5996dc394b0d
    address internal chef;
    // 0x429881672B9AE42b8EbA0E26cD9C73711b891Ca5
    address internal pickle;
    // POOL ID for 3Crv jar
    uint private constant POOL_ID = 14;

    // DEX related addresses
    address internal uniswap;
    // used for pickle <> weth <> underlying route
    address internal weth;

    constructor(address _controller, address _vault)
        public
        BaseStrategy(_controller, _vault)
    {
        // TODO fix
        assets[underlying] = true;
        assets[threeCrv] = true;
        assets[jar] = true;
    }

    function _totalAssets() private view returns (uint) {
        uint pricePerShare = PickleJar(jar).getRatio().div(1e18);
        (uint shares, ) = MasterChef(chef).userInfo(POOL_ID, address(this));

        return shares.mul(pricePerShare);
    }

    function totalAssets() external view returns (uint) {
        return _totalAssets();
    }

    function _depositUnderlying() private {
        // underlying to threeCrv
        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeApprove(pool, 0);
            IERC20(underlying).safeApprove(pool, underlyingBal);
            // mint threeCrv
            uint[3] memory amounts;
            amounts[underlyingIndex] = underlyingBal;
            ICurveFi3(pool).add_liquidity(amounts, 0);
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
        uint pickleBal = IERC20(jar).balanceOf(address(this));
        if (pickleBal > 0) {
            IERC20(jar).safeApprove(chef, 0);
            IERC20(jar).safeApprove(chef, pickleBal);
            MasterChef(chef).deposit(POOL_ID, pickleBal);
        }
    }

    function deposit(uint _underlyingAmount) external onlyVault {
        require(_underlyingAmount > 0, "underlying = 0");

        IERC20(underlying).safeTransferFrom(vault, address(this), _underlyingAmount);
        _depositUnderlying();
    }

    function _withdrawUnderlying(uint _p3CrvAmount) private {
        // unstake
        MasterChef(chef).withdraw(POOL_ID, _p3CrvAmount);

        // withdraw threeCrv from  Pickle
        PickleJar(jar).withdraw(_p3CrvAmount);

        // withdraw underlying
        uint threeBal = IERC20(threeCrv).balanceOf(address(this));
        // IERC20(threeCrv).safeApprove(pool, 0);
        // IERC20(threeCrv).safeApprove(pool, threeBal);
        // NOTE: creates threeCrv dust
        ICurveFi3(pool).remove_liquidity_one_coin(threeBal, int128(underlyingIndex), 0);
        // Now we have underlying
    }

    function withdraw(uint _underlyingAmount) external onlyVaultOrController {
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
            IERC20(underlying).safeTransfer(vault, underlyingBal);
        }
    }

    function withdrawAll() external onlyVaultOrController {
        (uint p3CrvBal, ) = MasterChef(chef).userInfo(POOL_ID, address(this));
        if (p3CrvBal > 0) {
            _withdrawUnderlying(p3CrvBal);
        }

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeTransfer(vault, underlyingBal);
        }
    }

    function _pickleToUnderlying() private {
        uint pickleBal = IERC20(pickle).balanceOf(address(this));
        if (pickleBal > 0) {
            // use Uniswap to exchange Pickle for underlying
            IERC20(pickle).safeApprove(uniswap, 0);
            IERC20(pickle).safeApprove(uniswap, pickleBal);
            // route pickle > weth > underlying
            address[] memory path = new address[](3);
            path[0] = pickle;
            path[1] = weth;
            path[2] = underlying;
            Uniswap(uniswap).swapExactTokensForTokens(
                pickleBal,
                uint(0),
                path,
                address(this),
                now.add(1800)
            );
            // Now this contract has underlying token
        }
    }

    function harvest() external onlyController {
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

            _depositUnderlying();
        }
    }

    function exit() external onlyVaultOrController {
        // Pickle is minted on withdraw so here we
        // 1. Withdraw from MasterChef
        // 2. Sell Pickle
        // 3. Transfer underlying to vault
        (uint p3CrvBal, ) = MasterChef(chef).userInfo(POOL_ID, address(this));
        if (p3CrvBal > 0) {
            _withdrawUnderlying(p3CrvBal);
        }

        _pickleToUnderlying();

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeTransfer(vault, underlyingBal);
        }
    }
}
