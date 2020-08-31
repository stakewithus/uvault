#!/usr/bin/python3

import pytest
from eth_account import Account
from eth_account.messages import encode_defunct


class VaultHelper:
    @staticmethod
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

    @staticmethod
    def withdraw(vault, params):
        signer = params["signer"]
        tokenHolder = params["to"]
        shares = params["shares"]
        minOut = params["minOut"]
        nonce = params["nonce"]

        # signer sign message
        txHash = vault.getTxHash(
            vault, signer.address, shares, minOut, nonce
        )
        sig = Account.from_key(signer.private_key).sign_message(
            encode_defunct(hexstr=str(txHash))
        )

        # withdraw
        tx = vault.withdraw(
            tokenHolder, shares, minOut, nonce,
            sig.v, sig.r, sig.s
        )

        return {
            "tx": tx,
            "sig": sig,
            "txHash": txHash
        }


@pytest.fixture
def vault_helper():
    return VaultHelper


@pytest.fixture(scope="function", autouse=True)
def isolate(fn_isolation):
    # perform a chain rewind after completing each test, to ensure proper isolation
    # https://eth-brownie.readthedocs.io/en/v1.10.3/tests-pytest-intro.html#isolation-fixtures
    pass


@pytest.fixture(scope="session")
def signers(accounts):
    # create accounts to get access to private key
    accounts.add()
    accounts.add()
    accounts.add()

    return [accounts[-3], accounts[-2], accounts[-1]]


@pytest.fixture(scope="function")
def erc20(MockERC20, accounts):
    yield MockERC20.deploy(
        "erc20",
        "erc20",
        18,
        10000,
        {'from': accounts[0]}
    )


# core
@pytest.fixture(scope="function")
def mockController(MockController, accounts):
    yield MockController.deploy(accounts[0], {'from': accounts[0]})


@pytest.fixture(scope="function")
def mockStrategy(MockStrategy, accounts, mockERC20):
    yield MockStrategy.deploy(mockERC20, {'from': accounts[0]})


@pytest.fixture(scope="function")
def controller(Controller, accounts):
    treasury = accounts[1]
    yield Controller.deploy(treasury, {'from': accounts[0]})


@pytest.fixture(scope="function")
def vault(Vault, accounts, erc20, mockController):
    yield Vault.deploy(
        erc20, mockController,
        "uERC20", "uERC20", 18,
        {'from': accounts[0]}
    )


# strategy
@pytest.fixture(scope="function")
def mockYCRV(MockERC20, accounts):
    yield MockERC20.deploy(
        "Curve.fi yDAI/yUSDC/yUSDT/yTUSD",
        "yDAI+yUSDC+yUSDT+yTUSD",
        18,
        10000,
        {'from': accounts[0]}
    )


@pytest.fixture(scope="function")
def mockYVault(MockYVault, accounts, mockYCRV):
    yield MockYVault.deploy(mockYCRV, {'from': accounts[0]})


@pytest.fixture(scope="function")
def strategyYVault(
    StrategyYVault, accounts, mockController, mockYCRV, mockYVault
):
    yield StrategyYVault.deploy(
        mockController, mockYCRV, mockYVault,
        {'from': accounts[0]}
    )
