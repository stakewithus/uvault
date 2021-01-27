// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

/*
version 1.2.0

Changes
- function deposit(uint) declared in IERC20Vault
*/

interface IVault {
    function admin() external view returns (address);

    function controller() external view returns (address);

    function timeLock() external view returns (address);

    /*
    @notice For EthVault, must return 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
    */
    function token() external view returns (address);

    function strategy() external view returns (address);

    function strategies(address _strategy) external view returns (bool);

    function reserveMin() external view returns (uint);

    function withdrawFee() external view returns (uint);

    function paused() external view returns (bool);

    function whitelist(address _addr) external view returns (bool);

    function setWhitelist(address _addr, bool _approve) external;

    function setAdmin(address _admin) external;

    function setController(address _controller) external;

    function setTimeLock(address _timeLock) external;

    function setPause(bool _paused) external;

    function setReserveMin(uint _reserveMin) external;

    function setWithdrawFee(uint _fee) external;

    /*
    @notice Returns the amount of asset (ETH or ERC20) in the vault
    */
    function balanceInVault() external view returns (uint);

    /*
    @notice Returns the estimate amount of asset in strategy
    @dev Output may vary depending on price of liquidity provider token
         where the underlying asset is invested
    */
    function balanceInStrategy() external view returns (uint);

    /*
    @notice Returns amount of tokens invested strategy
    */
    function totalDebtInStrategy() external view returns (uint);

    /*
    @notice Returns the total amount of asset in vault + total debt
    */
    function totalAssets() external view returns (uint);

    /*
    @notice Returns minimum amount of tokens that should be kept in vault for
            cheap withdraw
    @return Reserve amount
    */
    function minReserve() external view returns (uint);

    /*
    @notice Returns the amount of tokens available to be invested
    */
    function availableToInvest() external view returns (uint);

    /*
    @notice Approve strategy
    @param _strategy Address of strategy
    */
    function approveStrategy(address _strategy) external;

    /*
    @notice Revoke strategy
    @param _strategy Address of strategy
    */
    function revokeStrategy(address _strategy) external;

    /*
    @notice Set strategy
    @param _min Minimum undelying asset current strategy must return. Prevents slippage
    */
    function setStrategy(address _strategy, uint _min) external;

    /*
    @notice Transfers asset in vault to strategy
    */
    function invest() external;

    /*
    @notice Calculate amount of asset that can be withdrawn
    @param _shares Amount of shares
    @return Amount of asset that can be withdrawn
    */
    function getExpectedReturn(uint _shares) external view returns (uint);

    /*
    @notice Withdraw asset
    @param _shares Amount of shares to burn
    @param _min Minimum amount of asset expected to return
    */
    function withdraw(uint _shares, uint _min) external;

    /*
    @notice Transfer asset in vault to admin
    @param _token Address of asset to transfer
    @dev _token must not be equal to vault asset
    */
    function sweep(address _token) external;
}
