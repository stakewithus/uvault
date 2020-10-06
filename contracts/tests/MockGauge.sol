pragma solidity 0.5.17;

import "../interfaces/curve/Gauge.sol";

contract MockGauge is Gauge {
    // test helpers
    mapping(address => uint) public __balances__;
    bool public __depositWasCalled__;
    uint public __depositAmount__;
    bool public __withdrawWasCalled__;
    uint public __withdrawAmount__;

    function deposit(uint amount) external {
        __depositWasCalled__ = true;
        __depositAmount__ = amount;
    }

    function balanceOf(address addr) external view returns (uint) {
        return __balances__[addr];
    }

    function withdraw(uint amount) external {
        __withdrawWasCalled__ = true;
        __withdrawAmount__ = amount;
    }

    // test helpers
    function __setBalance__(address addr, uint amount) external {
        __balances__[addr] = amount;
    }
}
