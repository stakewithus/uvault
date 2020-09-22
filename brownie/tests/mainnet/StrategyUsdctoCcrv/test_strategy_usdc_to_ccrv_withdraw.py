import pytest
from brownie import Contract

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

# NOTE: cannot test
#       multiple calls to DepositCompound fails


@pytest.mark.skip
def test_withdraw(
    accounts, strategyUsdcToCcrv, usdc, stable_coin_holder, cGauge, cCrv, Controller
):
    strategy = strategyUsdcToCcrv

    admin = accounts[0]
    controller = strategy.controller()
    # NOTE: cast to string to fix error
    #       TypeError: unhashable type: 'EthAddress'
    treasury = str(Controller.at(controller).treasury())

    vault = accounts[2]

    # USDC precision = 10 ** 6
    deposit_amount = 10 * 10 ** 6

    # check usdc balance
    stable_coin_holder_bal = usdc.balanceOf(stable_coin_holder)
    assert stable_coin_holder_bal >= deposit_amount, "usdc balance < deposit amount"

    # transfer usdc to vault
    usdc.transfer(vault, deposit_amount, {'from': stable_coin_holder})
    assert usdc.balanceOf(
        vault
    ) >= deposit_amount, "vault usdc balance < deposit amount"

    # approve strategy to transfer from vault to strategy
    usdc.approve(strategy, deposit_amount, {'from': vault})

    # deposit into strategy
    strategy.deposit(deposit_amount,  {'from': vault})

    def get_snapshot():
        snapshot = {
            "strategy": {
                "underlyingBalance": strategy.underlyingBalance()
            },
            "usdc": {},
            "cCrv": {},
            "cGauge": {}
        }

        snapshot["usdc"][vault] = usdc.balanceOf(vault)
        snapshot["usdc"][treasury] = usdc.balanceOf(treasury)
        snapshot["usdc"][strategy] = usdc.balanceOf(strategy)
        snapshot["cCrv"][strategy] = cCrv.balanceOf(strategy)
        snapshot["cGauge"][strategy] = cGauge.balanceOf(strategy)

        return snapshot

    # withdraw amount may be < deposit amount
    # so here we get the maximum redeemable amount
    withdraw_amount = strategy.underlyingBalance()

    before = get_snapshot()
    strategy.withdraw(withdraw_amount,  {'from': vault})
    after = get_snapshot()

    # debug
    print(
        "cGauge (cCrv)",
        "\n",
        before["cGauge"][strategy],
        "\n",
        after["cGauge"][strategy],
        "\n",
    )
    print(
        "strategy (usdc calculated from cCrv in cGauge)",
        "\n",
        before["strategy"]["underlyingBalance"],
        "\n",
        after["strategy"]["underlyingBalance"],
        "\n"
    )
    print(
        "strategy (cCrv)",
        "\n",
        before["cCrv"][strategy],
        "\n",
        after["cCrv"][strategy],
        "\n",
    )
    print(
        "strategy (usdc)",
        "\n",
        before["usdc"][strategy],
        "\n",
        after["usdc"][strategy],
        "\n"
    )
    print(
        "vault (usdc)",
        "\n",
        before["usdc"][vault],
        "\n",
        after["usdc"][vault],
        "\n"
    )
    print(
        "treasury (usdc)",
        "\n",
        before["usdc"][treasury],
        "\n",
        after["usdc"][treasury],
        "\n",
    )

    # minimum amount of usdc to withdraw
    min_usdc = deposit_amount * 0.99

    # check balance of usdc transferred to treasury and vault
    fee = after["usdc"][treasury] - before["usdc"][treasury]
    returned_amount = after["usdc"][vault] - before["usdc"][vault]

    assert fee >= 0
    assert returned_amount >= min_usdc

    # check cCrv dust is redeposited into cGauge
    assert after["cCrv"][strategy] == 0
