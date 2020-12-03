// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyY.sol";

contract StrategyYDai is StrategyY {
    constructor(address _controller, address _vault)
        public
        StrategyY(_controller, _vault, DAI)
    {
        // dai
        underlyingIndex = 0;
        precisionDiv = 1;
    }
}
