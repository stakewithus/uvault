// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../interfaces/curve/StableSwapY.sol";
import "../interfaces/curve/DepositY.sol";
import "./StrategyCurve.sol";

contract StrategyY is StrategyCurve {
    // PAX StableSwap
    address private constant SWAP = 0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51;
    address private constant TUSD = 0x0000000000085d4780B73119b644AE5ecd22b376;
    address internal constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address internal constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address internal constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public StrategyCurve(_controller, _vault, _underlying) {
        // Curve
        // yDAI/yUSDC/yUSDT/yTUSD
        lp = 0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8;
        // DepositY
        pool = 0xbBC81d23Ea2c3ec7e56D39296F0cbB648873a5d3;
        // Gauge
        gauge = 0xFA712EE4788C042e2B7BB55E6cb8ec569C4530c1;
        // Minter
        minter = 0xd061D61a4d941c39E5453435B6345Dc261C2fcE0;
        // DAO
        crv = 0xD533a949740bb3306d119CC777fa900bA034cd52;
    }

    function _getVirtualPrice() internal view override returns (uint) {
        return StableSwapY(SWAP).get_virtual_price();
    }

    function _addLiquidity(uint _amount, uint _index) internal override {
        uint[4] memory amounts;
        amounts[_index] = _amount;
        DepositY(pool).add_liquidity(amounts, 0);
    }

    function _removeLiquidityOneCoin(uint _lpAmount) internal override {
        IERC20(lp).safeApprove(pool, 0);
        IERC20(lp).safeApprove(pool, _lpAmount);

        DepositY(pool).remove_liquidity_one_coin(
            _lpAmount,
            int128(underlyingIndex),
            0,
            false
        );
    }

    function _getMostPremiumToken() internal view override returns (address, uint) {
        uint[4] memory balances;
        balances[0] = StableSwapY(SWAP).balances(0); // DAI
        balances[1] = StableSwapY(SWAP).balances(1).mul(1e12); // USDC
        balances[2] = StableSwapY(SWAP).balances(2).mul(1e12); // USDT
        balances[3] = StableSwapY(SWAP).balances(3); // TUSD

        uint minIndex = 0;
        for (uint i = 1; i < balances.length; i++) {
            if (balances[i] <= balances[minIndex]) {
                minIndex = i;
            }
        }

        if (minIndex == 0) {
            return (DAI, 0);
        }
        if (minIndex == 1) {
            return (USDC, 1);
        }
        if (minIndex == 2) {
            return (USDT, 2);
        }
        return (TUSD, 3);
    }
}
