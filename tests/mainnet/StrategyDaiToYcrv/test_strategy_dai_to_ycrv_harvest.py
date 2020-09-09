import pytest
from brownie import Contract

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


# NOTE: need to restart ganache after every test due to following error
#       revert: UniswapV2: LOCKED
def test_harvest(
    accounts, strategyDaiToYcrv, dai, dai_holder, gauge, yCrv, yDai,
    minter, crv,
    Controller
):
    admin = accounts[0]
    controller = strategyDaiToYcrv.controller()
    # NOTE: cast to string to fix error
    #       TypeError: unhashable type: 'EthAddress'
    treasury = str(Controller.at(controller).treasury())
    vault = accounts[2]

    deposit_amount = 10 * 10 ** 18
    # allow 3% splippage
    deposit_min_return = deposit_amount * 0.97

    # check dai balance
    dai_holder_bal = dai.balanceOf(dai_holder)
    assert dai_holder_bal > deposit_amount, "dai balance < deposit amount"

    # transfer DAI to vault
    dai.transfer(vault, deposit_amount, {'from': dai_holder})
    assert dai.balanceOf(
        vault
    ) >= deposit_amount, "vault dai balance < deposit amount"

    # approve strategy to transfer from vault to strategy
    dai.approve(strategyDaiToYcrv, deposit_amount, {'from': vault})

    # deposit into strategy
    strategyDaiToYcrv.deposit(
        deposit_amount, deposit_min_return, {'from': vault}
    )

    def get_snapshot():
        snapshot = {
            "strategy": {
                "totalUnderlying": strategyDaiToYcrv.totalUnderlying()
            },
            "dai": {},
            "yDai": {},
            "yCrv": {},
            "gauge": {},
            "crv": {}
        }

        snapshot["dai"][vault] = dai.balanceOf(vault)
        snapshot["dai"][treasury] = dai.balanceOf(treasury)
        snapshot["dai"][strategyDaiToYcrv] = dai.balanceOf(
            strategyDaiToYcrv
        )
        snapshot["yDai"][strategyDaiToYcrv] = yDai.balanceOf(
            strategyDaiToYcrv
        )
        snapshot["yCrv"][strategyDaiToYcrv] = yCrv.balanceOf(
            strategyDaiToYcrv
        )
        snapshot["gauge"][strategyDaiToYcrv] = gauge.balanceOf(
            strategyDaiToYcrv
        )
        snapshot["crv"][strategyDaiToYcrv] = crv.balanceOf(
            strategyDaiToYcrv
        )

        return snapshot

    before = get_snapshot()
    strategyDaiToYcrv.harvest({'from': admin})
    after = get_snapshot()

    print(
        "crv - strategy",
        "\n",
        before["crv"][strategyDaiToYcrv],
        "\n",
        after["crv"][strategyDaiToYcrv],
        "\n",
    )
    print(
        "dai- strategy",
        "\n",
        before["dai"][strategyDaiToYcrv],
        "\n",
        after["dai"][strategyDaiToYcrv],
        "\n",
    )
    print(
        "dai - treasury",
        "\n",
        before["dai"][treasury],
        "\n",
        after["dai"][treasury],
        "\n",
    )

    # growth of yCrv amount
    growth = float(
        after["gauge"][strategyDaiToYcrv] - before["gauge"][strategyDaiToYcrv]
    ) / before["gauge"][strategyDaiToYcrv]
    print(
        "gauge - strategy",
        "\n",
        before["gauge"][strategyDaiToYcrv],
        "\n",
        after["gauge"][strategyDaiToYcrv],
        "\n",
        f' growth: {growth}'
        "\n"
    )

    # check dai performance fee to treasury
    assert after["dai"][treasury] >= before["dai"][treasury]

    # check crv and yCrv in strategy
    assert after["crv"][strategyDaiToYcrv] >= before["crv"][strategyDaiToYcrv]
    assert after["gauge"][strategyDaiToYcrv] >= before["gauge"][strategyDaiToYcrv]
