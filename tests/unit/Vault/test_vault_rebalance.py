import pytest
import brownie
from brownie.test import given, strategy

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
MAX_UINT = 2 ** 256 - 1


def test_rebalance(accounts, vault, erc20, mockStrategy):
    strategy = mockStrategy
    admin = accounts[0]
    account = accounts[1]
    amount = 123

    # mint ERC20 to account, approve vault to spend
    erc20.mint(account, amount)
    erc20.approve(vault, amount, {'from': account})

    vault.deposit(account, amount, {'from': account})

    # setup strategy
    strategy._setVault_(vault)
    strategy._setUnderlyingToken_(erc20)
    vault.setStrategy(strategy, {'from': admin})

    def get_snapshot():
        snapshot = {
            "vault": {
                "available": vault.available(),
            },
            "strategy": {
                "balance": strategy.balance()
            }
        }

        return snapshot

    # invest
    before = get_snapshot()
    tx = vault.rebalance({'from': admin})
    after = get_snapshot()

    # check withdrawAll was called
    assert strategy._getWithdrawAmount_() == MAX_UINT

    # check deposit was called
    assert strategy._getDepositAmount_() == \
        before["vault"]["available"] + before["strategy"]["balance"]


def test_rebalance_not_admin(accounts, vault):
    with brownie.reverts("dev: !admin"):
        vault.rebalance({'from': accounts[1]})


def test_rebalance_strategy_not_defined(accounts, vault):
    with brownie.reverts("dev: strategy = zero address"):
        vault.rebalance({'from': accounts[0]})
