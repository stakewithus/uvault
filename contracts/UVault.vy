# @version 0.2.4
"""
@title StakeWithUs UVault
@author StakeWithUs
@dev Based on https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/ERC20CRV.vy
@dev Vyper implementation / fork of https://github.com/iearn-finance/vaults/blob/master/contracts/yVault.sol
"""

from vyper.interfaces import ERC20

interface Controller:
    def balanceOf(addr: address) -> uint256: view
    def earn(addr: address, amount: uint256): nonpayable
    def withdraw(addr: address, amount: uint256): nonpayable

implements: ERC20


event Transfer:
    _from: indexed(address)
    _to: indexed(address)
    _amount: uint256

event Approval:
    _owner: indexed(address)
    _spender: indexed(address)
    _amount: uint256

event SetAdmin:
    admin: address

event SetController:
    controller: address

TRANSFER: constant(Bytes[4]) = method_id(
    "transfer(address,uint256)", output_type=Bytes[4]
)
TRANSFER_FROM: constant(Bytes[4]) = method_id(
    "transferFrom(address,address,uint256)", output_type=Bytes[4]
)

balanceOf: public(HashMap[address, uint256])
allowances: HashMap[address, HashMap[address, uint256]]
totalSupply: public(uint256)

token: public(address)
controller: public(address)
admin: public(address)


@external
def __init__(_token: address, _controller: address):
    """
    @notice Contract constructor
    @param _token Token address
    @param _controller Controller address
    """
    self.token = _token
    self.controller = _controller
    self.admin = msg.sender


@external
@view
def allowance(_owner : address, _spender : address) -> uint256:
    """
    @notice Check the amount of tokens that an owner allowed _to a spender
    @param _owner The address which owns the funds
    @param _spender The address which will spend the funds
    @return uint256 specifying the amount of tokens still available for the _spender
    """
    return self.allowances[_owner][_spender]


@external
def transfer(_to : address, _amount : uint256) -> bool:
    """
    @notice Transfer `_amount` tokens from `msg.sender` to `_to`
    @dev Vyper does not allow underflows, so the subtraction in
         this function will revert on an insufficient balance
    @param _to The address to transfer to
    @param _amount The amount to be transferred
    @return bool success
    """
    assert _to != ZERO_ADDRESS, "zero address"

    self.balanceOf[msg.sender] -= _amount
    self.balanceOf[_to] += _amount
    log Transfer(msg.sender, _to, _amount)

    return True


@external
def transferFrom(_from : address, _to : address, _amount : uint256) -> bool:
    """
    @notice Transfer `_amount` tokens from `_from` to `_to`
    @param _from address The address which you want to send tokens from
    @param _to address The address which you want to transfer to
    @param _amount uint256 the amount of tokens to be transferred
    @return bool success
    """
    assert _to != ZERO_ADDRESS, "zero address"

    # NOTE: vyper does not allow underflows
    #       so the following subtraction would revert on insufficient balance
    self.balanceOf[_from] -= _amount
    self.balanceOf[_to] += _amount
    self.allowances[_from][msg.sender] -= _amount
    log Transfer(_from, _to, _amount)

    return True


@external
def approve(_spender : address, _amount : uint256) -> bool:
    """
    @notice Approve `_spender` to transfer `_amount` tokens on behalf of `msg.sender`
    @dev Approval may only be from zero -> nonzero or from nonzero -> zero in order
        to mitigate the potential race condition described here:
        https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    @param _spender The address which will spend the funds
    @param _amount The amount of tokens to be spent
    @return bool success
    """
    assert _amount == 0 or self.allowances[msg.sender][_spender] == 0, "amount != 0 and allowance != 0"

    self.allowances[msg.sender][_spender] = _amount
    log Approval(msg.sender, _spender, _amount)

    return True


@internal
def _mint(_to: address, _amount: uint256):
    """
    @notice Mint `_amount` tokens and assign them to `_to`
    @dev Emits a Transfer event originating from 0x00
    @param _to The account that will receive the created tokens
    @param _amount The amount that will be created
    """
    assert _to != ZERO_ADDRESS, "zero address"

    self.totalSupply += _amount
    self.balanceOf[_to] += _amount

    log Transfer(ZERO_ADDRESS, _to, _amount)


@internal
def _burn(_from: address, _amount: uint256):
    """
    @notice Burn `_amount` tokens belonging to `from`
    @dev Emits a Transfer event with a destination of 0x00
    @param _from The account to burn tokens from
    @param _amount The amount that will be burned
    """
    assert _from != ZERO_ADDRESS, "zero address"

    self.balanceOf[_from] -= _amount
    self.totalSupply -= _amount

    log Transfer(_from, ZERO_ADDRESS, _amount)


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


@internal
def _safeTransferFrom(_token: address, _from: address, _to: address, _amount: uint256):
    """
    @notice call ERC20 transfer and handle the two cases whether boolean is returned or not
    @param _token ERC20 token address
    @param _from Address to transfer from
    @param _to Address to transfer to
    @param _amount Amount to transfer
    """
    # data = 100 bytes
    # 4  bytes method id
    # 32 bytes from address
    # 32 bytes to address
    # 32 bytes amount (uint256)
    self._call(_token, concat(
        TRANSFER_FROM,
        convert(_from, bytes32),
        convert(_to, bytes32),
        convert(_amount, bytes32)
    ))


@external
def setAdmin(_admin: address):
    """
    @notice Set the new admin.
    @param _admin New admin address
    """
    assert msg.sender == self.admin, "!admin"

    self.admin = _admin
    log SetAdmin(_admin)


@external
def setController(_controller: address):
    """
    @notice Set the new controller.
    @param _controller New controller address
    """
    assert msg.sender == self.admin, "!admin"

    self.controller = _controller
    log SetController(_controller)


@internal
@view
def _getBalance() -> uint256:
    """
    @notice Sum of token balances of this contract and controller
    """
    return ERC20(self.token).balanceOf(self) + Controller(self.controller).balanceOf(self)


@external
@view
def getBalance() -> uint256:
    """
    @notice Sum of token balances of this contract and controller
    """
    return self._getBalance()


@external
def earn():
    """
    @notice Transfer token to controller
    """
    bal: uint256 = self._getBalance()
    self._safeTransfer(self.token, self.controller, bal)
    Controller(self.controller).earn(self.token, bal)


@external
def deposit(_amount: uint256):
    """
    @notice Deposit token
    @param _amount The amount that will be burned
    """
    bal: uint256 = self._getBalance()
    before: uint256 = ERC20(self.token).balanceOf(self)
    self._safeTransferFrom(self.token, msg.sender, self, _amount)
    after: uint256 = ERC20(self.token).balanceOf(self)
    # TODO: is this necessary?
    diff: uint256 = after - before # dev: additional check for deflationary tokens

    shares: uint256 = 0
    if self.totalSupply == 0:
        shares = _amount
    else:
        # s = shares to mint
        # T = total supply of shares before minting
        # a = amount of tokens to deposit
        # B = balance of tokens before deposit
        # s / (T + s) = a / (B + a)
        # s = a * T / B
        shares = (_amount * self.totalSupply) / bal

    self._mint(msg.sender, shares)


@external
def withdraw(_shares: uint256):
    """
    @notice Withdraw token for shares
    @param _shares Shares owned by msg.sender
    """

    # s = shares
    # T = total supply
    # a = amount of tokens
    # B = balance of tokens
    # s / T = a / B
    # a = s * B / T
    amount: uint256 = (self._getBalance() * _shares) / self.totalSupply
    self._burn(msg.sender, amount)

    # Withdraw from controller if token balance of this contract < amount to transfer to msg.sender
    bal: uint256 = ERC20(self.token).balanceOf(self)
    if bal < amount:
        withdrawAmount: uint256 = amount - bal
        Controller(self.controller).withdraw(self, withdrawAmount)
        after: uint256 = ERC20(self.token).balanceOf(self)
        diff: uint256 = after - bal
        if after < amount:
            amount = after

    self._safeTransfer(self.token, msg.sender, amount)