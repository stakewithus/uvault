pragma solidity ^0.6.0;

// https://github.com/curvefi/curve-contract/blob/master/contracts/gauges/LiquidityGauge.vy
interface Gauge {
    function deposit(uint) external;
    function balanceOf(address) external view returns (uint);
    function withdraw(uint) external;
}
