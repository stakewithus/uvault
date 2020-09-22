import brownie
from brownie.test import given, strategy

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


@given(
    sender=strategy('address'),
    amount=strategy('uint256', exclude=0)
)
def test_deposit(accounts, vault, erc20, sender, amount):
    # mint ERC20 to sender, approve vault to spend
    erc20.mint(sender, amount)
    erc20.approve(vault, amount, {'from': sender})

    def get_snapshot():
        return {
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
    before = get_snapshot()
    tx = vault.deposit(amount, {'from': sender})
    after = get_snapshot()

    # check ERC20 balances
    assert after["erc20"]["balances"]["sender"] == before["erc20"]["balances"]["sender"] - amount
    assert after["erc20"]["balances"]["vault"] == before["erc20"]["balances"]["vault"] + amount

    # check vault shares
    assert after["vault"]["balances"]["sender"] == before["vault"]["balances"]["sender"] + amount
    assert after["vault"]["totalSupply"] == before["vault"]["totalSupply"] + amount


def test_deposit(accounts, vault, erc20):
    with brownie.reverts("dev: amount = 0"):
        vault.deposit(0)
