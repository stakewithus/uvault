// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../StrategyETH.sol";

/* solium-disable */
contract StrategyETHTest is StrategyETH {
    constructor(address _controller, address _vault)
        public
        StrategyETH(_controller, _vault)
    {}

    // allow anyone to send ETH. used for simulating profit
    receive() external payable {}

    function _totalAssets() internal view override returns (uint) {
        return address(this).balance;
    }

    function _deposit() internal override {}

    function _getTotalShares() internal view override returns (uint) {
        return address(this).balance;
    }

    function _withdraw(uint _shares) internal override {}

    function harvest() external override onlyAuthorized {}

    function exit() external override onlyAuthorized {
        _withdrawAll();
    }

    function sweep(address _token) external override onlyAdmin {
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
