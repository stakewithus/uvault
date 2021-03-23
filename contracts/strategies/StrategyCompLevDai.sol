// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyCompLev.sol";

contract StrategyCompLevDai is StrategyCompLev {
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
            // DAI
            0x6B175474E89094C44Da98b954EedeAC495271d0F,
            // CDAI
            _cToken,
            _keeper
        )
    {}
}
