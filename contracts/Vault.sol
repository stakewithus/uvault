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
// TODO circuit breaker
// TODO inline safeTransfer to save gas?
// TODO  protect agains hack by directly sending token to this contract's address
// TODO: safe withdraw any token in case strategy sends back wrong token
// TODO: batch deposit and batch withdraw (via sig or approve(msg.sender, this contract, shares))

contract Vault is ERC20 {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    address public admin;
    address public token;
    address public strategy;

    // percentange of token available to be invested into strategy
    uint public min = 9500;
    uint public constant max = 10000;

    constructor(
        address _token, string memory _name, string memory _symbol
    ) ERC20(_name, _symbol) public  {
        require(_token != address(0)); // dev: token = zero address
        // NOTE: token decimals must equal vault decimals

        admin = msg.sender;
        token = _token;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin); // dev: !admin
        _;
    }

    modifier whenStrategyDefined() {
        require(strategy != address(0)); // dev: Strategy must be defined
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
    function balanceInVault() external view returns (uint) {
        return _balanceInVault();
    }

    function _available() internal view returns (uint) {
        return _balanceInVault().mul(min).div(max);
    }

    /*
    @notice Returns amount of token available to be invested into strategy
    @return Amount of token available to be invested into strategy
    */
    function available() external view returns (uint) {
        return _available();
    }

    function _totalLockedValue() internal view returns (uint) {
        if (address(strategy) == address(0)) {
            return _balanceInVault();
        }
        return _balanceInVault().add(IStrategy(strategy).balance());
    }

    /*
    @notice Returns the total amount of tokens in vault + strategy
    @return Total amount of tokens in vault + strategy
    */
    function totalLockedValue() external view returns (uint) {
        return _totalLockedValue();
    }

    /*
    @notice Set strategy
    @param _strategy Address of strategy
    @dev Only admin is allowed to call
    @dev Must withdraw all tokens from current strategy
    */
    function setStrategy(address _strategy) public onlyAdmin {
        require(_strategy != address(0)); // dev: strategy = zero address
        require(IStrategy(_strategy).underlyingToken() == token); // dev: strategy.token != vault.token
        require(IStrategy(_strategy).vault() == address(this)); // dev: strategy.vault != vault
        require(_strategy != strategy); // dev: new strategy = current strategy

        // withdraw from current strategy
        if (strategy != address(0)) {
            IERC20(token).safeApprove(strategy, 0);
            IStrategy(strategy).withdrawAll();
        }

        strategy = _strategy;
        IERC20(token).safeApprove(strategy, uint256(-1));
    }

    function _invest() internal whenStrategyDefined {
        uint amount = _available();

        if (amount > 0) {
            // NOTE: infinite approval is set when this strategy was set
            IStrategy(strategy).deposit(amount);
        }
    }

    /*
    @notice Invest token from vault into strategy.
            Some token are kept in vault for cheap withdraw.
    */
    function invest() external onlyAdmin {
        _invest();
    }

    /*
    @notice Withdraw from strategy, fills up reserve and re-invests the rest of tokens
    */
    function rebalance() external onlyAdmin whenStrategyDefined {
        IStrategy(strategy).withdrawAll();
        _invest();
    }

    /*
    @notice Deposit token into vault
    @param _from Address to transfer tokens from
    @param _amount Amount of token to transfer from `msg.sender`
    */
    function deposit(address _from, uint _amount) external {
        require(_amount > 0); // dev: amount = 0
        // NOTE: no need to check if _from is zero address

        _mint(_from, _amount);
        IERC20(token).safeTransferFrom(_from, address(this), _amount);
    }

    /*
    @notice Withdraw shares for token
    @param _shares Amount of shares to burn
    */
    function withdraw(uint _shares) external {
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