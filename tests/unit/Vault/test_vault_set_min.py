import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_set_min(accounts, vault):
    tx = vault.setMin(123, {'from': accounts[0]})

    assert vault.min() == 123


def test_set_min_not_admin(accounts, vault):
    with brownie.reverts("dev: !admin"):
        vault.setMin(123, {'from': accounts[1]})


def test_set_admin_to_zero_address(accounts, vault):
    with brownie.reverts("dev: min > max"):
        _max = vault.max()
        vault.setMin(_max + 1, {'from': accounts[0]})
