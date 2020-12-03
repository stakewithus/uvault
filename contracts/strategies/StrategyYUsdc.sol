// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyY.sol";

contract StrategyYUsdc is StrategyY {
    constructor(address _controller, address _vault)
        public
        StrategyY(_controller, _vault, USDC)
    {
        // usdc
        underlyingIndex = 1;
        precisionDiv = 1e12;
    }
}
