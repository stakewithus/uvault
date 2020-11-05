// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

import "./StrategyCusd.sol";

contract StrategyCusdDai is StrategyCusd {
    constructor(address _controller, address _vault)
        public
        StrategyCusd(_controller, _vault, DAI)
    {
        // dai
        underlyingIndex = 0;
        precisionDiv = 1;
    }
}
