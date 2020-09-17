import pytest
from brownie import Contract

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


# NOTE: need to restart ganache after every test due to following error
#       revert: UniswapV2: LOCKED
def test_exit(
    accounts, strategyDaiToYcrv, dai, stable_coin_holder, gauge, yCrv, yDai,
    minter, crv,
    Controller
):
    strategy = strategyDaiToYcrv

    admin = accounts[0]
    controller = strategy.controller()
    # NOTE: cast to string to fix error
    #       TypeError: unhashable type: 'EthAddress'
    treasury = str(Controller.at(controller).treasury())
    vault = accounts[2]

    deposit_amount = 10 * 10 ** 18

    # check dai balance
    stable_coin_holder_bal = dai.balanceOf(stable_coin_holder)
    assert stable_coin_holder_bal >= deposit_amount, "dai balance < deposit amount"

    # transfer DAI to vault
    dai.transfer(vault, deposit_amount, {'from': stable_coin_holder})
    assert dai.balanceOf(
        vault
    ) >= deposit_amount, "vault dai balance < deposit amount"

    # approve strategy to transfer from vault to strategy
    dai.approve(strategy, deposit_amount, {'from': vault})

    # deposit into strategy
    strategy.deposit(deposit_amount, {'from': vault})

    def get_snapshot():
        snapshot = {
            "strategy": {
                "underlyingBalance": strategy.underlyingBalance()
            },
            "dai": {},
            "yDai": {},
            "yCrv": {},
            "gauge": {},
            "crv": {}
        }

        snapshot["dai"][vault] = dai.balanceOf(vault)
        snapshot["dai"][treasury] = dai.balanceOf(treasury)
        snapshot["dai"][strategy] = dai.balanceOf(strategy)
        snapshot["yDai"][strategy] = yDai.balanceOf(strategy)
        snapshot["yCrv"][strategy] = yCrv.balanceOf(strategy)
        snapshot["gauge"][strategy] = gauge.balanceOf(strategy)
        snapshot["crv"][strategy] = crv.balanceOf(strategy)

        return snapshot

    before = get_snapshot()
    strategy.exit({'from': vault})
    after = get_snapshot()

    # debug
    print(
        "strategy (CRV)",
        "\n",
        before["crv"][strategy],
        "\n",
        after["crv"][strategy],
        "\n",
    )
    print(
        "gauge (yCrv)",
        "\n",
        before["gauge"][strategy],
        "\n",
        after["gauge"][strategy],
        "\n"
    )
    print(
        "strategy (yCrv)",
        "\n",
        before["yCrv"][strategy],
        "\n",
        after["yCrv"][strategy],
        "\n"
    )
    print(
        "strategy (yDai)",
        "\n",
        before["yDai"][strategy],
        "\n",
        after["yDai"][strategy],
        "\n",
    )
    print(
        "strategy (DAI)",
        "\n",
        before["dai"][strategy],
        "\n",
        after["dai"][strategy],
        "\n",
    )
    print(
        "vault (DAI)",
        "\n",
        before["dai"][vault],
        "\n",
        after["dai"][vault],
        "\n",
    )

    # check strategy state
    assert after["strategy"]["underlyingBalance"] <= 1  # dust

    # # check strategy balances
    assert after["crv"][strategy] == 0
    assert after["yCrv"][strategy] == 0
    assert after["yDai"][strategy] == 0
    assert after["dai"][strategy] == 0

    # check vault balance
    assert after["dai"][vault] >= before["dai"][vault]
