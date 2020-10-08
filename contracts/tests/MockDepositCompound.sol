pragma solidity 0.5.17;

import "../interfaces/curve/DepositCompound.sol";

contract MockDepositCompound is DepositCompound {
    // test helpers
    uint _calc_withdraw_one_coin_;

    bool public _add_liquidity_wasCalled_;
    uint[] public _add_liquidity_amounts_;
    uint _add_liquidity_min_mint_amount_;

    bool public _remove_liquidity_imbalance_wasCalled_;
    uint[] public _remove_liquidity_imbalance_amounts_;
    uint _remove_liquidity_imbalance_max_burn_amount_;

    bool public _remove_liquidity_wasCalled_;
    uint public _remove_liquidity_amount_;
    uint[] public _remove_liquidity_amounts_;
    uint public _remove_liquidity_max_burn_amount_;

    bool public _remove_liquidity_one_coin_wasCalled_;
    uint public _remove_liquidity_one_coin_amount_;
    int128 public _remove_liquidity_i_;
    uint public _remove_liquidity_one_coin_min_uamount_;
    bool public _remove_liquidity_one_coin_donate_dust_;

    function calc_withdraw_one_coin(uint _token_amount, int128 i) external view returns (uint) {
        return _calc_withdraw_one_coin_;
    }

    function add_liquidity(uint[2] calldata amounts, uint min_mint_amount) external {
        _add_liquidity_wasCalled_ = true;
        _add_liquidity_amounts_ = amounts;
        _add_liquidity_min_mint_amount_ = min_mint_amount;
    }

    function remove_liquidity_imbalance(uint[2] calldata amounts, uint max_burn_amount) external {
        _remove_liquidity_imbalance_wasCalled_ = true;
        _remove_liquidity_imbalance_amounts_ = amounts;
        _remove_liquidity_imbalance_max_burn_amount_ = max_burn_amount;
    }

    function remove_liquidity(uint amount, uint[2] calldata amounts) external {
        _remove_liquidity_wasCalled_ = true;
        _remove_liquidity_amount_ = amount;
        _remove_liquidity_amounts_ = amounts;
    }

    function remove_liquidity_one_coin(
        uint amount,
        int128 i,
        uint min_uamount,
        bool donate_dust
    ) external {
        _remove_liquidity_one_coin_amount_ = amount;
        _remove_liquidity_i_ = i;
        _remove_liquidity_one_coin_min_uamount_ = min_uamount;
        _remove_liquidity_one_coin_donate_dust_ = donate_dust;
        _remove_liquidity_one_coin_wasCalled_ = true;
    }

    // test helpers
    function _set_calc_withdraw_one_coin_(uint amount) external {
        _calc_withdraw_one_coin_ = amount;
    }
}
