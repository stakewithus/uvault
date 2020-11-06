// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

interface ITimeLock {
    function admin() external view returns (address);

    function delay() external view returns (uint);

    function queued(bytes32 _txHash) external view returns (bool);

    function setAdmin(address _admin) external;

    function setDelay(uint _delay) external;

    receive() external payable;

    function getTxHash(
        address target,
        uint value,
        bytes calldata data,
        uint eta
    ) external pure returns (bytes32);

    function queue(
        address target,
        uint value,
        bytes calldata data,
        uint eta
    ) external returns (bytes32);

    function execute(
        address target,
        uint value,
        bytes calldata data,
        uint eta
    ) external payable returns (bytes memory);

    function cancel(
        address target,
        uint value,
        bytes calldata data,
        uint eta
    ) external;
}
