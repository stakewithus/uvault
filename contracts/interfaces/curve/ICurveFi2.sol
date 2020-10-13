pragma solidity 0.5.17;

interface ICurveFi2 {
    function calc_withdraw_one_coin(uint token_amount, int128 i) external view returns (uint);

    function add_liquidity(uint[2] calldata amounts, uint min_mint_amount) external;

    function remove_liquidity_one_coin(
        uint token_amount,
        int128 i,
        uint min_uamount,
        bool donate_dust
    ) external;
}
