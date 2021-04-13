// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

interface DepositUsdp {
    /*
    0 USDP
    1 DAI
    2 USDC
    3 USDT
    */
    function add_liquidity(uint[4] memory amounts, uint min) external returns (uint);

    // @dev returns amount of underlying token withdrawn
    function remove_liquidity_one_coin(
        uint amount,
        int128 index,
        uint min
    ) external returns (uint);
}
