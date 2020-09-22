pragma solidity ^0.5.16;

import "./IController.sol";

contract Controller is IController {
    address public admin;
    address public treasury;

    constructor(address _treasury) public {
        require(_treasury != address(0)); // dev: treasury = zero address

        admin = msg.sender;
        treasury = _treasury;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin); // dev: !admin
        _;
    }

    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0)); // dev: admin = zero address
        admin = _admin;
    }

    function setTreasury(address _treasury) external onlyAdmin {
        require(_treasury != address(0)); // dev: treasury = zero address
        treasury = _treasury;
    }
}