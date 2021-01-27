// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../StrategyERC20.sol";
import "./TestToken.sol";

/* solium-disable */
contract StrategyERC20Test is StrategyERC20 {
    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public StrategyERC20(_controller, _vault, _underlying) {}

    function _totalAssets() internal view override returns (uint) {
        return IERC20(underlying).balanceOf(address(this));
    }

    function _deposit() internal override {}

    function _getTotalShares() internal view override returns (uint) {
        return IERC20(underlying).balanceOf(address(this));
    }

    function _withdraw(uint _shares) internal override {}

    function harvest() external override onlyAuthorized {}

    function exit() external override onlyAuthorized {
        _withdrawAll();
    }

    function sweep(address _token) external override onlyAdmin {
        require(_token != underlying, "protected token");
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
