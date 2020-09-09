import pytest
from brownie import Contract

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


# NOTE: need to restart ganache after every test due to following error
#       revert: UniswapV2: LOCKED
def test_withdraw(accounts, strategyDaiToCrv, dai, dai_holder, gauge, yCrv, yDai, Controller):
    admin = accounts[0]
    controller = strategyDaiToCrv.controller()
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
    dai.approve(strategyDaiToCrv, deposit_amount, {'from': vault})

    # deposit into strategy
    strategyDaiToCrv.deposit(
        deposit_amount, deposit_min_return, {'from': vault}
    )

    def get_snapshot():
        snapshot = {
            "strategy": {
                "totalUnderlying": strategyDaiToCrv.totalUnderlying()
            },
            "dai": {},
            "yDai": {},
            "yCrv": {},
            "gauge": {}
        }

        snapshot["dai"][vault] = dai.balanceOf(vault)
        snapshot["dai"][treasury] = dai.balanceOf(treasury)
        snapshot["dai"][strategyDaiToCrv] = dai.balanceOf(
            strategyDaiToCrv
        )
        snapshot["yDai"][strategyDaiToCrv] = yDai.balanceOf(
            strategyDaiToCrv
        )
        snapshot["yCrv"][strategyDaiToCrv] = yCrv.balanceOf(
            strategyDaiToCrv
        )
        snapshot["gauge"][strategyDaiToCrv] = gauge.balanceOf(
            strategyDaiToCrv
        )

        return snapshot

    before = get_snapshot()

    strategyDaiToCrv.withdraw(
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
        before["gauge"][strategyDaiToCrv],
        "\n",
        after["gauge"][strategyDaiToCrv],
        "\n",
        (after["gauge"][strategyDaiToCrv] - before["gauge"]
         [strategyDaiToCrv]) / withdraw_amount
    )
    print(
        "yCrv - strategy",
        "\n",
        before["yCrv"][strategyDaiToCrv],
        "\n",
        after["yCrv"][strategyDaiToCrv],
        "\n",
        (after["yCrv"][strategyDaiToCrv] - before["yCrv"]
         [strategyDaiToCrv]) / withdraw_amount
    )
    print(
        "yDai - strategy",
        "\n",
        before["yDai"][strategyDaiToCrv],
        "\n",
        after["yDai"][strategyDaiToCrv],
        "\n",
        (after["yDai"][strategyDaiToCrv] - before["yDai"]
         [strategyDaiToCrv]) / withdraw_amount
    )
    print(
        "dai - strategy",
        "\n",
        before["dai"][strategyDaiToCrv],
        "\n",
        after["dai"][strategyDaiToCrv],
        "\n",
        (after["dai"][strategyDaiToCrv] - before["dai"]
         [strategyDaiToCrv]) / withdraw_amount
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
    exchange_rate = float(before["gauge"][strategyDaiToCrv]) / \
        before["strategy"]["totalUnderlying"]
    yCrv_amount = int(exchange_rate * withdraw_amount)

    delta = 1000  # acceptable rounding error
    assert abs(
        (before["gauge"][strategyDaiToCrv] - after["gauge"][strategyDaiToCrv]) -
        yCrv_amount
    ) <= delta
