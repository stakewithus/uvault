// TODO: lock version
pragma solidity ^0.6.0;

// TODO create ERC20 lite to save gas
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../../interfaces/uniswap/Uniswap.sol";
import "../../interfaces/curve/ICurveFi.sol";
import "../../interfaces/curve/Gauge.sol";
import "../../interfaces/curve/Minter.sol";
import "../interfaces/IController.sol";
import "../interfaces/IStrategy.sol";

contract StrategyUsdcToYcrv is IStrategy {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    address override public admin;
    address override public controller;
    address override public vault;

    address constant private usdc = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
    function underlyingToken() override external view returns (address) {
        return usdc;
    }

    function underlyingBalance() override external view returns (uint) {
        return 0;
    }
    function deposit(uint amount) override external {
    }

    function withdraw(uint amount) override external {
    }

    function withdrawAll() override external {

    }
    function harvest() override external {

    }
    function exit() override external {

    }
}