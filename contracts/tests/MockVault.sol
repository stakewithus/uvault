pragma solidity 0.5.17;

import "../IVault.sol";

/* solium-disable */
contract MockVault is IVault {
    address public admin;
    address public controller;
    address public token;
    address public strategy;
    address public nextStrategy;
    uint public timeLock;
    uint totalDebt;

    // test helpers
    uint public _setStrategyMin_;
    bool public _investWasCalled_;
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

    function setStrategy(address _strategy, uint _min) external {
        strategy = _strategy;
        _setStrategyMin_ = _min;
    }

    function balanceInVault() external view returns (uint) {
        return 0;
    }

    function balanceInStrategy() external view returns (uint) {
        return 0;
    }

    function minReserve() external view returns (uint) {
        return 0;
    }

    function totalAssets() external view returns (uint) {
        return 0;
    }

    function availableToInvest() external view returns (uint) {
        return 0;
    }

    function invest() external {
        _investWasCalled_ = true;
    }

    function deposit(uint _amount) external {
        _depositAmount_ = _amount;
    }

    function getExpectedReturn(uint _shares) external view returns (uint) {
        return 0;
    }

    function withdraw(uint _shares, uint _min) external {
        _withdrawAmount_ = _shares;
        _withdrawMin_ = _min;
    }

    function withdrawFromStrategy(uint _amount, uint _min) external {}

    function withdrawAllFromStrategy(uint _min) external {}

    function exitStrategy(uint _min) external {}

    function sweep(address _token) external {}
}
