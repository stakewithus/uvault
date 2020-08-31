# @version 0.2.4
"""
@title StakeWithUs Vault
@author StakeWithUs
@dev Based on https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/ERC20CRV.vy
@dev Vyper implementation / fork of https://github.com/iearn-finance/vaults/blob/master/contracts/yVault.sol
"""

from vyper.interfaces import ERC20

interface Controller:
    def balanceOf(addr: address) -> uint256: view
    def deposit(amount: uint256): nonpayable
    def withdraw(amount: uint256): nonpayable

implements: ERC20

# TODO: reentrancy lock
# TODO: circuit breaker

event Transfer:
    _from: indexed(address)
    _to: indexed(address)
    _amount: uint256

event Approval:
    _owner: indexed(address)
    _spender: indexed(address)
    _amount: uint256

# log to keep track of nonces that were used in a transaction
event TxNonce:
    _signer: indexed(address)
    _nonce: uint256

SIGN_PREFIX: constant(Bytes[28]) = b"\x19Ethereum Signed Message:\n32"

TRANSFER: constant(Bytes[4]) = method_id(
    "transfer(address,uint256)", output_type=Bytes[4]
)
TRANSFER_FROM: constant(Bytes[4]) = method_id(
    "transferFrom(address,address,uint256)", output_type=Bytes[4]
)

# number of batches
BATCH_SIZE: constant(uint256) = 100

name: public(String[64])
symbol: public(String[32])
decimals: public(uint256)

balanceOf: public(HashMap[address, uint256])
allowances: HashMap[address, HashMap[address, uint256]]
totalSupply: public(uint256)

token: public(address)
controller: public(address)
admin: public(address)

# mapping from signed and execute hash to bool
# true if tx corresponding to hash was executed
executed: public(HashMap[bytes32, bool])

@external
def __init__(
    _token: address, _controller: address,
    _name: String[64], _symbol: String[32], _decimals: uint256
):
    """
    @notice Contract constructor
    @param _token Token address
    @param _controller Controller address
    @param _name Token full name
    @param _symbol Token symbol
    @param _decimals Number of decimals for token
    """
    self.token = _token
    self.controller = _controller
    self.admin = msg.sender

    self.name = _name
    self.symbol = _symbol
    self.decimals = _decimals


### ERC20 ###
# TODO: test ERC20 functions
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
    assert _amount == 0 or self.allowances[msg.sender][_spender] == 0 # dev: amount != 0 and allowance != 0

    self.allowances[msg.sender][_spender] = _amount
    log Approval(msg.sender, _spender, _amount)

    return True


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
    assert _to != ZERO_ADDRESS # dev: to == zero addresss

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
    assert _to != ZERO_ADDRESS # dev: to == zero address

    # NOTE: vyper does not allow underflows
    #       so the following subtraction would revert on insufficient balance
    self.balanceOf[_from] -= _amount
    self.balanceOf[_to] += _amount
    self.allowances[_from][msg.sender] -= _amount
    log Transfer(_from, _to, _amount)

    return True


@internal
def _mint(_to: address, _amount: uint256):
    """
    @notice Mint `_amount` tokens and assign them to `_to`
    @dev Emits a Transfer event originating from 0x00
    @param _to The account that will receive the created tokens
    @param _amount The amount that will be created
    """
    assert _to != ZERO_ADDRESS # dev: to == zero address

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
    assert _from != ZERO_ADDRESS # dev: from == zero address

    self.balanceOf[_from] -= _amount
    self.totalSupply -= _amount

    log Transfer(_from, ZERO_ADDRESS, _amount)

### low level call ###
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
        assert convert(_response, bool) # dev: ERC20 transfer failed


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

### Vault functions ###
@external
def setAdmin(_admin: address):
    """
    @notice Set the new admin.
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
    bal: uint256 = ERC20(self.token).balanceOf(self)
    # Many ERC20s require approval from zero to nonzero or nonzero to zero
    ERC20(self.token).approve(self.controller, 0)
    ERC20(self.token).approve(self.controller, bal)
    Controller(self.controller).deposit(bal)


@internal
def _isValidSig(_digest: bytes32, _v: uint256, _r: uint256, _s: uint256, _signer: address) -> bool:
    """
    @notice Call approve for an array of tokens
    @param _digest Hash that was signed
    @param _v Signature param
    @param _r Signature param
    @param _s Signature param
    @param _signer Expected signer
    """
    return _signer == ecrecover(keccak256(concat(SIGN_PREFIX, _digest)), _v, _r, _s)


@internal
@view
def _getTxHash(
    _from: address, _to: address, _amount: uint256, _min: uint256,
    _nonce: uint256
) -> bytes32:
    """
    @notice Get hash of transfer between Vault token and underlying token
    @dev hash is used to sign deposit and withdraw
    @param _from Address to transfer from
    @param _amount The amount that will be transferred
    @param _min Minimum amount of token to return to prevent slippage
    @param _nonce Nonce used to sign
    @return bytes32 hash
    """
    return keccak256(concat(
        convert(self, bytes32),
        convert(_from, bytes32),
        convert(_to, bytes32),
        convert(_amount, bytes32),
        convert(_min, bytes32),
        convert(_nonce, bytes32)
    ))


@external
@view
def getTxHash(
    _from: address, _to: address, _amount: uint256, _min: uint256,
    _nonce: uint256
) -> bytes32:
    """
    @notice Get hash of transfer between Vault token and underlying token
    @dev hash is used to sign deposit and withdraw
    @param _from Address to transfer from
    @param _amount The amount that will be transferred
    @param _min Minimum amount of token to return to prevent slippage
    @param _nonce Nonce used to sign
    @return bytes32 hash
    """
    return self._getTxHash(_from, _to, _amount, _min, _nonce)


@internal
def _deposit(
    _from: address, _amount: uint256, _min: uint256, _nonce: uint256,
    _v: uint256, _r: uint256, _s: uint256
):
    """
    @notice Deposit token
    @param _from Address to transfer token from
    @param _amount The amount of tokens to deposit
    @param _min Minimum amount of shares to mint to prevent slippage
    @param _nonce Nonce used to sign
    @param _v Signature param
    @param _r Signature param
    @param _s Signature param
    @dev `_from` will not be zero address unless signer is zero address
    """
    txHash: bytes32 = self._getTxHash(
        _from, self, _amount, _min, _nonce
    )
    assert not self.executed[txHash] # dev: tx executed
    assert self._isValidSig(txHash, _v, _r, _s, _from) # dev: invalid sig

    self.executed[txHash] = True

    # TODO view function to calculate shares to be minted?
    bal: uint256 = self._getBalance()
    before: uint256 = ERC20(self.token).balanceOf(self)
    self._safeTransferFrom(self.token, _from, self, _amount)
    after: uint256 = ERC20(self.token).balanceOf(self)
    # Additional check for deflationary tokens
    diff: uint256 = after - before

    shares: uint256 = 0
    if self.totalSupply == 0:
        shares = diff
    else:
        # s = shares to mint
        # T = total supply of shares before minting
        # a = amount of tokens deposited
        # B = balance of tokens before deposit
        # s / (T + s) = a / (B + a)
        # s = a * T / B
        shares = (diff * self.totalSupply) / bal

    assert shares >= _min # dev: shares < min shares to mint

    self._mint(_from, shares)

    log TxNonce(_from, _nonce)


@external
def deposit(
    _from: address, _amount: uint256, _min: uint256, _nonce: uint256,
    _v: uint256, _r: uint256, _s: uint256
):
    """
    @notice Deposit token
    @param _from Address to transfer token from
    @param _amount The amount of tokens to deposit
    @param _min Minimum amount of shares to mint to prevent slippage
    @param _nonce Nonce used to sign
    @param _v Signature param
    @param _r Signature param
    @param _s Signature param
    """
    self._deposit(_from, _amount, _min, _nonce, _v, _r, _s)


@external
def batchDeposit(
    _signers: address[BATCH_SIZE], _amounts: uint256[BATCH_SIZE], _mins: uint256[BATCH_SIZE],
    _nonces: uint256[BATCH_SIZE],
    _vs: uint256[BATCH_SIZE], _rs: uint256[BATCH_SIZE], _ss: uint256[BATCH_SIZE]
):
    for i in range(BATCH_SIZE):
        signer: address = _signers[i]

        # break on first zero address
        if signer == ZERO_ADDRESS:
            break

        amount: uint256 = _amounts[i]
        _min: uint256 = _mins[i]
        nonce: uint256 = _nonces[i]
        v: uint256 = _vs[i]
        r: uint256 = _rs[i]
        s: uint256 = _ss[i]

        self._deposit(signer, amount, _min, nonce, v, r, s)


@internal
def _withdraw(
    _to: address, _shares: uint256, _min: uint256, _nonce: uint256,
    _v: uint256, _r: uint256, _s: uint256
):
    """
    @notice Withdraw token for shares
    @param _to Address to withdraw shares and transfer underlying token to
    @param _shares Shares to burn
    @param _min Minimum tokens to return, prevent slippage
    @param _nonce Nonce used to sign
    @param _v Signature param
    @param _r Signature param
    @param _s Signature param
    """
    txHash: bytes32 = self._getTxHash(self, _to, _shares, _min, _nonce)
    assert not self.executed[txHash] # dev: tx executed
    assert self._isValidSig(txHash, _v, _r, _s, _to) # dev: invalid sig

    self.executed[txHash] = True

    # s = shares
    # T = total supply
    # a = amount of tokens
    # B = balance of tokens
    # s / T = a / B
    # a = s * B / T
    amount: uint256 = (self._getBalance() * _shares) / self.totalSupply
    self._burn(_to, amount)

    # Withdraw from controller if token balance of this contract < amount to transfer to _to
    bal: uint256 = ERC20(self.token).balanceOf(self)
    if bal < amount:
        Controller(self.controller).withdraw(amount - bal)
        after: uint256 = ERC20(self.token).balanceOf(self)
        if after < amount:
            amount = after

    assert amount >= _min # dev: amount < min tokens to return

    self._safeTransfer(self.token, _to, amount)

    log TxNonce(_to, _nonce)


@external
def withdraw(
    _to: address, _shares: uint256, _min: uint256, _nonce: uint256,
    _v: uint256, _r: uint256, _s: uint256
):
    """
    @notice Withdraw token for shares
    @param _to Address to withdraw shares and transfer underlying token to
    @param _shares Shares to burn
    @param _min Minimum tokens to return, prevent slippage
    @param _nonce Nonce used to sign
    @param _v Signature param
    @param _r Signature param
    @param _s Signature param
    """
    self._withdraw(_to, _shares, _min, _nonce, _v, _r, _s)


# @external
# TODO: frontrunning?
# def batchWithdraw(
#     _accounts: address[100], _amounts: uint256[100], _nonces: uint256[100],
#     _vs: uint256[100], _rs: uint256[100], _ss: uint256[100],
# ):
#     # TODO: prevent slippage
#     # TODO: verify signature (address, token, amount, nonce)? or only allow admin to batch? call from gas relayer?
#     for i in range(100):
#         # TODO break if less than 100
#         addr: address = _accounts[i]
#         amount: uint256 = _amounts[i]
#         nonce: uint256 = _nonces[i]
#         v: uint256 = _vs[i]
#         r: uint256 = _rs[i]
#         s: uint256 = _ss[i]

#         # valid sig proves account exists, so we can safely transfer
#         # TODO: vulnerable to DOS
#         # TODO: let all tx fail?
#         # TODO: _safeTransfer can fail
#         # TODO signature verification can fail
#         # TODO: check total _amounts >= total supply
#         # TODO withdraw total from controller and then burn shares
#         self._withdraw(addr, amount, nonce, v, r, s)
