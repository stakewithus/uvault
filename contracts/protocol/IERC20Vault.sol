// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./IVault.sol";

interface IERC20Vault is IVault {
    /*
    @notice Deposit undelying token into this vault
    @param _amount Amount of token to deposit
    */
    function deposit(uint _amount) external;
}
