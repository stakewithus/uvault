# @version 0.2.4
"""
@title StakeWithUs Controller
@author StakeWithUs
@dev Based on https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/ERC20CRV.vy
@dev Vyper implementation / fork of https://github.com/iearn-finance/vaults/blob/master/contracts/yVault.sol
"""

from vyper.interfaces import ERC20

interface Strategy:
    def want() -> address: view
    def withdraw(amount: uint256): nonpayable
    def withdrawAll(): nonpayable
    def deposit(): nonpayable
    def getBalance() -> uint256: view

# TODO: docs
# TODO: test
event SetAdmin:
    admin: address

event SetStrategy:
    token: indexed(address)
    strategy: indexed(address)

event Withdraw:
    vault: indexed(address)
    amount: uint256

TRANSFER: constant(Bytes[4]) = method_id(
    "transfer(address,uint256)", output_type=Bytes[4]
)

# vault to strategy mapping
strategies: public(HashMap[address, address])
isVault: public(HashMap[address, bool])

admin: public(address)
# TODO withdraw to treasury
treasury: public(address)


@external
def __init__(_treasury: address):
    self.admin = msg.sender
    self.treasury = _treasury


@external
def setAdmin(_admin: address):
    assert msg.sender == self.admin, "!admin"
    assert _admin != ZERO_ADDRESS, "zero address"

    self.admin = _admin
    log SetAdmin(_admin)


@external
def setStrategy(_vault: address, _strategy: address):
    """
    @dev need to call twice (vault, strategy) and (token, strategy)
    """
    assert msg.sender == self.admin, "!admin"
    assert _vault != ZERO_ADDRESS, "zero address"
    assert _strategy != ZERO_ADDRESS, "zero address"

    current: address = self.strategies[_vault]
    if current != ZERO_ADDRESS:
        Strategy(current).withdrawAll()

    self.strategies[_vault] = _strategy
    self.isVault[_vault] = True

    log SetStrategy(_vault, _strategy)


@internal
def _call(_token: address, _data: Bytes[100]):
    """
    @notice Low level function to call ERC20 `transfer` or `transferFrom`,
            handle cases whether the transfer returns bool or not
    @dev Reverts if bool is returned and == False
    @param _token ERC20 token address
    @param _data Data to call `transfer` or `transferFrom`
    @dev Max size of `_data` is 100 bytes
         4  bytes method id
         32 bytes from address
         32 bytes to address
         32 bytes amount (uint256)
    """
    _response: Bytes[32] = raw_call(
        _token,
        _data,
        max_outsize=32
    )
    if len(_response) > 0:
        assert convert(_response, bool), "ERC20 transfer failed!"


@internal
def _safeTransfer(_token: address, _to: address, _amount: uint256):
    """
    @notice call ERC20 transfer and handle the two cases whether boolean is returned or not
    @param _token ERC20 token address
    @param _to Address to transfer to
    @param _amount Amount to transfer
    """
    # data = 68 bytes
    # 4  bytes method id
    # 32 bytes to address
    # 32 bytes amount (uint256)
    self._call(_token, concat(
        TRANSFER,
        convert(_to, bytes32),
        convert(_amount, bytes32)
    ))

@external
@view
def balanceOf(_vault: address) -> uint256:
    return Strategy(self.strategies[_vault]).getBalance()


@external
def earn(_vault: address, _amount: uint256):
    """
    @dev `_vault` can be address of Vault or underlying ERC20 token
    """
    strategy: address = self.strategies[_vault]
    assert strategy != ZERO_ADDRESS, "zero address"

    want: address = Strategy(strategy).want()
    self._safeTransfer(want, strategy, _amount)
    Strategy(strategy).deposit()


@external
def withdraw(_vault: address, _amount: uint256):
    assert self.isVault[msg.sender], "!vault"
    Strategy(self.strategies[_vault]).withdraw(_amount)

    log Withdraw(_vault, _amount)











