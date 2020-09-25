pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../IController.sol";
import "../IStrategy.sol";

contract StrategyMainnetTest is IStrategy {
    using SafeMath for uint;

    address public admin;
    address public controller;
    address public vault;

    uint public withdrawFee = 50;
    uint public withdrawFeeMax = 10000;

    // performance fee sent to treasury when harvest() generates profit
    uint public performanceFee = 50;
    uint public performanceFeeMax = 10000;

    address constant private usdc = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
    address constant private dai = address(0x6B175474E89094C44Da98b954EedeAC495271d0F);

    address constant private underlying = usdc;

    // test helper
    bool public _harvestWasCalled_;

    constructor(address _controller, address _vault) public {
        require(_controller != address(0), "controller = zero address");
        require(_vault != address(0), "vault = zero address");

        admin = msg.sender;
        controller = _controller;
        vault = _vault;
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
        require(
            msg.sender == vault || msg.sender == controller ,
            "!vault and !controller"
        );
        _;
    }

    function underlyingToken() external view returns (address) {
        return underlying;
    }

    function _underlyingBalance() internal view returns (uint) {
        return IERC20(underlying).balanceOf(address(this));
    }

    function underlyingBalance() external view returns (uint) {
        return _underlyingBalance();
    }

    function deposit(uint _underlyingAmount) external onlyVault {
        require(_underlyingAmount > 0, "underlying = 0");

        IERC20(underlying).transferFrom(
            msg.sender, address(this), _underlyingAmount
        );
    }

    function withdraw(uint _underlyingAmount) external onlyVault {
        require(_underlyingAmount > 0, "underlying = 0");

        // transfer fee to treasury
        uint fee = _underlyingAmount.mul(withdrawFee).div(withdrawFeeMax);
        if (fee > 0) {
            address treasury = IController(controller).treasury();
            require(treasury != address(0), "treasury = zero address");

            IERC20(underlying).transfer(treasury, fee);
        }

        // transfer rest to vault
        IERC20(underlying).transfer(msg.sender, _underlyingAmount.sub(fee));
    }

    function _withdrawAll() internal {
        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).transfer(vault, underlyingBal);
        }
    }

    function withdrawAll() external onlyVaultOrController {
        _withdrawAll();
    }

    function harvest() external onlyController {
        _harvestWasCalled_ = true;
    }

    function exit() external onlyVaultOrController {
        _withdrawAll();
   }
}