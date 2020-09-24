pragma solidity 0.5.17;

import "../interfaces/GasToken.sol";

contract MockGasToken is GasToken {
    // test helpers
    uint public _mintAmount_;
    uint public _freeAmount_;
    uint public _freeUpToAmount_;

    function mint(uint _amount) external {
        _mintAmount_ = _amount;
    }
    function free(uint _amount) external returns (bool) {
        _freeAmount_ = _amount;
        return true;
    }
    function freeUpTo(uint _amount) external returns (uint) {
        _freeUpToAmount_ = _amount;
        return 0;
    }
}