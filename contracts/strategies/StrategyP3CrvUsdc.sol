// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

import "./StrategyP3Crv.sol";

contract StrategyP3CrvUsdc is StrategyP3Crv {
    constructor(address _controller, address _vault)
        public
        StrategyP3Crv(_controller, _vault, USDC)
    {
        // usdc
        underlyingIndex = 1;
        precisionDiv = 1e12;
    }
}
