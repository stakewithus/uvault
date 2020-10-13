pragma solidity 0.5.17;

interface ICurveFi3 {
    function calc_withdraw_one_coin(uint token_amount, int128 i) external view returns (uint);

    function add_liquidity(uint[3] calldata amounts, uint min_mint_amount) external;

    function remove_liquidity_one_coin(uint token_amount, int128 i, uint min_uamount) external;
}
