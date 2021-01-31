// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

/*
version 1.2.0
*/

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./protocol/IStrategyETH.sol";
import "./protocol/IETHVault.sol";
import "./protocol/IController.sol";

// TODO: reentrancy
// TODO: denial of service?
// TODO: force ETH
contract ETHVault is IETHVault, ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    event SetStrategy(address strategy);
    event ApproveStrategy(address strategy);
    event RevokeStrategy(address strategy);
    event SetWhitelist(address addr, bool approved);

    // WARNING: not address of ETH, used as placeholder
    address private constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    address public override admin;
    address public override controller;
    address public override timeLock;
    address public immutable override token = ETH;
    address public override strategy;

    // mapping of approved strategies
    mapping(address => bool) public override strategies;

    // percentange of ETH reserved in vault for cheap withdraw
    uint public override reserveMin = 500;
    uint private constant RESERVE_MAX = 10000;

    // Denominator used to calculate fees
    uint private constant FEE_MAX = 10000;

    uint public override withdrawFee;
    uint private constant WITHDRAW_FEE_CAP = 500; // upper limit to withdrawFee

    bool public override paused;

    // whitelisted addresses
    // used to prevent flash loah attacks
    mapping(address => bool) public override whitelist;

    constructor(address _controller, address _timeLock)
        public
        ERC20("unagii_ETH", "uETH")
    {
        require(_controller != address(0), "controller = zero address");
        require(_timeLock != address(0), "time lock = zero address");

        // set to ETH decimals
        // ERC20 defaults to 18 decimals

        admin = msg.sender;
        controller = _controller;
        timeLock = _timeLock;
    }

    /*
    @dev Only allow ETH from current strategy
    @dev EOA cannot accidentally send ETH into this vault
    */
    receive() external payable {
        require(msg.sender == strategy, "msg.sender != strategy");
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "!admin");
        _;
    }

    modifier onlyTimeLock() {
        require(msg.sender == timeLock, "!time lock");
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
    @dev caller is restricted to EOA or whitelisted contract
    @dev Warning: Users can have their funds stuck if shares is transferred to a contract
    */
    modifier guard() {
        require((msg.sender == tx.origin) || whitelist[msg.sender], "!whitelist");
        _;
    }

    function setAdmin(address _admin) external override onlyAdmin {
        require(_admin != address(0), "admin = zero address");
        admin = _admin;
    }

    function setController(address _controller) external override onlyAdmin {
        require(_controller != address(0), "controller = zero address");
        controller = _controller;
    }

    function setTimeLock(address _timeLock) external override onlyTimeLock {
        require(_timeLock != address(0), "time lock = zero address");
        timeLock = _timeLock;
    }

    function setPause(bool _paused) external override onlyAdmin {
        paused = _paused;
    }

    function setWhitelist(address _addr, bool _approve) external override onlyAdmin {
        whitelist[_addr] = _approve;
        emit SetWhitelist(_addr, _approve);
    }

    function setReserveMin(uint _reserveMin) external override onlyAdmin {
        require(_reserveMin <= RESERVE_MAX, "reserve min > max");
        reserveMin = _reserveMin;
    }

    function setWithdrawFee(uint _fee) external override onlyAdmin {
        require(_fee <= WITHDRAW_FEE_CAP, "withdraw fee > cap");
        withdrawFee = _fee;
    }

    function _balanceInVault() private view returns (uint) {
        return address(this).balance;
    }

    /*
    @notice Returns balance of ETH in vault
    @return Amount of ETH in vault
    */
    function balanceInVault() external view override returns (uint) {
        return _balanceInVault();
    }

    function _balanceInStrategy() private view returns (uint) {
        if (strategy == address(0)) {
            return 0;
        }

        return IStrategyETH(strategy).totalAssets();
    }

    /*
    @notice Returns the estimate amount of ETH in strategy
    @dev Output may vary depending on price of liquidity provider token
         where ETH is invested
    */
    function balanceInStrategy() external view override returns (uint) {
        return _balanceInStrategy();
    }

    function _totalDebtInStrategy() private view returns (uint) {
        if (strategy == address(0)) {
            return 0;
        }
        return IStrategyETH(strategy).totalDebt();
    }

    /*
    @notice Returns amount of ETH invested strategy
    */
    function totalDebtInStrategy() external view override returns (uint) {
        return _totalDebtInStrategy();
    }

    function _totalAssets() private view returns (uint) {
        return _balanceInVault().add(_totalDebtInStrategy());
    }

    /*
    @notice Returns the total amount of ETH in vault + total debt
    @return Total amount of ETH in vault + total debt
    */
    function totalAssets() external view override returns (uint) {
        return _totalAssets();
    }

    function _minReserve() private view returns (uint) {
        return _totalAssets().mul(reserveMin) / RESERVE_MAX;
    }

    /*
    @notice Returns minimum amount of ETH that should be kept in vault for
            cheap withdraw
    @return Reserve amount
    */
    function minReserve() external view override returns (uint) {
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

        return balInVault - reserve;
    }

    /*
    @notice Returns amount of ETH available to be invested into strategy
    @return Amount of ETH available to be invested into strategy
    */
    function availableToInvest() external view override returns (uint) {
        return _availableToInvest();
    }

    /*
    @notice Approve strategy
    @param _strategy Address of strategy to revoke
    */
    function approveStrategy(address _strategy) external override onlyTimeLock {
        require(_strategy != address(0), "strategy = zero address");
        strategies[_strategy] = true;

        emit ApproveStrategy(_strategy);
    }

    /*
    @notice Revoke strategy
    @param _strategy Address of strategy to revoke
    */
    function revokeStrategy(address _strategy) external override onlyAdmin {
        require(_strategy != address(0), "strategy = zero address");
        strategies[_strategy] = false;

        emit RevokeStrategy(_strategy);
    }

    /*
    @notice Set strategy to approved strategy
    @param _strategy Address of strategy used
    @param _min Minimum ETH current strategy must return. Prevents slippage
    */
    function setStrategy(address _strategy, uint _min)
        external
        override
        onlyAdminOrController
    {
        require(strategies[_strategy], "!approved");
        require(_strategy != strategy, "new strategy = current strategy");
        require(
            IStrategyETH(_strategy).underlying() == ETH,
            "strategy.underlying != ETH"
        );
        require(
            IStrategyETH(_strategy).vault() == address(this),
            "strategy.vault != vault"
        );

        // withdraw from current strategy
        if (strategy != address(0)) {
            uint balBefore = _balanceInVault();
            IStrategyETH(strategy).exit();
            uint balAfter = _balanceInVault();

            require(balAfter.sub(balBefore) >= _min, "withdraw < min");
        }

        strategy = _strategy;

        emit SetStrategy(strategy);
    }

    /*
    @notice Invest ETH from vault into strategy.
            Some ETH are kept in vault for cheap withdraw.
    */
    function invest()
        external
        override
        whenStrategyDefined
        whenNotPaused
        onlyAdminOrController
    {
        uint amount = _availableToInvest();
        require(amount > 0, "available = 0");

        IStrategyETH(strategy).deposit{value: amount}();
    }

    /*
    @notice Deposit ETH into vault
    */
    function deposit() external payable override whenNotPaused nonReentrant guard {
        require(msg.value > 0, "deposit = 0");

        /*
        need to subtract msg.value to get total ETH before deposit
        totalAssets >= msg.value, since address(this).balance >= msg.value
        */
        uint totalEth = _totalAssets() - msg.value;
        uint totalShares = totalSupply();

        /*
        s = shares to mint
        T = total shares before mint
        d = deposit amount
        A = total ETH in vault + strategy before deposit

        s / (T + s) = d / (A + d)
        s = d / A * T
        */
        uint shares;
        if (totalShares == 0) {
            shares = msg.value;
        } else {
            shares = msg.value.mul(totalShares).div(totalEth);
        }

        _mint(msg.sender, shares);
    }

    function _getExpectedReturn(
        uint _shares,
        uint _balInVault,
        uint _balInStrat
    ) private view returns (uint) {
        /*
        s = shares
        T = total supply of shares
        w = amount of ETH to withdraw
        E = total amount of redeemable ETH in vault + strategy

        s / T = w / E
        w = s / T * E
        */

        /*
        total ETH = ETH in vault + min(total debt, ETH in strat)
        if ETH in strat > total debt, redeemable = total debt
        else redeemable = ETH in strat
        */
        uint totalDebt = _totalDebtInStrategy();
        uint totalEth;
        if (_balInStrat > totalDebt) {
            totalEth = _balInVault.add(totalDebt);
        } else {
            totalEth = _balInVault.add(_balInStrat);
        }

        uint totalShares = totalSupply();
        if (totalShares > 0) {
            return _shares.mul(totalEth) / totalShares;
        }
        return 0;
    }

    /*
    @notice Calculate amount of ETH that can be withdrawn
    @param _shares Amount of shares
    @return Amount of ETH that can be withdrawn
    */
    function getExpectedReturn(uint _shares) external view override returns (uint) {
        uint balInVault = _balanceInVault();
        uint balInStrat = _balanceInStrategy();

        return _getExpectedReturn(_shares, balInVault, balInStrat);
    }

    /*
    @dev WARNING check `_to` is not zero address before calling this function
    */
    function _sendEth(address payable _to, uint _amount) private {
        (bool sent, ) = _to.call{value: _amount}("");
        require(sent, "Send ETH failed");
    }

    /*
    @notice Withdraw ETH
    @param _shares Amount of shares to burn
    @param _min Minimum amount of ETH to return
    @dev Keep `guard` modifier, else attacker can deposit and then use smart
         contract to attack from withdraw
    */
    function withdraw(uint _shares, uint _min) external override nonReentrant guard {
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

            IStrategyETH(strategy).withdraw(amountFromStrat);

            uint balAfter = _balanceInVault();
            uint diff = balAfter.sub(balInVault);

            if (diff < amountFromStrat) {
                // withdraw amount - withdraw amount from strat = amount to withdraw from vault
                // diff = actual amount returned from strategy
                // NOTE: withdrawAmount >= amountFromStrat
                withdrawAmount = (withdrawAmount - amountFromStrat).add(diff);
            }

            // transfer to treasury
            uint fee = withdrawAmount.mul(withdrawFee) / FEE_MAX;
            if (fee > 0) {
                address treasury = IController(controller).treasury();
                require(treasury != address(0), "treasury = zero address");

                withdrawAmount = withdrawAmount - fee;
                _sendEth(payable(treasury), fee);
            }
        }

        require(withdrawAmount >= _min, "withdraw < min");

        _sendEth(msg.sender, withdrawAmount);
    }

    /*
    @notice Transfer token in vault to admin
    @param _token Address of token to transfer
    @dev Used to transfer token that was accidentally sent to this vault
    */
    function sweep(address _token) external override onlyAdmin {
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
