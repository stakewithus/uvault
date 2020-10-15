pragma solidity 0.5.17;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IController.sol";
import "./IVault.sol";
import "./IStrategy.sol";
import "./AccessControl.sol";

contract Controller is IController, AccessControl {
    using SafeMath for uint;

    bytes32 public constant ADMIN_ROLE = keccak256(abi.encodePacked("ADMIN"));
    bytes32 public constant HARVESTER_ROLE = keccak256(abi.encodePacked("HARVESTER"));

    address public admin;
    address public treasury;

    constructor(address _treasury) public {
        require(_treasury != address(0), "treasury = zero address");

        admin = msg.sender;
        treasury = _treasury;

        _grantRole(ADMIN_ROLE, admin);
        _grantRole(HARVESTER_ROLE, admin);
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

    function grantRole(bytes32 _role, address _addr) external onlyAdmin {
        require(_role == ADMIN_ROLE || _role == HARVESTER_ROLE, "invalid role");
        _grantRole(_role, _addr);
    }

    function revokeRole(bytes32 _role, address _addr) external onlyAdmin {
        require(_role == ADMIN_ROLE || _role == HARVESTER_ROLE, "invalid role");
        _revokeRole(_role, _addr);
    }

    function setStrategy(
        address _vault,
        address _strategy,
        uint _min
    ) external onlyAuthorized(ADMIN_ROLE) {
        IVault(_vault).setStrategy(_strategy, _min);
    }

    function invest(address _vault) external onlyAuthorized(HARVESTER_ROLE) {
        IVault(_vault).invest();
    }

    // @dev Warning: harvest can be called on strategy that is not set to any vault
    function harvest(address _strategy) external onlyAuthorized(HARVESTER_ROLE) {
        IStrategy(_strategy).harvest();
    }

    modifier checkWithdraw(address _strategy, uint _min) {
        address vault = IStrategy(_strategy).vault();
        address token = IVault(vault).token();

        uint balBefore = IERC20(token).balanceOf(vault);
        _;
        uint balAfter = IERC20(token).balanceOf(vault);

        require(balAfter.sub(balBefore) >= _min, "withdraw < min");
    }

    // @dev Warning: withdraw can be called on strategy that is not set to any vault
    function withdraw(
        address _strategy,
        uint _amount,
        uint _min
    ) external onlyAuthorized(HARVESTER_ROLE) checkWithdraw(_strategy, _min) {
        IStrategy(_strategy).withdraw(_amount);
    }

    // @dev Warning: withdrawAll can be called on strategy that is not set to any vault
    function withdrawAll(address _strategy, uint _min)
        external
        onlyAuthorized(ADMIN_ROLE)
        checkWithdraw(_strategy, _min)
    {
        IStrategy(_strategy).withdrawAll();
    }

    // @dev Warning: exit can be called on strategy that is not set to any vault
    function exit(address _strategy, uint _min)
        external
        onlyAuthorized(ADMIN_ROLE)
        checkWithdraw(_strategy, _min)
    {
        IStrategy(_strategy).exit();
    }
}
