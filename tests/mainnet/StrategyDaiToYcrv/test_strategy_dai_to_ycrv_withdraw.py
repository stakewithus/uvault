import pytest
from brownie import Contract

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


# NOTE: need to restart ganache after every test due to following error
#       revert: UniswapV2: LOCKED
def test_withdraw(accounts, strategyDaiToYcrv, dai, dai_holder, gauge, yCrv, yDai, Controller):
    admin = accounts[0]
    controller = strategyDaiToYcrv.controller()
    # NOTE: cast to string to fix error
    #       TypeError: unhashable type: 'EthAddress'
    treasury = str(Controller.at(controller).treasury())

    vault = accounts[2]

    deposit_amount = 10 * 10 ** 18
    # allow 3% splippage
    deposit_min_return = deposit_amount * 0.97

    withdraw_amount = 10 * 10 ** 18
    withdraw_min_return = withdraw_amount * 0.97

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
            "gauge": {}
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

        return snapshot

    before = get_snapshot()

    strategyDaiToYcrv.withdraw(
        withdraw_amount, withdraw_min_return, {'from': vault}
    )

    after = get_snapshot()

    # debug
    print(
        "total underlying"
        "\n",
        before["strategy"]["totalUnderlying"],
        "\n",
        after["strategy"]["totalUnderlying"],
        "\n")
    print(
        "gauge - strategy",
        "\n",
        before["gauge"][strategyDaiToYcrv],
        "\n",
        after["gauge"][strategyDaiToYcrv],
        "\n",
        (after["gauge"][strategyDaiToYcrv] - before["gauge"]
         [strategyDaiToYcrv]) / withdraw_amount
    )
    print(
        "yCrv - strategy",
        "\n",
        before["yCrv"][strategyDaiToYcrv],
        "\n",
        after["yCrv"][strategyDaiToYcrv],
        "\n",
        (after["yCrv"][strategyDaiToYcrv] - before["yCrv"]
         [strategyDaiToYcrv]) / withdraw_amount
    )
    print(
        "yDai - strategy",
        "\n",
        before["yDai"][strategyDaiToYcrv],
        "\n",
        after["yDai"][strategyDaiToYcrv],
        "\n",
        (after["yDai"][strategyDaiToYcrv] - before["yDai"]
         [strategyDaiToYcrv]) / withdraw_amount
    )
    print(
        "dai - strategy",
        "\n",
        before["dai"][strategyDaiToYcrv],
        "\n",
        after["dai"][strategyDaiToYcrv],
        "\n",
        (after["dai"][strategyDaiToYcrv] - before["dai"]
         [strategyDaiToYcrv]) / withdraw_amount
    )
    print(
        "dai - vault",
        "\n",
        before["dai"][vault],
        "\n",
        after["dai"][vault],
        "\n",
        (after["dai"][vault] - before["dai"][vault]) / withdraw_amount
    )
    print(
        "dai - treasury",
        "\n",
        before["dai"][treasury],
        "\n",
        after["dai"][treasury],
        "\n",
        (after["dai"][treasury] - before["dai"][treasury]) / withdraw_amount
    )

    # check balance of DAI transferred to treasury and vault
    fee = after["dai"][treasury] - before["dai"][treasury]
    returned_amount = after["dai"][vault] - before["dai"][vault]

    assert fee >= 0
    assert returned_amount + fee >= withdraw_min_return

    # check strategy underlying amount
    assert after["strategy"]["totalUnderlying"] == before["strategy"]["totalUnderlying"] - withdraw_amount

    # check withdraw of yCrv from gauge
    exchange_rate = float(before["gauge"][strategyDaiToYcrv]) / \
        before["strategy"]["totalUnderlying"]
    yCrv_amount = int(exchange_rate * withdraw_amount)

    delta = 1000  # acceptable rounding error
    assert abs(
        (before["gauge"][strategyDaiToYcrv] - after["gauge"][strategyDaiToYcrv]) -
        yCrv_amount
    ) <= delta
