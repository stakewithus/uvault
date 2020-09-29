pragma solidity 0.5.17;

import "./IController.sol";
import "./IVault.sol";
import "./IStrategy.sol";

contract Controller is IController {
    address public admin;
    address public treasury;
    address public gasRelayer;

    constructor(address _treasury, address _gasRelayer) public {
        require(_treasury != address(0), "treasury = zero address");
        require(_gasRelayer != address(0), "gas relayer = zero address");

        admin = msg.sender;
        treasury = _treasury;
        gasRelayer = _gasRelayer;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "!admin");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == admin || msg.sender == gasRelayer, "!authorized");
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

    function setGasRelayer(address _gasRelayer) external onlyAdmin {
        require(_gasRelayer != address(0), "gas relayer = zero address");
        gasRelayer = _gasRelayer;
    }

    function invest(address _vault) external onlyAuthorized {
        IVault(_vault).invest();
    }

    function setStrategy(address _vault, address _strategy) external onlyAuthorized {
        IVault(_vault).setStrategy(_strategy);
    }

    function rebalance(address _vault) external onlyAuthorized {
        IVault(_vault).rebalance();
    }

    function harvest(address _strategy) external onlyAuthorized {
        IStrategy(_strategy).harvest();
    }

    function withdrawAll(address _strategy) external onlyAuthorized {
        IStrategy(_strategy).withdrawAll();
    }

    function exit(address _strategy) external onlyAuthorized {
        IStrategy(_strategy).exit();
    }
}
