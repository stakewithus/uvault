// TODO: lock solidity version
pragma solidity ^0.6.0;

interface IStrategy {
    function admin() external view returns (address);
    function controller() external view returns (address);
    function vault() external view returns (address);
    function underlyingToken() external view returns (address);
    /*
    @notice Returns balance of underlying token
    */
    function balance() external view returns (uint);
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
    /*
    @notice Exit from strategy
    @dev Must claim and convert all assets into underlying token
    @dev Must transfer all tokens back to vault
    */
    function exit() external;
}