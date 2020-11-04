// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

interface Deposit3 {
    function add_liquidity(uint[3] calldata amounts, uint min_mint_amount) external;

    function remove_liquidity_one_coin(
        uint token_amount,
        int128 i,
        uint min_uamount
    ) external;
}
