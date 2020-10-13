pragma solidity 0.5.17;

import "./StrategyStableTo3Crv.sol";

contract StrategyUsdtToCusdMainnet is StrategyStableTo3Crv {
    address private constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    // Curve
    // 3Crv
    address private constant THREE_CRV = 0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490;
    // 3 Pool
    address private constant POOL = 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7;
    // Gauge
    address private constant GAUGE = 0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A;
    // Minter
    address private constant MINTER = 0xd061D61a4d941c39E5453435B6345Dc261C2fcE0;
    // DAO
    address private constant CRV = 0xD533a949740bb3306d119CC777fa900bA034cd52;

    // DEX related addresses
    address private constant UNISWAP = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    // used for crv <> weth <> usdt route
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    constructor(address _controller, address _vault)
        public
        StrategyStableTo3Crv(
            _controller,
            _vault,
            USDT,
            THREE_CRV,
            POOL,
            GAUGE,
            MINTER,
            CRV,
            UNISWAP,
            WETH,
            2
        )
    {}
}
