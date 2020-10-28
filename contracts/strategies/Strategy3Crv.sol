pragma solidity 0.5.17;

import "../interfaces/curve/ICurveFi3.sol";
import "./StrategyCurve.sol";

contract Strategy3Crv is StrategyCurve {
    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public StrategyCurve(_controller, _vault, _underlying) {}

    function _getVirtualPrice() internal view returns (uint) {
        return ICurveFi3(pool).get_virtual_price();
    }

    function _addLiquidity(uint _underlyingAmount) internal {
        uint[3] memory amounts;
        amounts[underlyingIndex] = _underlyingAmount;
        ICurveFi3(pool).add_liquidity(amounts, 0);
    }

    function _removeLiquidityOneCoin(uint _lpAmount) internal {
        ICurveFi3(pool).remove_liquidity_one_coin(
            _lpAmount,
            int128(underlyingIndex),
            0
        );
    }
}
