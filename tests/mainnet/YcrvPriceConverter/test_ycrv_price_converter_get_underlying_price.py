import pytest
from brownie import Contract


def test_get_underlying_price(accounts, yCrvPriceConverter):
    yCrvAmount = 1 * 10 ** 18
    daiPrice = yCrvPriceConverter.getUnderlyingPrice(yCrvAmount, 0)

    # debug
    print(
        "\n",
        f'yCrv {yCrvAmount:,d}\n',
        f' DAI {daiPrice:,d}'
    )
