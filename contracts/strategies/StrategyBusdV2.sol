// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../StrategyBaseV2.sol";
import "../UseUniswap.sol";
import "../interfaces/curve/LiquidityGauge.sol";
import "../interfaces/curve/Minter.sol";
import "../interfaces/curve/StableSwapBusd.sol";
import "../interfaces/curve/DepositBusd.sol";

contract StrategyBusdV2 is StrategyBaseV2, UseUniswap {
    address private constant BUSD = 0x4Fabb145d64652a948d72533023f6E7A623C7C53;
    address internal constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address internal constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address internal constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    // DAI = 0 | USDC = 1 | USDT = 2 | BUSD = 3
    uint internal underlyingIndex;
    // precision to convert 10 ** 18  to underlying decimals
    uint[4] private PRECISION_DIVS = [1, 1e12, 1e12, 1];

    // Curve //
    // StableSwapBusd
    address private constant SWAP = 0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27;
    // liquidity provider token (yDAI/yUSDC/yUSDT/yBUSD)
    address private constant LP = 0x3B3Ac5386837Dc563660FB6a0937DFAa5924333B;
    // DepositBusd
    address private constant POOL = 0xb6c057591E073249F2D9D88Ba59a46CFC9B59EdB;
    // LiquidityGauge
    address private constant GAUGE = 0x69Fb7c45726cfE2baDeE8317005d3F94bE838840;
    // Minter
    address private constant MINTER = 0xd061D61a4d941c39E5453435B6345Dc261C2fcE0;
    // DAO
    address private constant CRV = 0xD533a949740bb3306d119CC777fa900bA034cd52;

    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public StrategyBaseV2(_controller, _vault, _underlying) {}

    function _totalAssets() internal view override returns (uint) {
        uint lpBal = LiquidityGauge(GAUGE).balanceOf(address(this));
        /*
        get_virtual_price is calculated with exchange rate of wrapped token to underlying.
        So price per share = underlying price per LP share
        */
        uint pricePerShare = StableSwapBusd(SWAP).get_virtual_price();

        return lpBal.mul(pricePerShare).div(PRECISION_DIVS[underlyingIndex]) / 1e18;
    }

    /*
    @notice deposit token into curve
    */
    function _deposit(address _token, uint _index) private {
        // token to LP
        uint bal = IERC20(_token).balanceOf(address(this));
        if (bal > 0) {
            IERC20(_token).safeApprove(POOL, 0);
            IERC20(_token).safeApprove(POOL, bal);

            // mint LP
            uint[4] memory amounts;
            amounts[_index] = bal;

            /*
            shares = underlying amount * precision div * 1e18 / price per share
            */
            uint pricePerShare = StableSwapBusd(SWAP).get_virtual_price();
            uint shares = bal.mul(PRECISION_DIVS[_index]).mul(1e18).div(pricePerShare);
            uint min = shares.mul(SLIPPAGE_MAX - slippage) / SLIPPAGE_MAX;

            DepositBusd(POOL).add_liquidity(amounts, min);
        }

        // stake into LiquidityGauge
        uint lpBal = IERC20(LP).balanceOf(address(this));
        if (lpBal > 0) {
            IERC20(LP).safeApprove(GAUGE, 0);
            IERC20(LP).safeApprove(GAUGE, lpBal);
            LiquidityGauge(GAUGE).deposit(lpBal);
        }
    }

    /*
    @notice Deposits underlying to LiquidityGauge
    */
    function _depositUnderlying() internal override {
        _deposit(underlying, underlyingIndex);
    }

    function _getTotalShares() internal view override returns (uint) {
        return LiquidityGauge(GAUGE).balanceOf(address(this));
    }

    function _withdrawUnderlying(uint _lpAmount) internal override {
        // withdraw LP from  LiquidityGauge
        LiquidityGauge(GAUGE).withdraw(_lpAmount);

        // withdraw underlying //
        uint lpBal = IERC20(LP).balanceOf(address(this));

        // remove liquidity
        IERC20(LP).safeApprove(POOL, 0);
        IERC20(LP).safeApprove(POOL, lpBal);

        /*
        underlying amount = (shares * price per shares) / (1e18 * precision div)
        */
        uint pricePerShare = StableSwapBusd(SWAP).get_virtual_price();
        uint underlyingAmount =
            lpBal.mul(pricePerShare).div(PRECISION_DIVS[underlyingIndex]) / 1e18;
        uint min = underlyingAmount.mul(SLIPPAGE_MAX - slippage) / SLIPPAGE_MAX;
        // withdraw creates LP dust
        DepositBusd(POOL).remove_liquidity_one_coin(
            lpBal,
            int128(underlyingIndex),
            min,
            false
        );
        // Now we have underlying
    }

    /*
    @notice Returns address and index of token with lowest balance in Curve POOL
    */
    function _getMostPremiumToken() internal view returns (address, uint) {
        uint[4] memory balances;
        balances[0] = StableSwapBusd(SWAP).balances(0); // DAI
        balances[1] = StableSwapBusd(SWAP).balances(1).mul(1e12); // USDC
        balances[2] = StableSwapBusd(SWAP).balances(2).mul(1e12); // USDT
        balances[3] = StableSwapBusd(SWAP).balances(3); // BUSD

        uint minIndex = 0;
        for (uint i = 1; i < balances.length; i++) {
            if (balances[i] <= balances[minIndex]) {
                minIndex = i;
            }
        }

        if (minIndex == 0) {
            return (DAI, 0);
        }
        if (minIndex == 1) {
            return (USDC, 1);
        }
        if (minIndex == 2) {
            return (USDT, 2);
        }
        return (BUSD, 3);
    }

    function _swapCrvFor(address _token) private {
        Minter(MINTER).mint(GAUGE);

        uint crvBal = IERC20(CRV).balanceOf(address(this));
        if (crvBal > 0) {
            _swap(CRV, _token, crvBal);
            // Now this contract has token
        }
    }

    /*
    @notice Claim CRV and deposit most premium token into Curve
    */
    function harvest() external override onlyAuthorized {
        (address token, uint index) = _getMostPremiumToken();

        _swapCrvFor(token);

        uint bal = IERC20(token).balanceOf(address(this));
        if (bal > 0) {
            // transfer fee to treasury
            uint fee = bal.mul(performanceFee) / PERFORMANCE_FEE_MAX;
            if (fee > 0) {
                address treasury = IControllerV2(controller).treasury();
                require(treasury != address(0), "treasury = zero address");

                IERC20(token).safeTransfer(treasury, fee);
            }

            _deposit(token, index);
        }
    }

    /*
    @notice Exit strategy by harvesting CRV to underlying token and then
            withdrawing all underlying to vault
    @dev Must return all underlying token to vault
    @dev Caller should implement guard agains slippage
    */
    function exit() external override onlyAuthorized {
        _swapCrvFor(underlying);
        _withdrawAll();
    }
}
