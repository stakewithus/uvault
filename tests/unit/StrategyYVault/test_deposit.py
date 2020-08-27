import pytest


def test_deposit(
    accounts, strategyYVault, mockController, mockYCRV, mockYVault
):
    amount = 1000
    mockYCRV.mint(mockController, amount)
    mockYCRV.approveFrom(mockController, strategyYVault, amount)

    controllerBalanceBefore = mockYCRV.balanceOf(mockController)

    tx = strategyYVault.deposit(amount)

    assert len(tx.events) == 5
    assert tx.events["Deposit"].values() == [amount]

    assert mockYCRV.balanceOf(mockController) == controllerBalanceBefore - amount
    assert mockYCRV.balanceOf(strategyYVault) == 0
    assert mockYCRV.balanceOf(mockYVault) == amount

    assert mockYVault.balanceOf(strategyYVault) == amount
