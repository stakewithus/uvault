pragma solidity 0.5.17;

// https://etherscan.io/address/0x16de59092dae5ccf4a1e6439d611fd0653f0bd01#code

interface yERC20 {
  function deposit(uint256 _amount) external;
  function withdraw(uint256 _amount) external;
  function getPricePerFullShare() external view returns (uint);
}