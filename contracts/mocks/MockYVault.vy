# @version 0.2.4

from vyper.interfaces import ERC20

token: public(address)
balanceOf: public(HashMap[address, uint256])

# test helpers
depositAmount: public(uint256)
withdrawAmount: public(uint256)

@external
def __init__(_token: address):
    self.token = _token


@external
def deposit(_amount: uint256):
    self.depositAmount = _amount


@external
def withdraw(_amount: uint256):
    self.withdrawAmount = _amount


# test helper
@external
def setBalanceOf(_to: address, _amount: uint256):
    self.balanceOf[_to] += _amount