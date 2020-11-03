pragma solidity ^0.5.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./IStrategy.sol";

contract StrategyBase is IStrategy {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    address public underlying;

    address public admin;
    address public controller;
    address public vault;

    uint public totalDebt;

    // performance fee sent to treasury when harvest() generates profit
    uint public performanceFee = 100;
    uint internal constant PERFORMANCE_FEE_MAX = 10000;

    // valuable tokens that cannot be swept
    mapping(address => bool) public assets;

    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public {
        require(_controller != address(0), "controller = zero address");
        require(_vault != address(0), "vault = zero address");
        require(_underlying != address(0), "underlying = zero address");

        admin = msg.sender;
        controller = _controller;
        vault = _vault;
        underlying = _underlying;

        assets[underlying] = true;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "!admin");
        _;
    }

    modifier onlyVault() {
        require(msg.sender == vault, "!vault");
        _;
    }

    modifier onlyAdminOrController() {
        require(msg.sender == admin || msg.sender == controller, "!authorized");
        _;
    }

    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0), "admin = zero address");
        admin = _admin;
    }

    function setController(address _controller) external onlyAdmin {
        require(_controller != address(0), "controller = zero address");
        controller = _controller;
    }

    function setPerformanceFee(uint _fee) external onlyAdmin {
        require(_fee <= PERFORMANCE_FEE_MAX, "performance fee > max");
        performanceFee = _fee;
    }

    function sweep(address _token) external onlyAdmin {
        require(!assets[_token], "asset");

        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
