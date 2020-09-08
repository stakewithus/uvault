import pytest
from brownie import Contract

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_deposit(accounts, strategyDaiToCrv, dai, dai_holder, gauge):
    admin = accounts[0]
    controller = accounts[1]
    vault = accounts[2]

    amount = 10 * 10 ** 18
    min_return = 0

    # check dai balance
    dai_holder_bal = dai.balanceOf(dai_holder)
    assert dai_holder_bal > amount

    # transfer DAI to vault
    dai.transfer(vault, amount, {'from': dai_holder})
    assert dai.balanceOf(vault) == amount

    # approve strategy to transfer from vault to strategy
    dai.approve(strategyDaiToCrv, amount, {'from': vault})

    def get_snapshot():
        snapshot = {
            "strategy": {
                "totalUnderlying": strategyDaiToCrv.totalUnderlying()
            },
            "dai": {
                "balanceOf": {}
            },
            "gauge": {
                "balanceOf": {}
            }
        }

        snapshot["dai"]["balanceOf"][vault] = dai.balanceOf(vault)
        snapshot["gauge"]["balanceOf"][strategyDaiToCrv] = gauge.balanceOf(
            strategyDaiToCrv
        )

        return snapshot

    before = get_snapshot()

    strategyDaiToCrv.deposit(amount, min_return, {'from': vault})

    after = get_snapshot()

    assert after["strategy"]["totalUnderlying"] == before["strategy"]["totalUnderlying"] + amount
    # test transfer of DAI from vault to yCRV into gauge
    assert after["dai"]["balanceOf"][vault] == before["dai"]["balanceOf"][vault] - amount
    # dai to yCrv exchange diff
    delta = amount * 0.03
    assert after["gauge"]["balanceOf"][strategyDaiToCrv] - \
        before["gauge"]["balanceOf"][strategyDaiToCrv] > delta
