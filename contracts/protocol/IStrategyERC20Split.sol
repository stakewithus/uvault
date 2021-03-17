// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

interface IStrategyERC20Split {
    function vault() external view returns (address);

    function underlying() external view returns (address);

    function totalDebt() external view returns (uint);

    function totalAssets() external view returns (uint);

    function deposit(uint _amount) external;

    function withdraw(uint _amount) external;

    function withdrawAll() external;

    function harvest() external;

    function skim() external;

    function exit() external;
}
