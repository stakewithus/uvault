// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./IStrategy.sol";

interface IStrategyETH is IStrategy {
    /*
    @notice Deposit ETH
    */
    function deposit() external payable;
}
