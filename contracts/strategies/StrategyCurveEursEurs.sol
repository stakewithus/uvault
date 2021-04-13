// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyCurveEurs.sol";

contract StrategyCurveEursEurs is StrategyCurveEurs {
    constructor(
        address _controller,
        address _vault,
        address _keeper
    ) public StrategyCurveEurs(_controller, _vault, EURS, 0, _keeper) {}
}
