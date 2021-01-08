// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../interfaces/curve/StableSwapAave.sol";
import "./StrategyCurve.sol";

contract StrategyAave is StrategyCurve {
    // Aave StableSwap
    address private constant SWAP = 0xDeBF20617708857ebe4F679508E7b7863a8A8EeE;
    address internal constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address internal constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address internal constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public StrategyCurve(_controller, _vault, _underlying) {
        // Curve
        // Curve aDAI/aUSDC/aUSDT
        lp = 0xFd2a8fA60Abd58Efe3EeE34dd494cD491dC14900;
        // StableSwapAave
        pool = SWAP;
        // LiquidityGaugeV2
        gauge = 0xd662908ADA2Ea1916B3318327A97eB18aD588b5d;
        // Minter
        minter = 0xd061D61a4d941c39E5453435B6345Dc261C2fcE0;
        // DAO
        crv = 0xD533a949740bb3306d119CC777fa900bA034cd52;
    }

    function _getVirtualPrice() internal view override returns (uint) {
        return StableSwapAave(SWAP).get_virtual_price();
    }

    function _addLiquidity(uint _amount, uint _index) internal override {
        uint[3] memory amounts;
        amounts[_index] = _amount;
        // TODO add slippage
        // min = virtual price * (100 - slippage) / 100
        StableSwapAave(pool).add_liquidity(amounts, 0, true);
    }

    function _removeLiquidityOneCoin(uint _lpAmount) internal override {
        IERC20(lp).safeApprove(pool, 0);
        IERC20(lp).safeApprove(pool, _lpAmount);

        // TODO add slippage
        // min = virtual price * (100 - slippage) / 100
        StableSwapAave(pool).remove_liquidity_one_coin(
            _lpAmount,
            int128(underlyingIndex),
            0,
            true
        );
    }

    function _getMostPremiumToken() internal view override returns (address, uint) {
        uint[3] memory balances;
        balances[0] = StableSwapAave(SWAP).balances(0); // DAI
        balances[1] = StableSwapAave(SWAP).balances(1).mul(1e12); // USDC
        balances[2] = StableSwapAave(SWAP).balances(2).mul(1e12); // USDT

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
        return (USDT, 2);
    }
}
