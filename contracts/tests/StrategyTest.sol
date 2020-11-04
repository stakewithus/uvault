// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

import "../StrategyBase.sol";

/* solium-disable */
contract StrategyTest is StrategyBase {
    // test helper
    uint public _withdrawAmount_;
    bool public _harvestWasCalled_;
    bool public _exitWasCalled_;
    // simulate strategy withdrawing less than requested
    uint public _maxWithdrawAmount_ = uint(-1);

    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public StrategyBase(_controller, _vault, _underlying) {}

    function _totalAssets() internal override view returns (uint) {
        return IERC20(underlying).balanceOf(address(this));
    }

    function _depositUnderlying() internal override {}

    function _getTotalShares() internal override view returns (uint) {
        return IERC20(underlying).balanceOf(address(this));
    }

    function _withdrawUnderlying(uint _shares) internal override {
        _withdrawAmount_ = _shares;

        // burn token to simulate withdraw less than requested
        if (_shares > _maxWithdrawAmount_) {
            IERC20(underlying).transfer(address(1), _shares.sub(_maxWithdrawAmount_));
        }
    }

    function _harvest() internal override {
        _harvestWasCalled_ = true;
    }

    function exit() external override onlyAuthorized {
        _exitWasCalled_ = true;
        _withdrawAll();
    }

    // test helpers
    function _setVault_(address _vault) external {
        vault = _vault;
    }

    function _setUnderlying_(address _token) external {
        underlying = _token;
    }

    function _setAsset_(address _token) external {
        assets[_token] = true;
    }

    function _setTotalDebt_(uint _debt) external {
        totalDebt = _debt;
    }

    function _setMaxWithdrawAmount_(uint _max) external {
        _maxWithdrawAmount_ = _max;
    }
}
