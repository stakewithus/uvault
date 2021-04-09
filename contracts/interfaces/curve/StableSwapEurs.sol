// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

interface StableSwapEurs {
    function get_virtual_price() external view returns (uint);

    /*
    0 EURS
    1 sEUR
    */
    function balances(uint index) external view returns (uint);

    function add_liquidity(uint[2] calldata _amounts, uint _min_mint_amount)
        external
        returns (uint);

    function remove_liquidity_one_coin(
        uint _token_amount,
        int128 _i,
        uint _min_amount
    ) external returns (uint);
}
