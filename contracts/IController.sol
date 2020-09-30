pragma solidity 0.5.17;

interface IController {
    function admin() external view returns (address);

    function treasury() external view returns (address);

    // calls to vault
    /*
    @notice Invest token in vault into strategy
    @param _vault Address of vault
    @param _min Minimum amount of redeemable underlying token
    */
    function invest(address _vault, uint _min) external;

    function setStrategy(address _vault, address _strategy, uint _min) external;

    function rebalance(address _vault) external;

    // calls to strategy
    function harvest(address _strategy) external;

    /*
    @notice Withdraw all from strategy
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
