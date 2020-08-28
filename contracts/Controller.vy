# @version 0.2.4
"""
@title StakeWithUs Controller
@author StakeWithUs
@dev Vyper implementation / fork of https://github.com/iearn-finance/vaults/blob/master/contracts/StrategyControllerV2.sol
"""

from vyper.interfaces import ERC20

interface Strategy:
    def want() -> address: view
    def getBalance() -> uint256: view
    def deposit(amount: uint256): nonpayable
    def withdraw(amount: uint256): nonpayable

# TODO: docs
# TODO: test
# TODO: events
# TODO: invest dust
# TODO: create file for interfaces Vault, Strategy, Controller
# TODO: circuit breaker
# TODO remove log to save gas?


event Withdraw:
    vault: indexed(address)
    amount: uint256

TRANSFER: constant(Bytes[4]) = method_id(
    "transfer(address,uint256)", output_type=Bytes[4]
)

TRANSFER_FROM: constant(Bytes[4]) = method_id(
    "transferFrom(address,address,uint256)", output_type=Bytes[4]
)

# vault to strategy mapping
strategies: public(HashMap[address, address])
isVault: public(HashMap[address, bool])

admin: public(address)
# TODO withdraw to treasury
treasury: public(address)


@external
def __init__(_treasury: address):
    """
    @param _treasury Address of treasury to send withdrawal fees from strategy
    """
    assert _treasury != ZERO_ADDRESS # dev: treasury == zero address

    self.admin = msg.sender
    self.treasury = _treasury


@external
def setAdmin(_admin: address):
    """
    @notice Set admin
    @param _admin Address of new admin
    """
    assert msg.sender == self.admin # dev: !admin
    assert _admin != ZERO_ADDRESS # dev: admin == zero address

    self.admin = _admin


@external
def setTreasury(_treasury: address):
    """
    @notice Set treasury
    @param _treasury Address of new treasury
    """
    assert msg.sender == self.admin # dev: !admin
    assert _treasury != ZERO_ADDRESS # dev: treasury == zero address

    self.treasury = _treasury


@external
def setStrategy(_vault: address, _strategy: address):
    """
    @notice Set mapping from `_vault` to `_strategy`
    @param _vault Address of vault
    @param _strategy Address of strategy
    """
    assert msg.sender == self.admin # dev: !admin
    assert _vault != ZERO_ADDRESS # dev: vault == zero address
    assert _strategy != ZERO_ADDRESS # dev: strategy == zero address

    current: address = self.strategies[_vault]
    if current != ZERO_ADDRESS:
        bal: uint256 = Strategy(current).getBalance()
        Strategy(current).withdraw(bal)

    self.strategies[_vault] = _strategy
    self.isVault[_vault] = True


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


@external
@view
def balanceOf(_vault: address) -> uint256:
    """
    @notice Get balance of vault
    @param _vault Address of vault
    @return balance of `_vault`
    """
    return Strategy(self.strategies[_vault]).getBalance()


@external
def deposit(_amount: uint256):
    """
    @notice Deposit into strategy
    @param _amount Amount of tokens to deposit from vault into strategy
    @dev `msg.sender` must be a vault
    """
    assert self.isVault[msg.sender] # dev: !vault

    strategy: address = self.strategies[msg.sender]
    assert strategy != ZERO_ADDRESS # dev: strategy == zero address

    want: address = Strategy(strategy).want()

    self._safeTransferFrom(want, msg.sender, self, _amount)
    # Many ERC20s require approval from zero to nonzero or nonzero to zero
    ERC20(want).approve(strategy, 0)
    ERC20(want).approve(strategy, _amount)

    Strategy(strategy).deposit(_amount)


@external
def withdraw(_amount: uint256):
    assert self.isVault[msg.sender] # dev: !vault

    strategy: address = self.strategies[msg.sender]
    assert strategy != ZERO_ADDRESS # dev: zero address

    want: address = Strategy(strategy).want()

    before: uint256 = ERC20(want).balanceOf(self)
    Strategy(strategy).withdraw(_amount)
    after: uint256 = ERC20(want).balanceOf(self)

    self._safeTransfer(want, msg.sender, after - before)

    log Withdraw(msg.sender, _amount)
