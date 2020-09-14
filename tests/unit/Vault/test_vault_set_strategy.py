import brownie
from brownie.test import given, strategy

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
MAX_UINT = 2 ** 256 - 1


def test_set_strategy(accounts, vault, erc20, mockStrategy):
    admin = accounts[0]
    # rename
    strategy = mockStrategy

    # setup
    strategy._setVault_(vault)
    strategy._setUnderlyingToken_(erc20)

    def get_snapshot():
        snapshot = {
            "erc20": {
                "allowance": {}
            },
            "vault": {
                "strategy": vault.strategy()
            }
        }

        snapshot["erc20"]["allowance"][strategy] = erc20.allowance(
            vault, strategy
        )

        return snapshot

    # deposit
    before = get_snapshot()
    tx = vault.setStrategy(strategy, {'from': admin})
    after = get_snapshot()

    assert after["vault"]["strategy"] == strategy
    assert after["erc20"]["allowance"][strategy] == MAX_UINT


def test_set_strategy_update(accounts, vault, erc20, MockStrategy):
    admin = accounts[0]
    # setup
    oldStrategy = MockStrategy.deploy(vault, erc20, {'from': admin})
    newStrategy = MockStrategy.deploy(vault, erc20, {'from': admin})

    vault.setStrategy(oldStrategy, {'from': admin})

    def get_snapshot():
        snapshot = {
            "erc20": {
                "allowance": {}
            },
            "vault": {
                "strategy": vault.strategy()
            }
        }

        snapshot["erc20"]["allowance"][oldStrategy] = erc20.allowance(
            vault, oldStrategy
        )
        snapshot["erc20"]["allowance"][newStrategy] = erc20.allowance(
            vault, newStrategy
        )

        return snapshot

    # deposit
    before = get_snapshot()
    tx = vault.setStrategy(newStrategy, {'from': admin})
    after = get_snapshot()

    assert after["vault"]["strategy"] == newStrategy
    assert after["erc20"]["allowance"][newStrategy] == MAX_UINT
    assert after["erc20"]["allowance"][oldStrategy] == 0
    # check withdrawAll was called
    assert oldStrategy._getWithdrawAmount_() == MAX_UINT


def test_set_strategy_not_admin(accounts, vault):
    with brownie.reverts("dev: !admin"):
        # use non zero address to mock strategy address
        vault.setStrategy(accounts[0], {'from': accounts[1]})


def test_set_strategy_strategy_zero_address(accounts, vault):
    with brownie.reverts("dev: strategy == zero address"):
        vault.setStrategy(ZERO_ADDRESS, {'from': accounts[0]})


def test_set_strategy_underlying_token(accounts, vault, mockStrategy):
    # use non zero address to mock underlying token address
    mockStrategy._setUnderlyingToken_(accounts[0])

    with brownie.reverts("dev: strategy.token != vault.token"):
        vault.setStrategy(mockStrategy, {'from': accounts[0]})


def test_set_strategy_vault(accounts, vault, mockStrategy):
    # use non zero address to mock vault address
    mockStrategy._setVault_(accounts[0])

    with brownie.reverts("dev: strategy.vault != vault"):
        vault.setStrategy(mockStrategy, {'from': accounts[0]})
