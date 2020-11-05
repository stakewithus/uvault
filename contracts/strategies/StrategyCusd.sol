// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

import "../interfaces/curve/StableSwap2.sol";
import "../interfaces/curve/Deposit2.sol";
import "./StrategyCurve.sol";

contract StrategyCusd is StrategyCurve {
    address internal constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address internal constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

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

    function _addLiquidity(uint _amount, uint _index) internal override {
        uint[2] memory amounts;
        amounts[_index] = _amount;
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

    function _getMostPremiumToken() internal view override returns (address, uint) {
        uint[] memory balances = new uint[](2);
        balances[0] = StableSwap2(SWAP).balances(0); // DAI
        balances[1] = StableSwap2(SWAP).balances(1).mul(1e12); // USDC

        // DAI
        if (balances[0] < balances[1] && balances[0] < balances[2]) {
            return (DAI, 0);
        }

        // USDC
        if (balances[1] < balances[0] && balances[1] < balances[2]) {
            return (USDC, 1);
        }

        return (DAI, 0);
    }
}
