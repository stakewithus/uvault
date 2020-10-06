pragma solidity 0.5.17;

// https://github.com/curvefi/curve-contract/blob/master/contracts/gauges/LiquidityGauge.vy
interface Gauge {
    function deposit(uint) external;

    function balanceOf(address) external view returns (uint);

    function withdraw(uint) external;
}
