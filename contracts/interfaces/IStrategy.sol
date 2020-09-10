// TODO: lock solidity version
pragma solidity ^0.6.0;

interface IStrategy {
    function vault() external view returns(address);
    function underlyingToken() external view returns(address);
    function yieldToken() external view returns(address);
    function yieldTokenBalance() external view returns(uint);
    /*
    @notice Deposit `amount` underlying token for yield token
    @param amount Amount of underlying token to deposit
    @param min Minimum amount of yield token that must be returned
    */
    function deposit(uint amount, uint min) external;
    /*
    @notice Withdraw `amount` yield token to withdraw
    @param amount Amount of yield token to withdraw
    @param min Minimum amount of yield token that must be returned
    */
    function withdraw(uint amount, uint min) external;
    function harvest() external;
    /*
    @notice Withdraw all underlying token from strategy
    @dev Must return underlying token back to vault
    */
    function exit() external;
}