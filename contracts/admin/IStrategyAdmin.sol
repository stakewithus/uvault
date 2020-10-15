pragma solidity 0.5.17;

// Interface to use on Remix by admin
interface IStrategyAdmin {
    // admin helpers //
    function setAdmin(address _admin) external;

    function setController(address _controller) external;

    function setPerformanceFee(uint _fee) external;

    function performanceFee() external view returns (uint);

    // IStrategy //
    function admin() external view returns (address);

    function controller() external view returns (address);

    function vault() external view returns (address);

    /*
    @notice Returns address of underlying token
    */
    function underlying() external view returns (address);

    /*
    @notice Returns balance of underlying token
    */
    function totalAssets() external view returns (uint);

    /*
    @notice Deposit `amount` underlying token for yield token
    @param amount Amount of underlying token to deposit
    */
    function deposit(uint _amount) external;

    /*
    @notice Withdraw `amount` yield token to withdraw
    @param amount Amount of yield token to withdraw
    */
    function withdraw(uint _amount) external;

    /*
    @notice Withdraw all underlying token from strategy
    */
    function withdrawAll() external;

    function harvest() external;

    /*
    @notice Exit from strategy
    @dev Must transfer all underlying tokens back to vault
    @dev Should transfer dust out of this contract
    */
    function exit() external;

    /*
    @notice Transfer token in strategy to admin
    @param _token Address of token to transfer
    @dev Must transfer token to admin
    @dev _token must not be equal to underlying token
    @dev Used to transfer token that was accidentally sent or
         claim dust created from this strategy
    */
    function sweep(address _token) external;
}
