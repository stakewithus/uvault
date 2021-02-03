// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

interface LiquidityGaugeReward {
    function deposit(uint) external;

    function balanceOf(address) external view returns (uint);

    function withdraw(uint) external;

    function claim_rewards() external;
}
