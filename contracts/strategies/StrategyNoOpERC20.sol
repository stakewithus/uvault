// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

/*
version 1.2.0

Changes from StrategyNoOp
- enable setController
- move code to withdraw all token from exit() to withdrawAll()
  Under no circumstance should exit() fail. This prevents vault getting stuck to
  this strategy.
*/

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "../protocol/IStrategyERC20.sol";

/*
This is a "placeholder" strategy used during emergency shutdown
*/
contract StrategyNoOpERC20 is IStrategyERC20 {
    using SafeERC20 for IERC20;

    address public override admin;
    address public override controller;
    address public override vault;
    address public override underlying;

    uint public constant override totalDebt = 0;
    uint public constant override performanceFee = 0;
    uint public constant override slippage = 0;
    uint public constant override delta = 0;
    bool public constant override forceExit = false;

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

    // @dev variable name is removed to silence compiler warning
    function setPerformanceFee(uint) external override {
        revert("no-op");
    }

    // @dev variable name is removed to silence compiler warning
    function setSlippage(uint) external override {
        revert("no-op");
    }

    // @dev variable name is removed to silence compiler warning
    function setDelta(uint) external override {
        revert("no-op");
    }

    // @dev variable name is removed to silence compiler warning
    function setForceExit(bool) external override {
        revert("no-op");
    }

    function totalAssets() external view override returns (uint) {
        return 0;
    }

    // @dev variable name is removed to silence compiler warning
    function deposit(uint) external override {
        revert("no-op");
    }

    // @dev variable name is removed to silence compiler warning
    function withdraw(uint) external override {
        revert("no-op");
    }

    // @dev tranfser accidentally sent underlying tokens back to vault
    function withdrawAll() external override onlyAuthorized {
        uint bal = IERC20(underlying).balanceOf(address(this));
        if (bal > 0) {
            IERC20(underlying).safeTransfer(vault, bal);
        }
    }

    function harvest() external override {
        revert("no-op");
    }

    function skim() external override {
        revert("no-op");
    }

    function exit() external override {
        // this function must not fail for vault to exit this strategy
    }

    function sweep(address _token) external override onlyAdmin {
        require(_token != underlying, "protected token");
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
