// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

/*
Changes
- remove functions related to slippage and delta
- add keeper
- remove _increaseDebt
- remove _decreaseDebt
*/

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./protocol/IStrategyETH_V3.sol";
// used inside harvest
import "./protocol/IController.sol";

abstract contract StrategyETH_V3 is IStrategyETH_V3 {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    address public override admin;
    address public nextAdmin;
    address public override controller;
    address public immutable override vault;
    // Placeholder address to indicate that this is ETH strategy
    address public constant override underlying =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    // some functions specific to strategy cannot be called by controller
    // so we introduce a new role
    address public keeper;

    // total amount of underlying transferred from vault
    uint public override totalDebt;

    // performance fee sent to treasury when harvest() generates profit
    uint public performanceFee = 500;
    uint private constant PERFORMANCE_FEE_CAP = 2000; // upper limit to performance fee
    uint internal constant PERFORMANCE_FEE_MAX = 10000;

    // Force exit, in case normal exit fails
    bool public forceExit;

    constructor(
        address _controller,
        address _vault,
        address _keeper
    ) public {
        require(_controller != address(0), "controller = zero address");
        require(_vault != address(0), "vault = zero address");
        require(_keeper != address(0), "keeper = zero address");

        admin = msg.sender;
        controller = _controller;
        vault = _vault;
        keeper = _keeper;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "!admin");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == admin ||
                msg.sender == controller ||
                msg.sender == vault ||
                msg.sender == keeper,
            "!authorized"
        );
        _;
    }

    function setNextAdmin(address _nextAdmin) external onlyAdmin {
        require(_nextAdmin != admin, "next admin = current");
        // allow next admin = zero address (cancel next admin)
        nextAdmin = _nextAdmin;
    }

    function acceptAdmin() external {
        require(msg.sender == nextAdmin, "!next admin");
        admin = msg.sender;
        nextAdmin = address(0);
    }

    function setController(address _controller) external onlyAdmin {
        require(_controller != address(0), "controller = zero address");
        controller = _controller;
    }

    function setKeeper(address _keeper) external onlyAdmin {
        require(_keeper != address(0), "keeper = zero address");
        keeper = _keeper;
    }

    function setPerformanceFee(uint _fee) external onlyAdmin {
        require(_fee <= PERFORMANCE_FEE_CAP, "performance fee > cap");
        performanceFee = _fee;
    }

    function setForceExit(bool _forceExit) external onlyAdmin {
        forceExit = _forceExit;
    }

    function totalAssets() external view virtual override returns (uint);

    function deposit() external payable virtual override;

    function withdraw(uint) external virtual override;

    function withdrawAll() external virtual override;

    function harvest() external virtual override;

    function skim() external virtual override;

    function exit() external virtual override;

    function sweep(address) external virtual override;
}
