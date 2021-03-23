// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../StrategyERC20_V3.sol";

/* solium-disable */
contract StrategyERC20_V3_Test is StrategyERC20_V3 {
    constructor(
        address _controller,
        address _vault,
        address _underlying,
        address _keeper
    ) public StrategyERC20_V3(_controller, _vault, _underlying, _keeper) {}

    function totalAssets() external view override returns (uint) {
        return IERC20(underlying).balanceOf(address(this));
    }

    function deposit(uint _amount) external override onlyAuthorized {
        IERC20(underlying).transferFrom(vault, address(this), _amount);
    }

    function withdraw(uint _amount) external override onlyAuthorized {
        IERC20(underlying).transfer(vault, _amount);
    }

    function harvest() external override onlyAuthorized {}

    function skim() external override onlyAuthorized {}

    function withdrawAll() external override onlyAuthorized {
        uint bal = IERC20(underlying).balanceOf(address(this));
        IERC20(underlying).transfer(vault, bal);
    }

    function exit() external override onlyAuthorized {
        uint bal = IERC20(underlying).balanceOf(address(this));
        IERC20(underlying).transfer(vault, bal);
    }

    function sweep(address _token) external override onlyAdmin {
        require(_token != underlying, "protected token");
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
