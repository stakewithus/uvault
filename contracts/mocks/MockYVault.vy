# @version 0.2.4

balanceOf: public(HashMap[address, uint256])

@external
def __init__():
    pass


@external
def deposit(_amount: uint256):
    self.balanceOf[msg.sender] += _amount


@external
def withdraw(_amount: uint256):
    self.balanceOf[msg.sender] -= _amount


# test helper
@external
def mintTo(_to: address, _amount: uint256):
    self.balanceOf[_to] += _amount