import brownie
import pytest
import time

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_current_strategy_is_set(accounts, controller, Vault, erc20, mockStrategy, MockStrategy):
    admin = accounts[0]
    strategy = mockStrategy
    minWaitTime = 1

    vault = Vault.deploy(
        erc20, "vault", "vault", minWaitTime, {'from': accounts[0]}
    )

    # check vault state
    assert vault.timeLock() == 0
    assert vault.minWaitTime() == minWaitTime
    assert vault.strategy() == ZERO_ADDRESS

    # setup
    strategy._setVault_(vault)
    strategy._setUnderlyingToken_(vault.token())

    # set strategy
    vault.setNextStrategy(strategy, {'from': admin})
    time.sleep(minWaitTime)
    vault.switchStrategy({'from': admin})

    assert vault.strategy() == strategy

    nextStrategy = MockStrategy.deploy(
        controller, vault, vault.token(), {'from': admin}
    )

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

    assert after["vault"]["nextStrategy"] == nextStrategy
    assert after["vault"]["timeLock"] == tx.timestamp + minWaitTime
