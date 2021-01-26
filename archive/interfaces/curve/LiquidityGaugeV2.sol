// SPDX-License-Identifier: MIT
pragma solidity 0.6.11;

interface LiquidityGaugeV2 {
    function deposit(uint) external;

    function balanceOf(address) external view returns (uint);

    function withdraw(uint) external;

    function claim_rewards() external;
}
