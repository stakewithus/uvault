// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./protocol/IStrategyV2.sol";
// used inside harvest
import "./protocol/IControllerV2.sol";

/*
Changes from StrategyBase V1
- performance fee capped at 20%
- add slippage gaurd
- update skim(), increments total debt withoud withdrawing if total assets
  close to total debt
- sweep - delete mapping "assets" and use require to explicitly check protected tokens
*/

//TODO reentrancy protection

abstract contract StrategyBaseV2 is IStrategyV2 {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    address public override admin;
    address public override controller;
    address public override vault;
    address public override underlying;

    // total amount of underlying transferred from vault
    uint public override totalDebt;

    // performance fee sent to treasury when harvest() generates profit
    uint public override performanceFee = 500;
    uint private constant PERFORMANCE_FEE_CAP = 2000; // upper limit to performance fee
    uint internal constant PERFORMANCE_FEE_MAX = 10000;

    // prevent slippage from deposit / withdraw
    uint public override slippage = 100;
    uint internal constant SLIPPAGE_MAX = 10000;

    /* 
    Multiplier used to check total underlying is <= total debt * delta / DELTA_DENOM
    */
    uint public override delta = 10050;
    uint private constant DELTA_DENOM = 10000;

    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public {
        require(_controller != address(0), "controller = zero address");
        require(_vault != address(0), "vault = zero address");
        require(_underlying != address(0), "underlying = zero address");

        admin = msg.sender;
        controller = _controller;
        vault = _vault;
        underlying = _underlying;
    }

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
        require(_delta >= DELTA_DENOM, "delta < denominator");
        delta = _delta;
    }

    function _increaseDebt(uint _underlyingAmount) private {
        uint balBefore = IERC20(underlying).balanceOf(address(this));
        IERC20(underlying).safeTransferFrom(vault, address(this), _underlyingAmount);
        uint balAfter = IERC20(underlying).balanceOf(address(this));

        totalDebt = totalDebt.add(balAfter.sub(balBefore));
    }

    function _decreaseDebt(uint _underlyingAmount) private {
        uint balBefore = IERC20(underlying).balanceOf(address(this));
        IERC20(underlying).safeTransfer(vault, _underlyingAmount);
        uint balAfter = IERC20(underlying).balanceOf(address(this));

        uint diff = balBefore.sub(balAfter);
        if (diff > totalDebt) {
            totalDebt = 0;
        } else {
            totalDebt = totalDebt - diff;
        }
    }

    function _totalAssets() internal view virtual returns (uint);

    /*
    @notice Returns amount of underlying tokens locked in this contract
    */
    function totalAssets() external view override returns (uint) {
        return _totalAssets();
    }

    function _depositUnderlying() internal virtual;

    /*
    @notice Deposit underlying token into this strategy
    @param _underlyingAmount Amount of underlying token to deposit
    */
    function deposit(uint _underlyingAmount) external override onlyAuthorized {
        require(_underlyingAmount > 0, "underlying = 0");

        _increaseDebt(_underlyingAmount);
        _depositUnderlying();
    }

    /*
    @notice Returns total shares owned by this contract for depositing underlying
            into external Defi
    */
    function _getTotalShares() internal view virtual returns (uint);

    function _getShares(uint _underlyingAmount, uint _totalUnderlying)
        internal
        view
        returns (uint)
    {
        /*
        calculate shares to withdraw

        w = amount of underlying to withdraw
        U = total redeemable underlying
        s = shares to withdraw
        P = total shares deposited into external liquidity pool

        w / U = s / P
        s = w / U * P
        */
        if (_totalUnderlying > 0) {
            uint totalShares = _getTotalShares();
            return _underlyingAmount.mul(totalShares) / _totalUnderlying;
        }
        return 0;
    }

    function _withdrawUnderlying(uint _shares) internal virtual;

    /*
    @notice Withdraw undelying token to vault
    @param _underlyingAmount Amount of underlying token to withdraw
    @dev Caller should implement guard agains slippage
    */
    function withdraw(uint _underlyingAmount) external override onlyAuthorized {
        require(_underlyingAmount > 0, "underlying = 0");
        uint totalUnderlying = _totalAssets();
        require(_underlyingAmount <= totalUnderlying, "underlying > total");

        uint shares = _getShares(_underlyingAmount, totalUnderlying);
        if (shares > 0) {
            _withdrawUnderlying(shares);
        }

        // transfer underlying token to vault
        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            _decreaseDebt(underlyingBal);
        }
    }

    function _withdrawAll() internal {
        uint totalShares = _getTotalShares();
        if (totalShares > 0) {
            _withdrawUnderlying(totalShares);
        }

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            _decreaseDebt(underlyingBal);
            totalDebt = 0;
        }
    }

    /*
    @notice Withdraw all underlying to vault
    @dev Caller should implement guard agains slippage
    */
    function withdrawAll() external override onlyAuthorized {
        _withdrawAll();
    }

    /*
    @notice Sell any staking rewards for underlying, deposit undelying
    */
    function harvest() external virtual override;

    /*
    @notice Increase total debt if profit > 0 and total assets <= max,
            otherwise transfers profit to vault.
    @dev Guard against manipulation of external price feed by checking that
         total assets is below factor of total debt
    */
    function skim() external override onlyAuthorized {
        uint totalUnderlying = _totalAssets();
        require(totalUnderlying > totalDebt, "total underlying < debt");

        uint profit = totalUnderlying - totalDebt;

        // protect against price manipulation
        uint max = totalDebt.mul(delta) / DELTA_DENOM;
        if (totalUnderlying <= max) {
            /*
            total underlying is within reasonable bounds, probaly no price
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
            Possible reasons for total underlying > max
            1. total debt = 0
            2. total underlying really did increase over max
            3. price was manipulated
            */
            uint shares = _getShares(profit, totalUnderlying);
            if (shares > 0) {
                _withdrawUnderlying(shares);

                uint bal = IERC20(underlying).balanceOf(address(this));
                if (bal > 0) {
                    IERC20(underlying).safeTransfer(vault, bal);
                }
            }
        }
    }

    function exit() external virtual override;

    function sweep(address) external virtual override;
}
