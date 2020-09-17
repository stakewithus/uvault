import pytest
from brownie import Contract

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_withdraw(
    accounts, strategyDaiToYcrv, dai, stable_coin_holder, yGauge, yCrv, yDai, Controller
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
    strategy.deposit(deposit_amount,  {'from': vault})

    def get_snapshot():
        snapshot = {
            "strategy": {
                "underlyingBalance": strategy.underlyingBalance()
            },
            "dai": {},
            "yDai": {},
            "yCrv": {},
            "yGauge": {}
        }

        snapshot["dai"][vault] = dai.balanceOf(vault)
        snapshot["dai"][treasury] = dai.balanceOf(treasury)
        snapshot["dai"][strategy] = dai.balanceOf(strategy)
        snapshot["yDai"][strategy] = yDai.balanceOf(strategy)
        snapshot["yCrv"][strategy] = yCrv.balanceOf(strategy)
        snapshot["yGauge"][strategy] = yGauge.balanceOf(strategy)

        return snapshot

    # withdraw amount may be < deposit amount
    # so here we get the maximum redeemable amount
    withdraw_amount = strategy.underlyingBalance()

    before = get_snapshot()
    strategy.withdraw(withdraw_amount,  {'from': vault})
    after = get_snapshot()

    # debug
    print(
        "yGauge (yCrv)",
        "\n",
        before["yGauge"][strategy],
        "\n",
        after["yGauge"][strategy],
        "\n",
    )
    print(
        "strategy (DAI calculated from yCrv in yGauge)",
        "\n",
        before["strategy"]["underlyingBalance"],
        "\n",
        after["strategy"]["underlyingBalance"],
        "\n"
    )
    print(
        "strategy (yCrv)",
        "\n",
        before["yCrv"][strategy],
        "\n",
        after["yCrv"][strategy],
        "\n",
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
        "\n"
    )
    print(
        "vault (DAI)",
        "\n",
        before["dai"][vault],
        "\n",
        after["dai"][vault],
        "\n"
    )
    print(
        "treasury (DAI)",
        "\n",
        before["dai"][treasury],
        "\n",
        after["dai"][treasury],
        "\n",
    )

    # minimum amount of DAI to withdraw
    min_dai = deposit_amount * 0.99

    # check balance of DAI transferred to treasury and vault
    fee = after["dai"][treasury] - before["dai"][treasury]
    returned_amount = after["dai"][vault] - before["dai"][vault]

    assert fee >= 0
    assert returned_amount >= min_dai

    # check yCrv dust is redeposited into yGauge
    assert after["yCrv"][strategy] == 0
