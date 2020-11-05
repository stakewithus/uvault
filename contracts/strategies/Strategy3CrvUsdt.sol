// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

import "./Strategy3Crv.sol";

contract Strategy3CrvUsdt is Strategy3Crv {
    constructor(address _controller, address _vault)
        public
        Strategy3Crv(_controller, _vault, USDT)
    {
        // usdt
        underlyingIndex = 2;
        precisionDiv = 1e12;
    }
}
