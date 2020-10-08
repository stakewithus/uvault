pragma solidity 0.5.17;

import "../interfaces/curve/Gauge.sol";

contract MockGauge is Gauge {
    // test helpers
    mapping(address => uint) public _balances_;
    bool public _depositWasCalled_;
    uint public _depositAmount_;
    bool public _withdrawWasCalled_;
    uint public _withdrawAmount_;

    function deposit(uint amount) external {
        _depositWasCalled_ = true;
        _depositAmount_ = amount;
    }

    function balanceOf(address addr) external view returns (uint) {
        return _balances_[addr];
    }

    function withdraw(uint amount) external {
        _withdrawWasCalled_ = true;
        _withdrawAmount_ = amount;
    }

    // test helpers
    function __setBalance__(address addr, uint amount) external {
        _balances_[addr] = amount;
    }
}
