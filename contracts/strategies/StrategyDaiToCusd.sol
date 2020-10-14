pragma solidity 0.5.17;

import "./StrategyStableToCusd.sol";

contract StrategyDaiToCusd is StrategyStableToCusd {
    constructor(address _controller, address _vault)
        public
        StrategyStableToCusd(_controller, _vault)
    {
        // dai
        underlying = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
        underlyingIndex = 0;

        // Curve
        // cDAI/cUSDC
        cUnderlying = 0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2;
        // DepositCompound
        pool = 0xeB21209ae4C2c9FF2a86ACA31E123764A3B6Bc06;
        // Gauge
        gauge = 0x7ca5b0a2910B33e9759DC7dDB0413949071D7575;
        // Minter
        minter = 0xd061D61a4d941c39E5453435B6345Dc261C2fcE0;
        // DAO
        crv = 0xD533a949740bb3306d119CC777fa900bA034cd52;

        uniswap = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
        weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    }
}
