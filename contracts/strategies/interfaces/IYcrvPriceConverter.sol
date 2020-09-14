pragma solidity ^0.6.0;

interface IYcrvPriceConverter {
  function getUnderlyingPrice(uint _yCrvAmount, uint _underlyingTokenIndex) external view returns (uint);
}
