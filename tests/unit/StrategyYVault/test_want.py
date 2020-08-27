import brownie


WANT = "0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8"

def test_want(accounts, strategyYVault):
    assert strategyYVault.want() == WANT

