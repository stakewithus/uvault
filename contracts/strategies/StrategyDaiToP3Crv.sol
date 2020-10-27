pragma solidity 0.5.17;

import "./StrategyStableToP3Crv.sol";

contract StrategyDaiToP3Crv is StrategyStableToP3Crv {
    constructor(address _controller, address _vault)
        public
        StrategyStableToP3Crv(_controller, _vault)
    {
        // dai
        underlying = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
        underlyingIndex = 0;

        precisionDiv = 1;

        // Curve //
        // 3Crv
        threeCrv = 0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490;
        // 3 Pool
        curve = 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7;

        // Pickle //
        jar = 0x1BB74b5DdC1f4fC91D6f9E7906cf68bc93538e33;
        chef = 0xbD17B1ce622d73bD438b9E658acA5996dc394b0d;
        pickle = 0x429881672B9AE42b8EbA0E26cD9C73711b891Ca5;

        // uniswap //
        uniswap = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
        weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

        // Assets that cannot be swept by admin
        assets[underlying] = true;
        assets[threeCrv] = true;
        assets[jar] = true;
        assets[pickle] = true;
    }
}
