// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

interface StableSwapGusd {
    /*
    0 GUSD
    1 3CRV
    */
    function get_virtual_price() external view returns (uint);

    function balances(uint index) external view returns (uint);
}
