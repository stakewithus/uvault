pragma solidity 0.5.17;

import "./StrategyP3Crv.sol";

contract StrategyP3CrvUsdt is StrategyP3Crv {
    address private constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    constructor(address _controller, address _vault)
        public
        StrategyP3Crv(_controller, _vault, USDT)
    {
        // usdt
        underlyingIndex = 2;

        precisionDiv = 1e12;

        // Curve //
        // 3Crv
        threeCrv = 0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490;
        // 3 Pool
        curve = 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7;

        // Pickle //
        jar = 0x1BB74b5DdC1f4fC91D6f9E7906cf68bc93538e33;
        chef = 0xbD17B1ce622d73bD438b9E658acA5996dc394b0d;
        pickle = 0x429881672B9AE42b8EbA0E26cD9C73711b891Ca5;

        // Assets that cannot be swept by admin
        assets[pickle] = true;
    }
}
