import pytest
from brownie import Contract

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_withdraw_all(
    accounts, strategyDaiToYcrv, dai, stable_coin_holder, gauge, yCrv, yDai
):
    strategy = strategyDaiToYcrv

    admin = accounts[0]
    controller = accounts[1]
    vault = accounts[2]

    amount = 10 * 10 ** 18

    # check dai balance
    stable_coin_holder_bal = dai.balanceOf(stable_coin_holder)
    assert stable_coin_holder_bal >= amount

    # transfer DAI to vault
    dai.transfer(vault, amount, {'from': stable_coin_holder})
    assert dai.balanceOf(vault) == amount

    # approve strategy to transfer from vault to strategy
    dai.approve(strategy, amount, {'from': vault})

    strategy.deposit(amount, {'from': vault})

    def get_snapshot():
        snapshot = {
            "strategy": {
                "underlyingBalance": strategy.underlyingBalance()
            },
            "dai": {},
            "gauge": {},
            "yCrv": {},
            "yDai": {}
        }

        snapshot["dai"][vault] = dai.balanceOf(vault)
        snapshot["dai"][strategy] = dai.balanceOf(strategy)
        snapshot["gauge"][strategy] = gauge.balanceOf(strategy)
        snapshot["yCrv"][strategy] = yCrv.balanceOf(strategy)
        snapshot["yDai"][strategy] = yDai.balanceOf(strategy)

        return snapshot

    before = get_snapshot()
    strategy.withdrawAll({'from': vault})
    after = get_snapshot()

    # debug
    print(
        "vault (DAI)",
        "\n",
        before["dai"][vault],
        "\n",
        after["dai"][vault],
        "\n"
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
        "strategy (DAI calculated from yCrv in Gauge)",
        "\n",
        before["strategy"]["underlyingBalance"],
        "\n",
        after["strategy"]["underlyingBalance"],
        "\n",
    )
    print(
        "strategy (yDAI)",
        "\n",
        before["yDai"][strategy],
        "\n",
        after["yDai"][strategy],
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
        "gauge (yCrv)",
        "\n",
        before["gauge"][strategy],
        "\n",
        after["gauge"][strategy],
        "\n",
    )

    # minimum amount of redeemable dai
    min_redeemed_dai = amount * 0.99

    assert after["dai"][vault] >= min_redeemed_dai
    # check strategy is empty
    assert after["dai"][strategy] == 0
    assert after["gauge"][strategy] <= 10 * 10 ** 18  # dust yCrv < 1 DAI
    assert after["yCrv"][strategy] == 0
    assert after["yDai"][strategy] == 0
