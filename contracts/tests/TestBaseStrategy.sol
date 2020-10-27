pragma solidity 0.5.17;

import "../BaseStrategy.sol";

/* solium-disable */
contract TestBaseStrategy is BaseStrategy {
    constructor(address _controller, address _vault)
        public
        BaseStrategy(_controller, _vault)
    {}

    // IStrategy implementations
    function underlying() external view returns (address) {
        return address(0);
    }

    function totalAssets() external view returns (uint) {
        return 0;
    }

    function deposit(uint _amount) external {}

    function withdraw(uint _amount) external {}

    function withdrawAll() external {}

    function harvest() external {}

    function exit() external {}

    // test helpers //
    function _setAsset_(address _addr) external {
        assets[_addr] = true;
    }
}
