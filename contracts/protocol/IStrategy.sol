// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

/*
version 1.2.0

Changes

Changes listed here do not affect interaction with other contracts (Vault and Controller)
- removed function assets(address _token) external view returns (bool);
- remove function deposit(uint), declared in IStrategyERC20
- add function setSlippage(uint _slippage);
- add function setDelta(uint _delta);
*/

interface IStrategy {
    function admin() external view returns (address);

    function controller() external view returns (address);

    function vault() external view returns (address);

    /*
    @notice Returns address of underlying asset (ETH or ERC20)
    @dev Must return 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for ETH strategy
    */
    function underlying() external view returns (address);

    /*
    @notice Returns total amount of underlying transferred from vault
    */
    function totalDebt() external view returns (uint);

    function performanceFee() external view returns (uint);

    function slippage() external view returns (uint);

    /* 
    @notice Multiplier used to check total underlying <= total debt * delta / DELTA_MIN
    */
    function delta() external view returns (uint);

    /*
    @dev Flag to force exit in case normal exit fails
    */
    function forceExit() external view returns (bool);

    function setAdmin(address _admin) external;

    function setController(address _controller) external;

    function setPerformanceFee(uint _fee) external;

    function setSlippage(uint _slippage) external;

    function setDelta(uint _delta) external;

    function setForceExit(bool _forceExit) external;

    /*
    @notice Returns amount of underlying asset locked in this contract
    @dev Output may vary depending on price of liquidity provider token
         where the underlying asset is invested
    */
    function totalAssets() external view returns (uint);

    /*
    @notice Withdraw `_amount` underlying asset
    @param amount Amount of underlying asset to withdraw
    */
    function withdraw(uint _amount) external;

    /*
    @notice Withdraw all underlying asset from strategy
    */
    function withdrawAll() external;

    /*
    @notice Sell any staking rewards for underlying and then deposit undelying
    */
    function harvest() external;

    /*
    @notice Increase total debt if profit > 0 and total assets <= max,
            otherwise transfers profit to vault.
    @dev Guard against manipulation of external price feed by checking that
         total assets is below factor of total debt
    */
    function skim() external;

    /*
    @notice Exit from strategy
    @dev Must transfer all underlying tokens back to vault
    */
    function exit() external;

    /*
    @notice Transfer token accidentally sent here to admin
    @param _token Address of token to transfer
    @dev _token must not be equal to underlying token
    */
    function sweep(address _token) external;
}
