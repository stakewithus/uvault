pragma solidity 0.5.17;

import "../interfaces/uniswap/Uniswap.sol";

contract MockUniswap is Uniswap {
    // test helpers
    bool public _swapExactTokensForTokensWasCalled_;
    uint public _amountIn_;
    uint public _amountOutMin_;
    address[] _path_;
    address public _to_;
    uint public _deadline_;
    uint[] _amounts_;

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        _swapExactTokensForTokensWasCalled_ = true;
        _amountIn_ = amountIn;
        _amountOutMin_ = amountOutMin;
        _path_ = path;
        _to_ = to;
        _deadline_ = deadline;

        return _amounts_;
    }

    function __setAmounts__(uint[] calldata _amounts) external {
        _amounts_ = _amounts;
    }
}
