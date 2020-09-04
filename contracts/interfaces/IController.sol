// TODO: lock solidity version
pragma solidity ^0.6.0;

interface IController {
    function treasury() external view returns (address);
}