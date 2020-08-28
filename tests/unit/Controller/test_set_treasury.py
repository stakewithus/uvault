import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_set_treasury(accounts, controller):
    tx = controller.setTreasury(accounts[1], { 'from': accounts[0] })

    assert controller.treasury() == accounts[1]


def test_set_treasury_not_admin(accounts, controller):
    with brownie.reverts("dev: !admin"):
        controller.setTreasury(accounts[1], {'from': accounts[1]})


def test_set_treasury_to_zero_address(accounts, controller):
    with brownie.reverts("dev: treasury == zero address"):
        controller.setTreasury(ZERO_ADDRESS, {'from': accounts[0]})