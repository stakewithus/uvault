import pytest
import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_withdraw(
    accounts, vault, erc20, signers, vault_helper
):
    withdraw = vault_helper.withdraw

    signer = signers[0]
    amount = 1000

    # mint ERC20 to signer, approve vault to spend
    erc20.mint(signer, amount)
    erc20.approve(vault, amount, {'from': signer})

    # deposit
    vault.deposit(signer, amount)

    # snapshot before tx
    before = {
        "erc20": {
            "balances": {
                "signer": erc20.balanceOf(signer),
                "vault": erc20.balanceOf(vault)
            }
        },
        "vault": {
            "balances": {
                "signer": vault.balanceOf(signer),
            },
            "totalSupply": vault.totalSupply()
        },
    }

    # withdraw
    shares = vault.balanceOf(signer)
    res = withdraw(vault, {
        "signer": signer,
        "to": signer,
        "shares": shares,
        "minOut": 1000,
        "nonce": 456
    })
    tx = res["tx"]
    txHash = res["txHash"]

    # snapshot after tx
    after = {
        "erc20": {
            "balances": {
                "signer": erc20.balanceOf(signer),
                "vault": erc20.balanceOf(vault)
            }
        },
        "vault": {
            "balances": {
                "signer": vault.balanceOf(signer),
            },
            "totalSupply": vault.totalSupply()
        },
    }

    assert tx.events["TxNonce"].values() == [signer.address, 456]

    # check ERC20 balances
    assert after["erc20"]["balances"]["signer"] == before["erc20"]["balances"]["signer"] + amount
    assert after["erc20"]["balances"]["vault"] == before["erc20"]["balances"]["vault"] - amount

    # check vault shares
    assert after["vault"]["balances"]["signer"] == 0
    assert after["vault"]["totalSupply"] == before["vault"]["totalSupply"] - shares

    # check txHash is set as executed
    assert vault.executed(txHash)


@pytest.mark.skip
def test_withdraw_from_controller(
    accounts, vault, erc20, signers, vault_helper
):
    # cannot test this without calling Vault.earn() and transfer tokens into Controller
    pass


def test_withdraw_tx_executed(
    accounts, vault, erc20, signers, vault_helper
):
    withdraw = vault_helper.withdraw

    signer = signers[0]
    amount = 1000

    # mint ERC20 to signer, approve vault to spend
    erc20.mint(signer, amount)
    erc20.approve(vault, amount, {'from': signer})

    # deposit
    vault.deposit(signer, amount)

    shares = vault.balanceOf(signer)

    withdraw(vault, {
        "signer": signer,
        "to": signer,
        "shares": shares,
        "minOut": shares,
        "nonce": 456
    })

    # withdraw again with same signature
    with brownie.reverts("dev: tx executed"):
        withdraw(vault, {
            "signer": signer,
            "to": signer,
            "shares": shares,
            "minOut": shares,
            "nonce": 456
        })


def test_deposit_invalid_sig(
    accounts, vault, erc20, signers, vault_helper
):
    withdraw = vault_helper.withdraw

    not_signer = signers[1]
    signer = signers[0]

    # deposit again with same signature
    with brownie.reverts("dev: invalid sig"):
        withdraw(vault, {
            "signer": signer,
            "to": not_signer,
            "shares": 1000,
            "minOut": 1000,
            "nonce": 123,
        })


def test_withdraw_slippage(
    accounts, vault, erc20, signers, vault_helper
):
    withdraw = vault_helper.withdraw

    signer = signers[0]
    amount = 1000

    # mint ERC20 to signer, approve vault to spend
    erc20.mint(signer, amount)
    erc20.approve(vault, amount, {'from': signer})

    # deposit
    vault.deposit(signer, amount)

    shares = vault.balanceOf(signer)

    # withdraw
    with brownie.reverts("dev: amount < min tokens to return"):
        withdraw(vault, {
            "signer": signer,
            "to": signer,
            "shares": shares,
            "minOut": shares + 1,
            "nonce": 456
        })
