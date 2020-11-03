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
    address public timeLock;
    address public token;
    address public strategy;

    // percentange of token reserved in vault for cheap withdraw
    uint public reserveMin = 500;
    uint private constant RESERVE_MAX = 10000;

    // Denominator used to calculate fees
    uint private constant FEE_MAX = 10000;

    uint public withdrawFee;
    uint private constant WITHDRAW_FEE_CAP = 500; // upper limit to withdrawFee

    // mapping of approved strategies
    mapping(address => bool) public strategies;

    // total amount of underlying in strategy
    uint public totalDebt;

    bool public paused;

    // mapping from tx.origin to block number
    // used to prevent flash loah attacks
    mapping(address => uint) public blockNumberLast;

    /*
    @dev vault decimals must be equal to token decimals
    */
    constructor(
        address _controller,
        address _timeLock,
        address _token
    )
        public
        ERC20Detailed(
            string(abi.encodePacked("unagii_", ERC20Detailed(_token).name())),
            string(abi.encodePacked("u", ERC20Detailed(_token).symbol())),
            ERC20Detailed(_token).decimals()
        )
    {
        require(_controller != address(0), "controller = zero address");
        require(_timeLock != address(0), "time lock = zero address");

        admin = msg.sender;
        controller = _controller;
        token = _token;
        timeLock = _timeLock;
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

    modifier whenNotPaused() {
        require(!paused, "paused");
        _;
    }

    /*
    @dev modifier to prevent flash loan
    @dev caller is restricted to one tx per block
    */
    modifier noFlashLoan() {
        // TODO tx.origin any security risk?
        require(
            blockNumberLast[tx.origin] < block.number,
            "last block number >= block.number"
        );
        blockNumberLast[tx.origin] = block.number;
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

    modifier onlyTimeLock() {
        require(msg.sender == timeLock, "!time lock");
        _;
    }

    function setTimeLock(address _timeLock) external onlyTimeLock {
        require(_timeLock != address(0), "time lock = zero address");
        timeLock = _timeLock;
    }

    function setPause(bool _paused) external onlyAdmin {
        paused = _paused;
    }

    function setReserveMin(uint _reserveMin) external onlyAdmin {
        require(_reserveMin <= RESERVE_MAX, "reserve min > max");
        reserveMin = _reserveMin;
    }

    function setWithdrawFee(uint _fee) external onlyAdmin {
        require(_fee <= WITHDRAW_FEE_CAP, "withdraw fee > cap");
        withdrawFee = _fee;
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
    @notice Approve strategy
    @param _strategy Address of strategy to revoke
    */
    function approveStrategy(address _strategy) external onlyTimeLock {
        require(_strategy != address(0), "strategy = zero address");
        strategies[_strategy] = true;
    }

    /*
    @notice Revoke strategy
    @param _strategy Address of strategy to revoke
    */
    function revokeStrategy(address _strategy) external onlyAdmin {
        require(_strategy != address(0), "strategy = zero address");
        strategies[_strategy] = false;
    }

    function _exitStrategy(uint _min) internal whenStrategyDefined {
        IERC20(token).safeApprove(strategy, 0);

        uint balBefore = _balanceInVault();
        IStrategy(strategy).exit();
        uint balAfter = _balanceInVault();

        require(balAfter.sub(balBefore) >= _min, "withdraw < min");

        totalDebt = 0;
        strategy = address(0);
    }

    /*
    @notice Set strategy to approved strategy
    @param _strategy Address of strategy used
    @param _min Minimum undelying token current strategy must return. Prevents slippage
    */
    function setStrategy(address _strategy, uint _min) external onlyAdminOrController {
        require(strategies[_strategy], "!approved");
        require(_strategy != strategy, "new strategy = current strategy");
        require(
            IStrategy(_strategy).underlying() == token,
            "strategy.token != vault.token"
        );
        require(
            IStrategy(_strategy).vault() == address(this),
            "strategy.vault != vault"
        );

        // withdraw from current strategy
        if (strategy != address(0)) {
            _exitStrategy(_min);
        }

        strategy = _strategy;

        emit SetStrategy(strategy);
    }

    /*
    @notice Invest token from vault into strategy.
            Some token are kept in vault for cheap withdraw.
    */
    function invest() external whenStrategyDefined whenNotPaused onlyAdminOrController {
        uint amount = _availableToInvest();
        require(amount > 0, "available = 0");

        IERC20(token).safeApprove(strategy, 0);
        IERC20(token).safeApprove(strategy, amount);

        uint balBefore = _balanceInVault();
        IStrategy(strategy).deposit(amount);
        uint balAfter = _balanceInVault();

        IERC20(token).safeApprove(strategy, 0);

        totalDebt = totalDebt.add(balBefore.sub(balAfter));
    }

    /*
    @notice Deposit token into vault
    @param _amount Amount of token to transfer from `msg.sender`
    */
    function deposit(uint _amount) external whenNotPaused nonReentrant noFlashLoan {
        require(_amount > 0, "amount = 0");

        uint totalUnderlying = _totalAssets();
        uint totalShares = totalSupply();

        /*
        s = shares to mint
        T = total shares before mint
        d = deposit amount
        A = total assets in vault + strategy before deposit

        s / (T + s) = d / (A + d)
        s = d / A * T
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

        uint totalShares = totalSupply();
        if (totalShares > 0) {
            return _shares.mul(totalUnderlying).div(totalShares);
        }
        return 0;
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
    function withdraw(uint _shares, uint _min) external nonReentrant noFlashLoan {
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
        _exitStrategy(_min);
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
