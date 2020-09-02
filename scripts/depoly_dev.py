from brownie import (
    accounts, GasRelayer, ChiToken,
    Controller, Vault,
    StrategyTest, ERC20
)

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def main():
    admin = accounts[0]
    treasury = accounts[1]
    pool = accounts[2]  # pool used by strategy

    print("Admin:", admin.address)
    print("ETH:", admin.balance())

    # deploy ERC20 representing a valuable token such as DAI, USDC, etc...
    erc20 = ERC20.deploy("DAI", "DAI", 18, 0, {'from': admin})
    # mint to accounts
    for account in accounts:
        erc20.mint(account, 1000 * 10 ** 18, {'from': admin})

    # Deploy gas token
    chiToken = ChiToken.deploy({'from': admin})
    # mint gas tokens
    chiToken.mint(100, {'from': admin, })

    # deploy gas relayer
    gasRelayer = GasRelayer.deploy(chiToken, {'from': admin})

    # deploy controller
    controller = Controller.deploy(treasury, {'from': admin})

    # deploy vault
    vault = Vault.deploy(
        erc20, controller, gasRelayer, "vault", "vault", 18, {"from": admin}
    )
    # deploy strategy (does not matter which one, here we deploy StrategyYVault)
    strategy = StrategyTest.deploy(controller, erc20, pool, {'from': admin})

    # set strategy
    controller.setStrategy(vault, strategy, {'from': admin})
