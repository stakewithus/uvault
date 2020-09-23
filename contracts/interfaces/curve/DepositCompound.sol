pragma solidity 0.5.17;

// https://github.com/curvefi/curve-contract/blob/master/contracts/pools/compound/DepositCompound.vy
// Contract address
// 0xeB21209ae4C2c9FF2a86ACA31E123764A3B6Bc06

interface DepositCompound {
  function calc_withdraw_one_coin(uint _token_amount, int128 i) external view returns (uint);
  function add_liquidity(uint256[2] calldata amounts, uint256 min_mint_amount) external;
  function remove_liquidity_imbalance(uint256[2] calldata amounts, uint256 max_burn_amount) external;
  function remove_liquidity(uint256 _amount, uint256[2] calldata amounts) external;
  function remove_liquidity_one_coin(uint256 _token_amount, int128 _i, uint256 _min_uamount, bool _donate_dust) external;
}