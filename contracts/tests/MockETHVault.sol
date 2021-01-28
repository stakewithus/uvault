// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../protocol/IETHVault.sol";

/* solium-disable */
contract MockETHVault is IETHVault {
    address public override admin;
    address public override controller;
    address public override token = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public override strategy;
    address public override timeLock;
    uint public override reserveMin;
    uint public override withdrawFee;
    bool public override paused;

    mapping(address => bool) public override strategies;
    mapping(address => bool) public override whitelist;

    // test helpers
    uint public _strategyMin_;
    bool public _investWasCalled_;
    uint public _depositAmount_;
    uint public _withdrawAmount_;
    uint public _withdrawMin_;

    constructor(address _controller, address _timeLock) public {
        admin = msg.sender;
        controller = _controller;
        timeLock = _timeLock;
    }

    receive() external payable {}

    function setAdmin(address _admin) external override {}

    function setController(address _controller) external override {}

    function setTimeLock(address _timeLock) external override {}

    function setPause(bool _paused) external override {}

    function setWhitelist(address _addr, bool _approve) external override {}

    function setReserveMin(uint _min) external override {}

    function setWithdrawFee(uint _fee) external override {}

    function approveStrategy(address _strategy) external override {}

    function revokeStrategy(address _strategy) external override {}

    function setStrategy(address _strategy, uint _min) external override {
        strategy = _strategy;
        _strategyMin_ = _min;
    }

    function balanceInVault() external view override returns (uint) {
        return 0;
    }

    function balanceInStrategy() external view override returns (uint) {
        return 0;
    }

    function totalDebtInStrategy() external view override returns (uint) {
        return 0;
    }

    function totalAssets() external view override returns (uint) {
        return 0;
    }

    function minReserve() external view override returns (uint) {
        return 0;
    }

    function availableToInvest() external view override returns (uint) {
        return 0;
    }

    function invest() external override {
        _investWasCalled_ = true;
    }

    function deposit() external payable override {
        _depositAmount_ = msg.value;
    }

    function getExpectedReturn(uint) external view override returns (uint) {
        return 0;
    }

    function withdraw(uint _shares, uint _min) external override {
        _withdrawAmount_ = _shares;
        _withdrawMin_ = _min;
    }

    function sweep(address _token) external override {}
}
