import pytest
from brownie import Contract

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


# USDC precision = 10 ** 6
DEPOSIT_AMOUNT = 10 * 10 ** 6

# test

# NOTE: If test is failing, try restarting ganache


def test_deposit(accounts, strategyUsdcToCcrv, usdc, stable_coin_holder, cCrv, cGauge):
    strategy = strategyUsdcToCcrv

    admin = accounts[0]
    vault = accounts[2]

    # check balance
    assert usdc.balanceOf(stable_coin_holder) >= DEPOSIT_AMOUNT

    # transfer USDC to vault
    usdc.transfer(vault, DEPOSIT_AMOUNT, {'from': stable_coin_holder})
    assert usdc.balanceOf(vault) == DEPOSIT_AMOUNT

    # approve strategy to transfer from vault to strategy
    usdc.approve(strategy, DEPOSIT_AMOUNT, {'from': vault})

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
        snapshot["usdc"][strategy] = usdc.balanceOf(strategy)
        snapshot["cCrv"][strategy] = cCrv.balanceOf(strategy)
        snapshot["cGauge"][strategy] = cGauge.balanceOf(strategy)

        return snapshot

    before = get_snapshot()
    tx = strategy.deposit(DEPOSIT_AMOUNT, {'from': vault})
    after = get_snapshot()

    # debug
    print(
        "vault (USDC)",
        "\n",
        before["usdc"][vault],
        "\n",
        after["usdc"][vault],
        "\n"
    )
    print(
        "strategy (USDC)",
        "\n",
        before["usdc"][strategy],
        "\n",
        after["usdc"][strategy],
        "\n"
    )
    print(
        "strategy (USDC calculated from cCrv in cGauge)",
        "\n",
        before["strategy"]["underlyingBalance"],
        "\n",
        after["strategy"]["underlyingBalance"],
        "\n",
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
        "cGauge (cCrv)",
        "\n",
        before["cGauge"][strategy],
        "\n",
        after["cGauge"][strategy],
        "\n",
    )
    # exchange rate of cCrv / USDC
    rate = float(
        after["cGauge"][strategy] - before["cGauge"][strategy]
    ) / (DEPOSIT_AMOUNT * 10 ** 12)
    print(f'cCrv / USDC {rate}')

    # minimum amount of redeemable usdc
    min_redeemable_usdc = DEPOSIT_AMOUNT * 0.99
    # minimum amount of cCrv minted
    min_ccrv = DEPOSIT_AMOUNT * 0.95

    ccrv_diff = after["cGauge"][strategy] - before["cGauge"][strategy]
    usdc_diff = after["strategy"]["underlyingBalance"] - \
        before["strategy"]["underlyingBalance"]

    assert after["usdc"][vault] == before["usdc"][vault] - DEPOSIT_AMOUNT
    assert usdc_diff >= min_redeemable_usdc
    assert ccrv_diff >= min_ccrv
