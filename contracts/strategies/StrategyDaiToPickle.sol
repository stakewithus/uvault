pragma solidity ^0.5.17;

import "./StrategyPickle.sol";

contract StrategyDaiToPickle is StrategyPickle {
    constructor(address _controller, address _vault)
        public
        StrategyPickle(_controller, _vault)
    {
        // dai
        underlying = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
        // pickle jar (pJar 0.88a)
        jar = 0x6949Bb624E8e8A90F87cD2058139fcd77D2F3F87;
    }
}
