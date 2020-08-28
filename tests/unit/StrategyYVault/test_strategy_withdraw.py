import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_withdraw_not_controller(
    accounts, strategyYVault, mockController, mockYCRV, mockYVault
):
    with brownie.reverts("dev: !controller"):
        strategyYVault.withdraw(100)


def test_withdraw_no_withdraw_from_yvault(
    accounts, strategyYVault, mockController, mockYCRV, mockYVault
):
    treasury = mockController.treasury()

    amount = 1000
    mockYCRV.mint(strategyYVault, amount)
    mockYCRV.mint(mockYVault, 2000)

    # balance of yCRV
    balanceBefore = {
        "treasury": mockYCRV.balanceOf(treasury),
        "controller": mockYCRV.balanceOf(mockController),
        "strategyYVault": mockYCRV.balanceOf(strategyYVault),
        "yVault": mockYCRV.balanceOf(mockYVault)
    }

    # need to call withdraw from controller
    tx = mockController.withdraw(strategyYVault, amount)

    assert len(tx.events) == 3
    assert tx.events["Withdraw"].values() == [mockController, amount]

    # balance of yCRV
    balanceAfter = {
        "treasury": mockYCRV.balanceOf(treasury),
        "controller": mockYCRV.balanceOf(mockController),
        "strategyYVault": mockYCRV.balanceOf(strategyYVault),
        "yVault": mockYCRV.balanceOf(mockYVault)
    }

    fee = amount * 0.005
    assert balanceAfter["treasury"] == balanceBefore["treasury"] + fee
    assert balanceAfter["controller"] == balanceBefore["controller"] + (amount - fee)
    assert balanceAfter["strategyYVault"] == balanceBefore["strategyYVault"] - amount
    assert balanceAfter["yVault"] == balanceBefore["yVault"]


def test_withdraw_from_yvault(
    accounts, strategyYVault, mockController, mockYCRV, mockYVault
):
    treasury = mockController.treasury()

    amount = 1000
    mockYCRV.mint(strategyYVault, amount - 100)
    # strategyYVault owns 2000 yCRV inside yVault
    mockYVault.mintTo(strategyYVault, 2000)
    mockYCRV.mint(mockYVault, 2000)

    # balance of yCRV
    balanceBefore = {
        "treasury": mockYCRV.balanceOf(treasury),
        "controller": mockYCRV.balanceOf(mockController),
        "strategyYVault": mockYCRV.balanceOf(strategyYVault),
        "yVault": mockYCRV.balanceOf(mockYVault)
    }

    # need to call withdraw from controller
    tx = mockController.withdraw(strategyYVault, amount)

    assert len(tx.events) == 4
    assert tx.events["Withdraw"].values() == [mockController, amount]

    # balance of yCRV
    balanceAfter = {
        "treasury": mockYCRV.balanceOf(treasury),
        "controller": mockYCRV.balanceOf(mockController),
        "strategyYVault": mockYCRV.balanceOf(strategyYVault),
        "yVault": mockYCRV.balanceOf(mockYVault)
    }

    fee = amount * 0.005
    assert balanceAfter["treasury"] == balanceBefore["treasury"] + fee
    assert balanceAfter["controller"] == balanceBefore["controller"] + (amount - fee)
    assert balanceAfter["strategyYVault"] == 0
    assert balanceAfter["yVault"] == balanceBefore["yVault"] - (amount - balanceBefore["strategyYVault"])


def test_withdraw_treasury_is_zero_address(
    accounts, strategyYVault, mockController, mockYCRV, mockYVault
):
    mockController.setTreasury(ZERO_ADDRESS)

    amount = 1000
    mockYCRV.mint(strategyYVault, amount - 100)
    # strategyYVault owns 2000 yCRV inside yVault
    mockYVault.mintTo(strategyYVault, 2000)
    mockYCRV.mint(mockYVault, 2000)

    # revert message "dev: treasury == zero address" not propagated
    # to mockController
    with brownie.reverts():
        # need to call withdraw from controller
        mockController.withdraw(strategyYVault, amount)

