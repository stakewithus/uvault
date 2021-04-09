// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyCurveUst.sol";

contract StrategyCurveUstUst is StrategyCurveUst {
    constructor(
        address _controller,
        address _vault,
        address _keeper
    ) public StrategyCurveUst(_controller, _vault, UST, 0, _keeper) {}
}
