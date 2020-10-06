pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../interfaces/uniswap/Uniswap.sol";
import "../interfaces/curve/Gauge.sol";
import "../interfaces/curve/Minter.sol";
import "../interfaces/curve/DepositCompound.sol";
import "../IController.sol";
import "../IStrategy.sol";

/* potential hacks?
- front running?
- slippage when withdrawing all from strategy
*/

contract StrategyUsdcToCusd is IStrategy {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    address public admin;
    address public controller;
    address public vault;

    // performance fee sent to treasury when harvest() generates profit
    uint public performanceFee = 100;
    uint public constant PERFORMANCE_FEE_MAX = 10000;

    address private usdc = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
    // address private  DAI = address(0x6B175474E89094C44Da98b954EedeAC495271d0F);

    address private underlying = usdc;

    // Curve
    // cDAI/cUSDC
    address private cUsd = address(0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2);
    // DepositCompound
    address private depositC = address(0xeB21209ae4C2c9FF2a86ACA31E123764A3B6Bc06);
    // cUsd Gauge
    address private gauge = address(0x7ca5b0a2910B33e9759DC7dDB0413949071D7575);
    // Minter
    address private minter = address(0xd061D61a4d941c39E5453435B6345Dc261C2fcE0);
    // DAO
    address private crv = address(0xD533a949740bb3306d119CC777fa900bA034cd52);

    // DEX related addresses
    address private uniswap = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    // used for crv <> weth <> usdc route
    address private weth = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    constructor(address _controller, address _vault) public {
        require(_controller != address(0), "controller = zero address");
        require(_vault != address(0), "vault = zero address");

        admin = msg.sender;
        controller = _controller;
        vault = _vault;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "!admin");
        _;
    }

    modifier onlyController() {
        require(msg.sender == controller, "!controller");
        _;
    }

    modifier onlyVault() {
        require(msg.sender == vault, "!vault");
        _;
    }

    modifier onlyVaultOrController() {
        require(msg.sender == vault || msg.sender == controller, "!vault and !controller");
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

    function setPerformanceFee(uint _fee) external onlyAdmin {
        require(_fee <= performanceFee, "performance fee > max");
        performanceFee = _fee;
    }

    function underlyingToken() external view returns (address) {
        return underlying;
    }

    function _underlyingBalance() internal view returns (uint) {
        uint gaugeBal = Gauge(gauge).balanceOf(address(this));

        // DAI  = 0
        // usdc = 1
        return DepositCompound(depositC).calc_withdraw_one_coin(gaugeBal, int128(1));
    }

    /*
    @notice Returns amount of underlying stable coin locked in this contract
    */
    function underlyingBalance() external view returns (uint) {
        return _underlyingBalance();
    }

    /*
    @notice Deposits underlying to Gauge
    */
    function _depositUnderlying() internal {
        // underlying to cUsd
        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeApprove(depositC, 0);
            IERC20(underlying).safeApprove(depositC, underlyingBal);
            // mint cUsd
            DepositCompound(depositC).add_liquidity([0, underlyingBal], 0);
        }

        // stake cUsd into Gauge
        uint cUsdBal = IERC20(cUsd).balanceOf(address(this));
        if (cUsdBal > 0) {
            IERC20(cUsd).safeApprove(gauge, 0);
            IERC20(cUsd).safeApprove(gauge, cUsdBal);
            Gauge(gauge).deposit(cUsdBal);
        }
    }

    /*
    @notice Deposit underlying token into this strategy
    @param _underlyingAmount Amount of underlying token to deposit
    */
    function deposit(uint _underlyingAmount) external onlyVault {
        require(_underlyingAmount > 0, "underlying = 0");

        IERC20(underlying).safeTransferFrom(vault, address(this), _underlyingAmount);
        _depositUnderlying();
    }

    function _withdrawUnderlying(uint _cUsdAmount) internal {
        // withdraw cUsd from  Gauge
        Gauge(gauge).withdraw(_cUsdAmount);

        // withdraw dai and usdc
        uint cUsdBal = IERC20(cUsd).balanceOf(address(this));
        IERC20(cUsd).safeApprove(depositC, 0);
        IERC20(cUsd).safeApprove(depositC, cUsdBal);
        // NOTE: creates cUsd dust so we donate it
        DepositCompound(depositC).remove_liquidity_one_coin(cUsdBal, int128(1), 0, true);

        // Now we have usdc
    }

    /*
    @notice Withdraw undelying token to vault
    @param _underlyingAmount Amount of underlying token to withdraw
    */
    function withdraw(uint _underlyingAmount) external onlyVaultOrController {
        require(_underlyingAmount > 0, "underlying = 0");
        uint totalUnderlying = _underlyingBalance();
        require(_underlyingAmount <= totalUnderlying, "underlying > total");

        // calculate cUsd amount to withdraw from underlying
        /*
        u = amount of underlying to withdraw
        U = total underlying redeemable from cUsd in Gauge
        c = amount of cUsd to withdraw
        C = total amount of cUsd in Gauge

        u / U = c / C
        c = u / U * C
        */
        uint gaugeBal = Gauge(gauge).balanceOf(address(this));
        uint cUsdAmount = _underlyingAmount.mul(gaugeBal).div(totalUnderlying);

        if (cUsdAmount > 0) {
            _withdrawUnderlying(cUsdAmount);
        }

        // transfer underlying token to vault
        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeTransfer(vault, underlyingBal);
        }
    }

    function _withdrawAll() internal {
        // gauge balance is same unit as cUsd
        uint gaugeBal = Gauge(gauge).balanceOf(address(this));
        if (gaugeBal > 0) {
            _withdrawUnderlying(gaugeBal);
        }

        uint underlyingBal = IERC20(underlying).balanceOf(address(this));
        if (underlyingBal > 0) {
            IERC20(underlying).safeTransfer(vault, underlyingBal);
        }
    }

    /*
    @notice Withdraw all underlying to vault
    @dev This function does not claim CRV
    */
    function withdrawAll() external onlyVaultOrController {
        _withdrawAll();
    }

    /*
    @notice Claim CRV and swap for underlying token
    */
    function _crvToUnderlying() internal {
        Minter(minter).mint(gauge);

        uint crvBal = IERC20(crv).balanceOf(address(this));
        if (crvBal > 0) {
            // use Uniswap to exchange CRV for underlying
            IERC20(crv).safeApprove(uniswap, 0);
            IERC20(crv).safeApprove(uniswap, crvBal);

            // route crv > weth > underlying
            address[] memory path = new address[](3);
            path[0] = crv;
            path[1] = weth;
            path[2] = underlying;

            Uniswap(uniswap).swapExactTokensForTokens(crvBal, uint(0), path, address(this), now.add(1800));
            // NOTE: Now this contract has underlying token
        }
    }

    /*
    @notice Claim CRV, swap for underlying, transfer performance fee to treasury,
            deposit remaning underlying
    */
    function harvest() external onlyController {
        _crvToUnderlying();

        uint usdcBal = IERC20(usdc).balanceOf(address(this));
        if (usdcBal > 0) {
            // transfer fee to treasury
            uint fee = usdcBal.mul(performanceFee).div(PERFORMANCE_FEE_MAX);
            if (fee > 0) {
                address treasury = IController(controller).treasury();
                require(treasury != address(0), "treasury = zero address");

                IERC20(usdc).safeTransfer(treasury, fee);
            }

            // deposit remaining underlying for cUsd
            _depositUnderlying();
        }
    }

    /*
    @notice Exit strategy by harvesting CRV to underlying token and then
            withdrawing all underlying to vault
    @dev Must return all underlying token to vault
    */
    function exit() external onlyVaultOrController {
        _crvToUnderlying();
        _withdrawAll();
    }

    function sweep(address _token) external onlyAdmin {
        require(_token != underlying, "token = underlying");
        require(_token != cUsd, "token = cUsd");
        IERC20(_token).transfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
