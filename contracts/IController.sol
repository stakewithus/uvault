pragma solidity ^0.5.16;

interface IController {
    function admin() external view returns (address);
    function treasury() external view returns (address);
}