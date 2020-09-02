from vyper.interfaces import ERC20

interface GasToken:
    def mint(amount: uint256): nonpayable
    def free(amount: uint256) -> bool: nonpayable
    def freeUpTo(amount: uint256) -> uint256: nonpayable

# TODO test

owner: public(address)
gasToken: public(address)
whitelist: public(HashMap[address, bool])


@external
def __init__(_gasToken: address):
    self.owner = msg.sender
    self.gasToken = _gasToken
    # Owner is always whitelisted
    self.whitelist[self.owner] = True


@external
def addWhitelist(_addresses: address[5]):
    """
    @notice Adds operators to the whitelist
    @param _addresses An fixed array of addresses to add to whitelist
    """
    assert msg.sender == self.owner  # dev: !owner
    for i in range(5):
        _address: address = _addresses[i]
        if _address != ZERO_ADDRESS:
            self.whitelist[_address] = True


@external
def removeWhitelist(_addresses: address[5]):
    """
    @notice Removes operators from the whitelist
    @param _addresses An fixed array of addresses to remove from whitelist
    """
    assert msg.sender == self.owner # dev: !owner
    for i in range(5):
        _address: address = _addresses[i]
        if _address != ZERO_ADDRESS:
            self.whitelist[_address] = False

# TODO whitelist can set gas token
@external
def mintGasToken(_value: uint256):
    """
    @notice Mints GST2 with the gas supplied
    @dev GST2 Tokens are stored in the smart contract, accessible by operators on the whitelist
    @param _value The amount of cGST2 to mint. 100 cGST2 = GST2
    """
    GasToken(self.gasToken).mint(_value)


@external
def transferGasToken(_to: address, _value: uint256):
    """
    @notice Transfers GST2 to another address
    @param _to The destination address
    @param _value Amount of GST2 to transfer in cGST2
    """
    assert msg.sender == self.owner # dev: !owner
    assert ERC20(self.gasToken).balanceOf(self) >= _value # dev: gas token balance < value
    ERC20(self.gasToken).transfer(_to, _value)


# TODO: find out max bytes size for batching deposit and withdraw
@external
def relayTx(_value: uint256, _to: address, _to_data: Bytes[6000]):
    """
    @notice Relays a tx
    @param _value Amount of GST2 to burn
    @param _to Address to relay the tx to
    @param _to_data Calldata payload for the tx
    """
    assert self.whitelist[msg.sender] # dev: !whitelist
    assert ERC20(self.gasToken).balanceOf(self) >= _value # dev: gas token balance < value

    if _value > 0:
        GasToken(self.gasToken).freeUpTo(_value)

    # Call the Meta Tx
    raw_call(
        _to,
        _to_data,
        max_outsize=0
    )
