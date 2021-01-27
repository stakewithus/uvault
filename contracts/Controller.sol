// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./protocol/IController.sol";
import "./protocol/IVaultBase.sol";
import "./protocol/IStrategyBase.sol";
import "./AccessControl.sol";

/*
version 1.1.0

Changes from Controller V1
- Check vault and strategy are approved by admin.
  Protect from arbitrary contract to be passed into invest, harvest, skim, etc...
- compatible with ERC20 and ETH vault / strategy
  (checks withdraw min for ERC20 and ETH strategies)
- add setStrategyAndInvest
*/

// TODO reentrancy
contract Controller is IController, AccessControl {
    using SafeMath for uint;

    event ApproveVault(address vault, bool approved);
    event ApproveStrategy(address strategy, bool approved);

    // WARNING: not address of ETH, used as placeholder
    address private constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    // keccak256(abi.encodePacked("ADMIN"));
    bytes32 public constant override ADMIN_ROLE =
        0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42;
    // keccak256(abi.encodePacked("HARVESTER"));
    bytes32 public constant override HARVESTER_ROLE =
        0x27e3e4d29d60af3ae6456513164bb5db737d6fc8610aa36ad458736c9efb884c;

    address public override admin;
    address public override treasury;

    // approved vaults
    mapping(address => bool) public vaults;
    // approved strategies
    mapping(address => bool) public strategies;

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

    modifier onlyApprovedVault(address _vault) {
        require(vaults[_vault], "!approved vault");
        _;
    }

    modifier onlyApprovedStrategy(address _strategy) {
        require(strategies[_strategy], "!approved strategy");
        _;
    }

    modifier isCurrentStrategy(address _strategy) {
        address vault = IStrategyBase(_strategy).vault();
        /*
        Check that _strategy is the current strategy used by the vault.
        */
        require(IVaultBase(vault).strategy() == _strategy, "!strategy");
        _;
    }

    function setAdmin(address _admin) external override onlyAdmin {
        require(_admin != address(0), "admin = zero address");

        _revokeRole(ADMIN_ROLE, admin);
        _revokeRole(HARVESTER_ROLE, admin);

        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(HARVESTER_ROLE, _admin);

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

    function approveVault(address _vault) external onlyAdmin {
        require(!vaults[_vault], "already approved vault");
        vaults[_vault] = true;
        emit ApproveVault(_vault, true);
    }

    function revokeVault(address _vault) external onlyAdmin {
        require(vaults[_vault], "!approved vault");
        vaults[_vault] = false;
        emit ApproveVault(_vault, false);
    }

    function approveStrategy(address _strategy) external onlyAdmin {
        require(!strategies[_strategy], "already approved strategy");
        strategies[_strategy] = true;
        emit ApproveStrategy(_strategy, true);
    }

    function revokeStrategy(address _strategy) external onlyAdmin {
        require(strategies[_strategy], "!approved strategy");
        strategies[_strategy] = false;
        emit ApproveStrategy(_strategy, false);
    }

    function setStrategy(
        address _vault,
        address _strategy,
        uint _min
    ) external override onlyAuthorized(ADMIN_ROLE) {
        IVaultBase(_vault).setStrategy(_strategy, _min);
    }

    function invest(address _vault)
        external
        override
        onlyAuthorized(HARVESTER_ROLE)
        onlyApprovedVault(_vault)
    {
        IVaultBase(_vault).invest();
    }

    /*
    @notice Set strategy for vault and invest
    @param _vault Address of vault
    @param _strategy Address of strategy
    @param _min Minimum undelying token current strategy must return. Prevents slippage
    @dev Set strategy and invest in single transaction to avoid front running
    */
    function setStrategyAndInvest(
        address _vault,
        address _strategy,
        uint _min
    ) external onlyAuthorized(ADMIN_ROLE) {
        IVaultBase(_vault).setStrategy(_strategy, _min);
        IVaultBase(_vault).invest();
    }

    function harvest(address _strategy)
        external
        override
        onlyAuthorized(HARVESTER_ROLE)
        onlyApprovedStrategy(_strategy)
        isCurrentStrategy(_strategy)
    {
        IStrategyBase(_strategy).harvest();
    }

    function skim(address _strategy)
        external
        override
        onlyAuthorized(HARVESTER_ROLE)
        onlyApprovedStrategy(_strategy)
        isCurrentStrategy(_strategy)
    {
        IStrategyBase(_strategy).skim();
    }

    modifier checkWithdraw(address _strategy, uint _min) {
        address vault = IStrategyBase(_strategy).vault();
        address token = IVaultBase(vault).token();

        uint balBefore;
        uint balAfter;
        if (token == ETH) {
            balBefore = address(vault).balance;
            _;
            balAfter = address(vault).balance;
        } else {
            balBefore = IERC20(token).balanceOf(vault);
            _;
            balAfter = IERC20(token).balanceOf(vault);
        }

        require(balAfter.sub(balBefore) >= _min, "withdraw < min");
    }

    function withdraw(
        address _strategy,
        uint _amount,
        uint _min
    )
        external
        override
        onlyAuthorized(HARVESTER_ROLE)
        onlyApprovedStrategy(_strategy)
        isCurrentStrategy(_strategy)
        checkWithdraw(_strategy, _min)
    {
        IStrategyBase(_strategy).withdraw(_amount);
    }

    function withdrawAll(address _strategy, uint _min)
        external
        override
        onlyAuthorized(HARVESTER_ROLE)
        onlyApprovedStrategy(_strategy)
        isCurrentStrategy(_strategy)
        checkWithdraw(_strategy, _min)
    {
        IStrategyBase(_strategy).withdrawAll();
    }

    function exit(address _strategy, uint _min)
        external
        override
        onlyAuthorized(ADMIN_ROLE)
        onlyApprovedStrategy(_strategy)
        isCurrentStrategy(_strategy)
        checkWithdraw(_strategy, _min)
    {
        IStrategyBase(_strategy).exit();
    }
}
