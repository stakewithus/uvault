// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./protocol/IStrategyERC20_V3.sol";

// WARNING: This contract size is very close to max size (24k)
contract StrategyERC20Split is IStrategyERC20_V3 {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    struct Strategy {
        // ratio of underlying that will be deposited into this strategy
        // when deposit() is called
        uint depositRatio;
        bool approved;
        bool active;
    }

    event ApproveStrategy(address strategy);
    event RevokeStrategy(address strategy);

    address public timeLock;
    address public override admin;
    address public override controller;
    address public immutable override vault;
    address public immutable override underlying;
    // Allow bot to call functions
    address public keeper;

    // total amount of underlying transferred from vault
    uint public override totalDebt;

    // Force exit, in case normal exit fails
    bool public forceExit;

    uint private constant MAX_ACTIVE_STRATEGIES = 10;
    address[] public activeStrategies;
    mapping(address => Strategy) public strategies;
    // max sum of deposit ratios of active strategies
    uint private constant MAX_TOTAL_DEPOSIT_RATIO = 10000;
    // sum of deposit ratios
    uint public totalDepositRatio;

    constructor(
        address _controller,
        address _vault,
        address _underlying,
        address _timeLock,
        address _keeper
    ) public {
        require(_controller != address(0), "controller = zero address");
        require(_vault != address(0), "vault = zero address");
        require(_underlying != address(0), "underlying = zero address");
        require(_timeLock != address(0), "time lock = zero address");
        require(_keeper != address(0), "keeper = zero address");

        admin = msg.sender;
        controller = _controller;
        vault = _vault;
        underlying = _underlying;
        timeLock = _timeLock;
        keeper = _keeper;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "!admin");
        _;
    }

    modifier onlyAdminOrKeeper() {
        require(msg.sender == admin || msg.sender == keeper, "!keeper");
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

    modifier onlyTimeLock() {
        require(msg.sender == timeLock, "!timeLock");
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

    function setTimeLock(address _timeLock) external onlyTimeLock {
        require(_timeLock != address(0), "time lock = zero address");
        timeLock = _timeLock;
    }

    function setKeeper(address _keeper) external onlyAdmin {
        require(_keeper != address(0), "keeper = zero address");
        keeper = _keeper;
    }

    function setForceExit(bool _forceExit) external onlyAdmin {
        forceExit = _forceExit;
    }

    /*
    @notice Approve strategy
    @param _strategy Address of strategy
    @dev Only time lock can execute this function

    Approve / activate state transitions

           approveStrategy()   activateStrategy()
                   |               |
    not approved -----> approved -----> approved & active
                 <-----          <-----
                    |              |
            revokeStrategy()   deactivateStrategy()
    */
    function approveStrategy(address _strategy) external onlyTimeLock {
        Strategy storage strategy = strategies[_strategy];

        require(!strategy.approved, "approved");

        require(
            IStrategyERC20_V3(_strategy).vault() == address(this),
            "!strategy.vault"
        );
        require(
            IStrategyERC20_V3(_strategy).underlying() == underlying,
            "!strategy.underlying"
        );

        strategy.approved = true;

        emit ApproveStrategy(_strategy);
    }

    /*
    @notice Revoke strategy
    @param _strategy Address of strategy
    */
    function revokeStrategy(address _strategy) external onlyAdmin {
        Strategy storage strategy = strategies[_strategy];

        require(strategy.approved, "!approved");
        require(!strategy.active, "active");

        delete strategies[_strategy];

        emit RevokeStrategy(_strategy);
    }

    /*
    @notice Activate strategy
    @param _strategy Address of strategy
    @param _depositRatio Ratio of deposit this strategy will receive
    */
    function activateStrategy(address _strategy, uint _depositRatio)
        external
        onlyAdmin
    {
        Strategy storage strategy = strategies[_strategy];

        require(strategy.approved, "!approved");
        require(!strategy.active, "active");

        require(_depositRatio > 0, "deposit ratio = 0 ");

        totalDepositRatio = totalDepositRatio.add(_depositRatio);
        require(
            totalDepositRatio <= MAX_TOTAL_DEPOSIT_RATIO,
            "total deposit ratio > max"
        );

        require(activeStrategies.length < MAX_ACTIVE_STRATEGIES, "active > max");
        activeStrategies.push(_strategy);

        strategy.active = true;
        strategy.depositRatio = _depositRatio;

        // TODO: infinite approval?
        // IERC20(underlying).approve(_strategy, type(uint).max);
    }

    /*
    @notice Deactivate strategy
    @param _strategy Address of strategy
    @param _min Minimum underlying to return from exiting a strategy
    */
    function deactivateStrategy(address _strategy, uint _min) external onlyAdmin {
        Strategy storage strategy = strategies[_strategy];

        require(strategy.active, "!active");

        totalDepositRatio = totalDepositRatio.sub(strategy.depositRatio);

        // reset all states except strategy.approved
        strategy.active = false;
        strategy.depositRatio = 0;

        // remove _strategy, preserve array order //
        // algorithm test at https://github.com/stakewithus/echidna-test/contracts/ArrayShift.sol
        // find index of _strategy
        for (uint i = 0; i < activeStrategies.length; i++) {
            if (activeStrategies[i] == _strategy) {
                /*
                if i == activeStrategies.length - 1
                    pop last element
                else i < activeStrategies.length - 1
                    shift elements to the left by one
                    pop last element
                */
                // here activeStrategies.length >= 1
                for (uint j = i; j < activeStrategies.length - 1; j++) {
                    activeStrategies[i] = activeStrategies[j + 1];
                }
                activeStrategies.pop();
                break;
            }
        }

        uint balBefore = IERC20(underlying).balanceOf(address(this));
        IStrategyERC20_V3(_strategy).exit();
        uint balAfter = IERC20(underlying).balanceOf(address(this));

        require(balAfter.sub(balBefore) >= _min, "exit < min");

        // TODO: infinite approval?
        // IERC20(underlying).approve(_strategy, 0);
    }

    /*
    @notice Set order of withdraw for active strategies
    @param _strategies Addresses of active strategies
    */
    function setActiveStrategies(address[] calldata _strategies)
        external
        onlyAdminOrKeeper
    {
        require(_strategies.length == activeStrategies.length, "!strategies.length");

        // Check strategy is active and no duplicates
        for (uint i = 0; i < _strategies.length; i++) {
            Strategy storage strategy = strategies[_strategies[i]];
            // if duplicate, this will fail
            require(strategy.active, "!active");
            strategy.active = false;
        }

        for (uint i = 0; i < _strategies.length; i++) {
            address strategy = _strategies[i];
            activeStrategies[i] = strategy;
            strategies[strategy].active = true;
        }
    }

    /*
    @notice Update deposit ratios of active strategies
    @param _depositRatios Array of deposit ratios
    */
    function setDepositRatios(uint[] calldata _depositRatios)
        external
        onlyAdminOrKeeper
    {
        require(
            _depositRatios.length == activeStrategies.length,
            "!depositRatios.length"
        );

        // totalDepositRatio, use memory to save gas from SSTORE
        uint total;
        for (uint i = 0; i < _depositRatios.length; i++) {
            uint depositRatio = _depositRatios[i];
            // allow deposit ratio = 0

            strategies[activeStrategies[i]].depositRatio = depositRatio;
            total = total.add(depositRatio);
        }

        totalDepositRatio = total;
        // allow total deposit ratio = 0
        require(
            totalDepositRatio <= MAX_TOTAL_DEPOSIT_RATIO,
            "total deposit ratio > max"
        );
    }

    /*
    @notice Returns count of active strategies
    @return Length of `activeStrategies`
    */
    function getActiveStrategiesCount() external view returns (uint) {
        return activeStrategies.length;
    }

    function _totalAssets() private view returns (uint) {
        // TODO: save gas?
        uint total = IERC20(underlying).balanceOf(address(this));
        for (uint i = 0; i < activeStrategies.length; i++) {
            total = total.add(IStrategyERC20_V3(activeStrategies[i]).totalAssets());
        }
        return total;
        /*
        total = bal + total deposited into strats + total profit - total loss
        */
    }

    function totalAssets() external view override returns (uint) {
        return _totalAssets();
    }

    function _depositStrategy(address _strategy, uint _amount) private {
        require(_amount > 0, "deposit = 0");

        Strategy storage strategy = strategies[_strategy];

        require(strategy.active, "!active");

        // TODO: inifinite approval?
        // TODO: use approve() to save gas?
        IERC20(underlying).safeApprove(_strategy, 0);
        IERC20(underlying).safeApprove(_strategy, _amount);

        IStrategyERC20_V3(_strategy).deposit(_amount);
    }

    /*
    @notice Deposit underlying token into this contract
    @param _amount Amount of underlying token to transfer from vault
    */
    function deposit(uint _amount) external override onlyAuthorized {
        require(_amount > 0, "deposit = 0");
    }

    // TODO: depositStrategy(address _strategy) in case deposit hits gas limit

    function withdraw(uint _amount) external override onlyAuthorized {
        require(_amount > 0, "withdraw = 0");

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal < _amount) {
            // TODO: vulnerable to price manipulation across active strategies?
            // TODO: what if strategy.totalAssets() is low because of hack?
            uint remaining = _amount - underlyingBal;
            for (uint i = 0; i < activeStrategies.length; i++) {
                address strategy = activeStrategies[i];
                // TODO: redundant (totalAssets() called inside Strategy.withdraw())
                // TODO: implement withdraw(amount >= totalAssets) to withdraw all inside IStrategyERC20_V3?
                uint total = IStrategyERC20_V3(strategy).totalAssets();

                uint balBefore = IERC20(underlying).balanceOf(address(this));
                if (remaining >= total) {
                    IStrategyERC20_V3(strategy).withdrawAll();
                } else {
                    IStrategyERC20_V3(strategy).withdraw(remaining);
                }
                uint balAfter = IERC20(underlying).balanceOf(address(this));

                uint diff = balAfter.sub(balBefore);
                if (remaining > diff) {
                    remaining -= diff;
                } else {
                    // remaining - diff <= 0
                    break;
                }
            }
        }

        // transfer underlying token to vault
        uint underlyingBalAfter = IERC20(underlying).balanceOf(address(this));
        if (underlyingBalAfter > 0) {
            if (underlyingBalAfter < _amount) {
                _amount = underlyingBalAfter;
            }

            uint balBefore = IERC20(underlying).balanceOf(address(this));
            IERC20(underlying).safeTransfer(vault, _amount);
            uint balAfter = IERC20(underlying).balanceOf(address(this));

            uint diff = balBefore.sub(balAfter);
            if (diff >= totalDebt) {
                totalDebt = 0;
            } else {
                totalDebt -= diff;
            }
        }
    }

    function withdrawAll() external override onlyAuthorized {
        for (uint i = 0; i < activeStrategies.length; i++) {
            IStrategyERC20_V3(activeStrategies[i]).withdrawAll();
        }

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeTransfer(vault, underlyingBal);
            totalDebt = 0;
        }
    }

    function harvest() external override onlyAuthorized {
        for (uint i = 0; i < activeStrategies.length; i++) {
            // NOTE: This possibly wastes gas if 0 underlying invested in strategy
            IStrategyERC20_V3(activeStrategies[i]).harvest();
        }
    }

    function skim() external override onlyAuthorized {
        /*
        Don't loop strategy.skim() here.
        Need to check strategy.totalAsset() > strategy.totalDebt()
        This is called inside strategy.skim(), so we would be wasting gas here.
        */

        /*
        Note on how balance and total debt between this contract and strategy change

        bal = balance in this contract
        total debt = strategy.totalDebt()

                                           | bal | total debt |
        strategy.deposit                   |  -  |     +      |
        strategy.skim (increase totalDebt) |  =  |     +      |
        strategy.skim (transfer profit)    |  +  |     =      |
        strategy.withdraw                  |  +  |     -      |
        ---------------------------------------------------------

        b = balance in this contract
        s = sum of total debts in strategies
        v = total debt from vault

            profit = b + s - v

        profit > 0 means either
        - b increased when profit transferred from strategies
        - or s increased

        so we can rewrite profit as
            profit = t + d
        where
        t = amount of profit transferred from strategies to this contract
        d = increase in sum of total debts in strategies

        Here we will
            totalDebt += t + d
        since
            totalDebt += d
        to reflect increase in total debts
        and
            totalDebt += t
        amount that totalDebt will increase if we transfer t back to vault
        and then deposit into this contract
        */
        uint bal = IERC20(underlying).balanceOf(address(this));
        uint total = bal;
        // sum total debt in strategies
        for (uint i = 0; i < activeStrategies.length; i++) {
            total = total.add(IStrategyERC20_V3(activeStrategies[i]).totalDebt());
        }

        require(total > totalDebt, "total <= debt");

        totalDebt = totalDebt.add(total - totalDebt);
    }

    // @dev Call from controller to guard against slippage
    function exit() external override onlyAuthorized {
        if (forceExit) {
            return;
        }

        for (uint i = 0; i < activeStrategies.length; i++) {
            IStrategyERC20_V3(activeStrategies[i]).exit();
        }

        uint bal = IERC20(underlying).balanceOf(address(this));
        if (bal > 0) {
            IERC20(underlying).safeTransfer(vault, bal);
            totalDebt = 0;
        }
    }

    function sweep(address _token) external override onlyAdmin {
        require(_token != underlying, "protected token");
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
