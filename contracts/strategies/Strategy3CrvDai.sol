// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

import "./Strategy3Crv.sol";

contract Strategy3CrvDai is Strategy3Crv {
    constructor(address _controller, address _vault)
        public
        Strategy3Crv(_controller, _vault, DAI)
    {
        // dai
        underlyingIndex = 0;
        precisionDiv = 1;
    }
}
