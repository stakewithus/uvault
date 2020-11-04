// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.11;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./protocol/IController.sol";
import "./protocol/IVault.sol";
import "./protocol/IStrategy.sol";
import "./AccessControl.sol";

contract Controller is IController, AccessControl {
    using SafeMath for uint;

    bytes32 public constant override ADMIN_ROLE = keccak256(abi.encodePacked("ADMIN"));
    bytes32 public constant override HARVESTER_ROLE = keccak256(
        abi.encodePacked("HARVESTER")
    );

    address public override admin;
    address public override treasury;

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

    /*
    @dev Dont forget to revoke ADMIN_ROLE and HARVESTER_ROLE for old admin
    @dev Dont forget to grant ADMIN_ROLE and HARVESTER_ROLE for new admin
    */
    function setAdmin(address _admin) external override onlyAdmin {
        require(_admin != address(0), "admin = zero address");
        admin = _admin;
    }

    function setTreasury(address _treasury) external override onlyAdmin {
        require(_treasury != address(0), "treasury = zero address");
        treasury = _treasury;
    }

    function grantRole(bytes32 _role, address _addr) external override onlyAdmin {
        require(_role == ADMIN_ROLE || _role == HARVESTER_ROLE, "invalid role");
        _grantRole(_role, _addr);
    }

    function revokeRole(bytes32 _role, address _addr) external override onlyAdmin {
        require(_role == ADMIN_ROLE || _role == HARVESTER_ROLE, "invalid role");
        _revokeRole(_role, _addr);
    }

    function setStrategy(
        address _vault,
        address _strategy,
        uint _min
    ) external override onlyAuthorized(ADMIN_ROLE) {
        IVault(_vault).setStrategy(_strategy, _min);
    }

    function invest(address _vault) external override onlyAuthorized(HARVESTER_ROLE) {
        IVault(_vault).invest();
    }

    // @dev Warning: harvest can be called on strategy that is not set to any vault
    function harvest(address _strategy)
        external
        override
        onlyAuthorized(HARVESTER_ROLE)
    {
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
    ) external override onlyAuthorized(HARVESTER_ROLE) checkWithdraw(_strategy, _min) {
        IStrategy(_strategy).withdraw(_amount);
    }

    // @dev Warning: withdrawAll can be called on strategy that is not set to any vault
    function withdrawAll(address _strategy, uint _min)
        external
        override
        onlyAuthorized(ADMIN_ROLE)
        checkWithdraw(_strategy, _min)
    {
        IStrategy(_strategy).withdrawAll();
    }

    // @dev Warning: exit can be called on strategy that is not set to any vault
    function exit(address _strategy, uint _min)
        external
        override
        onlyAuthorized(ADMIN_ROLE)
        checkWithdraw(_strategy, _min)
    {
        IStrategy(_strategy).exit();
    }
}
