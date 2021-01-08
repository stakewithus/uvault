// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

interface StableSwapAave {
    function get_virtual_price() external view returns (uint);

    /*
    0 DAI
    1 USDC
    2 USDT
    */
    function balances(uint _index) external view returns (uint);

    function add_liquidity(
        uint[3] calldata _amounts,
        uint _min_mint_amount,
        bool _use_underlying
    ) external returns (uint);

    function remove_liquidity_one_coin(
        uint _token_amount,
        int128 _i,
        uint _min_amount,
        bool _use_underlying
    ) external returns (uint);
}
