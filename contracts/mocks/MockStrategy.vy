# @version 0.2.4

totalSupply: uint256
balanceOf: public(HashMap[address, uint256])

@external
def __init__():
    pass


@external
@view
def getBalance() -> uint256:
    return self.totalSupply


@external
def deposit(_amount: uint256):
    self.balanceOf[msg.sender] += _amount
    self.totalSupply += _amount


@external
def withdraw(_amount: uint256):
    self.balanceOf[msg.sender] -= _amount
    self.totalSupply -= _amount


# test helper
@external
def mintTo(_to: address, _amount: uint256):
    self.balanceOf[_to] += _amount
    self.totalSupply += _amount