import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_set_admin(accounts, vault):
    tx = vault.setAdmin(accounts[1], {'from': accounts[0]})

    assert vault.admin() == accounts[1]


def test_set_admin_not_admin(accounts, vault):
    with brownie.reverts("dev: !admin"):
        vault.setAdmin(accounts[1], {'from': accounts[1]})


def test_set_admin_to_zero_address(accounts, vault):
    with brownie.reverts("dev: admin = zero address"):
        vault.setAdmin(ZERO_ADDRESS, {'from': accounts[0]})
