pragma solidity 0.5.17;

import "./IController.sol";
import "./IVault.sol";
import "./IStrategy.sol";

contract Controller is IController {
    address public admin;
    address public treasury;

    constructor(address _treasury) public {
        require(_treasury != address(0), "treasury = zero address");

        admin = msg.sender;
        treasury = _treasury;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "!admin");
        _;
    }

    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0), "admin = zero address");
        admin = _admin;
    }

    function setTreasury(address _treasury) external onlyAdmin {
        require(_treasury != address(0), "treasury = zero address");
        treasury = _treasury;
    }

    function invest(address _vault) external onlyAdmin {
        IVault(_vault).invest();
    }

    function switchStrategy(address _vault) external onlyAdmin {
        IVault(_vault).switchStrategy();
    }

    function rebalance(address _vault) external onlyAdmin {
        IVault(_vault).rebalance();
    }

    function harvest(address _strategy) external onlyAdmin {
        IStrategy(_strategy).harvest();
    }

    function withdrawAll(address _strategy) external onlyAdmin {
        IStrategy(_strategy).withdrawAll();
    }

    function exit(address _strategy) external onlyAdmin {
        IStrategy(_strategy).exit();
    }
}