pragma solidity 0.5.17;

import "./StrategyCusd.sol";

contract StrategyCusdUsdc is StrategyCusd {
    address private constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    constructor(address _controller, address _vault)
        public
        StrategyCusd(_controller, _vault, USDC)
    {
        // usdc
        underlyingIndex = 1;

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
    }
}
