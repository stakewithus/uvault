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
    def deposit(): nonpayable
    def withdraw(amount: uint256): nonpayable

# TODO: create file for interfaces Vault, Strategy, Controller
# TODO: circuit breaker


TRANSFER_FROM: constant(Bytes[4]) = method_id(
    "transferFrom(address,address,uint256)", output_type=Bytes[4]
)

# vault to strategy mapping
strategies: public(HashMap[address, address])
# strategy to vault mapping
vaults: public(HashMap[address, address])
isVault: public(HashMap[address, bool])

admin: public(address)
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
    @notice Set mapping between `_vault` and `_strategy`
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
    self.vaults[_strategy] = _vault
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

    self._safeTransferFrom(want, msg.sender, strategy, _amount)
    Strategy(strategy).deposit()


@external
def withdraw(_amount: uint256):
    """
    @notice Withdraw from strategy
    @param _amount Amount of tokens to withdraw from strategy into vault
    @dev `msg.sender` must be a vault
    """
    assert self.isVault[msg.sender] # dev: !vault

    strategy: address = self.strategies[msg.sender]
    assert strategy != ZERO_ADDRESS # dev: strategy == zero address

    Strategy(strategy).withdraw(_amount)
