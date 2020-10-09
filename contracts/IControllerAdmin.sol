pragma solidity 0.5.17;

// Interface to use on Remix by admin
interface IControllerAdmin {
    // Admin helpers //
    function gasRelayer() external view returns (address);

    function setAdmin(address _admin) external;

    function setTreasury(address _treasury) external;

    function setGasRelayer(address _gasRelayer) external;

    // IController //
    function admin() external view returns (address);

    function treasury() external view returns (address);

    function setStrategy(address _vault, address _strategy) external;

    // calls to strategy
    /*
    @notice Invest token in vault into strategy
    @param _vault Address of vault
    */
    function invest(address _vault) external;

    function harvest(address _strategy) external;

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
