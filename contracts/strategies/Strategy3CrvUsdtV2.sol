// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./Strategy3CrvV2.sol";

contract Strategy3CrvUsdtV2 is Strategy3CrvV2 {
    constructor(address _controller, address _vault)
        public
        Strategy3CrvV2(_controller, _vault, USDT)
    {
        underlyingIndex = 2;
    }
}
