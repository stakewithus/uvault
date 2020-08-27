# @version 0.2.4

treasury: public(address)
vaults: public(HashMap[address, address])

@external
def __init__(_treasury: address):
    self.treasury = _treasury

@external
def setStrategy(_vault: address, _strategy: address):
    self.vaults[_strategy] = _vault

