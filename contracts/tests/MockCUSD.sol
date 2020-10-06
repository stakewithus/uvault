pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

contract MockCUSD is ERC20, ERC20Detailed {
    constructor() public ERC20Detailed("cUSD", "cUSD", 6) {}
}
