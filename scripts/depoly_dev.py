from brownie import (
    accounts, GasRelayer, ChiToken,
    Controller, Vault,
    StrategyTest, ERC20
)

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

BATCH_SIZE = 1000
NUM_SIGNERS = 10


def batch_deposit(signers, vault, gasRelayer):
    amount = 10 * 10 ** 18

    _accounts = []
    amounts = []

    for i in range(BATCH_SIZE):
        if i < len(signers):
            _accounts.append(signers[i])
            amounts.append(amount)
        else:
            _accounts.append(ZERO_ADDRESS)
            amounts.append(0)

    # call batchDeposit through gas relayer
    call_data = vault.batchDeposit.encode_input(_accounts, amounts)

    gasRelayer.mintGasToken(100)
    gasRelayer.relayTx(100, vault, call_data)


def main():
    admin = accounts[0]
    treasury = accounts[1]
    pool = accounts[2]  # pool used by strategy
    # tx should be sent from gas relayer,
    # but use this address in case you want to quickly test
    relayer = accounts[3]

    print("Admin:", admin.address)
    print("ETH:", admin.balance())

    # deploy ERC20 representing a valuable token such as DAI, USDC, etc...
    erc20 = ERC20.deploy("DAI", "DAI", 18, 0, {'from': admin})

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

    # ----------------------------------------------------------------------
    # test gas costs

    # add signers
    signers = []
    for i in range(NUM_SIGNERS):
        accounts.add()
        signers.append(accounts[-1])

    # mint ERC20
    for signer in signers:
        erc20.mint(signer, 100 * 10 ** 18)

    amount = 10 * 10 ** 18

    # approve vault to deposit
    for signer in signers:
        erc20.approve(vault, amount, {'from': signer})

    # test batch deposit
    batch_deposit(signers, vault, gasRelayer)
