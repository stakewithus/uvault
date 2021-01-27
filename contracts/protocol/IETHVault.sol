// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./IVault.sol";

interface IETHVault is IVault {
    /*
    @notice Deposit ETH into this vault
    */
    function deposit() external payable;
}
