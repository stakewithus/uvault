// TODO: lock solidity version
pragma solidity ^0.6.0;

interface IStrategy {
    function token() external view returns (address);
    function vault() external view returns (address);
    function controller() external view returns (address);
    function balance() external view returns (uint);
    function deposit(uint amount) external;
    function withdraw(uint amount) external;
}