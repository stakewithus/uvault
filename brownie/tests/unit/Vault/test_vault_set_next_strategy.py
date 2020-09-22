import brownie
import pytest

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_current_strategy_is_not_set(accounts, Vault, erc20, mockStrategy):
    admin = accounts[0]
    minWaitTime = 100

    vault = Vault.deploy(
        erc20, "vault", "vault", minWaitTime, {'from': accounts[0]}
    )

    mockStrategy._setVault_(vault)
    mockStrategy._setUnderlyingToken_(vault.token())
    nextStrategy = mockStrategy

    def get_snapshot():
        return {
            "vault": {
                "strategy": vault.strategy(),
                "nextStrategy": vault.nextStrategy(),
                "timeLock": vault.timeLock(),
            }
        }

    before = get_snapshot()
    tx = vault.setNextStrategy(nextStrategy, {'from': admin})
    after = get_snapshot()

    assert tx.events["SetNextStrategy"].values() == [nextStrategy]
    assert before["vault"]["strategy"] == ZERO_ADDRESS
    assert after["vault"]["nextStrategy"] == nextStrategy
    assert after["vault"]["timeLock"] == 0


@pytest.mark.skip
def test_current_strategy_is_set(accounts, Vault, erc20, mockStrategy):
    # Cannot test without having a strategy set first.
    # test for integration
    pass


def test_not_admin(accounts, vault, erc20):
    strategy = accounts[1]  # mock strategy address

    with brownie.reverts("dev: !admin"):
        vault.setNextStrategy(strategy, {'from': accounts[1]})


def test_strategy_zero_address(accounts, vault, erc20):
    admin = accounts[0]
    strategy = ZERO_ADDRESS

    with brownie.reverts("dev: strategy = zero address"):
        vault.setNextStrategy(strategy, {'from': admin})


def test_strategy_underlying_token(accounts, vault, mockStrategy):
    admin = accounts[0]
    strategy = mockStrategy
    # use non zero address to mock underlying token address
    strategy._setUnderlyingToken_(accounts[0])

    with brownie.reverts("dev: strategy.token != vault.token"):
        vault.setNextStrategy(strategy, {'from': admin})


def test_strategy_vault(accounts, vault, mockStrategy):
    admin = accounts[0]
    strategy = mockStrategy
    # use non zero address to mock vault address
    strategy._setVault_(accounts[0])

    with brownie.reverts("dev: strategy.vault != vault"):
        vault.setNextStrategy(strategy, {'from': admin})


def test_same_next_strategy(accounts, vault, mockStrategy):
    admin = accounts[0]
    strategy = mockStrategy
    # use non zero address to mock vault address
    strategy._setVault_(vault)
    strategy._setUnderlyingToken_(vault.token())

    vault.setNextStrategy(strategy, {'from': admin})

    with brownie.reverts("dev: same next strategy"):
        vault.setNextStrategy(strategy, {'from': admin})
