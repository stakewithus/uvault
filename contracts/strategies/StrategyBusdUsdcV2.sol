// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyBusdV2.sol";

contract StrategyBusdUsdcV2 is StrategyBusdV2 {
    constructor(address _controller, address _vault)
        public
        StrategyBusdV2(_controller, _vault, USDC)
    {
        // USDC
        underlyingIndex = 1;
    }
}
