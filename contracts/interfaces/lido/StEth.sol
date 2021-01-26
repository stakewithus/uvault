// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

interface StEth {
    function submit(address) external payable returns (uint);
}
