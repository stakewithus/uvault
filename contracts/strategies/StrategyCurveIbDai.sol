// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyCurveIb.sol";

contract StrategyCurveIbDai is StrategyCurveIb {
    constructor(
        address _controller,
        address _vault,
        address _keeper
    ) public StrategyCurveIb(_controller, _vault, DAI, 0, _keeper) {}
}
