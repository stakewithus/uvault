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

contract VaultV2 is IVault, ERC20 {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    event Invest(uint amount);
    event Deposit(address indexed from, uint amount);
    event Withdraw(address indexed to, uint amount);

    address public admin;
    address public override token;
    address public override strategy;

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
        require(IStrategy(_strategy).token() == token); // dev: strategy.token != vault.token
        require(IStrategy(_strategy).vault() == address(this)); // dev: strategy.vault != vault
        require(_strategy != strategy); // dev: new strategy == current strategy

        // withdraw from current strategy
        if (strategy != address(0)) {
            IERC20(token).safeApprove(strategy, 0);

            uint bal = IStrategy(strategy).balance();
            if (bal > 0) {
                IStrategy(strategy).withdraw(bal);
            }
        }

        strategy = _strategy;
        // NOTE: Many ERC20s require approval from zero to nonzero or nonzero to zero
        IERC20(token).safeApprove(strategy, 0);
        IERC20(token).safeApprove(strategy, uint256(-1));
    }

    function _balance() internal view returns (uint) {
        // NOTE: total balance = balance of vault + strategy
        return IERC20(token).balanceOf(address(this)).add(IStrategy(strategy).balance());
    }

    function balance() override external view returns (uint) {
        return _balance();
    }

    function invest() override external whenStrategyDefined {
        uint bal = IERC20(token).balanceOf(address(this));

        if (bal > 0) {
            IStrategy(strategy).deposit(bal);
            emit Invest(bal);
        }
    }

    function deposit(uint _amount) override external {
        require(_amount > 0); // dev: amount == 0

        _mint(msg.sender, _amount);
        IERC20(token).safeTransferFrom(msg.sender, address(this), _amount);

        emit Deposit(msg.sender, _amount);
    }

    function withdraw(uint _shares, uint _min) override external whenStrategyDefined {
        uint totalSupply = totalSupply();
        require(totalSupply > 0); // dev: total supply == 0
        require(_shares > 0); // dev: amount == 0

        /*
        s = shares
        T = total supply of shares
        a = amount of tokens
        B = total balance of tokens in vault + strategy
        s / T = a / B
        a = s * B / T
        */
        uint amount = _balance().mul(_shares).div(totalSupply);
        uint bal = IERC20(token).balanceOf(address(this));

        if (bal < amount) {
            // NOTE: can skip check for underflow here since bal < amount
            IStrategy(strategy).withdraw(amount - bal);
            uint balAfter = ERC20(token).balanceOf(address(this));

            if (balAfter < amount) {
                amount = balAfter;
            }
        }

        require(amount >= _min); // dev: amount < min return

        _burn(msg.sender, amount);
        IERC20(token).safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, amount);
    }
}