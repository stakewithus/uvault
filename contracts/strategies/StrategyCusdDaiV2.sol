// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyCusdV2.sol";

contract StrategyCusdDaiV2 is StrategyCusdV2 {
    constructor(address _controller, address _vault)
        public
        StrategyCusdV2(_controller, _vault, DAI)
    {
        underlyingIndex = 0;
    }
}
