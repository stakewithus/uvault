// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./protocol/IStrategyETH.sol";
// used inside harvest
import "./protocol/IControllerV2.sol";

//TODO reentrancy protection

abstract contract StrategyETH is IStrategyETH {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    address public override admin;
    address public override controller;
    address public override vault;
    address public immutable override underlying =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    // total amount of ETH transferred from vault
    uint public override totalDebt;

    // performance fee sent to treasury when harvest() generates profit
    uint public override performanceFee = 500;
    uint private constant PERFORMANCE_FEE_CAP = 2000; // upper limit to performance fee
    uint internal constant PERFORMANCE_FEE_MAX = 10000;

    // prevent slippage from deposit / withdraw
    uint public override slippage = 100;
    uint internal constant SLIPPAGE_MAX = 10000;

    /* 
    Multiplier used to check totalAssets() is <= total debt * delta / DELTA_MIN
    */
    uint public override delta = 10050;
    uint private constant DELTA_MIN = 10000;

    constructor(address _controller, address _vault) public {
        require(_controller != address(0), "controller = zero address");
        require(_vault != address(0), "vault = zero address");

        admin = msg.sender;
        controller = _controller;
        vault = _vault;
    }

    /*
    @dev implement receive() external payable in child contract
    @dev receive() should restrict msg.sender to prevent accidental ETH transfer
    @dev vault and controller will never call receive()
    */

    modifier onlyAdmin() {
        require(msg.sender == admin, "!admin");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == admin || msg.sender == controller || msg.sender == vault,
            "!authorized"
        );
        _;
    }

    function setAdmin(address _admin) external override onlyAdmin {
        require(_admin != address(0), "admin = zero address");
        admin = _admin;
    }

    function setController(address _controller) external override onlyAdmin {
        require(_controller != address(0), "controller = zero address");
        controller = _controller;
    }

    function setPerformanceFee(uint _fee) external override onlyAdmin {
        require(_fee <= PERFORMANCE_FEE_CAP, "performance fee > cap");
        performanceFee = _fee;
    }

    function setSlippage(uint _slippage) external override onlyAdmin {
        require(_slippage <= SLIPPAGE_MAX, "slippage > max");
        slippage = _slippage;
    }

    function setDelta(uint _delta) external override onlyAdmin {
        require(_delta >= DELTA_MIN, "delta < min");
        delta = _delta;
    }

    function _sendEthToVault(uint _amount) internal {
        require(address(this).balance >= _amount, "ETH balance < amount");

        (bool sent, ) = vault.call{value: _amount}("");
        require(sent, "Send ETH failed");
    }

    function _increaseDebt() private {
        totalDebt = totalDebt.add(msg.value);
    }

    function _decreaseDebt(uint _amount) private {
        _sendEthToVault(_amount);

        if (_amount > totalDebt) {
            totalDebt = 0;
        } else {
            totalDebt -= _amount;
        }
    }

    function _totalAssets() internal view virtual returns (uint);

    /*
    @notice Returns amount of ETH locked in this contract
    */
    function totalAssets() external view override returns (uint) {
        return _totalAssets();
    }

    function _depositEth() internal virtual;

    /*
    @notice Deposit ETH into this strategy
    */
    function deposit() external payable override onlyAuthorized {
        require(msg.value > 0, "msg.value = 0");

        _increaseDebt();
        _depositEth();
    }

    /*
    @notice Returns total shares owned by this contract for depositing ETH
            into external Defi
    */
    function _getTotalShares() internal view virtual returns (uint);

    function _getShares(uint _ethAmount, uint _totalEth) internal view returns (uint) {
        /*
        calculate shares to withdraw

        w = amount of ETH to withdraw
        E = total redeemable ETH
        s = shares to withdraw
        P = total shares deposited into external liquidity pool

        w / E = s / P
        s = w / E * P
        */
        if (_totalEth > 0) {
            uint totalShares = _getTotalShares();
            return _ethAmount.mul(totalShares) / _totalEth;
        }
        return 0;
    }

    function _withdrawEth(uint _shares) internal virtual;

    /*
    @notice Withdraw ETH to vault
    @param _ethAmount Amount of ETH to withdraw
    @dev Caller should implement guard against slippage
    */
    function withdraw(uint _ethAmount) external override onlyAuthorized {
        require(_ethAmount > 0, "withdraw = 0");
        uint totalEth = _totalAssets();
        require(_ethAmount <= totalEth, "withdraw > total");

        uint shares = _getShares(_ethAmount, totalEth);
        if (shares > 0) {
            _withdrawEth(shares);
        }

        // transfer ETH to vault
        uint ethBal = address(this).balance;
        if (ethBal > 0) {
            _decreaseDebt(ethBal);
        }
    }

    function _withdrawAll() internal {
        uint totalShares = _getTotalShares();
        if (totalShares > 0) {
            _withdrawEth(totalShares);
        }

        // transfer ETH to vault
        uint ethBal = address(this).balance;
        if (ethBal > 0) {
            _decreaseDebt(ethBal);
            totalDebt = 0;
        }
    }

    /*
    @notice Withdraw all ETH to vault
    @dev Caller should implement guard agains slippage
    */
    function withdrawAll() external override onlyAuthorized {
        _withdrawAll();
    }

    /*
    @notice Sell any staking rewards for ETH and then deposit ETH
    */
    function harvest() external virtual override;

    /*
    @notice Increase total debt if profit > 0 and total assets <= max,
            otherwise transfers profit to vault.
    @dev Guard against manipulation of external price feed by checking that
         total assets is below factor of total debt
    */
    function skim() external override onlyAuthorized {
        uint totalEth = _totalAssets();
        require(totalEth > totalDebt, "total ETH < debt");

        uint profit = totalEth - totalDebt;

        // protect against price manipulation
        uint max = totalDebt.mul(delta) / DELTA_MIN;
        if (totalEth <= max) {
            /*
            total ETH is within reasonable bounds, probaly no price
            manipulation occured.
            */

            /*
            If we were to withdraw profit followed by deposit, this would
            increase the total debt roughly by the profit.

            Withdrawing consumes high gas, so here we omit it and
            directly increase debt, as if withdraw and deposit were called.
            */
            totalDebt = totalDebt.add(profit);
        } else {
            /*
            Possible reasons for total ETH > max
            1. total debt = 0
            2. total ETH really did increase over max
            3. price was manipulated
            */
            uint shares = _getShares(profit, totalEth);
            if (shares > 0) {
                uint balBefore = address(this).balance;
                _withdrawEth(shares);
                uint balAfter = address(this).balance;

                uint diff = balAfter.sub(balBefore);
                if (diff > 0) {
                    _sendEthToVault(diff);
                }
            }
        }
    }

    function exit() external virtual override;

    function sweep(address) external virtual override;
}
