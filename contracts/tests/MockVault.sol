pragma solidity 0.5.17;

import "../IVault.sol";

contract MockVault is IVault {
    address public admin;
    address public controller;
    address public token;
    address public strategy;
    address public nextStrategy;
    uint public timeLock;

    // test helpers
    bool public _switchStrategyWasCalled_;
    bool public _investWasCalled_;
    bool public _rebalanceWasCalled_;
    uint public _depositAmount_;
    uint public _withdrawAmount_;
    uint public _withdrawMin_;

    constructor(address _controller, address _token) public {
        admin = msg.sender;
        controller = _controller;
        token = _token;
    }

    function setNextStrategy(address _strategy) external {
        nextStrategy = _strategy;
    }

    function switchStrategy() external {
        _switchStrategyWasCalled_ = true;
    }

    function balanceInVault() external view returns (uint) {
        return 0;
    }

    function availableToInvest() external view returns (uint) {
        return 0;
    }

    function totalLockedValue() external view returns (uint) {
        return 0;
    }

    function invest() external {
        _investWasCalled_ = true;
    }

    function rebalance() external {
        _rebalanceWasCalled_ = true;
    }

    function deposit(uint _amount) external {
        _depositAmount_ = _amount;
    }

    function calcWithdraw(uint _shares) external view returns (uint) {
        return 0;
    }

    function withdraw(uint _shares, uint _min) external {
        _withdrawAmount_ = _shares;
        _withdrawMin_ = _min;
    }
}