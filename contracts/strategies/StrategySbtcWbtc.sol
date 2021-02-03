// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategySbtc.sol";

contract StrategyPaxUsdtV2 is StrategySbtc {
    constructor(address _controller, address _vault)
        public
        StrategySbtc(_controller, _vault, WBTC)
    {
        underlyingIndex = 1;
    }
}
