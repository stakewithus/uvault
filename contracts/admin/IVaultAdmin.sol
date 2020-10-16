pragma solidity 0.5.17;

// Interface to use on Remix by admin
interface IVaultAdmin {
    // admin helpers //
    function minWaitTime() external view returns (uint);

    function strategies(address _strategy) external view returns (bool);

    function reserveMin() external view returns (uint);

    function withdrawFee() external view returns (uint);

    function paused() external view returns (uint);

    function setAdmin(address _admin) external;

    function setController(address _controller) external;

    function setReserveMin(address _reserveMin) external;

    function setWithdrawFee(address _fee) external;

    function pause() external;

    function unpause() external;

    // IVault interface //
    function admin() external view returns (address);

    function controller() external view returns (address);

    function token() external view returns (address);

    function strategy() external view returns (address);

    function nextStrategy() external view returns (address);

    function timeLock() external view returns (uint);

    function setNextStrategy(address _strategy) external;

    /*
    @notice Set strategy
    */
    function setStrategy(address _strategy, uint _min) external;

    /*
    @notice Returns the amount of token in the vault
    */
    function balanceInVault() external view returns (uint);

    /*
    @notice Returns the amount of token in the strategy
    */
    function balanceInStrategy() external view returns (uint);

    /*
    @notice Returns minimum amount of tokens that should be kept in vault for
            cheap withdraw
    @return Reserve amount
    */
    function minReserve() external view returns (uint);

    /*
    @notice Returns the total amount of token in vault + strategy
    */
    function totalAssets() external view returns (uint);

    /*
    @notice Returns the amount of tokens available to be invested
    */
    function availableToInvest() external view returns (uint);

    /*
    @notice Transfers token in vault to strategy
    */
    function invest() external;

    function deposit(uint _amount) external;

    /*
    @notice Calculate amount of underlying token that can be withdrawn
    @param _shares Amount of shares
    @return Amount of underlying token that can be withdrawn
    */
    function calcWithdraw(uint _shares) external view returns (uint);

    /*
    @notice Withdraw underlying token
    @param _shares Amount of shares to burn
    @param _min Minimum amount of underlying token expected to return
    */
    function withdraw(uint _shares, uint _min) external;

    /*
    @notice Transfer token != underlying token in vault to admin
    @param _token Address of token to transfer
    @dev Must transfer token to admin
    @dev _token must not be equal to underlying token
    @dev Used to transfer token that was accidentally sent to this vault
    */
    function sweep(address _token) external;
}
