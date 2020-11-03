pragma solidity 0.5.17;

import "../IController.sol";
import "../StrategyBase.sol";

contract StrategyTest is StrategyBase {
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
    ) public StrategyBase(_controller, _vault, _underlying) {}

    function _totalAssets() internal view returns (uint) {
        return IERC20(underlying).balanceOf(address(this));
    }

    function totalAssets() external view returns (uint) {
        return _totalAssets();
    }

    function deposit(uint _underlyingAmount) external onlyVault {
        require(_underlyingAmount > 0, "underlying = 0");
        _increaseDebt(_underlyingAmount);
    }

    function withdraw(uint _underlyingAmount) external onlyVault {
        require(_underlyingAmount > 0, "underlying = 0");

        _withdrawAmount_ = _underlyingAmount;
        _withdraw(_underlyingAmount);
    }

    function _withdrawAll() internal {
        _withdrawAllWasCalled_ = true;

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            _withdrawAmount_ = underlyingBal;
            _withdraw(underlyingBal);
        }
    }

    function withdrawAll() external onlyVault {
        _withdrawAll();
    }

    function harvest() external onlyAdminOrController {
        _harvestWasCalled_ = true;
    }

    function exit() external onlyVault {
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

    function _withdraw(uint _amount) internal {
        uint withdrawAmount = _amount;
        if (_amount > _maxTransferAmount_) {
            withdrawAmount = _maxTransferAmount_;
        }
        _decreaseDebt(withdrawAmount);
    }
}
