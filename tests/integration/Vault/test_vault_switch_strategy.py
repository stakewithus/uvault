import brownie
import pytest
import time

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
MAX_UINT = 2 ** 256 - 1


# fixtures
@pytest.fixture(scope="function")
def admin(accounts):
    return accounts[0]


MIN_WAIT_TIME = 1


@pytest.fixture(scope="function")
def vault(Vault, admin, erc20):
    yield Vault.deploy(erc20, "vault", "vault", MIN_WAIT_TIME, {'from': admin})


@pytest.fixture(scope="function")
def strategy(mockStrategy):
    # rename mockStrategy to strategy
    return mockStrategy


@pytest.fixture(scope="function", autouse=True)
def setup(admin, vault, strategy):
    strategy._setVault_(vault)
    strategy._setUnderlyingToken_(vault.token())

    vault.setNextStrategy(strategy, {'from': admin})

    assert vault.strategy() == ZERO_ADDRESS
    assert vault.nextStrategy() == strategy
    assert vault.timeLock() == 0
    assert vault.minWaitTime() == MIN_WAIT_TIME

# test


def test_set_new_strategy(admin, vault, erc20, strategy):
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


def test_switch_strategy(accounts, admin, vault, erc20, strategy, MockStrategy):
    controller = accounts[1]  # mock controller address

    # setup
    vault.switchStrategy({'from': admin})
    oldStrategy = strategy

    newStrategy = MockStrategy.deploy(
        controller, vault, vault.token(), {'from': admin}
    )

    vault.setNextStrategy(newStrategy, {'from': admin})
    # wait for time lock to pass
    time.sleep(MIN_WAIT_TIME)

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


def test_next_strategy_zero_address(Vault, erc20, admin):
    vault = Vault.deploy(
        erc20, "vault", "vault", MIN_WAIT_TIME, {'from': admin}
    )

    with brownie.reverts("dev: next strategy = zero address"):
        vault.switchStrategy({'from': admin})


def test_same_strategy(vault, admin):
    vault.switchStrategy({'from': admin})

    with brownie.reverts("dev: next strategy = current strategy"):
        vault.switchStrategy({'from': admin})


def test_time_lock(accounts, vault, admin, erc20, strategy, MockStrategy):
    controller = accounts[1]  # mock controller address

    # setup
    vault.switchStrategy({'from': admin})
    newStrategy = MockStrategy.deploy(
        controller, vault, vault.token(), {'from': admin}
    )

    tx = vault.setNextStrategy(newStrategy, {'from': admin})

    assert vault.timeLock() >= tx.timestamp + MIN_WAIT_TIME

    with brownie.reverts("dev: timestamp < time lock"):
        vault.switchStrategy({'from': admin})
