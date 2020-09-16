import pytest
import brownie
from brownie.test import given, strategy

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
MAX_UINT = 2 ** 256 - 1


def test_invest(accounts, vault, erc20, mockStrategy):
    strategy = mockStrategy
    admin = accounts[0]
    account = accounts[1]
    amount = 123

    # mint ERC20 to account, approve vault to spend
    erc20.mint(account, amount)
    erc20.approve(vault, amount, {'from': account})

    vault.deposit(amount, {'from': account})

    # setup strategy
    strategy._setVault_(vault)
    strategy._setUnderlyingToken_(erc20)
    vault.setNextStrategy(strategy, {'from': admin})
    vault.switchStrategy({'from': admin})

    def get_snapshot():
        snapshot = {
            "vault": {
                "availableToInvest": vault.availableToInvest(),
            }
        }

        return snapshot

    # invest
    before = get_snapshot()
    tx = vault.invest({'from': admin})
    after = get_snapshot()

    # check deposit was called
    assert strategy._getDepositAmount_(
    ) == before["vault"]["availableToInvest"]


def test_invest_zero_available(accounts, vault, erc20, mockStrategy):
    admin = accounts[0]
    # rename
    strategy = mockStrategy

    # setup
    strategy._setVault_(vault)
    strategy._setUnderlyingToken_(erc20)
    vault.setNextStrategy(strategy, {'from': admin})
    vault.switchStrategy({'from': admin})

    assert vault.availableToInvest() == 0

    # invest
    tx = vault.invest()

    # check deposit was not called
    assert strategy._getDepositAmount_() == 0


def test_invest_not_admin(accounts, vault):
    with brownie.reverts("dev: !admin"):
        vault.invest({'from': accounts[1]})


def test_invest_strategy_not_defined(accounts, vault):
    with brownie.reverts("dev: strategy = zero address"):
        vault.invest({'from': accounts[0]})
