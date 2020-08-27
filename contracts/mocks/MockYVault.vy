# @version 0.2.4

from vyper.interfaces import ERC20

token: public(address)
balanceOf: public(HashMap[address, uint256])

@external
def __init__(_token: address):
    self.token = _token


@external
def deposit(_amount: uint256):
    ERC20(self.token).transferFrom(msg.sender, self, _amount)
    self.balanceOf[msg.sender] += _amount


@external
def withdraw(_amount: uint256):
    ERC20(self.token).transfer(msg.sender, _amount)
    self.balanceOf[msg.sender] -= _amount


# test helper
@external
def mintTo(_to: address, _amount: uint256):
    self.balanceOf[_to] += _amount