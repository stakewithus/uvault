// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

import "./Strategy3Crv.sol";

contract Strategy3CrvUsdc is Strategy3Crv {
    address private constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    constructor(address _controller, address _vault)
        public
        Strategy3Crv(_controller, _vault, USDC)
    {
        // usdc
        underlyingIndex = 1;

        // Curve
        // 3Crv
        lp = 0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490;
        // 3 Pool
        pool = 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7;
        // Gauge
        gauge = 0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A;
        // Minter
        minter = 0xd061D61a4d941c39E5453435B6345Dc261C2fcE0;
        // DAO
        crv = 0xD533a949740bb3306d119CC777fa900bA034cd52;
    }
}
