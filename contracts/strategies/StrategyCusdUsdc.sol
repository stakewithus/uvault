// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

import "./StrategyCusd.sol";

contract StrategyCusdUsdc is StrategyCusd {
    constructor(address _controller, address _vault)
        public
        StrategyCusd(_controller, _vault, USDC)
    {
        // usdc
        underlyingIndex = 1;
        precisionDiv = 1e12;
    }
}
