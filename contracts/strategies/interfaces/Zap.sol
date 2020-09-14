pragma solidity ^0.6.0;

// Contract address
// 0xbBC81d23Ea2c3ec7e56D39296F0cbB648873a5d3
interface Zap {
  function calc_withdraw_one_coin(uint _token_amount, int128 i) external view returns (uint);
}