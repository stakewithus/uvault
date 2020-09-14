// TODO: lock solidity version
pragma solidity ^0.6.0;

interface IStrategy {
    function vault() external view returns(address);
    function underlyingToken() external view returns(address);
    function balance() external view returns(uint);
    /*
    @notice Deposit `amount` underlying token for yield token
    @param amount Amount of underlying token to deposit
    */
    function deposit(uint amount) external;
    /*
    @notice Withdraw `amount` yield token to withdraw
    @param amount Amount of yield token to withdraw
    */
    function withdraw(uint amount) external;
    /*
    @notice Withdraw all underlying token from strategy
    */
    function withdrawAll() external;
    function harvest() external;
}