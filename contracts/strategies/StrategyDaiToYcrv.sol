// TODO: lock version
pragma solidity ^0.6.0;

// TODO create ERC20 lite to save gas
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./interfaces/Uniswap.sol";
import "./interfaces/ICurveFi.sol";
import "./interfaces/Gauge.sol";
import "./interfaces/Minter.sol";
import "./interfaces/yERC20.sol";
import "../interfaces/IController.sol";
import "../interfaces/IStrategy.sol";
import "../interfaces/IVault.sol";

// TODO interface IStrategy
// TODO: claim all CRV to DAI and withdraw to vault
// TOOD: events?
contract StrategyDaiToYcrv {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public admin;
    address public controller;
    address public vault;

    // TODO remove withdraw fee?
    uint public withdrawFee = 50;
    uint public withdrawFeeMax = 10000;

    // performance fee sent to treasury when harvest() generates profit
    uint public performanceFee = 50;
    uint public performanceFeeMax = 10000;

    // total amount of underlying token in this contract
    uint public totalUnderlying;
    address constant private dai = address(0x6B175474E89094C44Da98b954EedeAC495271d0F);

    // Curve
    // yDAIyUSDCyUSDTyTUSD
    address constant private yCrv = address(0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8);
    address constant private gauge = address(0xFA712EE4788C042e2B7BB55E6cb8ec569C4530c1);
    // Curve Minter
    address constant private minter = address(0xd061D61a4d941c39E5453435B6345Dc261C2fcE0);
    // CRV DAO token
    address constant private crv = address(0xD533a949740bb3306d119CC777fa900bA034cd52);
    // Curve
    address constant private curve = address(0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51);

    address constant private uniswap = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    address constant private weth = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2); // used for crv <> weth <> dai route
    address constant private yDai = address(0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01);

    constructor(address _controller, address _vault) public {
        require(_controller != address(0)); // dev: controller == zero address
        require(_vault != address(0)); // dev: vault == zero address
        // require(IVault(_vault).token() == dai); // dev: vault.token !== strategy.token

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

    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0)); // dev: admin == zero address
        admin = _admin;
    }

    function setController(address _controller) external onlyAdmin {
        require(_controller != address(0)); // dev: controller == zero address
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

    function underlyingToken() external view returns (address) {
        return dai;
    }

    function _getBalance() internal view returns (uint) {
        return Gauge(gauge).balanceOf(address(this));
    }

    function getBalance() external view returns (uint) {
        return _getBalance();
    }

    function getExchangeRate() external view returns (uint, uint) {
        return (_getBalance(), totalUnderlying);
    }

    /*
    @notice Deposit `_amount` DAI, swap to `yCrv`, deposit `yCrv` into Curve `Gauge`
    @param _amount Amount of DAI to deposit
    @param _min Minimum amount of `yCrv` that must be returned
    */
    function _deposit(address _from, uint _amount, uint _min) internal {
        require(_amount > 0); // amount == 0

        totalUnderlying = totalUnderlying.add(_amount);

        IERC20(dai).safeTransferFrom(_from, address(this), _amount);

        // DAI to yDAI
        uint256 daiBal = IERC20(dai).balanceOf(address(this));
        if (daiBal > 0) {
            // IERC20(dai).approve(yDai, 0);
            IERC20(dai).approve(yDai, daiBal); // TODO: infinite approve?
            yERC20(yDai).deposit(daiBal);
        }

        // yDAI to yCRV
        uint256 yDaiBal = IERC20(yDai).balanceOf(address(this));
        if (yDaiBal > 0) {
            // IERC20(yDai).approve(curve, 0);
            IERC20(yDai).approve(curve, yDaiBal); // TODO: infinite approve?
            // mint yCRV
            ICurveFi(curve).add_liquidity([yDaiBal, 0, 0, 0], 0);
        }

        uint256 yCrvBal = IERC20(yCrv).balanceOf(address(this));
        require(yCrvBal >= _min); // dev: yCrv < min
        if (yCrvBal > 0) {
            // IERC20(underlying).safeApprove(gauge, 0);
            IERC20(yCrv).safeApprove(gauge, yCrvBal);
            Gauge(gauge).deposit(yCrvBal);
        }
    }

    function deposit(uint _amount, uint _min) external onlyVault {
        // NOTE: msg.sender == vault
        _deposit(msg.sender, _amount, _min);
    }

    // TODO: how to handle dust?

    /*
    @notice Withdraw `_amount` DAI of `yCrv` from Curve `Gauge`
    @param _amount Amount of DAI to withdraw
    @param _min Minimum amount of DAI that must be returned
    */
    function withdraw(uint _amount, uint _min) external onlyVault {
        require(_amount > 0); // dev: amount == 0

        // yCrv in Gauge
        uint yCrvTotal = Gauge(gauge).balanceOf(address(this));
        // calculate yCrv amount to withdraw from DAI
        // yCrv / DAI exchange rate = yCrv total / DAI total
        uint yCrvAmount = _amount.mul(yCrvTotal).div(totalUnderlying);

        // update total after exchange amount is calculated above
        totalUnderlying = totalUnderlying.sub(_amount);

        Gauge(gauge).withdraw(yCrvAmount);

        uint yCrvBal = IERC20(yCrv).balanceOf(address(this));
        if (yCrvBal > 0) {
            // use Uniswap to exchange yCrv for DAI
            IERC20(yCrv).safeApprove(uniswap, 0);
            IERC20(yCrv).safeApprove(uniswap, yCrvBal);

            // route yCrv > WETH > DAI
            address[] memory path = new address[](3);
            path[0] = yCrv;
            path[1] = weth;
            path[2] = dai;

            // TODO: use 1inch?
            Uniswap(uniswap).swapExactTokensForTokens(
                yCrvBal, uint(0), path, address(this), now.add(1800)
            );
        }

        // transfer DAI to treasury and vault
        uint daiBal = IERC20(dai).balanceOf(address(this));
        if (daiBal > 0) {
            // check slippage
            require(daiBal >= _min); // dev: dai amount < min
            // transfer fee to treasury
            uint fee = daiBal.mul(withdrawFee).div(withdrawFeeMax);
            if (fee > 0) {
                address treasury = IController(controller).treasury();
                require(treasury != address(0)); // dev: treasury == zero address

                IERC20(dai).safeTransfer(treasury, fee);
            }

            // transfer rest to vault
            IERC20(dai).safeTransfer(msg.sender, daiBal.sub(fee));
        }
    }

    /*
    @notice Claim CRV, swap for DAI, transfer performance fee to treasury, rdeposit remaning DAI
    */
    function harvest() external onlyAdmin {
        Minter(minter).mint(gauge);

        uint crvBal = IERC20(crv).balanceOf(address(this));
        if (crvBal > 0) {
            // use Uniswap to exchange CRV for DAI
            IERC20(crv).safeApprove(uniswap, 0);
            IERC20(crv).safeApprove(uniswap, crvBal);

            // route CRV > WETH > DAI
            address[] memory path = new address[](3);
            path[0] = crv;
            path[1] = weth;
            path[2] = dai;

            // TODO: use 1inch?
            Uniswap(uniswap).swapExactTokensForTokens(
                crvBal, uint(0), path, address(this), now.add(1800)
            );
        }

        uint daiBal = IERC20(dai).balanceOf(address(this));
        if (daiBal > 0) {
            // transfer fee to treasury
            uint fee = daiBal.mul(performanceFee).div(performanceFeeMax);
            if (fee > 0) {
                address treasury = IController(controller).treasury();
                require(treasury != address(0)); // dev: treasury == zero address

                IERC20(dai).safeTransfer(treasury, fee);
            }

            // NOTE: min yCrv to return is set to 0
            _deposit(address(this), daiBal.sub(fee), 0);
        }
    }
}