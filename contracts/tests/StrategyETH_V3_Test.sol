// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../StrategyETH_V3.sol";

/* solium-disable */
contract StrategyETH_V3_Test is StrategyETH_V3 {
    constructor(
        address _controller,
        address _vault,
        address _keeper
    ) public StrategyETH_V3(_controller, _vault, _keeper) {}

    // allow anyone to send ETH. used for simulating profit
    receive() external payable {}

    function _sendEthToVault(uint _amount) private {
        (bool sent, ) = vault.call{value: _amount}("");
        require(sent, "Send ETH failed");
    }

    function totalAssets() external view override returns (uint) {
        return address(this).balance;
    }

    function deposit() external payable override onlyAuthorized {}

    function withdraw(uint _amount) external override onlyAuthorized {
        _sendEthToVault(_amount);
    }

    function harvest() external override onlyAuthorized {}

    function skim() external override onlyAuthorized {}

    function withdrawAll() external override onlyAuthorized {
        _sendEthToVault(address(this).balance);
    }

    function exit() external override onlyAuthorized {
        _sendEthToVault(address(this).balance);
    }

    function sweep(address _token) external override onlyAdmin {
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
