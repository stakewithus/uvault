import pytest
import brownie


def test_deposit_not_controller(
    accounts, strategyYVault, mockController, mockYCRV, mockYVault
):
    with brownie.reverts("dev: !controller"):
        strategyYVault.deposit(100)


def test_deposit(
    accounts, strategyYVault, mockController, mockYCRV, mockYVault
):
    amount = 1000
    mockYCRV.mint(mockController, amount)
    mockYCRV.approveFrom(mockController, strategyYVault, amount)

    balanceBefore = {
        "controller": mockYCRV.balanceOf(mockController),
        "yVault": mockYCRV.balanceOf(mockYVault),
        "strategyYVault": mockYCRV.balanceOf(strategyYVault)
    }

    # need to call from controller
    tx = mockController.deposit(strategyYVault, amount)

    assert len(tx.events) == 5
    assert tx.events["Deposit"].values() == [mockController, amount]

    balanceAfter = {
        "controller": mockYCRV.balanceOf(mockController),
        "yVault": mockYCRV.balanceOf(mockYVault),
        "strategyYVault": mockYCRV.balanceOf(strategyYVault)
    }

    assert balanceAfter["controller"] == balanceBefore["controller"] - amount
    assert balanceAfter["strategyYVault"] == 0
    assert balanceAfter["yVault"] == balanceBefore["yVault"] + balanceBefore["strategyYVault"] + amount
