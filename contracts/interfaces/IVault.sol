pragma solidity ^0.5.16;

interface IVault {
    function admin() external view returns (address);
    function token() external view returns (address);
    function strategy() external view returns (address);
    function nextStrategy() external view returns (address);
    function timeLock() external view returns (uint);
    function setNextStrategy(address _strategy) external;
    function switchStrategy() external;
    /*
    @notice Returns the amount of token in the vault
    */
    function balanceInVault() external view returns (uint);
    /*
    @notice Returns the amount of tokens available to be invested
    */
    function availableToInvest() external view returns (uint);
    /*
    @notice Returns the total amount of token in vault + strategy
    */
    function totalLockedValue() external view returns (uint);
    /*
    @notice Transfers token in vault to strategy
    */
    function invest() external;
    /*
    @notice Refills token reserve in vault and then re-invests remaining token
            into strategy
    */
    function rebalance() external;
    function deposit(uint _amount) external;
    function withdraw(uint _amount) external;
}