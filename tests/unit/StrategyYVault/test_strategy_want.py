import brownie


def test_want(accounts, strategyYVault, mockYCRV):
    assert strategyYVault.want() == mockYCRV.address

