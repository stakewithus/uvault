import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
# mock addresses
STRATEGY = "0x0000000000000000000000000000000000000001"
VAULT = "0x0000000000000000000000000000000000000002"


def test_set_strategy(accounts, controller):
    controller.setStrategy(VAULT, STRATEGY, {'from': accounts[0]})

    assert controller.strategies(VAULT) == STRATEGY
    assert controller.vaults(STRATEGY) == VAULT
    assert controller.isVault(VAULT)


def test_set_strategy_not_admin(accounts, controller):
    with brownie.reverts("dev: !admin"):
        controller.setStrategy(VAULT, STRATEGY, {'from': accounts[1]})


def test_set_strategy_vault_zero_address(accounts, controller):
    with brownie.reverts("dev: vault == zero address"):
        controller.setStrategy(ZERO_ADDRESS, STRATEGY, {'from': accounts[0]})


def test_set_strategy_strategy_zero_address(accounts, controller):
    with brownie.reverts("dev: strategy == zero address"):
        controller.setStrategy(VAULT, ZERO_ADDRESS, {'from': accounts[0]})


def test_set_strategy_withdraw_from_strategy(accounts, controller, mockStrategy):
    # mock balance of strategy
    balance = 1000
    mockStrategy.__setBalance(balance)

    controller.setStrategy(VAULT, mockStrategy, {'from': accounts[0]})

    # mock new strategy
    newStrategy = accounts[1]
    controller.setStrategy(VAULT, newStrategy, {'from': accounts[0]})

    # check Strategy.withdraw was called
    assert mockStrategy.__withdrawAmount() == balance
    assert controller.strategies(VAULT) == newStrategy
    assert controller.vaults(newStrategy) == VAULT
    assert controller.isVault(VAULT)
