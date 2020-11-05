// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

import "./StrategyP3Crv.sol";

contract StrategyP3CrvDai is StrategyP3Crv {
    constructor(address _controller, address _vault)
        public
        StrategyP3Crv(_controller, _vault, DAI)
    {
        // dai
        underlyingIndex = 0;
        precisionDiv = 1;
    }
}
