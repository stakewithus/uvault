// TODO: lock solidity version
pragma solidity ^0.6.0;

interface IVault {
    function token() external view returns (address);
    function strategy() external view returns (address);
    function setStrategy(address _strategy) external;
    function invest(uint amount, uint min) external;
    function deposit(uint amount) external;
    function withdraw(uint amount, uint min) external;
}