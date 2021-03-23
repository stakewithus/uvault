// SPDX-License-Identifier: MIT
pragma solidity ^0.6;

interface CEth {
    function mint() external payable;

    function redeemUnderlying(uint redeemAmount) external returns (uint);

    function borrow(uint borrowAmount) external returns (uint);

    function repayBorrow() external payable;

    function redeem(uint) external returns (uint);

    function borrowBalanceCurrent(address account) external returns (uint);

    function balanceOfUnderlying(address account) external returns (uint);

    function getAccountSnapshot(address account)
        external
        view
        returns (
            uint,
            uint,
            uint,
            uint
        );
}
