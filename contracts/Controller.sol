// TODO: lock solidity version
pragma solidity ^0.6.0;

import "./interfaces/IController.sol";

contract Controller is IController {
    address override public admin;
    address override public treasury;

    constructor(address _treasury) public {
        require(_treasury != address(0)); // dev: treasury == zero address

        admin = msg.sender;
        treasury = _treasury;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin); // dev: !admin
        _;
    }

    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0)); // dev: admin == zero address
        admin = _admin;
    }

    function setTreaury(address _treasury) external onlyAdmin {
        require(_treasury != address(0)); // dev: treasury == zero address
        treasury = _treasury;
    }
}