# @version 0.2.4
"""
@title StakeWithUs StrategyYVault
@author StakeWithUs
"""

from vyper.interfaces import ERC20

interface Controller:
    def treasury() -> address: view
    def vaults(strategy: address) -> address: view

interface YVault:
    def balanceOf() -> uint256: nonpayable
    def deposit(amount: uint256): nonpayable
    def withdraw(amount: uint256): nonpayable

event SetAdmin:
    admin: address

event SetController:
    controller: address

event SetWithdrawFee:
    fee: uint256

# TODO: events, doc, test
TRANSFER: constant(Bytes[4]) = method_id(
    "transfer(address,uint256)", output_type=Bytes[4]
)

TRANSFER_FROM: constant(Bytes[4]) = method_id(
    "transferFrom(address,address,uint256)", output_type=Bytes[4]
)

# yCRV
WANT: constant(address) = 0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8
# yVault
POOL: constant(address) = 0x5dbcF33D8c2E976c6b560249878e6F1491Bca25c

controller: public(address)
admin: public(address)

withdrawFee: public(uint256)
withdrawFeeMax: public(uint256)

@external
def __init__(_controller: address):
    self.admin = msg.sender
    self.controller = _controller

    self.withdrawFee = 50
    self.withdrawFeeMax = 10000


@external
def setAdmin(_admin: address):
    """
    @notice Set admin
    @param _admin New admin address
    """
    assert msg.sender == self.admin, "!admin"
    assert _admin != ZERO_ADDRESS, "admin == zero address"

    self.admin = _admin
    log SetAdmin(_admin)


@external
def setController(_controller: address):
    """
    @notice Set the new controller.
    @param _controller New controller address
    """
    assert msg.sender == self.admin, "!admin"
    assert _controller != ZERO_ADDRESS, "controller == zero address"

    self.controller = _controller
    log SetController(_controller)


@external
def setWithdrawFee(_fee: uint256):
    """
    @notice Set withdraw fee
    @param _fee New withdraw fee
    """
    assert msg.sender == self.admin, "!admin"

    self.withdrawFee = _fee
    log SetWithdrawFee(_fee)


@external
@view
def want() -> address:
    """
    @notice Get address of token to invest
    @return address of token to invest
    """
    return WANT


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


@internal
def _getBalance() -> uint256:
    return ERC20(WANT).balanceOf(self) + YVault(POOL).balanceOf()


@external
def getBalance() -> uint256:
    return self._getBalance()


@external
def deposit(_amount: uint256):
    self._safeTransferFrom(WANT, self.controller, self, _amount)

    bal: uint256 = ERC20(WANT).balanceOf(self)
    if bal > 0:
        ERC20(WANT).approve(POOL, 0)
        ERC20(WANT).approve(POOL, bal)
        YVault(POOL).deposit(bal)


@external
def withdraw(_amount: uint256):
    assert msg.sender == self.controller, "!controller"

    bal: uint256 = ERC20(WANT).balanceOf(self)
    amount: uint256 = _amount
    if bal < amount:
        YVault(POOL).withdraw(amount - bal)
        after: uint256 = ERC20(WANT).balanceOf(self)
        if after < amount:
            amount = after

    fee: uint256 = (amount * self.withdrawFee) / self.withdrawFeeMax
    if fee > 0:
        treasury: address = Controller(self.controller).treasury()
        assert treasury != ZERO_ADDRESS, "treasury == zero address"
        # fee can be lost if treasury is an address not controlled by StakeWithUs
        self._safeTransfer(WANT, treasury, fee)

    vault: address = Controller(self.controller).vaults(self)
    assert vault != ZERO_ADDRESS, "vault == zero address"

    # TODO: use pull pattern?
    self._safeTransfer(WANT, vault, amount - fee)
