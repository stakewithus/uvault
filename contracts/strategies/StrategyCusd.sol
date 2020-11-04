// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

import "../interfaces/curve/ICurveFi2.sol";
import "./StrategyCurve.sol";

contract StrategyCusd is StrategyCurve {
    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public StrategyCurve(_controller, _vault, _underlying) {}

    /*
    @dev Returns USD price of 1 Curve Compound LP token
    */
    function _getVirtualPrice() internal override view returns (uint) {
        return ICurveFi2(pool).get_virtual_price();
    }

    function _addLiquidity(uint _underlyingAmount) internal override {
        uint[2] memory amounts;
        amounts[underlyingIndex] = _underlyingAmount;
        ICurveFi2(pool).add_liquidity(amounts, 0);
    }

    function _removeLiquidityOneCoin(uint _lpAmount) internal override {
        ICurveFi2(pool).remove_liquidity_one_coin(
            _lpAmount,
            int128(underlyingIndex),
            0,
            true
        );
    }
}
