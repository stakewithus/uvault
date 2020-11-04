// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

contract TxReceiver {
    // test helper
    bytes public _data_;
    bool public _fail_;

    function callMe(bytes calldata _data) external {
        require(!_fail_, "failed");

        _data_ = _data;
    }

    function _setFail_(bool _fail) external {
        _fail_ = _fail;
    }
}
