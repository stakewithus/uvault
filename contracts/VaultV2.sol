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

// TODO: test
// TODO: doc
// TODO: reentrancy lock
// TODO circuit breaker
// TODO: keep percentage of underlying token as reserve to save gas on withdraw
// TODO inline safeTransfer to save gas?
// TODO  protect agains hack by directly sending token to this contract's address
// TODO: implement reserve to make withdraw cheap
// TODO: safe withdraw any token in case strategy sends back wrong token

contract VaultV2 is IVault, ERC20 {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    address public admin;
    address override public token;
    address override public strategy;

    constructor(
        address _token, string memory _name, string memory _symbol
    ) ERC20(_name, _symbol) public  {
        require(_token != address(0)); // dev: token == zero address

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
        require(_admin != address(0)); // dev: admin == zero address
        admin = _admin;
    }

    function setStrategy(address _strategy) override public onlyAdmin {
        require(_strategy != address(0)); // dev: strategy == zero address
        require(IStrategy(_strategy).underlyingToken() == token); // dev: strategy.token != vault.token
        require(IStrategy(_strategy).vault() == address(this)); // dev: strategy.vault != vault
        require(_strategy != strategy); // dev: new strategy == current strategy

        // withdraw from current strategy
        if (strategy != address(0)) {
            IERC20(token).safeApprove(strategy, 0);
            IStrategy(strategy).exit();
        }

        strategy = _strategy;
        IERC20(token).safeApprove(strategy, uint256(-1));
    }

    /*
    @notice Invest token in vault into strategy
    @param _amount Amount of token to invest
    @param _min Min amount of yield earning tokens to return. Prevents slippage
    */
    function invest(uint _amount, uint _min)
        override external onlyAdmin whenStrategyDefined
    {
        require(_amount > 0); // dev: amount = 0
        // NOTE: infinite approval is set when this strategy was set
        IStrategy(strategy).deposit(_amount, _min);
    }

    function deposit(uint _amount) override external {
        require(_amount > 0); // dev: amount == 0

        _mint(msg.sender, _amount);
        IERC20(token).safeTransferFrom(msg.sender, address(this), _amount);
    }

    /*
    @notice Withdraw shares for yield token
    @param _shares Amount of shares to burn
    @param _min Minimum number of yield token to return
    */
    function withdraw(uint _shares, uint _min)
        override external whenStrategyDefined
    {
        uint totalSupply = totalSupply();
        require(totalSupply > 0); // dev: total supply == 0
        require(_shares > 0); // dev: amount == 0

        /*
        s = sahres
        T = total supply of shares
        y = amount of yield token to return
        Y = total amount of yield token

        s / T = y / Y

        NOTE: value of y per s is low when there are many token in vault
              not yet invested in strategy
        */
        // TODO: How to handle Y = 0 when strategy is exited
        uint amount = _shares.mul(
            IStrategy(strategy).yieldTokenBalance()
        ).div(totalSupply);

        address yieldToken = IStrategy(strategy).yieldToken();
        uint bal = IERC20(yieldToken).balanceOf(address(this));
        if (bal < amount) {
            // NOTE: can skip check for underflow here since bal < amount
            IStrategy(strategy).withdraw(amount - bal, _min);
            uint balAfter = ERC20(yieldToken).balanceOf(address(this));

            if (balAfter < amount) {
                amount = balAfter;
            }
        }

        require(amount >= _min); // dev: amount < min return

        _burn(msg.sender, amount);
        IERC20(yieldToken).safeTransfer(msg.sender, amount);
    }
}