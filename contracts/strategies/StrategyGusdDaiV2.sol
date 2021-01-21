// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyGusdV2.sol";

contract StrategyGusdDaiV2 is StrategyGusdV2 {
    constructor(address _controller, address _vault)
        public
        StrategyGusdV2(_controller, _vault, DAI)
    {
        // DAI
        underlyingIndex = 1;
    }
}
