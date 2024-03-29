// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyAave.sol";

contract StrategyAaveUsdc is StrategyAave {
    constructor(address _controller, address _vault)
        public
        StrategyAave(_controller, _vault, USDC, 1)
    {}
}
