pragma solidity 0.5.17;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

import "./IStrategy.sol";
import "./IVault.sol";
import "./IController.sol";

/* potential hacks?
- directly send underlying token to this vault or strategy
- flash loan
    - flashloan make undelying token less valuable
    - vault deposit
    - flashloan make underlying token more valuable
    - vault withdraw
    - return loan
- front running?
*/

contract Vault is IVault, ERC20, ERC20Detailed, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    event SetNextStrategy(address strategy);
    event SetStrategy(address strategy);

    address public admin;
    address public controller;
    address public token;
    address public strategy;

    // percentange of token reserved in vault for cheap withdraw
    uint public reserveMin = 500;
    uint private constant RESERVE_MAX = 10000;

    // Denominator used to calculate fees
    uint private constant FEE_MAX = 10000;

    uint public withdrawFee;
    uint private constant WITHDRAW_FEE_CAP = 500; // upper limit to withdrawFee

    // address of next strategy to be used
    address public nextStrategy;
    // timestamp of when the next strategy can be used
    uint public timeLock;
    // Minimum time that must pass before new strategy can be used
    uint public minWaitTime;

    // mapping of approved strategies
    mapping(address => bool) public strategies;

    // total amount of underlying in strategy
    uint public totalDebt;

    bool public paused;

    /*
    @dev vault decimals must be equal to token decimals
    */
    constructor(
        address _controller,
        address _token,
        uint _minWaitTime
    )
        public
        ERC20Detailed(
            string(abi.encodePacked("unagii_", ERC20Detailed(_token).name())),
            string(abi.encodePacked("u", ERC20Detailed(_token).symbol())),
            ERC20Detailed(_token).decimals()
        )
    {
        require(_controller != address(0), "controller = zero address");

        admin = msg.sender;
        controller = _controller;
        token = _token;
        minWaitTime = _minWaitTime;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "!admin");
        _;
    }

    modifier onlyAdminOrController() {
        require(msg.sender == admin || msg.sender == controller, "!authorized");
        _;
    }

    modifier whenStrategyDefined() {
        require(strategy != address(0), "strategy = zero address");
        _;
    }

    modifier whenPaused() {
        require(paused, "!paused");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "paused");
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

    function setReserveMin(uint _reserveMin) external onlyAdmin {
        require(_reserveMin <= RESERVE_MAX, "reserve min > max");
        reserveMin = _reserveMin;
    }

    function setWithdrawFee(uint _fee) external onlyAdmin {
        require(_fee <= WITHDRAW_FEE_CAP, "withdraw fee > cap");
        withdrawFee = _fee;
    }

    function pause() external onlyAdmin whenNotPaused {
        paused = true;
    }

    function unpause() external onlyAdmin whenPaused {
        paused = false;
    }

    function _balanceInVault() private view returns (uint) {
        return IERC20(token).balanceOf(address(this));
    }

    /*
    @notice Returns balance of token  s in vault
    @return Amount of token in vault
    */
    function balanceInVault() external view returns (uint) {
        return _balanceInVault();
    }

    function _balanceInStrategy() private view returns (uint) {
        if (strategy == address(0)) {
            return 0;
        }

        return IStrategy(strategy).totalAssets();
    }

    /*
    @notice Returns the estimate amount of token in strategy
    @dev Output may vary depending on price of liquidity provider token
         where the underlying token is invested
    */
    function balanceInStrategy() external view returns (uint) {
        return _balanceInStrategy();
    }

    function _totalAssets() private view returns (uint) {
        return _balanceInVault().add(totalDebt);
    }

    /*
    @notice Returns the total amount of tokens in vault + total debt
    @return Total amount of tokens in vault + total debt
    */
    function totalAssets() external view returns (uint) {
        return _totalAssets();
    }

    function _minReserve() private view returns (uint) {
        return _totalAssets().mul(reserveMin).div(RESERVE_MAX);
    }

    /*
    @notice Returns minimum amount of tokens that should be kept in vault for
            cheap withdraw
    @return Reserve amount
    */
    function minReserve() external view returns (uint) {
        return _minReserve();
    }

    function _availableToInvest() private view returns (uint) {
        if (strategy == address(0)) {
            return 0;
        }

        uint balInVault = _balanceInVault();
        uint reserve = _minReserve();

        if (balInVault <= reserve) {
            return 0;
        }

        return balInVault.sub(reserve);
    }

    /*
    @notice Returns amount of token available to be invested into strategy
    @return Amount of token available to be invested into strategy
    */
    function availableToInvest() external view returns (uint) {
        return _availableToInvest();
    }

    /*
    @notice Set next strategy
    @param _nextStrategy Address of next strategy
    */
    function setNextStrategy(address _nextStrategy) external onlyAdmin {
        require(_nextStrategy != address(0), "strategy = zero address");
        require(_nextStrategy != nextStrategy, "same next strategy");
        require(_nextStrategy != strategy, "next strategy = current strategy");

        nextStrategy = _nextStrategy;
        // set time lock if current strategy is set
        if (strategy != address(0)) {
            timeLock = block.timestamp.add(minWaitTime);
        }

        emit SetNextStrategy(_nextStrategy);
    }

    /*
    @notice Set strategy either to next strategy or back to previously approved strategy
    @param _strategy Address of strategy used
    @param _min Minimum undelying token current strategy must return. Prevents slippage
    */
    function setStrategy(address _strategy, uint _min) external onlyAdminOrController {
        require(_strategy != address(0), "strategy = zero address");
        require(_strategy != strategy, "new strategy = current strategy");
        require(
            IStrategy(_strategy).underlying() == token,
            "strategy.token != vault.token"
        );
        require(
            IStrategy(_strategy).vault() == address(this),
            "strategy.vault != vault"
        );

        if (_strategy == nextStrategy) {
            require(block.timestamp >= timeLock, "timestamp < time lock");
            strategies[_strategy] = true;
        } else {
            require(strategies[_strategy], "!approved strategy");
        }

        address oldStrategy = strategy;
        strategy = _strategy;

        // withdraw from current strategy
        if (oldStrategy != address(0)) {
            IERC20(token).safeApprove(oldStrategy, 0);

            uint balBefore = _balanceInVault();
            IStrategy(oldStrategy).exit();
            uint balAfter = _balanceInVault();

            require(balAfter.sub(balBefore) >= _min, "exit < min");
        }

        IERC20(token).safeApprove(strategy, 0);
        IERC20(token).safeApprove(strategy, uint(-1));

        emit SetStrategy(strategy);
    }

    /*
    @notice Revoke strategy
    @param _strategy Address of strategy to revoke
    */
    function revokeStrategy(address _strategy) external onlyAdmin {
        strategies[_strategy] = false;
    }

    /*
    @notice Invest token from vault into strategy.
            Some token are kept in vault for cheap withdraw.
    */
    function invest() external whenStrategyDefined whenNotPaused onlyAdminOrController {
        uint amount = _availableToInvest();
        require(amount > 0, "available = 0");

        uint balBefore = _balanceInVault();
        // infinite approval is set when this strategy was set
        IStrategy(strategy).deposit(amount);
        uint balAfter = _balanceInVault();

        totalDebt = totalDebt.add(balBefore.sub(balAfter));
    }

    /*
    @notice Deposit token into vault
    @param _amount Amount of token to transfer from `msg.sender`
    */
    function deposit(uint _amount) external whenNotPaused nonReentrant {
        require(_amount > 0, "amount = 0");

        uint totalUnderlying = _totalAssets();
        uint totalShares = totalSupply();

        /*
        s = shares to mint
        T = total shares before mint
        d = deposit amount
        P = total in vault + strategy before deposit

        s / (T + s) = d / (P + d)
        s = d / P * T
        */
        uint shares;
        if (totalShares == 0) {
            shares = _amount;
        } else {
            shares = _amount.mul(totalShares).div(totalUnderlying);
        }

        _mint(msg.sender, shares);
        IERC20(token).safeTransferFrom(msg.sender, address(this), _amount);
    }

    function _getExpectedReturn(
        uint _shares,
        uint _balInVault,
        uint _balInStrat
    ) private view returns (uint) {
        /*
        s = shares
        T = total supply of shares
        w = amount of underlying token to withdraw
        U = total amount of redeemable underlying token in vault + strategy

        s / T = w / U
        w = s / T * U
        */

        /*
        total underlying = bal in vault + min(total debt, bal in strat)
        if bal in strat > total debt, redeemable = total debt
        else redeemable <= bal in strat
        */
        uint totalUnderlying;
        if (_balInStrat > totalDebt) {
            totalUnderlying = _balInVault.add(totalDebt);
        } else {
            totalUnderlying = _balInVault.add(_balInStrat);
        }

        return _shares.mul(totalUnderlying).div(totalSupply());
    }

    /*
    @notice Calculate amount of underlying token that can be withdrawn
    @param _shares Amount of shares
    @return Amount of underlying token that can be withdrawn
    */
    function getExpectedReturn(uint _shares) external view returns (uint) {
        uint balInVault = _balanceInVault();
        uint balInStrat = _balanceInStrategy();

        return _getExpectedReturn(_shares, balInVault, balInStrat);
    }

    /*
    @notice Withdraw underlying token
    @param _shares Amount of shares to burn
    @param _min Minimum amount of underlying token to return
    */
    function withdraw(uint _shares, uint _min) external nonReentrant {
        require(_shares > 0, "shares = 0");

        uint balInVault = _balanceInVault();
        uint balInStrat = _balanceInStrategy();
        uint withdrawAmount = _getExpectedReturn(_shares, balInVault, balInStrat);

        // Must burn after calculating withdraw amount
        _burn(msg.sender, _shares);

        if (balInVault < withdrawAmount) {
            // maximize withdraw amount from strategy
            uint amountFromStrat = withdrawAmount;
            if (balInStrat < withdrawAmount) {
                amountFromStrat = balInStrat;
            }

            IStrategy(strategy).withdraw(amountFromStrat);

            uint balAfter = _balanceInVault();
            uint diff = balAfter.sub(balInVault);

            if (diff < amountFromStrat) {
                // withdraw amount - withdraw amount from strat = amount to withdraw from vault
                // diff = actual amount returned from strategy
                withdrawAmount = withdrawAmount.sub(amountFromStrat).add(diff);
            }

            totalDebt = totalDebt.sub(diff);

            // transfer to treasury
            uint fee = withdrawAmount.mul(withdrawFee).div(FEE_MAX);
            if (fee > 0) {
                address treasury = IController(controller).treasury();
                require(treasury != address(0), "treasury = zero address");

                withdrawAmount = withdrawAmount.sub(fee);
                IERC20(token).safeTransfer(treasury, fee);
            }
        }

        require(withdrawAmount >= _min, "withdraw < min");

        IERC20(token).safeTransfer(msg.sender, withdrawAmount);
    }

    /*
    @notice Withdraw underlying token from strategy back to vault
    @param _amount Amount of tokens to withdraw
    @param _min Minimum amount of underlying token to return
    */
    function withdrawFromStrategy(uint _amount, uint _min)
        external
        whenStrategyDefined
        onlyAdminOrController
    {
        uint balBefore = _balanceInVault();
        IStrategy(strategy).withdraw(_amount);
        uint balAfter = _balanceInVault();

        uint diff = balAfter.sub(balBefore);
        require(diff >= _min, "withdraw < min");

        if (diff > totalDebt) {
            totalDebt = 0;
        } else {
            totalDebt = totalDebt.sub(diff);
        }
    }

    /*
    @notice Withdraw all underlying token from strategy back to vault
    @param _min Minimum amount of underlying token to return
    */
    function withdrawAllFromStrategy(uint _min)
        external
        whenStrategyDefined
        onlyAdminOrController
    {
        uint balBefore = _balanceInVault();
        IStrategy(strategy).withdrawAll();
        uint balAfter = _balanceInVault();

        require(balAfter.sub(balBefore) >= _min, "withdraw < min");

        totalDebt = 0;
    }

    /*
    @notice Withdraw all underlying token from strategy back to vault and
            deactivate current strategy
    @param _min Minimum amount of underlying token to return
    */
    function exitStrategy(uint _min)
        external
        whenStrategyDefined
        onlyAdminOrController
    {
        uint balBefore = _balanceInVault();
        IStrategy(strategy).exit();
        uint balAfter = _balanceInVault();

        require(balAfter.sub(balBefore) >= _min, "withdraw < min");

        totalDebt = 0;
        strategy = address(0);
    }

    /*
    @notice Transfer token != underlying token in vault to admin
    @param _token Address of token to transfer
    @dev Must transfer token to admin
    @dev _token must not be equal to underlying token
    @dev Used to transfer token that was accidentally sent to this vault
    */
    function sweep(address _token) external onlyAdmin {
        require(_token != token, "token = vault.token");
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
