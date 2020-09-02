# @version 0.2.4

from vyper.interfaces import ERC20

want: public(address)

# test helpers
__balance: uint256
__depositWasCalled: public(bool)
__withdrawAmount: public(uint256)

@external
def __init__(_want: address):
    self.want = _want


@external
@view
def getBalance() -> uint256:
    return self.__balance


@external
def deposit():
    self.__depositWasCalled = True


@external
def withdraw(_amount: uint256):
    self.__withdrawAmount = _amount


# test helper
@external
def __setBalance(_amount: uint256):
    self.__balance = _amount
