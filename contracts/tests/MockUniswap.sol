pragma solidity 0.5.17;

import "../interfaces/uniswap/Uniswap.sol";

contract MockUniswap is Uniswap {
    // test helpers
    bool public __swapExactTokensForTokensWasCalled__;
    uint public __amountIn__;
    uint public __amountOutMin__;
    address[] __path__;
    address public __to__;
    uint public __deadline__;
    uint[] __amounts__;

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        __swapExactTokensForTokensWasCalled__ = true;
        __amountIn__ = amountIn;
        __amountOutMin__ = amountOutMin;
        __path__ = path;
        __to__ = to;
        __deadline__ = deadline;

        return __amounts__;
    }

    function __setAmounts__(uint[] calldata _amounts) external {
        __amounts__ = _amounts;
    }
}
