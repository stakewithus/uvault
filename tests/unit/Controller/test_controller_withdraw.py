import pytest
import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_withdraw(accounts, controller, mockStrategy, erc20):
    # mock vault address
    vault = accounts[1]
    controller.setStrategy(vault, mockStrategy, {'from': accounts[0]})

    amount = 1000

    controller.withdraw(amount, {'from': vault})

    # check deposit was called with amount
    assert mockStrategy.__withdrawAmount() == amount
    # cannot test vault's balance of erc20 since mockStrategy
    # does not transfer erc20


def test_withdraw_not_vault(accounts, controller):
    with brownie.reverts("dev: !vault"):
        controller.withdraw(100, {'from': accounts[0]})


@pytest.mark.skip
def test_withdraw_strategy_zero_address(accounts, controller):
    # strategy cannot be set to zero address
    pass
