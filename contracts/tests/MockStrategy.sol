pragma solidity 0.5.17;

import "../IStrategy.sol";

contract MockStrategy is IStrategy {
    address public admin;
    address public controller;
    address public vault;
    address public underlyingToken;

    // test helper
    uint private _balance_;
    uint private _depositAmount_;
    uint private _withdrawAmount_;
    bool private _exitWasCalled_;

    constructor(address _controller, address _vault, address _underlyingToken) public {
        admin = msg.sender;
        controller = _controller;
        vault = _vault;
        underlyingToken = _underlyingToken;
    }

    function underlyingBalance() external view returns (uint) {
        return _balance_;
    }

    function deposit(uint _amount) external {
        _depositAmount_ = _amount;
    }

    function withdraw(uint _amount) external {
        _withdrawAmount_ = _amount;
    }

    function withdrawAll() external {
        _withdrawAmount_ = uint(-1);
    }

    function harvest() external {}

    function exit() external {
        _exitWasCalled_ = true;
    }

    // test helpers
    function _setVault_(address _vault) external {
        vault = _vault;
    }

    function _setUnderlyingToken_(address _token) external {
        underlyingToken = _token;
    }

    function _setBalance_(uint _balance) external {
        _balance_ = _balance;
    }

    function _getDepositAmount_() external view returns (uint) {
        return _depositAmount_;
    }

    function _getWithdrawAmount_() external view returns (uint) {
        return _withdrawAmount_;
    }

    function _wasExitCalled_() external view returns (bool) {
        return _exitWasCalled_;
    }
}