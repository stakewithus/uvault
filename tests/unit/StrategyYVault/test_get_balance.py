import brownie


def test_get_balance(accounts, strategyYVault, mockYCRV, mockYVault):
    mockYVault.mintTo(strategyYVault, 200)
    mockYCRV.transfer(strategyYVault, 100, {'from': accounts[0]})

    assert strategyYVault.getBalance() == 300