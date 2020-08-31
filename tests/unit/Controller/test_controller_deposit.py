import pytest
import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_deposit(accounts, controller, mockStrategy, erc20):
    # mock vault address
    vault = accounts[1]
    controller.setStrategy(vault, mockStrategy, {'from': accounts[0]})

    amount = 1000
    erc20.mint(vault, amount)
    erc20.approve(controller, amount, {'from': vault})

    balanceBefore = {
        "vault": erc20.balanceOf(vault)
    }

    controller.deposit(amount, {'from': vault})

    balanceAfter = {
        "vault": erc20.balanceOf(vault)
    }

    # check deposit was called with amount
    assert mockStrategy.depositAmount() == amount
    assert balanceAfter["vault"] == balanceBefore["vault"] - amount


def test_deposit_not_vault(accounts, controller):
    with brownie.reverts("dev: !vault"):
        controller.deposit(100, {'from': accounts[0]})


@pytest.mark.skip
def test_deposit_strategy_zero_address(accounts, controller):
    # strategy cannot be set to zero address
    pass
