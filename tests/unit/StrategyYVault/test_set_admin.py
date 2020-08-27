import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_set_admin(accounts, strategyYVault):
    tx = strategyYVault.setAdmin(accounts[1], { 'from': accounts[0] })

    assert strategyYVault.admin() == accounts[1]
    assert len(tx.events) == 1
    assert tx.events["SetAdmin"].values() == [accounts[1]]


def test_set_admin_not_admin(accounts, strategyYVault):
    with brownie.reverts("!admin"):
        strategyYVault.setAdmin(accounts[1], {'from': accounts[1]})


def test_set_admin_to_zero_address(accounts, strategyYVault):
    with brownie.reverts("admin == zero address"):
        strategyYVault.setAdmin(ZERO_ADDRESS, {'from': accounts[0]})