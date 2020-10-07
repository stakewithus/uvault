pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../IController.sol";
import "../IStrategy.sol";

contract StrategyTest is IStrategy {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    address public admin;
    address public controller;
    address public vault;

    // performance fee sent to treasury when harvest() generates profit
    uint public performanceFee = 50;
    uint public constant PERFORMANCE_FEE_MAX = 10000;

    address public underlying;

    // test helper
    bool public _harvestWasCalled_;
    bool public _exitWasCalled_;
    bool public _sweepWasCalled_;
    address public _sweepToken_;
    bool public _withdrawAllWasCalled_;
    uint public _withdrawAmount_;

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
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "!admin");
        _;
    }

    modifier onlyController() {
        require(msg.sender == controller, "!controller");
        _;
    }

    modifier onlyVault() {
        require(msg.sender == vault, "!vault");
        _;
    }

    modifier onlyVaultOrController() {
        require(msg.sender == vault || msg.sender == controller, "!vault and !controller");
        _;
    }

    function _underlyingBalance() internal view returns (uint) {
        return IERC20(underlying).balanceOf(address(this));
    }

    function underlyingBalance() external view returns (uint) {
        return _underlyingBalance();
    }

    function deposit(uint _underlyingAmount) external onlyVault {
        require(_underlyingAmount > 0, "underlying = 0");

        IERC20(underlying).safeTransferFrom(vault, address(this), _underlyingAmount);
    }

    function withdraw(uint _underlyingAmount) external onlyVaultOrController {
        require(_underlyingAmount > 0, "underlying = 0");

        _withdrawAmount_ = _underlyingAmount;
        // transfer to vault
        IERC20(underlying).safeTransfer(vault, _underlyingAmount);
    }

    function _withdrawAll() internal {
        _withdrawAllWasCalled_ = true;

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            _withdrawAmount_ = underlyingBal;
            IERC20(underlying).safeTransfer(vault, underlyingBal);
        }
    }

    function withdrawAll() external onlyVaultOrController {
        _withdrawAll();
    }

    function harvest() external onlyController {
        _harvestWasCalled_ = true;
    }

    function exit() external onlyVaultOrController {
        _exitWasCalled_ = true;
        _withdrawAll();
    }

    function sweep(address _token) external {
        _sweepWasCalled_ = true;
        _sweepToken_ = _token;
    }

    // test helpers
    function _setVault_(address _vault) external {
        vault = _vault;
    }

    function _setUnderlying_(address _token) external {
        underlying = _token;
    }
}
