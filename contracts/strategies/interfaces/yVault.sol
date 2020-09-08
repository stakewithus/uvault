pragma solidity ^0.6.0;

// https://github.com/iearn-finance/vaults/blob/master/contracts/yVault.sol
interface yVault {
  function balanceOf(address) external view returns (uint);
  function deposit(uint256 _amount) external;
  function withdraw(uint256 _amount) external;
}