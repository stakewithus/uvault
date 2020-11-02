pragma solidity 0.5.17;

import "../IVault.sol";

/* solium-disable */
contract MockTimeLock {
    // test helpers
    function _setTimeLock_(address _vault, address _timeLock) external {
        IVault(_vault).setTimeLock(_timeLock);
    }

    function _approveStrategy_(address _vault, address _strategy) external {
        IVault(_vault).approveStrategy(_strategy);
    }
}
