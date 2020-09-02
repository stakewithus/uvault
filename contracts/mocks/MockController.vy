# @version 0.2.4

interface Strategy:
    def deposit(): nonpayable
    def withdraw(amount: uint256): nonpayable


treasury: public(address)
vaults: public(HashMap[address, address])

balanceOf: public(HashMap[address, uint256])

# test helpers
__depositAmount: public(uint256)
__withdrawAmount: public(uint256)

@external
def __init__(_treasury: address):
    self.treasury = _treasury


@external
def setStrategy(_vault: address, _strategy: address):
    self.vaults[_strategy] = _vault


@external
def setTreasury(_treasury: address):
    self.treasury = _treasury


@external
def deposit(_amount: uint256):
    self.__depositAmount = _amount


@external
def withdraw(_amount: uint256):
    self.__withdrawAmount = _amount



# test helpeur
@external
def __setTreasury(_treasury: address):
    self.treasury = _treasury


@external
def __setBalanceOf(_vault: address, _amount: uint256):
    self.balanceOf[_vault] = _amount


@external
def __depositToStrategy(_strategy: address):
    Strategy(_strategy).deposit()


@external
def __withdrawFromStrategy(_strategy: address, _amount: uint256):
    Strategy(_strategy).withdraw(_amount)