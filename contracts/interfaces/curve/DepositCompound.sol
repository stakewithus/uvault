pragma solidity 0.5.17;

// https://github.com/curvefi/curve-contract/blob/master/contracts/pools/compound/DepositCompound.vy
// Contract address
// 0xeB21209ae4C2c9FF2a86ACA31E123764A3B6Bc06

interface DepositCompound {
    function calc_withdraw_one_coin(uint _token_amount, int128 i) external view returns (uint);

    function add_liquidity(uint[2] calldata amounts, uint min_mint_amount) external;

    function remove_liquidity_imbalance(uint[2] calldata amounts, uint max_burn_amount) external;

    function remove_liquidity(uint _amount, uint[2] calldata amounts) external;

    function remove_liquidity_one_coin(
        uint _token_amount,
        int128 _i,
        uint _min_uamount,
        bool _donate_dust
    ) external;
}
