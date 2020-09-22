#!/usr/bin/python3
import os
from pathlib import Path
from dotenv import load_dotenv
import pytest
import brownie
from brownie import Contract
from eth_account import Account
from eth_account.messages import encode_defunct

env_path = Path('.') / '.env.test'
load_dotenv(dotenv_path=env_path)

STABLE_COIN_HOLDER = os.getenv("STABLE_COIN_HOLDER")


class AccountHelper:
    @staticmethod
    def sign(account, txHash):
        # account must be account created by accounts.add()
        return Account.from_key(account.private_key).sign_message(
            encode_defunct(hexstr=str(txHash))
        )


@pytest.fixture
def account_helper():
    return AccountHelper


class VaultHelper:
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
    # number of accounts to create
    n = 10

    for i in range(n):
        accounts.add()

    return accounts[-n:]

# test / mock


@pytest.fixture(scope="function")
def erc20(ERC20, accounts):
    yield ERC20.deploy(
        "erc20",
        "erc20",
        18,
        10000,
        {'from': accounts[0]}
    )


@pytest.fixture(scope="function")
def chiToken(ChiToken, accounts):
    yield ChiToken.deploy({'from': accounts[0]})


@pytest.fixture(scope="function")
def txReceiver(TxReceiver, accounts):
    yield TxReceiver.deploy({'from': accounts[0]})


@pytest.fixture(scope="function")
def mockController(MockController, accounts):
    yield MockController.deploy(accounts[0], {'from': accounts[0]})


@pytest.fixture(scope="function")
def mockStrategy(MockStrategy, accounts, erc20):
    # mock controller address
    controller = accounts[1]
    # mock vault address
    vault = accounts[2]
    yield MockStrategy.deploy(controller, vault, erc20, {'from': accounts[0]})

# core


@pytest.fixture(scope="function")
def gasRelayer(GasRelayer, accounts, chiToken):
    yield GasRelayer.deploy(chiToken, {'from': accounts[0]})


@pytest.fixture(scope="function")
def controller(Controller, accounts):
    treasury = accounts[1]
    yield Controller.deploy(treasury, {'from': accounts[0]})


@pytest.fixture(scope="function")
def vault(Vault, accounts, erc20):
    yield Vault.deploy(erc20, "vault", "vault", 0, {'from': accounts[0]})


# strategy


@pytest.fixture(scope="function")
def mockYCRV(ERC20, accounts):
    yield ERC20.deploy(
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


@pytest.fixture(scope="function")
def strategyDaiToYcrv(StrategyDaiToYcrv, accounts, controller):
    admin = accounts[0]
    vault = accounts[2]

    yield StrategyDaiToYcrv.deploy(controller, vault, {'from': admin})


@pytest.fixture(scope="function")
def strategyUsdcToCcrv(StrategyUsdcToCcrv, accounts, controller):
    admin = accounts[0]
    vault = accounts[2]

    yield StrategyUsdcToCcrv.deploy(controller, vault, {'from': admin})

# Mainnet


@pytest.fixture
def stable_coin_holder(accounts):
    yield accounts.at(STABLE_COIN_HOLDER, force=True)


@pytest.fixture
def dai():
    yield Contract.from_explorer("0x6B175474E89094C44Da98b954EedeAC495271d0F")


@pytest.fixture
def usdc():
    yield Contract.from_explorer("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")


@pytest.fixture
def yGauge():
    yield Contract.from_explorer("0xFA712EE4788C042e2B7BB55E6cb8ec569C4530c1")


@pytest.fixture
def cGauge():
    yield Contract.from_explorer("0x7ca5b0a2910B33e9759DC7dDB0413949071D7575")


@pytest.fixture
def yCrv():
    # yDAIyUSDCyUSDTyTUSD
    yield Contract.from_explorer("0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8")


@pytest.fixture
def cUsd():
    # cDAIcUSDC
    yield Contract.from_explorer("0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2")


@pytest.fixture
def crv():
    yield Contract.from_explorer("0xD533a949740bb3306d119CC777fa900bA034cd52")


@pytest.fixture
def minter():
    yield Contract.from_explorer("0xd061D61a4d941c39E5453435B6345Dc261C2fcE0")


@pytest.fixture
def yDai():
    yield Contract.from_explorer("0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01")
