pragma solidity 0.5.17;

interface IController {
    function admin() external view returns (address);

    function treasury() external view returns (address);

    // calls to vault
    /*
    @notice Invest token in vault into strategy
    @param _vault Address of vault
    */
    function invest(address _vault) external;

    function setStrategy(
        address _vault,
        address _strategy,
        uint _min
    ) external;

    /*
    @notice Withdraw from strategy, fills up reserve and re-invests the rest of tokens
    @param _vault Address of the vault
    @param _min Minimum amount of token that must be withdrawn from strategy
    */
    function rebalance(address _vault, uint _min) external;

    // calls to strategy
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
