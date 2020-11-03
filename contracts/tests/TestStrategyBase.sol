pragma solidity 0.5.17;

import "../StrategyBase.sol";

/* solium-disable */
contract TestStrategyBase is StrategyBase {
    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public StrategyBase(_controller, _vault, _underlying) {}

    // IStrategy implementations
    function totalAssets() external view returns (uint) {
        return 0;
    }

    function deposit(uint _amount) external {
        _increaseDebt(_amount);
    }

    function withdraw(uint _amount) external {
        _decreaseDebt(_amount);
    }

    function withdrawAll() external {}

    function harvest() external {}

    function exit() external {}

    // test helpers //
    function _setAsset_(address _addr) external {
        assets[_addr] = true;
    }
}
