pragma solidity 0.5.17;

import "../interfaces/curve/ICurveFi2.sol";
import "./StrategyStableToCurve.sol";

contract StrategyStableToCusd is StrategyStableToCurve {
    constructor(address _controller, address _vault)
        public
        StrategyStableToCurve(_controller, _vault)
    {}

    function _calcWithdrawOneCoin(uint _gaugeAmount) internal view returns (uint) {
        if (_gaugeAmount > 0) {
            return
                ICurveFi2(pool).calc_withdraw_one_coin(
                    _gaugeAmount,
                    int128(underlyingIndex)
                );
        }
        return 0;
    }

    function _addLiquidity(uint _underlyingAmount) internal {
        uint[2] memory amounts;
        amounts[underlyingIndex] = _underlyingAmount;
        ICurveFi2(pool).add_liquidity(amounts, 0);
    }

    function _removeLiquidityOneCoin(uint _cAmount) internal {
        ICurveFi2(pool).remove_liquidity_one_coin(
            _cAmount,
            int128(underlyingIndex),
            0,
            true
        );
    }
}
