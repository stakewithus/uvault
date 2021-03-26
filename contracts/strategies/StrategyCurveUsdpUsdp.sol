// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyCurveUsdp.sol";

contract StrategyCurveUsdpUsdp is StrategyCurveUsdp {
    constructor(
        address _controller,
        address _vault,
        address _keeper
    ) public StrategyCurveUsdp(_controller, _vault, USDP, 0, _keeper) {}
}
