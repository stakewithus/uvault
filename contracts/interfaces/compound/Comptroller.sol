// SPDX-License-Identifier: MIT
pragma solidity 0.6.11;

interface Comptroller {
    function markets(address cToken)
        external
        view
        returns (
            bool,
            uint,
            bool
        );

    // Claim all the COMP accrued by holder in specific markets
    function claimComp(address holder, address[] calldata cTokens) external;
}
