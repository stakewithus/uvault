pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

/* solium-disable */
contract ERC20Token is ERC20, ERC20Detailed {
    constructor() public ERC20Detailed("test", "TEST", 18) {}

    /* test helper */
    function _mint_(address _to, uint _amount) external {
        _mint(_to, _amount);
    }

    function _burn_(address _from, uint _amount) external {
        _burn(_from, _amount);
    }

    function _approve_(
        address _from,
        address _to,
        uint _amount
    ) external {
        _approve(_from, _to, _amount);
    }
}
