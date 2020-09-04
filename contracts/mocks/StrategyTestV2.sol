// TODO: lock solidity version
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
// TODO SafeERC20 lite
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// TODO use more gas efficient ERC20
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../interfaces/IController.sol";
import "../interfaces/IStrategy.sol";

contract StrategyTestV2 is IStrategy {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    address public admin;
    address public override controller;
    address public override vault;

    address public override token;
    address public pool;

    uint public withdrawFee = 50;
    uint public withdrawFeeMax = 10000;

    constructor(
        address _controller, address _vault,
        address _token, address _pool
    ) public {
        require(_controller != address(0)); // dev: controller == zero address
        require(_vault != address(0)); // dev: vault == zero address
        require(_token != address(0)); // dev: token == zero address
        require(_pool != address(0)); // dev: pool == zero address

        admin = msg.sender;
        controller = _controller;
        vault = _vault;

        token = _token;
        pool = _pool;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin); // dev: !admin
        _;
    }

    modifier onlyVault() {
        require(msg.sender == vault); // dev: !vault
        _;
    }

    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0)); // dev: admin == zero address
        admin = _admin;
    }

    function setController(address _controller) external onlyAdmin {
        require(_controller != address(0)); // dev: controller == zero address
        controller = _controller;
    }

    function setWithdrawFee(uint _fee) external onlyAdmin {
        require(_fee <= withdrawFeeMax); // dev: withdraw fee > max
        withdrawFee = _fee;
    }

    function balance() override external view returns (uint) {
        return IERC20(token).balanceOf(address(this)).add(IERC20(token).balanceOf(pool));
    }

    function deposit(uint _amount) override external onlyVault {
        require(_amount > 0); // amount == 0

        // NOTE: msg.sender == vault
        IERC20(token).safeTransferFrom(msg.sender, address(this), _amount);
        IERC20(token).safeTransfer(pool, _amount);
    }

    function withdraw(uint _amount) override external onlyVault {
        require(_amount > 0); // amount == 0

        uint bal = IERC20(token).balanceOf(address(this));
        uint amount = _amount;

        if (bal < _amount) {
            IERC20(token).safeTransferFrom(pool, address(this), amount - bal);

            uint balAfter = IERC20(token).balanceOf(address(this));
            if (balAfter < amount) {
                amount = balAfter;
            }
        }

        uint fee = amount.mul(withdrawFee).div(withdrawFeeMax);

        if (fee > 0) {
            address treasury = IController(controller).treasury();
            require(treasury != address(0)); // dev: treasury == zero address

            IERC20(token).safeTransfer(treasury, fee);
        }

        // NOTE: msg.sender == vault
        IERC20(token).safeTransfer(msg.sender, amount.sub(fee));
    }
}

