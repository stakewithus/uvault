import brownie
from brownie.test import given, strategy

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_earn_zero_balance(accounts, vault, erc20):
    before = {
        "erc20": {
            "balances": {
                "vault": erc20.balanceOf(vault)
            }
        },
    }

    # deposit
    tx = vault.earn()

    after = {
        "erc20": {
            "balances": {
                "vault": erc20.balanceOf(vault)
            }
        },
    }

    # check ERC20 balances
    assert after["erc20"]["balances"]["vault"] == before["erc20"]["balances"]["vault"]
    assert after["erc20"]["balances"]["vault"] == 0


@given(amount=strategy("uint256"))
def test_earn(accounts, vault, erc20, mockController, amount):
    erc20.mint(vault, amount)

    vault.earn()

    # NOTE: cannot check ERC20 balances since controller calls transferFrom
    assert mockController.depositAmount() == amount
