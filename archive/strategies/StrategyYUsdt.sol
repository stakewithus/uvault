// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyY.sol";

contract StrategyYUsdt is StrategyY {
    constructor(address _controller, address _vault)
        public
        StrategyY(_controller, _vault, USDT)
    {
        // usdt
        underlyingIndex = 2;
        precisionDiv = 1e12;
    }
}
