pragma solidity 0.5.17;

import "./Strategy3Crv.sol";

contract Strategy3CrvDai is Strategy3Crv {
    constructor(address _controller, address _vault)
        public
        Strategy3Crv(_controller, _vault)
    {
        // dai
        underlying = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
        underlyingIndex = 0;

        // Curve
        // 3Crv
        cUnderlying = 0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490;
        // 3 Pool
        pool = 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7;
        // Gauge
        gauge = 0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A;
        // Minter
        minter = 0xd061D61a4d941c39E5453435B6345Dc261C2fcE0;
        // DAO
        crv = 0xD533a949740bb3306d119CC777fa900bA034cd52;

        uniswap = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
        weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

        // Assets that cannot be swept by admin
        assets[underlying] = true;
        assets[cUnderlying] = true;
    }
}
