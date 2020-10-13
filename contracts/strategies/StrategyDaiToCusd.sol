pragma solidity 0.5.17;

import "./StrategyStableToCusd.sol";

contract StrategyDaiToCusd is StrategyStableToCusd {
    address private constant  DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

    // Curve
    // cDAI/cUSDC
    address private constant CUSD = 0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2;
    // DepositCompound
    address private constant POOL = 0xeB21209ae4C2c9FF2a86ACA31E123764A3B6Bc06;
    // Gauge
    address private constant GAUGE = 0x7ca5b0a2910B33e9759DC7dDB0413949071D7575;
    // Minter
    address private constant MINTER = 0xd061D61a4d941c39E5453435B6345Dc261C2fcE0;
    // DAO
    address private constant CRV = 0xD533a949740bb3306d119CC777fa900bA034cd52;

    // DEX related addresses
    address private constant UNISWAP = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    // used for crv <> weth <> dai route
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    constructor(address _controller, address _vault)
        public
        StrategyStableToCusd(_controller, _vault, DAI, CUSD, POOL, GAUGE, MINTER, CRV, UNISWAP, WETH, 0)
    {}
}
