pragma solidity 0.5.17;

import "../interfaces/curve/DepositCompound.sol";

contract MockDepositCompound is DepositCompound {
    // test helpers
    uint __calc_withdraw_one_coin__;

    bool public __add_liquidity_wasCalled__;
    uint[] public __add_liquidity_amounts__;
    uint __add_liquidity_min_mint_amount__;

    bool public __remove_liquidity_imbalance_wasCalled__;
    uint[] public __remove_liquidity_imbalance_amounts__;
    uint __remove_liquidity_imbalance_max_burn_amount__;

    bool public __remove_liquidity_wasCalled__;
    uint public __remove_liquidity_amount__;
    uint[] public __remove_liquidity_amounts__;
    uint public __remove_liquidity_max_burn_amount__;

    bool public __remove_liquidity_one_coin_wasCalled__;
    uint public __remove_liquidity_one_coin_amount__;
    int128 public __remove_liquidity_i__;
    uint public __remove_liquidity_one_coin_min_uamount;
    bool public __remove_liquidity_one_coin_donate_dust__;

    function calc_withdraw_one_coin(uint _token_amount, int128 i) external view returns (uint) {
        return __calc_withdraw_one_coin__;
    }

    function add_liquidity(uint[2] calldata amounts, uint min_mint_amount) external {
        __add_liquidity_wasCalled__ = true;
        __add_liquidity_amounts__ = amounts;
        __add_liquidity_min_mint_amount__ = min_mint_amount;
    }

    function remove_liquidity_imbalance(uint[2] calldata amounts, uint max_burn_amount) external {
        __remove_liquidity_imbalance_wasCalled__ = true;
        __remove_liquidity_imbalance_amounts__ = amounts;
        __remove_liquidity_imbalance_max_burn_amount__ = max_burn_amount;
    }

    function remove_liquidity(uint amount, uint[2] calldata amounts) external {
        __remove_liquidity_wasCalled__ = true;
        __remove_liquidity_amount__ = amount;
        __remove_liquidity_amounts__ = amounts;
    }

    function remove_liquidity_one_coin(
        uint amount,
        int128 i,
        uint min_uamount,
        bool donate_dust
    ) external {
        __remove_liquidity_one_coin_amount__ = amount;
        __remove_liquidity_i__ = i;
        __remove_liquidity_one_coin_min_uamount = min_uamount;
        __remove_liquidity_one_coin_donate_dust__ = donate_dust;
        __remove_liquidity_one_coin_wasCalled__ = true;
    }

    // test helpers
    function __set_calc_withdraw_one_coin__(uint amount) external {
        __calc_withdraw_one_coin__ = amount;
    }
}
