pragma solidity 0.5.17;

import "./StrategyP3Crv.sol";

contract StrategyP3CrvUsdc is StrategyP3Crv {
    constructor(address _controller, address _vault)
        public
        StrategyP3Crv(_controller, _vault)
    {
        // usdc
        underlying = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
        underlyingIndex = 1;

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

        // uniswap //
        uniswap = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
        weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

        // Assets that cannot be swept by admin
        assets[underlying] = true;
        assets[pickle] = true;
    }
}
