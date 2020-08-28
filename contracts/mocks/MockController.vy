# @version 0.2.4

interface Strategy:
    def withdraw(amount: uint256): nonpayable


treasury: public(address)
vaults: public(HashMap[address, address])

@external
def __init__(_treasury: address):
    self.treasury = _treasury


@external
def setStrategy(_vault: address, _strategy: address):
    self.vaults[_strategy] = _vault


# test helper
@external
def setTreasury(_treasury: address):
    self.treasury = _treasury


@external
def withdraw(_strategy: address, _amount: uint256):
   Strategy(_strategy).withdraw(_amount)