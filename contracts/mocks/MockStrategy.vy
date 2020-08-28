# @version 0.2.4

from vyper.interfaces import ERC20

totalSupply: uint256
balanceOf: public(HashMap[address, uint256])
want: public(address)

# test helpers
depositAmount: public(uint256)
withdrawAmount: public(uint256)

@external
def __init__(_want: address):
    self.want = _want


@external
@view
def getBalance() -> uint256:
    return ERC20(self.want).balanceOf(self)


@external
def deposit(_amount: uint256):
    self.depositAmount = _amount


@external
def withdraw(_amount: uint256):
    self.withdrawAmount = _amount
