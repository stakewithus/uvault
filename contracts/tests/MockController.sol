pragma solidity 0.5.17;

import "../IController.sol";

contract MockController is IController {
    address public admin;
    address public treasury;

    constructor(address _treasury) public {
        admin = msg.sender;
        treasury = _treasury;
    }

    function invest(address _vault) external {}

    function rebalance(address _vault) external {}

    function setStrategy(
        address _vault,
        address _strategy,
        uint _min
    ) external {}

    function harvest(address _strategy) external {}

    function withdraw(
        address _strategy,
        uint _amount,
        uint _min
    ) external {}

    function withdrawAll(address _strategy, uint _min) external {}

    function exit(address _strategy, uint _min) external {}
}
