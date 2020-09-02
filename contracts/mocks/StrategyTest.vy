# @version 0.2.4
"""
Strategy used for dev and test
"""

from vyper.interfaces import ERC20

interface Controller:
    def treasury() -> address: view
    def vaults(_strategy: address) -> address: view


TRANSFER: constant(Bytes[4]) = method_id(
    "transfer(address,uint256)", output_type=Bytes[4]
)

TRANSFER_FROM: constant(Bytes[4]) = method_id(
    "transferFrom(address,address,uint256)", output_type=Bytes[4]
)

want: public(address)
pool: public(address)

controller: public(address)
admin: public(address)

withdrawFee: public(uint256)
withdrawFeeMax: public(uint256)

@external
def __init__(_controller: address, _want: address, _pool: address):
    self.admin = msg.sender
    self.controller = _controller

    self.want = _want
    self.pool = _pool

    self.withdrawFee = 50
    self.withdrawFeeMax = 10000


@external
def setAdmin(_admin: address):
    """
    @notice Set admin
    @param _admin New admin address
    """
    assert msg.sender == self.admin # dev: !admin
    assert _admin != ZERO_ADDRESS # dev: admin == zero address

    self.admin = _admin


@external
def setController(_controller: address):
    """
    @notice Set the new controller.
    @param _controller New controller address
    """
    assert msg.sender == self.admin # dev: !admin
    assert _controller != ZERO_ADDRESS # dev: controller == zero address

    self.controller = _controller


@external
def setWithdrawFee(_fee: uint256):
    """
    @notice Set withdraw fee
    @param _fee New withdraw fee
    """
    assert msg.sender == self.admin # dev: !admin

    self.withdrawFee = _fee


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
        assert convert(_response, bool) # dev: ERC20 transfer failed!


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
@view
def _getBalance() -> uint256:
    """
    @notice Get balance of `want` in this contract and pool
    @return uint256 balance
    """
    return ERC20(self.want).balanceOf(self) + ERC20(self.want).balanceOf(self.pool)


@external
@view
def getBalance() -> uint256:
    """
    @notice Get balance of `want` in this contract and pool
    @return uint256 balance
    """
    return self._getBalance()


@external
def deposit():
    """
    @notice Deposit balance into yVault
    """
    assert msg.sender == self.controller # dev: !controller

    bal: uint256 = ERC20(self.want).balanceOf(self)
    if bal > 0:
        self._safeTransfer(self.want, self.pool, bal)


@external
def withdraw(_amount: uint256):
    """
    @notice Withdraw `_amount` from yVault to vault
    @param _amount Amount of yCRV to withdraw
    """
    assert msg.sender == self.controller # dev: !controller
    assert _amount > 0 # dev: amount == 0

    bal: uint256 = ERC20(self.want).balanceOf(self)
    amount: uint256 = _amount
    if bal < amount:
        # NOTE: pool must approve before transfer
        self._safeTransferFrom(self.want, self.pool, self, amount - bal)
        after: uint256 = ERC20(self.want).balanceOf(self)
        if after < amount:
            amount = after

    # transfer to treasury
    fee: uint256 = (amount * self.withdrawFee) / self.withdrawFeeMax
    if fee > 0:
        treasury: address = Controller(self.controller).treasury()
        assert treasury != ZERO_ADDRESS # dev: treasury == zero address
        # TODO: transfer fee to controller?
        # fee can be lost if treasury is an address not controlled by StakeWithUs
        self._safeTransfer(self.want, treasury, fee)

    # # transfer to vault
    vault: address = Controller(self.controller).vaults(self)
    assert vault != ZERO_ADDRESS # dev: vault == zero address

    self._safeTransfer(self.want, vault, amount - fee)
