import pytest
from brownie import Contract

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


# NOTE: need to restart ganache after every test due to following error
#       revert: UniswapV2: LOCKED
def test_exit(
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
    strategyDaiToYcrv.exit({'from': vault})
    after = get_snapshot()

    # debug
    print(
        "crv - strategy",
        "\n",
        before["crv"][strategyDaiToYcrv],
        "\n",
        after["crv"][strategyDaiToYcrv],
        "\n",
    )
    print(
        "gauge - strategy",
        "\n",
        before["gauge"][strategyDaiToYcrv],
        "\n",
        after["gauge"][strategyDaiToYcrv],
        "\n"
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
        "dai - vault",
        "\n",
        before["dai"][vault],
        "\n",
        after["dai"][vault],
        "\n",
    )

    # check strategy state
    assert after["strategy"]["totalUnderlying"] == 0

    # check strategy balances
    assert after["crv"][strategyDaiToYcrv] == 0
    assert after["yCrv"][strategyDaiToYcrv] == 0
    assert after["dai"][strategyDaiToYcrv] == 0

    # check vault balance
    assert after["dai"][vault] >= before["dai"][vault]
