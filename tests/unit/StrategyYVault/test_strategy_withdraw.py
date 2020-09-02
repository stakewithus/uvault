import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def get_snapshot(mockYCRV, treasury, vault, strategyYVault, mockYVault):
    return {
        "yCRV": {
            "balances": {
                "treasury": mockYCRV.balanceOf(treasury),
                "vault": mockYCRV.balanceOf(vault),
                "strategyYVault": mockYCRV.balanceOf(strategyYVault),
                "yVault": mockYCRV.balanceOf(mockYVault)
            }
        }
    }


def test_withdraw_not_controller(
    accounts, strategyYVault, mockController, mockYCRV, mockYVault
):
    with brownie.reverts("dev: !controller"):
        strategyYVault.withdraw(100)


def test_withdraw_zero_amount(
    accounts, strategyYVault, mockController, mockYCRV, mockYVault
):
    # NOTE: revert message "dev: amount == 0" not propagated
    # to mockController
    with brownie.reverts():
        # need to call withdraw from controller
        mockController.withdrawFromStrategy(strategyYVault, 0)


def test_withdraw_no_withdraw_from_yvault(
    accounts, strategyYVault, mockController, mockYCRV, mockYVault
):
    treasury = mockController.treasury()

    # setup strategy to have some yCRV stored
    amount = 1000
    mockYCRV.mint(strategyYVault, amount)

    # set strategy to vault mapping
    vault = accounts[1]
    mockController.setStrategy(vault, strategyYVault)

    # snapshot before
    before = get_snapshot(
        mockYCRV, treasury, vault, strategyYVault, mockYVault
    )

    # need to call withdraw from controller
    mockController.withdrawFromStrategy(strategyYVault, amount)

    # snapshot after
    after = get_snapshot(
        mockYCRV, treasury, vault, strategyYVault, mockYVault
    )

    fee = amount * (strategyYVault.withdrawFee() /
                    strategyYVault.withdrawFeeMax())

    assert after["yCRV"]["balances"]["treasury"] == before["yCRV"]["balances"]["treasury"] + fee
    assert after["yCRV"]["balances"]["vault"] == before["yCRV"]["balances"]["vault"] + \
        (amount - fee)
    assert after["yCRV"]["balances"]["strategyYVault"] == before["yCRV"]["balances"]["strategyYVault"] - amount
    # check no withdraw from yVault
    assert after["yCRV"]["balances"]["yVault"] == before["yCRV"]["balances"]["yVault"]


def test_withdraw_from_yvault(
    accounts, strategyYVault, mockController, mockYCRV, mockYVault
):
    treasury = mockController.treasury()

    amount = 10000
    # mint amount < 10000 to strategy
    mockYCRV.mint(strategyYVault, amount - 1000)

    # strategyYVault owns 20000 yCRV inside yVault
    mockYVault.setBalanceOf(strategyYVault, 20000)
    mockYCRV.mint(mockYVault, 20000)

    # set strategy to vault mapping
    vault = accounts[1]
    mockController.setStrategy(vault, strategyYVault)

    # snapshot before tx
    before = get_snapshot(
        mockYCRV, treasury, vault, strategyYVault, mockYVault
    )

    # need to call withdraw from controller
    mockController.withdrawFromStrategy(strategyYVault, amount)

    # snapshot after tx
    after = get_snapshot(
        mockYCRV, treasury, vault, strategyYVault, mockYVault
    )

    # check yVault.withdraw was called
    diff = amount - before["yCRV"]["balances"]["strategyYVault"]
    assert mockYVault.withdrawAmount() == diff

    # withdraww amount = balance of strategy + amount withdrawn from yVault
    withdrawAmount = before["yCRV"]["balances"]["strategyYVault"] + \
        after["yCRV"]["balances"]["yVault"] - \
        before["yCRV"]["balances"]["yVault"]
    fee = withdrawAmount * (strategyYVault.withdrawFee() /
                            strategyYVault.withdrawFeeMax())

    assert after["yCRV"]["balances"]["treasury"] == before["yCRV"]["balances"]["treasury"] + fee
    assert after["yCRV"]["balances"]["vault"] == before["yCRV"]["balances"]["vault"] + \
        (withdrawAmount - fee)
    # strateby balance was < amount so here it must be 0
    assert after["yCRV"]["balances"]["strategyYVault"] == 0


def test_withdraw_treasury_is_zero_address(
    accounts, strategyYVault, mockController, mockYCRV, mockYVault
):
    mockController.setTreasury(ZERO_ADDRESS)

    amount = 1000
    mockYCRV.mint(strategyYVault, amount)

    # revert message "dev: treasury == zero address" not propagated
    # to mockController
    with brownie.reverts():
        # need to call withdraw from controller
        mockController.withdrawFromStrategy(strategyYVault, amount)
