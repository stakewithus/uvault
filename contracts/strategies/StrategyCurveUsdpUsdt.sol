// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./StrategyCurveUsdp.sol";

contract StrategyCurveUsdpUsdt is StrategyCurveUsdp {
    constructor(
        address _controller,
        address _vault,
        address _keeper
    ) public StrategyCurveUsdp(_controller, _vault, USDT, 3, _keeper) {}
}
