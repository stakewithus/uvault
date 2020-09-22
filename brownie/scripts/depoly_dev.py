from brownie import (
    accounts,
    GasRelayer, ChiToken, Controller, Vault,
    StrategyTest, ERC20
)
from eth_account import Account
from eth_account.messages import encode_defunct

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

BATCH_SIZE = 100
NUM_SIGNERS = 10


def sign(account, txHash):
    return Account.from_key(account.private_key).sign_message(
        encode_defunct(hexstr=str(txHash))
    )


def withdraw(signer, vault):
    txHash = vault.getTxHash(
        vault, signer, 1 * 10 ** 18, 1 * 10 ** 18, 123)
    sig = sign(signer, txHash)

    vault.withdraw(
        signer, 1 * 10 ** 18, 1 * 10 ** 18, 123,
        sig.v, sig.r, sig.s
    )


def depositWithGasRelayer(signer, vault, gasRelayer):
    gasRelayer.relayTx(
        1,
        vault,
        vault.deposit.encode_input(signer, 10 * 10 ** 18)
    )


def withdrawWithGasRelayer(signer, vault, gasRelayer):
    txHash = vault.getTxHash(
        vault, signer, 1 * 10 ** 18, 1 * 10 ** 18, 123)
    sig = sign(signer, txHash)

    callData = vault.withdraw.encode_input(
        signer, 1 * 10 ** 18, 1 * 10 ** 18, 123,
        sig.v, sig.r, sig.s
    )

    gasRelayer.relayTx(1, vault, callData)


def batchDeposit(signers, vault, gasRelayer):
    amount = 20 * 10 ** 18

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
    callData = vault.batchDeposit.encode_input(_accounts, amounts)

    gasRelayer.relayTx(100, vault, callData)


def batchWithdraw(signers, vault, gasRelayer):
    _signers = []
    amounts = []
    mins = []
    nonces = []
    vs = []
    rs = []
    ss = []
    total = 0

    for i in range(BATCH_SIZE):
        if i < len(signers):
            signer = signers[i]
            amount = 1 * 10 ** 18
            _min = 0
            nonce = 0

            txHash = vault.getTxHash(vault, signer, amount, _min, nonce)
            sig = sign(signer, txHash)

            total += amount
            _signers.append(signer)
            amounts.append(amount)
            mins.append(_min)
            nonces.append(nonce)
            vs.append(sig.v)
            rs.append(sig.r)
            ss.append(sig.s)
        else:
            _signers.append(ZERO_ADDRESS)
            amounts.append(0)
            mins.append(0)
            nonces.append(0)
            vs.append(0)
            rs.append(0)
            ss.append(0)

    # call batchWithdraw through gas relayer
    callData = vault.batchWithdraw.encode_input(
        _signers, amounts, mins, total, nonces,
        vs, rs, ss
    )

    gasRelayer.relayTx(100, vault, callData)


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
    gasRelayer.mintGasToken(100)
    gasRelayer.mintGasToken(100)
    gasRelayer.mintGasToken(100)
    gasRelayer.mintGasToken(100)

    # add signers
    signers = []
    for i in range(NUM_SIGNERS):
        accounts.add()
        signers.append(accounts[-1])

    # mint ERC20
    for signer in signers:
        erc20.mint(signer, 100 * 10 ** 18)

    amount = 100 * 10 ** 18

    # approve vault to deposit
    for signer in signers:
        erc20.approve(vault, amount, {'from': signer})

    # uncomment to test gas cost

    # test simple ERC20 transfer
    # erc20.mint(accounts[0], 100 * 10 ** 18, {'from': accounts[0]})
    # erc20.transfer(accounts[1], 10 * 10 ** 18, {'from': accounts[0]})

    # test deposit without gas relayer
    # vault.deposit(signers[0], 10 * 10 ** 18)

    # test withdraw without gas relayer
    # withdraw(signers[0], vault)

    # test deposit with gas relayer
    # depositWithGasRelayer(signers[0], vault, gasRelayer)

    # test withdraw with gas relayer
    # withdrawWithGasRelayer(signers[0], vault, gasRelayer)

    # test batch deposit
    # batchDeposit(signers, vault, gasRelayer)

    # test batch withdraw
    # batchWithdraw(signers, vault, gasRelayer)
