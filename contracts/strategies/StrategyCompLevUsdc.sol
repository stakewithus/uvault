// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyCompLev.sol";

contract StrategyCompLevUsdc is StrategyCompLev {
    constructor(
        address _controller,
        address _vault,
        address _keeper,
        address _cToken
    )
        public
        StrategyCompLev(
            _controller,
            _vault,
            // USDC
            0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48,
            // CUSDC
            _cToken,
            _keeper
        )
    {}
}
