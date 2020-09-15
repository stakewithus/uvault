import pytest
from brownie import Contract

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_deposit(accounts, strategyDaiToYcrv, dai, dai_holder, gauge):
    strategy = strategyDaiToYcrv

    admin = accounts[0]
    controller = accounts[1]
    vault = accounts[2]

    amount = 10 * 10 ** 18

    # check dai balance
    dai_holder_bal = dai.balanceOf(dai_holder)
    assert dai_holder_bal > amount

    # transfer DAI to vault
    dai.transfer(vault, amount, {'from': dai_holder})
    assert dai.balanceOf(vault) == amount

    # approve strategy to transfer from vault to strategy
    dai.approve(strategy, amount, {'from': vault})

    def get_snapshot():
        snapshot = {
            "strategy": {
                "balance": strategy.balance()
            },
            "dai": {},
            "gauge": {}
        }

        snapshot["dai"][vault] = dai.balanceOf(vault)
        snapshot["dai"][strategy] = dai.balanceOf(strategy)
        snapshot["gauge"][strategy] = gauge.balanceOf(strategy)

        return snapshot

    before = get_snapshot()
    strategy.deposit(amount, {'from': vault})
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
        before["strategy"]["balance"],
        "\n",
        after["strategy"]["balance"],
        "\n",
    )
    print(
        "gauge (yCrv)",
        "\n",
        before["gauge"][strategy],
        "\n",
        after["gauge"][strategy],
        "\n",
    )
    # exchange rate of yCrv / DAI
    rate = float(
        after["gauge"][strategy] - before["gauge"][strategy]
    ) / (amount)
    print(f'yCrv / DAI {rate}')

    # minimum amount of redeemable dai
    min_redeemable_dai = amount * 0.99
    # minimum amount of ycrv minted
    min_ycrv = amount * 0.97

    ycrv_diff = after["gauge"][strategy] - before["gauge"][strategy]
    dai_diff = after["strategy"]["balance"] - before["strategy"]["balance"]

    assert after["dai"][vault] == before["dai"][vault] - amount
    assert dai_diff >= min_redeemable_dai
    assert ycrv_diff >= min_ycrv
