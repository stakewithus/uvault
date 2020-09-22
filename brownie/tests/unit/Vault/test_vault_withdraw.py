import pytest
import brownie
from brownie.test import given, strategy

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
MAX_UINT = 2 ** 256 - 1


def test_withdraw_from_vault(accounts, vault, erc20):
    # NOTE: amount of shares = amount of tokens deposited
    shares = 123
    account = accounts[1]

    # mint ERC20 to account, approve vault to spend
    erc20.mint(account, shares)
    erc20.approve(vault, shares, {'from': account})

    vault.deposit(shares, {'from': account})

    def get_snapshot():
        snapshot = {
            "erc20": {
                "balanceOf": {}
            },
            "vault": {
                "balanceOf": {},
                "strategy": vault.strategy(),
                "totalSupply": vault.totalSupply(),
                "totalLockedValue": vault.totalLockedValue()
            }
        }

        snapshot["vault"]["balanceOf"][account] = vault.balanceOf(account)
        snapshot["erc20"]["balanceOf"][vault] = erc20.balanceOf(vault)
        snapshot["erc20"]["balanceOf"][account] = erc20.balanceOf(account)

        return snapshot

    # deposit
    before = get_snapshot()
    tx = vault.withdraw(shares, {'from': account})
    after = get_snapshot()

    # expected withdraw amount
    withdrawAmount = shares * \
        before["vault"]["totalLockedValue"] / before["vault"]["totalSupply"]

    assert after["vault"]["totalSupply"] == before["vault"]["totalSupply"] - shares
    assert after["vault"]["balanceOf"][account] == before["vault"]["balanceOf"][account] - shares
    assert after["erc20"]["balanceOf"][vault] == before["erc20"]["balanceOf"][vault] - withdrawAmount
    assert after["erc20"]["balanceOf"][account] == before["erc20"]["balanceOf"][account] + withdrawAmount


@pytest.mark.skip
def test_withdraw_from_strategy(accounts, vault, erc20, mockStrategy):
    # NOTE: cannot test without calling invest() and transferring tokens to strategy
    pass


def test_withdraw_zero_total_supply(accounts, vault):
    with brownie.reverts("dev: total supply = 0"):
        vault.withdraw(123, {'from': accounts[1]})


def test_withdraw_zero_shares(accounts, vault, erc20):
    amount = 123
    sender = accounts[1]

    # mint ERC20 to sender, approve vault to spend
    erc20.mint(sender, amount)
    erc20.approve(vault, amount, {'from': sender})

    vault.deposit(amount, {'from': sender})

    with brownie.reverts("dev: shares = 0"):
        vault.withdraw(0, {'from': sender})
