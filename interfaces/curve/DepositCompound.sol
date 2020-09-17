pragma solidity ^0.6.0;

// https://github.com/curvefi/curve-contract/blob/master/contracts/pools/compound/DepositCompound.vy
// Contract address
// 0xeB21209ae4C2c9FF2a86ACA31E123764A3B6Bc06

interface DepositCompound {
  function calc_withdraw_one_coin(uint _token_amount, int128 i) external view returns (uint);
}