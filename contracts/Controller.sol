pragma solidity 0.5.17;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IController.sol";
import "./IVault.sol";
import "./IStrategy.sol";
import "./AccessControl.sol";

contract Controller is IController, AccessControl {
    using SafeMath for uint;

    address public admin;
    address public treasury;

    constructor(address _treasury) public {
        require(_treasury != address(0), "treasury = zero address");

        admin = msg.sender;
        treasury = _treasury;

        _authorize(admin);
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

    function authorize(address _addr) external onlyAdmin {
        _authorize(_addr);
    }

    function unauthorize(address _addr) external onlyAdmin {
        _unauthorize(_addr);
    }

    function setStrategy(
        address _vault,
        address _strategy,
        uint _min
    ) external onlyAuthorized {
        IVault(_vault).setStrategy(_strategy, _min);
    }

    function invest(address _vault) external onlyAuthorized {
        IVault(_vault).invest();
    }

    // @dev Warning: harvest can be called on strategy that is not set to any vault
    function harvest(address _strategy) external onlyAuthorized {
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
    ) external onlyAuthorized checkWithdraw(_strategy, _min) {
        IStrategy(_strategy).withdraw(_amount);
    }

    // @dev Warning: withdrawAll can be called on strategy that is not set to any vault
    function withdrawAll(address _strategy, uint _min)
        external
        onlyAuthorized
        checkWithdraw(_strategy, _min)
    {
        IStrategy(_strategy).withdrawAll();
    }

    // @dev Warning: exit can be called on strategy that is not set to any vault
    function exit(address _strategy, uint _min)
        external
        onlyAuthorized
        checkWithdraw(_strategy, _min)
    {
        IStrategy(_strategy).exit();
    }
}
