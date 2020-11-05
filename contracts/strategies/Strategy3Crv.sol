// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

import "../interfaces/curve/StableSwap3.sol";
import "./StrategyCurve.sol";

contract Strategy3Crv is StrategyCurve {
    address internal constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address internal constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address internal constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public StrategyCurve(_controller, _vault, _underlying) {}

    function _getVirtualPrice() internal view override returns (uint) {
        return StableSwap3(pool).get_virtual_price();
    }

    function _addLiquidity(uint _amount, uint _index) internal override {
        uint[3] memory amounts;
        amounts[_index] = _amount;
        StableSwap3(pool).add_liquidity(amounts, 0);
    }

    function _removeLiquidityOneCoin(uint _lpAmount) internal override {
        StableSwap3(pool).remove_liquidity_one_coin(
            _lpAmount,
            int128(underlyingIndex),
            0
        );
    }

    function _getMostPremiumToken() internal view override returns (address, uint) {
        uint[] memory balances = new uint[](3);
        balances[0] = StableSwap3(pool).balances(0); // DAI
        balances[1] = StableSwap3(pool).balances(1).mul(1e12); // USDC
        balances[2] = StableSwap3(pool).balances(2).mul(1e12); // USDT

        // DAI
        if (balances[0] < balances[1] && balances[0] < balances[2]) {
            return (DAI, 0);
        }

        // USDC
        if (balances[1] < balances[0] && balances[1] < balances[2]) {
            return (USDC, 1);
        }

        // USDT
        if (balances[2] < balances[0] && balances[2] < balances[1]) {
            return (USDT, 2);
        }

        return (DAI, 0);
    }
}
