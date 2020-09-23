pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

contract ERC20Token is ERC20, ERC20Detailed {
    constructor() ERC20Detailed("test", "test", 18) public  {}

    function mint(address _to, uint _amount) external {
        _mint(_to, _amount);
    }
}