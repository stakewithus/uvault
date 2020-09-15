pragma solidity ^0.6.0;

interface Uniswap {
    function swapExactTokensForTokens(uint, uint, address[] calldata, address, uint) external;
}