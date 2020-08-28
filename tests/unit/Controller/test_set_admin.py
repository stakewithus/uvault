import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_set_admin(accounts, controller):
    tx = controller.setAdmin(accounts[1], { 'from': accounts[0] })

    assert controller.admin() == accounts[1]


def test_set_admin_not_admin(accounts, controller):
    with brownie.reverts("dev: !admin"):
        controller.setAdmin(accounts[1], {'from': accounts[1]})


def test_set_admin_to_zero_address(accounts, controller):
    with brownie.reverts("dev: admin == zero address"):
        controller.setAdmin(ZERO_ADDRESS, {'from': accounts[0]})