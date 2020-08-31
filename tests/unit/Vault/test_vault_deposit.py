import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_deposit_total_supply_is_zero(accounts, vault, erc20):
    sender = accounts[0]
    amount = 1000

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
