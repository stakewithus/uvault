import brownie
import pytest

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
MAX_UINT = 2 ** 256 - 1


def test_switch_strategy_new(accounts, vault, erc20, mockStrategy):
    admin = accounts[0]

    strategy = mockStrategy
    strategy._setVault_(vault)
    strategy._setUnderlyingToken_(vault.token())

    assert vault.strategy() == ZERO_ADDRESS
    assert vault.nextStrategy() == ZERO_ADDRESS
    assert vault.timeLock() == 0

    vault.setNextStrategy(strategy, {'from': admin})

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

    before = get_snapshot()
    tx = vault.switchStrategy({'from': admin})
    after = get_snapshot()

    assert tx.events["SwitchStrategy"].values() == [strategy]
    assert after["vault"]["strategy"] == strategy
    assert after["erc20"]["allowance"][strategy] == MAX_UINT
    # check exit was not called
    assert not strategy._wasExitCalled_()


def test_switch_strategy_update(accounts, vault, erc20, MockStrategy):
    admin = accounts[0]
    controller = accounts[1]  # mock controller address

    # check time lock is zero so that we can switch strategy without waiting
    assert vault.timeLock() == 0

    # setup
    oldStrategy = MockStrategy.deploy(
        controller, vault, erc20, {'from': admin}
    )
    newStrategy = MockStrategy.deploy(
        controller, vault, erc20, {'from': admin}
    )

    vault.setNextStrategy(oldStrategy, {'from': admin})
    vault.switchStrategy({'from': admin})
    vault.setNextStrategy(newStrategy, {'from': admin})

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

    before = get_snapshot()
    tx = vault.switchStrategy({'from': admin})
    after = get_snapshot()

    assert before["vault"]["strategy"] == oldStrategy
    assert after["vault"]["strategy"] == newStrategy
    assert after["erc20"]["allowance"][newStrategy] == MAX_UINT
    assert after["erc20"]["allowance"][oldStrategy] == 0
    # check exit was called
    assert oldStrategy._wasExitCalled_()


def test_not_admin(accounts, vault):
    with brownie.reverts("dev: !admin"):
        vault.switchStrategy({'from': accounts[1]})


def test_next_strategy_zero_address(accounts, vault):
    admin = accounts[0]

    with brownie.reverts("dev: next strategy = zero address"):
        vault.switchStrategy({'from': admin})


def test_same_strategy(accounts, vault, mockStrategy):
    admin = accounts[0]

    strategy = mockStrategy
    strategy._setVault_(vault)
    strategy._setUnderlyingToken_(vault.token())

    vault.setNextStrategy(strategy, {'from': admin})
    vault.switchStrategy({'from': admin})

    with brownie.reverts("dev: next strategy = current strategy"):
        vault.switchStrategy({'from': admin})


def test_time_lock(accounts, Vault, erc20, mockStrategy):
    admin = accounts[0]
    minWaitTime = 100

    vault = Vault.deploy(
        erc20, "vault", "vault", minWaitTime, {'from': accounts[0]}
    )

    strategy = mockStrategy
    strategy._setVault_(vault)
    strategy._setUnderlyingToken_(vault.token())

    vault.setNextStrategy(strategy, {'from': admin})

    with brownie.reverts("dev: timestamp < time lock"):
        vault.switchStrategy({'from': admin})
