// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "../protocol/IStrategyETH.sol";

/*
This is a "placeholder" strategy used during emergency shutdown
*/
contract StrategyNoOpETH is IStrategyETH {
    using SafeERC20 for IERC20;

    address public override admin;
    address public override controller;
    address public override vault;
    // Placeholder address of ETH, indicating this is strategy for ETH
    address public immutable override underlying =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    uint public override totalDebt;
    uint public override performanceFee;
    uint public override slippage;
    uint public override delta;

    constructor(address _controller, address _vault) public {
        require(_controller != address(0), "controller = zero address");
        require(_vault != address(0), "vault = zero address");

        admin = msg.sender;
        controller = _controller;
        vault = _vault;
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

    // @dev variable name is removed to silence compiler warning
    function setController(address) external override {
        revert("no-op");
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

    function totalAssets() external view override returns (uint) {
        return 0;
    }

    function deposit() external payable override {
        revert("no-op");
    }

    // @dev variable name is removed to silence compiler warning
    function withdraw(uint) external override {
        revert("no-op");
    }

    // @dev tranfser accidentally sent ETH back to vault
    function withdrawAll() external override onlyAuthorized {
        uint bal = address(this).balance;
        if (bal > 0) {
            (bool sent, ) = vault.call{value: bal}("");
            require(sent, "Send ETH failed");
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
