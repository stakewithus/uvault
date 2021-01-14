// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../protocol/IControllerV2.sol";

/* solium-disable */
contract MockControllerV2 is IControllerV2 {
    // keccak256(abi.encodePacked("ADMIN"));
    bytes32 public constant override ADMIN_ROLE =
        0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42;
    // keccak256(abi.encodePacked("HARVESTER"));
    bytes32 public constant override HARVESTER_ROLE =
        0x27e3e4d29d60af3ae6456513164bb5db737d6fc8610aa36ad458736c9efb884c;

    address public override admin;
    address public override treasury;

    constructor(address _treasury) public {
        admin = msg.sender;
        treasury = _treasury;
    }

    function setAdmin(address _admin) external override {}

    function setTreasury(address _treasury) external override {}

    function grantRole(bytes32 _role, address _addr) external override {}

    function revokeRole(bytes32 _role, address _addr) external override {}

    function invest(address _vault) external override {}

    function setStrategy(
        address _vault,
        address _strategy,
        uint _min
    ) external override {}

    function harvest(address _strategy) external override {}

    function harvest(
        address _strategy,
        uint _min,
        uint _max
    ) external override {}

    function skim(address _strategy) external override {}

    function withdraw(
        address _strategy,
        uint _amount,
        uint _min
    ) external override {}

    function withdrawAll(address _strategy, uint _min) external override {}

    function exit(address _strategy, uint _min) external override {}

    /* test helper */
    function _setTreasury_(address _treasury) external {
        treasury = _treasury;
    }
}
