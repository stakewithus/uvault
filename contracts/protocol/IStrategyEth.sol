// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

interface IStrategyEth {
    function admin() external view returns (address);

    function controller() external view returns (address);

    function vault() external view returns (address);

    /*
    @notice Must return 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE indicating
            that this is a strategy for ETH
    */
    function underlying() external view returns (address);

    /*
    @notice Returns total amount of ETH transferred from vault
    */
    function totalDebt() external view returns (uint);

    function performanceFee() external view returns (uint);

    function slippage() external view returns (uint);

    /* 
    @notice Multiplier used to check total ETH <= total debt * delta / DELTA_MIN
    */
    function delta() external view returns (uint);

    function setAdmin(address _admin) external;

    function setController(address _controller) external;

    function setPerformanceFee(uint _fee) external;

    function setSlippage(uint _slippage) external;

    function setDelta(uint _delta) external;

    /*
    @notice Returns amount of ETH locked in this contract
    @dev Output may vary depending on price of liquidity provider token
         where ETH is invested
    */
    function totalAssets() external view returns (uint);

    /*
    @notice Deposit ETH
    @param amount Amount must be 0
    @dev Input `_amount` is present so that this function can be called by
         ControllerV2
    */
    function deposit(uint _amount) external payable;

    /*
    @notice Withdraw `_amount` ETH
    @param amount Amount of ETH to withdraw
    */
    function withdraw(uint _amount) external;

    /*
    @notice Withdraw all ETH from strategy
    */
    function withdrawAll() external;

    /*
    @notice Sell any staking rewards for ETH and then deposit ETH
    */
    function harvest() external;

    /*
    @notice Increase total debt if profit > 0 and total assets <= max,
            otherwise transfers profit to vault.
    @dev Guard against manipulation of external price feed by checking that
         total assets is below factor of total debt
    */
    function skim() external;

    /*
    @notice Exit from strategy
    @dev Must transfer all ETH back to vault
    */
    function exit() external;

    /*
    @notice Transfer token accidentally sent here to admin
    @param _token Address of token to transfer
    */
    function sweep(address _token) external;
}
