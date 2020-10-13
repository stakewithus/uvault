pragma solidity 0.5.17;

import "../interfaces/curve/ICurveFi2.sol";
import "./StrategyStableToCurve.sol";

contract StrategyStableToCusd is StrategyStableToCurve {
    constructor(
        address _controller,
        address _vault,
        address _underlying,
        address _cUnderlying,
        address _pool,
        address _gauge,
        address _minter,
        address _crv,
        address _uniswap,
        address _weth,
        uint256 _underlyingIndex
    ) public StrategyStableToCurve(
        _controller,
        _vault,
        _underlying,
        _cUnderlying,
        _pool,
        _gauge,
        _minter,
        _crv,
        _uniswap,
        _weth,
        _underlyingIndex
    ) {}

    function _calcWithdrawOneCoin(uint _gaugeAmount) internal view returns (uint) {
        return ICurveFi2(pool).calc_withdraw_one_coin(_gaugeAmount, int128(underlyingIndex));
    }

    function _addLiquidity(uint _underlyingAmount) internal {
        uint[2] memory amounts;
        amounts[underlyingIndex] = _underlyingAmount;
        ICurveFi2(pool).add_liquidity(amounts , 0);
    }
    function _removeLiquidityOneCoin(uint _cAmount) internal {
        ICurveFi2(pool).remove_liquidity_one_coin(_cAmount, int128(underlyingIndex), 0, true);
    }
}
