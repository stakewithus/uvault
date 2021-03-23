// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyCompLev.sol";

contract StrategyCompLevWbtc is StrategyCompLev {
    constructor(
        address _controller,
        address _vault,
        address _cToken,
        address _keeper
    )
        public
        StrategyCompLev(
            _controller,
            _vault,
            // WBTC
            0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599,
            // CWBTC
            _cToken,
            _keeper
        )
    {}
}
