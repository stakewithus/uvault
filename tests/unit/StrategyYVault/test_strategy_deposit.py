import pytest
import brownie


def test_deposit(
    accounts, strategyYVault, mockController, mockYCRV, mockYVault
):
    amount = 1000
    mockYCRV.mint(strategyYVault, amount)

    # need to call from controller
    mockController.depositToStrategy(strategyYVault)

    assert mockYVault.depositAmount() == amount


def test_deposit_not_controller(
    accounts, strategyYVault, mockController, mockYCRV, mockYVault
):
    with brownie.reverts("dev: !controller"):
        strategyYVault.deposit()
