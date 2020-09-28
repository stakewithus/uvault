pragma solidity 0.5.17;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

import "./IStrategy.sol";
import "./IVault.sol";

// TODO: batch deposit and batch withdraw

/* potential hacks?
- directly send underlying token to this vault
- flash loan
    - vault deposit
    - use loan and make underlying token more valuable
    - vault withdraw
    - return loan
- front running?
- slippage when withdrawing all from strategy
*/

contract Vault is ERC20, ERC20Detailed, IVault {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    event SetNextStrategy(address strategy);
    event SwitchStrategy(address strategy);

    address public admin;
    address public controller;
    address public token;
    address public strategy;

    // percentange of token available to be invested into strategy
    uint public min = 9500;
    uint public constant MAX = 10000;

    // address of next strategy to be used
    address public nextStrategy;
    // timestamp of when the next strategy can be used
    uint public timeLock;
    // Minimum time that must pass before new strategy can be used
    uint public minWaitTime;

    /*
    @dev vault decimals must be equal to token decimals
    */
    constructor(
        address _controller,
        address _token,
        string memory _name,
        string memory _symbol,
        uint _minWaitTime
    ) public ERC20Detailed(_name, _symbol, ERC20Detailed(_token).decimals()) {
        // NOTE: ERC20Detailed(_token).decimals() will fail if token = address(0)
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

    modifier onlyController() {
        require(msg.sender == controller, "!controller");
        _;
    }

    modifier whenStrategyDefined() {
        require(strategy != address(0), "strategy = zero address");
        _;
    }

    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0), "admin = zero address");
        admin = _admin;
    }

    function setMin(uint _min) external onlyAdmin {
        require(_min <= MAX, "min > max");
        min = _min;
    }

    function _balanceInVault() internal view returns (uint) {
        return IERC20(token).balanceOf(address(this));
    }

    /*
    @notice Returns balance of tokens in vault
    @return Amount of token in vault
    */
    function balanceInVault() external view returns (uint) {
        return _balanceInVault();
    }

    function _availableToInvest() internal view returns (uint) {
        return _balanceInVault().mul(min).div(MAX);
    }

    /*
    @notice Returns amount of token available to be invested into strategy
    @return Amount of token available to be invested into strategy
    */
    function availableToInvest() external view returns (uint) {
        return _availableToInvest();
    }

    function _totalLockedValue() internal view returns (uint) {
        if (address(strategy) == address(0)) {
            return _balanceInVault();
        }
        return _balanceInVault().add(IStrategy(strategy).underlyingBalance());
    }

    /*
    @notice Returns the total amount of tokens in vault + strategy
    @return Total amount of tokens in vault + strategy
    */
    function totalLockedValue() external view returns (uint) {
        return _totalLockedValue();
    }

    /*
    @notice Set next strategy
    @param _nextStrategy Address of next strategy
    */
    function setNextStrategy(address _nextStrategy) external onlyAdmin {
        require(_nextStrategy != address(0), "strategy = zero address");
        require(IStrategy(_nextStrategy).underlyingToken() == token, "strategy.token != vault.token");
        require(IStrategy(_nextStrategy).vault() == address(this), "strategy.vault != vault");
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
    @notice Switch strategy
    @dev Only admin is allowed to call
    @dev Must withdraw all tokens from current strategy
    */
    function switchStrategy() external onlyController {
        require(nextStrategy != address(0), "next strategy = zero address");
        require(nextStrategy != strategy, "next strategy = current strategy");
        require(block.timestamp >= timeLock, "timestamp < time lock");

        // withdraw from current strategy
        if (strategy != address(0)) {
            IERC20(token).safeApprove(strategy, 0);
            IStrategy(strategy).exit();
        }

        strategy = nextStrategy;
        IERC20(token).safeApprove(strategy, 0);
        IERC20(token).safeApprove(strategy, uint(-1));

        emit SwitchStrategy(strategy);
    }

    function _invest() internal {
        uint amount = _availableToInvest();

        if (amount > 0) {
            // NOTE: infinite approval is set when this strategy was set
            IStrategy(strategy).deposit(amount);
        }
    }

    /*
    @notice Invest token from vault into strategy.
            Some token are kept in vault for cheap withdraw.
    */
    function invest() external onlyController whenStrategyDefined {
        _invest();
    }

    /*
    @notice Withdraw from strategy, fills up reserve and re-invests the rest of tokens
    */
    function rebalance() external onlyController whenStrategyDefined {
        IStrategy(strategy).withdrawAll();
        _invest();
    }

    /*
    @notice Deposit token into vault
    @param _amount Amount of token to transfer from `msg.sender`
    */
    function deposit(uint _amount) external {
        require(_amount > 0, "amount = 0");

        _mint(msg.sender, _amount);
        IERC20(token).safeTransferFrom(msg.sender, address(this), _amount);
    }

    /*
    @notice Calculate amount of underlying token that can be withdrawn
    @param _shares Amount of shares
    @return Amount of underlying token that can be withdrawn
    */
    function calcWithdraw(uint _shares) external view returns (uint) {
        return _shares.mul(_totalLockedValue()).div(totalSupply());
    }

    /*
    @notice Withdraw underlying token
    @param _shares Amount of shares to burn
    @param _min Minimum amount of underlying token expected to return
    */
    function withdraw(uint _shares, uint _min) external {
        // NOTE: cache totalSupply before burning
        uint totalShares = totalSupply();
        require(totalShares > 0, "total shares = 0");
        require(_shares > 0, "shares = 0");

        _burn(msg.sender, _shares);

        /*
        s = shares
        T = total supply of shares
        u = amount of underlying token to withdraw
        U = total amount of underlying token in vault + strategy

        s / T = u / U
        u = s / T * U
        */
        uint amountToWithdraw = _shares.mul(_totalLockedValue()).div(totalShares);

        uint bal = _balanceInVault();
        if (amountToWithdraw > bal) {
            // safe to skip check for underflow since amountToWithdraw > bal
            IStrategy(strategy).withdraw(amountToWithdraw - bal);

            uint balAfter = _balanceInVault();
            if (balAfter < amountToWithdraw) {
                amountToWithdraw = balAfter;
            }
        }

        require(amountToWithdraw >= _min, "withdraw amount < min");

        IERC20(token).safeTransfer(msg.sender, amountToWithdraw);
    }
}
