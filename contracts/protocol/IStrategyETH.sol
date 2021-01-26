// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./IStrategyBase.sol";

interface IStrategyETH is IStrategyBase {
    /*
    @notice Deposit ETH
    */
    function deposit() external payable;
}
