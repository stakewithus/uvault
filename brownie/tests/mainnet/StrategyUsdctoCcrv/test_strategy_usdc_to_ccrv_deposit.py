import pytest
from brownie import Contract

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


# NOTE: If test is failing, try restarting ganache

def test_deposit(accounts, strategyUsdcToCcrv, usdc, stable_coin_holder, cUsd, cGauge):
    strategy = strategyUsdcToCcrv

    admin = accounts[0]
    vault = accounts[2]

    # USDC precision = 10 ** 6
    deposit_amount = 10 * 10 ** 6

    # check balance
    assert usdc.balanceOf(stable_coin_holder) >= deposit_amount

    # transfer USDC to vault
    usdc.transfer(vault, deposit_amount, {'from': stable_coin_holder})
    assert usdc.balanceOf(vault) == deposit_amount

    # approve strategy to transfer from vault to strategy
    usdc.approve(strategy, deposit_amount, {'from': vault})

    def get_snapshot():
        snapshot = {
            "strategy": {
                "underlyingBalance": strategy.underlyingBalance()
            },
            "usdc": {},
            "cUsd": {},
            "cGauge": {}
        }

        snapshot["usdc"][vault] = usdc.balanceOf(vault)
        snapshot["usdc"][strategy] = usdc.balanceOf(strategy)
        snapshot["cUsd"][strategy] = cUsd.balanceOf(strategy)
        snapshot["cGauge"][strategy] = cGauge.balanceOf(strategy)

        return snapshot

    before = get_snapshot()
    tx = strategy.deposit(deposit_amount, {'from': vault})
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
        "strategy (USDC calculated from cUsd in cGauge)",
        "\n",
        before["strategy"]["underlyingBalance"],
        "\n",
        after["strategy"]["underlyingBalance"],
        "\n",
    )
    print(
        "strategy (cUsd)",
        "\n",
        before["cUsd"][strategy],
        "\n",
        after["cUsd"][strategy],
        "\n",
    )
    print(
        "cGauge (cUsd)",
        "\n",
        before["cGauge"][strategy],
        "\n",
        after["cGauge"][strategy],
        "\n",
    )
    # exchange rate of cUsd / USDC
    rate = float(
        after["cGauge"][strategy] - before["cGauge"][strategy]
    ) / (deposit_amount * 10 ** 12)
    print(f'cUsd / USDC {rate}')

    # minimum amount of redeemable usdc
    min_redeemable_usdc = deposit_amount * 0.99
    # minimum amount of cUsd minted
    min_ccrv = deposit_amount * 0.95

    ccrv_diff = after["cGauge"][strategy] - before["cGauge"][strategy]
    usdc_diff = after["strategy"]["underlyingBalance"] - \
        before["strategy"]["underlyingBalance"]

    assert after["usdc"][vault] == before["usdc"][vault] - deposit_amount
    assert usdc_diff >= min_redeemable_usdc
    assert ccrv_diff >= min_ccrv
