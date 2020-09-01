import brownie
from brownie.test import given, strategy

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


@given(
    sender=strategy('address'),
    amount=strategy('uint256')
)
def test_deposit(accounts, vault, erc20, sender, amount):
    # mint ERC20 to sender, approve vault to spend
    erc20.mint(sender, amount)
    erc20.approve(vault, amount, {'from': sender})

    before = {
        "erc20": {
            "balances": {
                "sender": erc20.balanceOf(sender),
                "vault": erc20.balanceOf(vault)
            }
        },
        "vault": {
            "balances": {
                "sender": vault.balanceOf(sender)
            },
            "totalSupply": vault.totalSupply()
        }
    }

    # deposit
    tx = vault.deposit(sender, amount)

    after = {
        "erc20": {
            "balances": {
                "sender": erc20.balanceOf(sender),
                "vault": erc20.balanceOf(vault)
            }
        },
        "vault": {
            "balances": {
                "sender": vault.balanceOf(sender)
            },
            "totalSupply": vault.totalSupply()
        }
    }

    # check ERC20 balances
    assert after["erc20"]["balances"]["sender"] == before["erc20"]["balances"]["sender"] - amount
    assert after["erc20"]["balances"]["vault"] == before["erc20"]["balances"]["vault"] + amount

    # check vault shares
    assert after["vault"]["balances"]["sender"] == before["vault"]["balances"]["sender"] + amount
    assert after["vault"]["totalSupply"] == before["vault"]["totalSupply"] + amount
