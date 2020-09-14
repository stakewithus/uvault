// TODO: lock solidity version
pragma solidity ^0.6.0;

interface IController {
    function admin() external view returns (address);
    function treasury() external view returns (address);
}