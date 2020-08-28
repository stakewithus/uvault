import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
CONTROLLER_ADDRESS = "0x0000000000000000000000000000000000000001"


def test_set_controller(accounts, strategyYVault):
    tx = strategyYVault.setController(CONTROLLER_ADDRESS, { 'from': accounts[0] })

    assert strategyYVault.controller() == CONTROLLER_ADDRESS
    assert len(tx.events) == 1
    assert tx.events["SetController"].values() == [CONTROLLER_ADDRESS]


def test_set_controller_not_admin(accounts, strategyYVault):
    with brownie.reverts("dev: !admin"):
        strategyYVault.setController(CONTROLLER_ADDRESS, {'from': accounts[1]})


def test_set_controller_to_zero_address(accounts, strategyYVault):
    with brownie.reverts("dev: controller == zero address"):
        strategyYVault.setController(ZERO_ADDRESS, {'from': accounts[0]})