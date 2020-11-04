// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

import "../interfaces/curve/StableSwap2.sol";
import "../interfaces/curve/Deposit2.sol";
import "./StrategyCurve.sol";

contract StrategyCusd is StrategyCurve {
    address private constant SWAP = 0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56;

    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public StrategyCurve(_controller, _vault, _underlying) {}

    /*
    @dev Returns USD price of 1 Curve Compound LP token
    */
    function _getVirtualPrice() internal view override returns (uint) {
        return StableSwap2(SWAP).get_virtual_price();
    }

    function _addLiquidity(uint _underlyingAmount) internal override {
        uint[2] memory amounts;
        amounts[underlyingIndex] = _underlyingAmount;
        Deposit2(pool).add_liquidity(amounts, 0);
    }

    function _removeLiquidityOneCoin(uint _lpAmount) internal override {
        Deposit2(pool).remove_liquidity_one_coin(
            _lpAmount,
            int128(underlyingIndex),
            0,
            true
        );
    }
}
