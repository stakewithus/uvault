import brownie
from eth_account import Account
from eth_account.messages import encode_defunct

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def deposit(vault, params):
    signer = params["signer"]
    tokenHolder = params["from"]
    amount = params["amount"]
    minOut = params["minOut"]
    nonce = params["nonce"]

    # signer sign message
    txHash = vault.getTxHash(
        signer.address, vault, amount, minOut, nonce
    )
    sig = Account.from_key(signer.private_key).sign_message(
        encode_defunct(hexstr=str(txHash))
    )

    # deposit
    tx = vault.deposit(
        tokenHolder, amount, minOut, nonce,
        sig.v, sig.r, sig.s
    )

    return {
        "tx": tx,
        "sig": sig,
        "txHash": txHash
    }


def test_deposit_total_supply_is_zero(
    accounts, vault, erc20, signers
):
    signer = signers[0]
    amount = 1000
    minOut = 1000
    nonce = 123

    # mint ERC20 to signer, approve vault to spend
    erc20.mint(signer, amount)
    erc20.approve(vault, amount, {'from': signer})

    balancesBefore = {
        "signer": erc20.balanceOf(signer),
        "vault": erc20.balanceOf(vault)
    }

    # deposit
    res = deposit(vault, {
        "signer": signer,
        "from": signer,
        "amount": amount,
        "minOut": minOut,
        "nonce": nonce
    })
    tx = res["tx"]
    txHash = res["txHash"]

    balancesAfter = {
        "signer": erc20.balanceOf(signer),
        "vault": erc20.balanceOf(vault)
    }

    assert tx.events["TxNonce"].values() == [signer.address, nonce]

    # check ERC20 balances
    assert balancesAfter["signer"] == balancesBefore["signer"] - amount
    assert balancesAfter["vault"] == balancesBefore["vault"] + amount

    # check vault shares
    expectedShares = balancesAfter["vault"] - balancesBefore["vault"]
    assert vault.balanceOf(signer) == expectedShares
    assert vault.totalSupply() == expectedShares

    # check txHash is set as executed
    assert vault.executed(txHash)


def test_deposit_total_supply_is_not_zero(accounts, vault, erc20, signers):
    amounts = [1000, 2000]
    minOuts = [1000, 2000]
    nonces = [123, 456]

    # signers[0] deposits, total suppyl > 0
    erc20.mint(signers[0], amounts[0])
    erc20.approve(vault, amounts[0], {'from': signers[0]})
    deposit(vault, {
        "signer": signers[0],
        "from": signers[0],
        "amount": amounts[0],
        "minOut": minOuts[0],
        "nonce": nonces[0]
    })

    # mint ERC20 to signers[1]
    erc20.mint(signers[1], amounts[1])
    erc20.approve(vault, amounts[1], {'from': signers[1]})

    balancesBefore = {
        "signer0": erc20.balanceOf(signers[0]),
        "signer1": erc20.balanceOf(signers[1]),
        "vault": erc20.balanceOf(vault)
    }

    # signer[1] deposits
    res = deposit(vault, {
        "signer": signers[1],
        "from": signers[1],
        "amount": amounts[1],
        "minOut": minOuts[1],
        "nonce": nonces[1]
    })
    tx = res["tx"]
    txHash = res["txHash"]

    vaultBalanceBefore = vault.getBalance()
    totalSupplyBefore = vault.totalSupply()
    balancesAfter = {
        "signer0": erc20.balanceOf(signers[0]),
        "signer1": erc20.balanceOf(signers[1]),
        "vault": erc20.balanceOf(vault)
    }

    assert tx.events["TxNonce"].values() == [signers[1].address, nonces[1]]

    # check ERC20 balances
    assert balancesAfter["signer1"] == balancesBefore["signer1"] - amounts[1]
    assert balancesAfter["vault"] == balancesBefore["vault"] + amounts[1]

    # check vault shares
    expectedShares = amounts[1] * totalSupplyBefore / vaultBalanceBefore
    assert vault.balanceOf(signers[1]) == expectedShares

    expectedTotalSupply = vault.balanceOf(
        signers[0]) + vault.balanceOf(signers[1])

    assert vault.totalSupply() == expectedTotalSupply

    # check txHash is set as executed
    assert vault.executed(txHash)


def test_deposit_tx_executed(
    accounts, vault, erc20, signers
):
    signer = signers[0]
    amount = 1000
    minOut = 1000
    nonce = 123

    # mint ERC20 to signer, approve vault to spend
    erc20.mint(signer, amount)
    erc20.approve(vault, amount, {'from': signer})

    # deposit
    deposit(vault, {
        "signer": signer,
        "from": signer,
        "amount": amount,
        "minOut": minOut,
        "nonce": nonce,
    })

    # mint and approve again
    erc20.mint(signer, amount)
    erc20.approve(vault, amount, {'from': signer})

    # deposit again with same signature
    with brownie.reverts("dev: tx executed"):
        deposit(vault, {
            "signer": signer,
            "from": signer,
            "amount": amount,
            "minOut": minOut,
            "nonce": nonce,
        })


def test_deposit_invalid_sig(
    accounts, vault, erc20, signers
):
    not_signer = signers[1]
    signer = signers[0]
    amount = 1000
    minOut = 1000
    nonce = 123

    # deposit again with same signature
    with brownie.reverts("dev: invalid sig"):
        deposit(vault, {
            "signer": signer,
            "from": not_signer,
            "amount": amount,
            "minOut": minOut,
            "nonce": nonce,
        })
