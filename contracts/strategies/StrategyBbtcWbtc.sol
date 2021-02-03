// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyBbtc.sol";

contract StrategyBbtcWbtc is StrategyBbtc {
    constructor(address _controller, address _vault)
        public
        StrategyBbtc(_controller, _vault, WBTC)
    {
        underlyingIndex = 2;
    }
}
