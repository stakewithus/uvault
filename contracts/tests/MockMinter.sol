pragma solidity 0.5.17;

import "../interfaces/curve/Minter.sol";

contract MockMinter is Minter {
    // test helpers
    bool public __mintWasCalled__;
    address public __mintAddress__;

    function mint(address addr) external {
        __mintWasCalled__ = true;
        __mintAddress__ = addr;
    }
}
