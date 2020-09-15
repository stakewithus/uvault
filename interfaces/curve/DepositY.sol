pragma solidity ^0.6.0;

// https://github.com/curvefi/curve-contract/blob/master/contracts/pools/y/DepositY.vy
// Contract address
// 0xbBC81d23Ea2c3ec7e56D39296F0cbB648873a5d3

interface DepositY {
  function calc_withdraw_one_coin(uint _token_amount, int128 i) external view returns (uint);
}