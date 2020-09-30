pragma solidity 0.5.17;

interface IVault {
    function admin() external view returns (address);

    function controller() external view returns (address);

    function token() external view returns (address);

    function strategy() external view returns (address);

    function nextStrategy() external view returns (address);

    function timeLock() external view returns (uint);

    function setNextStrategy(address _strategy) external;

    /*
    @notice Set strategy
    @param _min Minimum amount of underlying tokens to return on exit
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
    @notice Returns the amount of tokens available to be invested
    */
    function availableToInvest() external view returns (uint);

    /*
    @notice Returns the total amount of token in vault + strategy
    */
    function totalValueLocked() external view returns (uint);

    /*
    @notice Transfers token in vault to strategy
    @param _min Minimum amount of redeemable underlying token
    */
    function invest(uint _min) external;

    /*
    @notice Refills token reserve in vault and then re-invests remaining token
            into strategy
    */
    function rebalance() external;

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
}
