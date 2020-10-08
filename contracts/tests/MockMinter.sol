pragma solidity 0.5.17;

import "../interfaces/curve/Minter.sol";

contract MockMinter is Minter {
    // test helpers
    bool public _mintWasCalled_;
    address public _mintAddress_;

    function mint(address addr) external {
        _mintWasCalled_ = true;
        _mintAddress_ = addr;
    }
}
