pragma solidity 0.5.17;

interface Uniswap {
    function swapExactTokensForTokens(uint, uint, address[] calldata, address, uint) external;
}