// TODO lock solidity
pragma solidity ^0.6.0;

import "./interfaces/IYcrvPriceConverter.sol";

// Contract address
// 0xbBC81d23Ea2c3ec7e56D39296F0cbB648873a5d3
interface Zap {
  function calc_withdraw_one_coin(uint _token_amount, int128 i) external view returns (uint);
}

contract YcrvPriceConverter is IYcrvPriceConverter {
  address public constant zap = address(0xbBC81d23Ea2c3ec7e56D39296F0cbB648873a5d3);

  function getUnderlyingPrice( uint _yCrvAmount, uint _underlyingTokenIndex)
    override external view returns (uint)
  {
    return Zap(zap).calc_withdraw_one_coin(
      _yCrvAmount, int128(_underlyingTokenIndex)
    );
  }
}