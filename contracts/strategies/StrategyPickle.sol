pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../interfaces/pickle/PickleJar.sol";

import "../IController.sol";
import "../IStrategy.sol";
import "../BaseStrategy.sol";

contract StrategyPickle is IStrategy, BaseStrategy {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    address public underlying;
    address internal jar;

    constructor(address _controller, address _vault)
        public
        BaseStrategy(_controller, _vault)
    {}

    function _totalAssets() private view returns (uint) {
        uint pricePerShare = PickleJar(jar).getRatio().div(1e18);
        return PickleJar(jar).balanceOf(address(this)).mul(pricePerShare);
    }

    function totalAssets() external view returns (uint) {
        return _totalAssets();
    }

    function deposit(uint _underlyingAmount) external onlyVault {
        require(_underlyingAmount > 0, "underlying = 0");

        IERC20(underlying).safeTransferFrom(vault, address(this), _underlyingAmount);
        PickleJar(jar).deposit(_underlyingAmount);
    }

    function withdraw(uint _underlyingAmount) external onlyVaultOrController {
        require(_underlyingAmount > 0, "underlying = 0");
        uint totalUnderlying = _totalAssets();
        require(_underlyingAmount <= totalUnderlying, "underlying > total");

        // calculate amount of shares to withdraw
        /*
        u = amount of underlying to withdraw
        U = total underlying redeemable
        s = amount of shares to withdraw
        T = total amount of shares

        u / U = s / T
        s = u / U * T
        */
        uint pickleBal = PickleJar(jar).balanceOf(address(this));
        uint pickleAmount = _underlyingAmount.mul(pickleBal).div(totalUnderlying);

        if (pickleAmount > 0) {
            PickleJar(jar).withdraw(pickleAmount);
        }

        // transfer underlying token to vault
        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeTransfer(vault, underlyingBal);
        }
    }

    function _withdrawAll() private {
        uint pickleBal = PickleJar(jar).balanceOf(address(this));
        if (pickleBal > 0) {
            PickleJar(jar).withdraw(pickleBal);
        }

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeTransfer(vault, underlyingBal);
        }
    }

    function withdrawAll() external onlyVaultOrController {
        _withdrawAll();
    }

    function harvest() external onlyController {
        // TODO: harvest Pickle
    }

    function exit() external onlyVaultOrController {
        _withdrawAll();
    }

    function sweep(address _token) external onlyAdmin {
        require(_token != underlying, "token = underlying");
        require(_token != jar, "token = pickle");
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
