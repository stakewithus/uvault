pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../IController.sol";
import "../IStrategy.sol";
import "../BaseStrategy.sol";

contract StrategyTest is IStrategy, BaseStrategy {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    address public underlying;

    // test helper
    bool public _harvestWasCalled_;
    bool public _exitWasCalled_;
    bool public _sweepWasCalled_;
    address public _sweepToken_;
    bool public _withdrawAllWasCalled_;
    uint public _withdrawAmount_;
    // simulate strategy transferring less than requested
    uint public _maxTransferAmount_ = uint(-1);

    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public BaseStrategy(_controller, _vault) {
        require(_underlying != address(0), "underlying = zero address");

        underlying = _underlying;
    }

    function _totalAssets() internal view returns (uint) {
        return IERC20(underlying).balanceOf(address(this));
    }

    function totalAssets() external view returns (uint) {
        return _totalAssets();
    }

    function deposit(uint _underlyingAmount) external onlyVault {
        require(_underlyingAmount > 0, "underlying = 0");

        IERC20(underlying).safeTransferFrom(vault, address(this), _underlyingAmount);
    }

    function withdraw(uint _underlyingAmount) external onlyVaultOrController {
        require(_underlyingAmount > 0, "underlying = 0");

        _withdrawAmount_ = _underlyingAmount;
        // transfer to vault
        _transfer(vault, _underlyingAmount);
    }

    function _withdrawAll() internal {
        _withdrawAllWasCalled_ = true;

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            _withdrawAmount_ = underlyingBal;
            _transfer(vault, underlyingBal);
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

    function _setMaxTransferAmount_(uint _max) external {
        _maxTransferAmount_ = _max;
    }

    function _transfer(address _to, uint _amount) internal {
        if (_amount > _maxTransferAmount_) {
            IERC20(underlying).safeTransfer(_to, _maxTransferAmount_);
        } else {
            IERC20(underlying).safeTransfer(_to, _amount);
        }
    }
}
