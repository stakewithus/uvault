// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

import "../protocol/IVault.sol";

/* solium-disable */
contract MockVault is IVault {
    address public override admin;
    address public override controller;
    address public override token;
    address public override strategy;
    address public override timeLock;
    uint public override reserveMin;
    uint public override withdrawFee;
    bool public override paused;

    mapping(address => bool) public override strategies;

    // test helpers
    uint public _setStrategyMin_;
    bool public _investWasCalled_;
    uint public _depositAmount_;
    uint public _withdrawAmount_;
    uint public _withdrawMin_;

    constructor(
        address _controller,
        address _timeLock,
        address _token
    ) public {
        admin = msg.sender;
        controller = _controller;
        timeLock = _timeLock;
        token = _token;
    }

    function setAdmin(address _admin) external override {}

    function setController(address _controller) external override {}

    function setTimeLock(address _timeLock) external override {}

    function setPause(bool _paused) external override {}

    function setReserveMin(uint _min) external override {}

    function setWithdrawFee(uint _fee) external override {}

    function approveStrategy(address _strategy) external override {}

    function revokeStrategy(address _strategy) external override {}

    function setStrategy(address _strategy, uint _min) external override {
        strategy = _strategy;
        _setStrategyMin_ = _min;
    }

    function balanceInVault() external override view returns (uint) {
        return 0;
    }

    function balanceInStrategy() external override view returns (uint) {
        return 0;
    }

    function totalDebtInStrategy() external override view returns (uint) {
        return 0;
    }

    function totalAssets() external override view returns (uint) {
        return 0;
    }

    function minReserve() external override view returns (uint) {
        return 0;
    }

    function availableToInvest() external override view returns (uint) {
        return 0;
    }

    function invest() external override {
        _investWasCalled_ = true;
    }

    function deposit(uint _amount) external override {
        _depositAmount_ = _amount;
    }

    function getExpectedReturn(uint _shares) external override view returns (uint) {
        return 0;
    }

    function withdraw(uint _shares, uint _min) external override {
        _withdrawAmount_ = _shares;
        _withdrawMin_ = _min;
    }

    function sweep(address _token) external override {}
}
