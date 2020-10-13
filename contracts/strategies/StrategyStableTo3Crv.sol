pragma solidity 0.5.17;

import "../interfaces/curve/ICurveFi3.sol";
import "./StrategyStableToCurve.sol";

contract StrategyStableTo3Crv is StrategyStableToCurve {
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
        // return ICurveFi3(pool).calc_withdraw_one_coin(_gaugeAmount, int128(underlyingIndex));
        return ICurveFi3(pool).calc_withdraw_one_coin(0, int128(1));
    }

    function _addLiquidity(uint _underlyingAmount) internal {
        uint[3] memory amounts;
        amounts[underlyingIndex] = _underlyingAmount;
        ICurveFi3(pool).add_liquidity(amounts , 0);
    }
    function _removeLiquidityOneCoin(uint _cAmount) internal {
        ICurveFi3(pool).remove_liquidity_one_coin(_cAmount, int128(underlyingIndex), 0, true);
    }
}
