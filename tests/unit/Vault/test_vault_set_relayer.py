import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
RELAYER_ADDRESS = "0x0000000000000000000000000000000000000001"


def test_set_relayer(accounts, vault):
    tx = vault.setRelayer(RELAYER_ADDRESS, {'from': accounts[0]})

    assert vault.relayer() == RELAYER_ADDRESS


def test_set_relayer_not_admin(accounts, vault):
    with brownie.reverts("dev: !admin"):
        vault.setRelayer(RELAYER_ADDRESS, {'from': accounts[1]})


def test_set_relayer_to_zero_address(accounts, vault):
    with brownie.reverts("dev: relayer == zero address"):
        vault.setRelayer(ZERO_ADDRESS, {'from': accounts[0]})
