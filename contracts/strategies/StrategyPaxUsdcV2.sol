// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyPaxV2.sol";

contract StrategyPaxUsdcV2 is StrategyPaxV2 {
    constructor(address _controller, address _vault)
        public
        StrategyPaxV2(_controller, _vault, USDC)
    {
        // USDC
        underlyingIndex = 1;
    }
}
