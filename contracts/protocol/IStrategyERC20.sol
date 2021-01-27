// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./IStrategy.sol";

interface IStrategyERC20 is IStrategy {
    /*
    @notice Deposit `amount` underlying ERC20 token
    @param amount Amount of underlying ERC20 token to deposit
    */
    function deposit(uint _amount) external;
}
