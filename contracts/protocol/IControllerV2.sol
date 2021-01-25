// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

interface IControllerV2 {
    function ADMIN_ROLE() external view returns (bytes32);

    function HARVESTER_ROLE() external view returns (bytes32);

    function admin() external view returns (address);

    function treasury() external view returns (address);

    function setAdmin(address _admin) external;

    function setTreasury(address _treasury) external;

    function grantRole(bytes32 _role, address _addr) external;

    function revokeRole(bytes32 _role, address _addr) external;

    /*
    @notice Returns true if vault is approved
    */
    function vaults(address _vault) external view returns (bool);

    /*
    @notice Returns true if strategy is approved
    */
    function strategies(address _strategy) external view returns (bool);

    function approveVault(address _vault) external;

    function revokeVault(address _vault) external;

    function approveStrategy(address _strategy) external;

    function revokeStrategy(address _strategy) external;

    /*
    @notice Set strategy for vault
    @param _vault Address of vault
    @param _strategy Address of strategy
    @param _min Minimum undelying token current strategy must return. Prevents slippage
    */
    function setStrategy(
        address _vault,
        address _strategy,
        uint _min
    ) external;

    /*
    @notice Invest token in vault into strategy
    @param _vault Address of vault
    */
    function invest(address _vault) external;

    /*
    @notice Set strategy for vault and invest
    @param _vault Address of vault
    @param _strategy Address of strategy
    @param _min Minimum undelying token current strategy must return. Prevents slippage
    @dev Set strategy and invest in single transaction to avoid front running
    */
    function setStrategyAndInvest(
        address _vault,
        address _strategy,
        uint _min
    ) external;

    // calls to strategy //
    /*
    @notice Claim rewards and deposit into strategy
    */
    function harvest(address _strategy) external;

    /*
    @notice Claim profit from strategy.
    */
    function skim(address _strategy) external;

    /*
    @notice Withdraw from strategy to vault
    @param _strategy Address of strategy
    @param _amount Amount of underlying token to withdraw
    @param _min Minimum amount of underlying token to withdraw
    */
    function withdraw(
        address _strategy,
        uint _amount,
        uint _min
    ) external;

    /*
    @notice Withdraw all from strategy to vault
    @param _strategy Address of strategy
    @param _min Minimum amount of underlying token to withdraw
    */
    function withdrawAll(address _strategy, uint _min) external;

    /*
    @notice Exit from strategy
    @param _strategy Address of strategy
    @param _min Minimum amount of underlying token to withdraw
    */
    function exit(address _strategy, uint _min) external;
}
