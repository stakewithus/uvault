pragma solidity ^0.6.0;

// https://github.com/curvefi/curve-contract/blob/master/contracts/pools/compound/StableSwapCompound.vy
interface StableSwapCompound {
  function exchange(
    int128 from, int128 to, uint256 _from_amount, uint256 _min_to_amount
  ) external;
}