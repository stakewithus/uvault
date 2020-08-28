import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_set_withdraw_fee(accounts, strategyYVault):
    fee = 123
    tx = strategyYVault.setWithdrawFee(fee, { 'from': accounts[0] })

    assert strategyYVault.withdrawFee() == fee
    assert len(tx.events) == 1
    assert tx.events["SetWithdrawFee"].values() == [fee]


def test_set_controller_not_admin(accounts, strategyYVault):
    fee = 123
    with brownie.reverts("dev: !admin"):
        strategyYVault.setWithdrawFee(fee, {'from': accounts[1]})
