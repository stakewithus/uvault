// TODO: lock solidity version
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
// TODO SafeERC20 lite
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// TODO use more gas efficient ERC20
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./interfaces/IStrategy.sol";
import "./interfaces/IVault.sol";

// TODO: reentrancy lock
// TODO: circuit breaker
// TODO: inline safeTransfer to save gas?
// TODO: protect agains hack by directly sending token to this contract's address
// TODO: safe withdraw any token in case strategy sends back wrong token
// TODO: batch deposit and batch withdraw (via sig or approve(msg.sender, this contract, shares))

contract Vault is ERC20, IVault {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    event SetNextStrategy(address nextStrategy);
    event SwitchStrategy(address newStrategy);

    address override public admin;
    address override public token;
    address override public strategy;

    // percentange of token available to be invested into strategy
    uint public min = 9500;
    uint public constant max = 10000;

    // address of next strategy to be used
    address override public nextStrategy;
    // timestamp of when the next strategy can be used
    uint override public timeLock;
    // Minimum time that must pass before new strategy can be used
    uint public minWaitTime;

    constructor(
        address _token, string memory _name, string memory _symbol,
        uint _minWaitTime
    ) ERC20(_name, _symbol) public  {
        require(_token != address(0)); // dev: token = zero address
        // NOTE: token decimals must equal vault decimals

        admin = msg.sender;
        token = _token;
        minWaitTime = _minWaitTime;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin); // dev: !admin
        _;
    }

    modifier whenStrategyDefined() {
        require(strategy != address(0)); // dev: strategy = zero address
        _;
    }

    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0)); // dev: admin = zero address
        admin = _admin;
    }

    function setMin(uint _min) external onlyAdmin {
        require(_min <= max); // dev: min > max
        min = _min;
    }

    function _balanceInVault() internal view returns (uint) {
        return IERC20(token).balanceOf(address(this));
    }

    /*
    @notice Returns balance of tokens in vault
    @return Amount of token in vault
    */
    function balanceInVault() override external view returns (uint) {
        return _balanceInVault();
    }

    function _availableToInvest() internal view returns (uint) {
        return _balanceInVault().mul(min).div(max);
    }

    /*
    @notice Returns amount of token available to be invested into strategy
    @return Amount of token available to be invested into strategy
    */
    function availableToInvest() override external view returns (uint) {
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
    function totalLockedValue() override external view returns (uint) {
        return _totalLockedValue();
    }

    /*
    @notice Set next strategy
    @param _nextStrategy Address of next strategy
    */
    function setNextStrategy(address _strategy) override external onlyAdmin {
        require(_strategy != address(0)); // dev: strategy = zero address
        require(IStrategy(_strategy).underlyingToken() == token); // dev: strategy.token != vault.token
        require(IStrategy(_strategy).vault() == address(this)); // dev: strategy.vault != vault
        require(_strategy != nextStrategy); // dev: same next strategy
        require(_strategy != strategy); // dev: next strategy = current strategy

        nextStrategy = _strategy;
        // set time lock if current strategy is set
        if (strategy != address(0)) {
            timeLock = block.timestamp.add(minWaitTime);
        }

        emit SetNextStrategy(_strategy);
    }

    /*
    @notice Switch strategy
    @dev Only admin is allowed to call
    @dev Must withdraw all tokens from current strategy
    */
    function switchStrategy() override external onlyAdmin {
        require(nextStrategy != address(0)); // dev: next strategy = zero address
        require(nextStrategy != strategy); // dev: next strategy = current strategy
        require(block.timestamp >= timeLock); // dev: timestamp < time lock

        // withdraw from current strategy
        if (strategy != address(0)) {
            IERC20(token).safeApprove(strategy, 0);
            IStrategy(strategy).exit();
        }

        strategy = nextStrategy;
        IERC20(token).safeApprove(strategy, uint256(-1));

        emit SwitchStrategy(strategy);
    }

    function _invest() internal whenStrategyDefined {
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
    function invest() override external onlyAdmin {
        _invest();
    }

    /*
    @notice Withdraw from strategy, fills up reserve and re-invests the rest of tokens
    */
    function rebalance() override external onlyAdmin whenStrategyDefined {
        IStrategy(strategy).withdrawAll();
        _invest();
    }

    /*
    @notice Deposit token into vault
    @param _amount Amount of token to transfer from `msg.sender`
    */
    function deposit(uint _amount) override external {
        require(_amount > 0); // dev: amount = 0

        _mint(msg.sender, _amount);
        IERC20(token).safeTransferFrom(msg.sender, address(this), _amount);
    }

    /*
    @notice Withdraw shares for token
    @param _shares Amount of shares to burn
    */
    function withdraw(uint _shares) override external {
        // NOTE: cache totalSupply before burning
        uint totalSupply = totalSupply();
        require(totalSupply > 0); // dev: total supply = 0
        require(_shares > 0); // dev: shares = 0

        _burn(msg.sender, _shares);

        /*
        s = shares
        T = total supply of shares
        y = amount of token to withdraw
        Y = total amount of token in vault + strategy

        s / T = y / Y
        */
        uint amountToWithdraw = _shares.mul(_totalLockedValue()).div(totalSupply);

        uint bal = _balanceInVault();
        if (amountToWithdraw > bal) {
            // NOTE: can skip check for underflow here since amountToWithdraw > bal
            IStrategy(strategy).withdraw(amountToWithdraw - bal);
            uint balAfter = _balanceInVault();

            if (balAfter < amountToWithdraw) {
                amountToWithdraw = balAfter;
            }
        }

        IERC20(token).safeTransfer(msg.sender, amountToWithdraw);
    }
}