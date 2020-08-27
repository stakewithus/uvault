#!/usr/bin/python3

import pytest


@pytest.fixture(scope="function", autouse=True)
def isolate(fn_isolation):
    # perform a chain rewind after completing each test, to ensure proper isolation
    # https://eth-brownie.readthedocs.io/en/v1.10.3/tests-pytest-intro.html#isolation-fixtures
    pass


@pytest.fixture(scope="module")
def token(Token, accounts):
    return Token.deploy("Test Token", "TST", 18, 1e21, {'from': accounts[0]})

# core

@pytest.fixture(scope="module")
def mockController(MockController, accounts):
    yield MockController.deploy(accounts[0], {'from': accounts[0]})


# strategy

@pytest.fixture(scope="module")
def mockYCRV(MockERC20, accounts):
    yield MockERC20.deploy(
        "Curve.fi yDAI/yUSDC/yUSDT/yTUSD",
        "yDAI+yUSDC+yUSDT+yTUSD",
        18,
        10000,
        {'from': accounts[0]}
    )


@pytest.fixture(scope="module")
def mockYVault(MockYVault, accounts, mockYCRV):
    yield MockYVault.deploy(mockYCRV, {'from': accounts[0]})


@pytest.fixture(scope="module")
def strategyYVault(
    StrategyYVault, accounts, mockController, mockYCRV, mockYVault
):
    yield StrategyYVault.deploy(
        mockController, mockYCRV, mockYVault,
        {'from': accounts[0]}
    )