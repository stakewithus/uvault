# @version 0.2.4

from vyper.interfaces import ERC20

want: public(address)

# test helpers
_balance: uint256
depositWasCalled: public(bool)
withdrawAmount: public(uint256)

@external
def __init__(_want: address):
    self.want = _want


@external
@view
def getBalance() -> uint256:
    return self._balance


@external
def deposit():
    self.depositWasCalled = True


@external
def withdraw(_amount: uint256):
    self.withdrawAmount = _amount


@external
def setBalance(_amount: uint256):
    self._balance = _amount
