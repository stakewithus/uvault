// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyObtc.sol";

contract StrategyObtcWbtc is StrategyObtc {
    constructor(address _controller, address _vault)
        public
        StrategyObtc(_controller, _vault, WBTC)
    {
        underlyingIndex = 2;
    }
}
