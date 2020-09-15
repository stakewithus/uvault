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
    strategy = strategyDaiToYcrv

    admin = accounts[0]
    controller = strategy.controller()
    # NOTE: cast to string to fix error
    #       TypeError: unhashable type: 'EthAddress'
    treasury = str(Controller.at(controller).treasury())
    vault = accounts[2]

    deposit_amount = 10 * 10 ** 18

    # check dai balance
    dai_holder_bal = dai.balanceOf(dai_holder)
    assert dai_holder_bal > deposit_amount, "dai balance < deposit amount"

    # transfer DAI to vault
    dai.transfer(vault, deposit_amount, {'from': dai_holder})
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
    strategy.harvest({'from': admin})
    after = get_snapshot()

    print(
        "strategy (CRV)",
        "\n",
        before["crv"][strategy],
        "\n",
        after["crv"][strategy],
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
        "treasury (DAI)",
        "\n",
        before["dai"][treasury],
        "\n",
        after["dai"][treasury],
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
    # growth of yCrv amount
    growth = float(
        after["gauge"][strategy] - before["gauge"][strategy]
    ) / before["gauge"][strategy]

    print(f'yCrv growth: {growth}')

    # check dai performance fee to treasury
    assert after["dai"][treasury] >= before["dai"][treasury]

    # check crv and yCrv in strategy
    assert after["crv"][strategy] >= before["crv"][strategy]
    assert after["gauge"][strategy] >= before["gauge"][strategy]
