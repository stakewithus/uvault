// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

/*
version 1.3.0

Changes listed here do not affect interaction with other contracts (Vault and Controller)
- remove functions that are not called by other contracts (vaults and controller)
*/

interface IStrategyETH_V3 {
    function admin() external view returns (address);

    function controller() external view returns (address);

    function vault() external view returns (address);

    /*
    @notice Returns address of underlying token (ETH or ERC20)
    @dev Return 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for ETH strategy
    */
    function underlying() external view returns (address);

    /*
    @notice Returns total amount of underlying token transferred from vault
    */
    function totalDebt() external view returns (uint);

    /*
    @notice Returns amount of underlying token locked in this contract
    @dev Output may vary depending on price of liquidity provider token
         where the underlying token is invested
    */
    function totalAssets() external view returns (uint);

    /*
    @notice Deposit ETH
    */
    function deposit() external payable;

    /*
    @notice Withdraw `_amount` underlying token
    @param amount Amount of underlying token to withdraw
    */
    function withdraw(uint _amount) external;

    /*
    @notice Withdraw all underlying token from strategy
    */
    function withdrawAll() external;

    /*
    @notice Sell any staking rewards for underlying
    */
    function harvest() external;

    /*
    @notice Increase total debt if totalAssets > totalDebt
    */
    function skim() external;

    /*
    @notice Exit from strategy, transfer all underlying tokens back to vault
    */
    function exit() external;

    /*
    @notice Transfer token accidentally sent here to admin
    @param _token Address of token to transfer
    @dev _token must not be equal to underlying token
    */
    function sweep(address _token) external;
}
