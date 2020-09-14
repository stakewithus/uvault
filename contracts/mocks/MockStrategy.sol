pragma solidity ^0.6.0;

import "../interfaces/IStrategy.sol";

contract MockStrategy is IStrategy {
    address override public vault;
    address override public underlyingToken;

    // test helper
    uint private _balance_;
    uint private _depositAmount_;
    uint private _withdrawAmount_;

    constructor(address _vault, address _underlyingToken) public {
        vault = _vault;
        underlyingToken = _underlyingToken;
    }

    function balance() override external view returns (uint) {
        return _balance_;
    }

    function deposit(uint _amount) override external {
        _depositAmount_ = _amount;
    }

    function withdraw(uint _amount) override external {
        _withdrawAmount_ = _amount;
    }

    function withdrawAll() override external {
        _withdrawAmount_ = uint(-1);
    }

    function harvest() override external {}

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
}