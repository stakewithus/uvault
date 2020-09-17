// TODO: lock version
pragma solidity ^0.6.0;

// TODO create ERC20 lite to save gas
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../../interfaces/uniswap/Uniswap.sol";
import "../../interfaces/curve/ICurveFi.sol";
import "../../interfaces/curve/Gauge.sol";
import "../../interfaces/curve/Minter.sol";
import "../../interfaces/curve/DepositCompound.sol";
import "../../interfaces/yearn/yERC20.sol";
import "../interfaces/IController.sol";
import "../interfaces/IStrategy.sol";

contract StrategyUsdcToCcrv is IStrategy {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    address override public admin;
    address override public controller;
    address override public vault;

    // TODO remove withdraw fee?
    uint public withdrawFee = 50;
    uint public withdrawFeeMax = 10000;

    // performance fee sent to treasury when harvest() generates profit
    uint public performanceFee = 50;
    uint public performanceFeeMax = 10000;

    address constant private usdc = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);

    // Curve
    // cDAI/cUSDC
    address constant private cCrv = address(0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2);
    // DepositCompound
    address constant private depositC = address(0xeB21209ae4C2c9FF2a86ACA31E123764A3B6Bc06);
    // StableSwapCompound
    address constant private curve = address(0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56);
    // cCrv Gauge
    address constant private gauge = address(0x7ca5b0a2910B33e9759DC7dDB0413949071D7575);
    // Minter
    address constant private minter = address(0xd061D61a4d941c39E5453435B6345Dc261C2fcE0);
    // DAO
    address constant private crv = address(0xD533a949740bb3306d119CC777fa900bA034cd52);

    // DEX related addresses
    address constant private uniswap = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    address constant private weth = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2); // used for crv <> weth <> dai route

    // USDC yVault
    address constant private yUsdc = address(0xd6aD7a6750A7593E092a9B218d66C0A814a3436e);

    constructor(address _controller, address _vault) public {
        require(_controller != address(0)); // dev: controller = zero address
        require(_vault != address(0)); // dev: vault = zero address

        admin = msg.sender;
        controller = _controller;
        vault = _vault;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin); // dev: !admin
        _;
    }

    modifier onlyVault() {
        require(msg.sender == vault); // dev: !vault
        _;
    }

    modifier onlyAdminOrVault() {
        require(msg.sender == admin || msg.sender == vault); // dev: !admin and !vault
        _;
    }

    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0)); // dev: admin = zero address
        admin = _admin;
    }

    function setController(address _controller) external onlyAdmin {
        require(_controller != address(0)); // dev: controller = zero address
        controller = _controller;
    }

    function setWithdrawFee(uint _fee) external onlyAdmin {
        require(_fee <= withdrawFeeMax); // dev: withdraw fee > max
        withdrawFee = _fee;
    }

    function setPerformanceFee(uint _fee) external onlyAdmin {
        require(_fee <= performanceFee); // dev: performance fee > max
        performanceFee = _fee;
    }

    function underlyingToken() override external view returns (address) {
        return usdc;
    }

    /*
    @notice Get amout of USDC from cCrv
    @param _yCrvAmount Amount of cCrv to convert to USDC
    */
    function _getYcrvToUsdc( uint _yCrvAmount) internal view returns (uint) {
        // USDC = index 1
        return DepositCompound(
            depositC
        ).calc_withdraw_one_coin(_yCrvAmount, int128(1));
    }

    function _underlyingBalance() internal view returns (uint) {
        return _getYcrvToUsdc(Gauge(gauge).balanceOf(address(this)));
    }

    /*
    @notice Returns amount of USDC locked in this contract
    */
    function underlyingBalance() override external view returns (uint) {
        return _underlyingBalance();
    }

    /*
    @notice Deposits USDC for cCrv
    */
    function _usdcToCcrv() internal {
        // USDC to cUsdc
        uint256 usdcBal = IERC20(usdc).balanceOf(address(this));
        if (usdcBal > 0) {
            IERC20(usdc).safeApprove(depositC, usdcBal);

            usdcBal = 1000;
            // mint cCrv
            // min slippage is set to 0
            DepositCompound(depositC).add_liquidity([0, usdcBal], 0);
        }

        // stake cCrv into Gauge
        uint256 cCrv = IERC20(cCrv).balanceOf(address(this));
        if (cCrv > 0) {
            IERC20(cCrv).safeApprove(gauge, cCrv);
            Gauge(gauge).deposit(cCrv);
        }
    }

    function deposit(uint _amount) override external onlyVault {
        require(_amount > 0); // amount == 0

        // NOTE: msg.sender == vault
        IERC20(usdc).safeTransferFrom(msg.sender, address(this), _amount);
        _usdcToCcrv();
    }

    function withdraw(uint amount) override external {
    }

    function withdrawAll() override external {

    }
    function harvest() override external {

    }
    function exit() override external {
    }
}