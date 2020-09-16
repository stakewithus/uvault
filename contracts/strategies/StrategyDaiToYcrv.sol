// TODO: lock version
pragma solidity ^0.6.0;

// TODO create ERC20 lite to save gas
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../../interfaces/uniswap/Uniswap.sol";
import "../../interfaces/curve/ICurveFi.sol";
import "../../interfaces/curve/Gauge.sol";
import "../../interfaces/curve/Minter.sol";
import "../../interfaces/curve/DepositY.sol";
import "../../interfaces/yearn/yERC20.sol";
import "../../interfaces/1inch/IOneSplit.sol";
import "../interfaces/IController.sol";
import "../interfaces/IStrategy.sol";

// TODO interface IStrategy
// TODO: claim all CRV to DAI and withdraw to vault
// TOOD: events?
// TODO reentrancy lock
// TODO: remove double call to safeApprove?
// TODO: protect against attacker directly sending token to this strategy
// TODO inline safeTransfer to save gas?

contract StrategyDaiToYcrv is IStrategy {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address override public admin;
    address override public controller;
    address override public vault;

    // TODO remove withdraw fee?
    uint public withdrawFee = 50;
    uint public withdrawFeeMax = 10000;

    // performance fee sent to treasury when harvest() generates profit
    uint public performanceFee = 50;
    uint public performanceFeeMax = 10000;

    address constant private dai = address(0x6B175474E89094C44Da98b954EedeAC495271d0F);

    // Curve
    // yDAIyUSDCyUSDTyTUSD
    address constant private yCrv = address(0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8);
    address constant private gauge = address(0xFA712EE4788C042e2B7BB55E6cb8ec569C4530c1);
    // Curve Minter
    address constant private minter = address(0xd061D61a4d941c39E5453435B6345Dc261C2fcE0);
    // Curve DepositY
    address constant private depositY = address(0xbBC81d23Ea2c3ec7e56D39296F0cbB648873a5d3);
    // CRV DAO token
    address constant private crv = address(0xD533a949740bb3306d119CC777fa900bA034cd52);
    // Curve
    address constant private curve = address(0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51);

    // DEX related addresses
    address constant private oneSplit = address(0x50FDA034C0Ce7a8f7EFDAebDA7Aa7cA21CC1267e);
    address constant private uniswap = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    address constant private weth = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2); // used for crv <> weth <> dai route

    // DAI yVault
    address constant private yDai = address(0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01);

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
        return dai;
    }

    /*
    @notice Get amout of DAI from yCrv
    @param _yCrvAmount Amount of yCrv to convert to DAI
    */
    function _getYcrvToDai( uint _yCrvAmount) internal view returns (uint) {
        // DAI = index 0
        return DepositY(depositY).calc_withdraw_one_coin(_yCrvAmount, int128(0));
    }

    function _underlyingBalance() internal view returns (uint) {
        return _getYcrvToDai(Gauge(gauge).balanceOf(address(this)));
    }

    /*
    @notice Returns amount of DAI locked in this contract
    */
    function underlyingBalance() override external view returns (uint) {
        return _underlyingBalance();
    }

    /*
    @notice Deposits DAI for yCRV
    */
    function _daiToYcrv() internal {
        // DAI to yDAI
        uint256 daiBal = IERC20(dai).balanceOf(address(this));
        if (daiBal > 0) {
            IERC20(dai).safeApprove(yDai, daiBal);
            yERC20(yDai).deposit(daiBal);
        }

        // yDAI to yCRV
        uint256 yDaiBal = IERC20(yDai).balanceOf(address(this));
        if (yDaiBal > 0) {
            IERC20(yDai).safeApprove(curve, yDaiBal);
            // mint yCRV
            // min slippage is set to 0
            ICurveFi(curve).add_liquidity([yDaiBal, 0, 0, 0], 0);
        }

        // stake yCRV into Gauge
        uint256 yCrvBal = IERC20(yCrv).balanceOf(address(this));
        if (yCrvBal > 0) {
            IERC20(yCrv).safeApprove(gauge, yCrvBal);
            Gauge(gauge).deposit(yCrvBal);
        }
    }

    function deposit(uint _amount) override external onlyVault {
        require(_amount > 0); // amount == 0

        // NOTE: msg.sender == vault
        IERC20(dai).safeTransferFrom(msg.sender, address(this), _amount);
        _daiToYcrv();
    }

    /*
    @notice Get value of yDAI from DAI
    @return value of yDAI
    */
    function _getDaiToYdai(uint _daiAmount) internal view returns (uint) {
        return _daiAmount
        .mul(10 ** 18)
        .div(
            yERC20(yDai).getPricePerFullShare() // returns yDAI / DAI
        );
    }

    /*
    @notice Get value of yDAI from yCrv
    @return value of yDAI
    */
    function _getYcrvToYdai(uint _yCrvAmount) internal view returns (uint) {
        return _getDaiToYdai(_getYcrvToDai(_yCrvAmount));
    }

    /*
    @notice Withdraw yCrv and convert it to DAI
    @param _yCrvAmount Amount of yCRV to swap to DAI
    @dev Creates yCrv dust that are too small to convert to yDai
    */
    function _yCrvToDai(uint _yCrvAmount) internal {
        // withdraw yCrv from  Gauge
        Gauge(gauge).withdraw(_yCrvAmount);

        // get yCrv to yDAI
        uint yDaiAmount = _getYcrvToYdai(_yCrvAmount);

        // withdraw yDAI from Curve
        // TODO: pass min as input?
        ICurveFi(curve).remove_liquidity_imbalance(
            [yDaiAmount, 0, 0, 0], _yCrvAmount
        );

        // withdraw DAI from yVault
        uint yDaiBal = IERC20(yDai).balanceOf(address(this));
        if (yDaiBal > 0) {
            yERC20(yDai).withdraw(yDaiBal);
        }
        // Now we have DAI
    }

    /*
    @notice Deposit yCrv dust created from `_yCrvToDai` into Gauge
    */
    function _depositYcrvDust() internal {
        // deposit dust into Gauge
        uint yCrvBal = IERC20(yCrv).balanceOf(address(this));
        if (yCrvBal > 0) {
            IERC20(yCrv).safeApprove(gauge, yCrvBal);
            Gauge(gauge).deposit(yCrvBal);
        }
    }

    /*
    @notice Withdraw `_daiAmount` of `DAI`
    @param _daiAmount Amount of `DAI` to withdraw
    */
    function withdraw(uint _daiAmount) override external onlyVault {
        require(_daiAmount > 0); // dev: amount == 0
        uint totalDai = _underlyingBalance();
        require(_daiAmount <= totalDai); // dev: dai > total redeemable dai

        // get yCrv amount to withdraw from DAI
        /*
        d = amount of DAI to withdraw
        D = total DAI redeemable from yCrv in Gauge
        y = amount of yCrv to withdraw
        Y = total amount of yCrv in Gauge

        d / D = y / Y
        y = d / D * Y
        */
        uint gaugeBal = Gauge(gauge).balanceOf(address(this));
        uint yCrvAmount = _daiAmount.mul(gaugeBal).div(totalDai);

        // TODO:: use this to calculate price of DAI in yCrv?
        // https://github.com/iearn-finance/yearn-protocol/blob/develop/contracts/strategies/StrategyDAICurve.sol#L151
        /*
            // calculate amount of ycrv to withdraw for amount of _want_
            uint256 _ycrv = _amount.mul(1e18).div(ICurveFi(curve).get_virtual_price());
            // calculate amount of yycrv to withdraw for amount of _ycrv_
            uint256 _yycrv = _ycrv.mul(1e18).div(yERC20(yycrv).getPricePerFullShare());
        */

        _yCrvToDai(yCrvAmount);
        _depositYcrvDust();


        // transfer DAI to treasury and vault
        uint daiBal = IERC20(dai).balanceOf(address(this));
        // TODO remove withdrawal fee?
        if (daiBal > 0) {
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

    function _withdrawAll() internal {
        // gauge balance is same unit as yCrv
        uint gaugeBal = Gauge(gauge).balanceOf(address(this));
        if (gaugeBal > 0) {
            _yCrvToDai(gaugeBal);
        }

        uint daiBal = IERC20(dai).balanceOf(address(this));
        if (daiBal > 0) {
            IERC20(dai).safeTransfer(vault, daiBal);
        }
    }

    /*
    @notice Withdraw all DAI to vault
    @dev Must allow admin to withdraw to vault
    @dev This function does not claim CRV
    */
    function withdrawAll() override external onlyAdminOrVault {
        _withdrawAll();
        _depositYcrvDust();
    }

    /*
    @notice Use Uniswap to exchange CRV for DAI
    */
    function _uniswap_CrvToDai() internal {
        Minter(minter).mint(gauge);

        uint crvBal = IERC20(crv).balanceOf(address(this));
        if (crvBal > 0) {
            // use Uniswap to exchange CRV for DAI
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
            // NOTE: Now this contract has DAI
        }
    }

    /*
    @notice Use 1inch to exchange CRV for DAI
    @dev This function does not work, fails at IOneSplit(oneSplit).swap()
    */
    // function _oneInch_CrvToDai() internal {
    //     Minter(minter).mint(gauge);

    //     uint crvBal = IERC20(crv).balanceOf(address(this));
    //     if (crvBal > 0) {
    //         IERC20(crv).safeApprove(oneSplit, 0);
    //         IERC20(crv).safeApprove(oneSplit, crvBal);

    //         uint returnAmount;
    //         uint[] memory distribution;

    //         (returnAmount, distribution) = IOneSplit(oneSplit).getExpectedReturn(
    //             crv, dai, crvBal, 10, 0
    //         );

    //         IOneSplit(oneSplit).swap(crv, dai, crvBal, returnAmount, distribution, 0);
    //         // NOTE: Now this contract has DAI
    //     }
    // }

    /*
    @notice Claim CRV and swap for DAI
    @dev Experiment with uniswap and 1inch
    */
    function _crvToDai() internal {
        _uniswap_CrvToDai();
        // _oneInch_CrvToDai();
    }

    /*
    @notice Claim CRV, swap for DAI, transfer performance fee to treasury, deposit remaning DAI
    */
    function harvest() override external onlyAdmin {
        _crvToDai();

        uint daiBal = IERC20(dai).balanceOf(address(this));
        if (daiBal > 0) {
            // transfer fee to treasury
            uint fee = daiBal.mul(performanceFee).div(performanceFeeMax);
            if (fee > 0) {
                address treasury = IController(controller).treasury();
                require(treasury != address(0)); // dev: treasury == zero address

                IERC20(dai).safeTransfer(treasury, fee);
            }

            // deposit remaining DAI for yCRV
            _daiToYcrv();
        }
    }

    /*
    @notice Transfer dust to treasury
    */
    function _clean() internal {
        uint yCrvBal = IERC20(yCrv).balanceOf(address(this));
        if (yCrvBal > 0) {
            address treasury = IController(controller).treasury();
            require(treasury != address(0)); // dev: treasury == zero address

            IERC20(yCrv).safeTransfer(treasury, yCrvBal);
        }
    }

    /*
    @notice Exit strategy by harvesting CRV to DAI and then withdrawing all DAI to vault
    @dev Must return all DAI to vault
    */
    function exit() override external onlyAdminOrVault {
        _crvToDai();
        _withdrawAll();
        _clean();
    }
}