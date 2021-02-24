// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyYV2.sol";

contract StrategyYUsdcV2 is StrategyYV2 {
    constructor(address _controller, address _vault)
        public
        StrategyYV2(_controller, _vault, USDC, 1)
    {}
}
