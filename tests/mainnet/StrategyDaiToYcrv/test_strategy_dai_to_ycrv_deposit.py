import pytest
from brownie import Contract

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_deposit(accounts, strategyDaiToYcrv, dai, dai_holder, gauge):
    admin = accounts[0]
    controller = accounts[1]
    vault = accounts[2]

    amount = 10 * 10 ** 18
    # allow 3% splippage
    min_return = amount * 0.97

    # check dai balance
    dai_holder_bal = dai.balanceOf(dai_holder)
    assert dai_holder_bal > amount

    # transfer DAI to vault
    dai.transfer(vault, amount, {'from': dai_holder})
    assert dai.balanceOf(vault) == amount

    # approve strategy to transfer from vault to strategy
    dai.approve(strategyDaiToYcrv, amount, {'from': vault})

    def get_snapshot():
        snapshot = {
            "strategy": {
                "totalUnderlying": strategyDaiToYcrv.totalUnderlying()
            },
            "dai": {},
            "gauge": {}
        }

        snapshot["dai"][vault] = dai.balanceOf(vault)
        snapshot["dai"][strategyDaiToYcrv] = dai.balanceOf(strategyDaiToYcrv)
        snapshot["gauge"][strategyDaiToYcrv] = gauge.balanceOf(
            strategyDaiToYcrv
        )

        return snapshot

    before = get_snapshot()
    strategyDaiToYcrv.deposit(amount, min_return, {'from': vault})
    after = get_snapshot()

    # debug
    print(
        "dai - vault",
        "\n",
        before["dai"][vault],
        "\n",
        after["dai"][vault],
        "\n"
    )
    print(
        "dai - strategy",
        "\n",
        before["dai"][strategyDaiToYcrv],
        "\n",
        after["dai"][strategyDaiToYcrv],
        "\n"
    )
    exchanged_rate = float(amount) / (
        after["gauge"][strategyDaiToYcrv] - before["gauge"][strategyDaiToYcrv]
    )
    print(
        "gauge - strategy",
        "\n",
        before["gauge"][strategyDaiToYcrv],
        "\n",
        after["gauge"][strategyDaiToYcrv],
        "\n",
        f'DAI / yCrv exchanged rate: {exchanged_rate}'
    )

    assert after["strategy"]["totalUnderlying"] == before["strategy"]["totalUnderlying"] + amount
    # test transfer of DAI from vault into gauge
    assert after["dai"][vault] == before["dai"][vault] - amount
    assert after["gauge"][strategyDaiToYcrv] - \
        before["gauge"][strategyDaiToYcrv] >= min_return
