# @version 0.2.4

interface Strategy:
    def deposit(amount: uint256): nonpayable
    def withdraw(amount: uint256): nonpayable


treasury: public(address)
vaults: public(HashMap[address, address])

balanceOf: public(HashMap[address, uint256])

# test helpers
depositAmount: public(uint256)
withdrawAmount: public(uint256)

@external
def __init__(_treasury: address):
    self.treasury = _treasury


@external
def setStrategy(_vault: address, _strategy: address):
    self.vaults[_strategy] = _vault


@external
def deposit(_amount: uint256):
    self.depositAmount = _amount


@external
def withdraw(_amount: uint256):
    self.withdrawAmount = _amount

# test helper
@external
def setTreasury(_treasury: address):
    self.treasury = _treasury


@external
def setBalanceOf(_vault: address, _amount: uint256):
    self.balanceOf[_vault] = _amount

# @external
# def deposit(_strategy: address, _amount: uint256):
#    Strategy(_strategy).deposit(_amount)


# @external
# def withdraw(_strategy: address, _amount: uint256):
#    Strategy(_strategy).withdraw(_amount)
