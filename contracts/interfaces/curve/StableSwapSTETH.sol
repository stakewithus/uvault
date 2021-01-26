// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

interface StableSwapSTETH {
    function get_virtual_price() external view returns (uint);

    /*
    0 ETH
    1 STETH
    */
    function balances(uint _index) external view returns (uint);

    function add_liquidity(uint[2] memory amounts, uint min) external payable;

    function remove_liquidity_one_coin(
        uint _token_amount,
        int128 i,
        uint min_amount
    ) external;

    function get_dy(
        int128 i,
        int128 j,
        uint dx
    ) external view returns (uint);
}
