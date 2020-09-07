// TODO: lock version
pragma solidity ^0.6.0;

// TODO create ERC20 lite to save gas
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./interfaces/ICurveFi.sol";
import "./interfaces/Guage.sol";
import "./interfaces/yVault.sol";
import "../interfaces/IStrategy.sol";
import "../interfaces/IVault.sol";

// TODO interface IStrategy
// TODO: claim all CRV to DAI and withdraw to vault
contract StrategyDAItoYCRV {
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
    uint public underlyingTotal;
    // DAI
    address public underlyingToken = address(0x6B175474E89094C44Da98b954EedeAC495271d0F);

    /*
    address(0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8), // yCRV underlying
    address(0xFA712EE4788C042e2B7BB55E6cb8ec569C4530c1), // _gauge
    address(0xd061D61a4d941c39E5453435B6345Dc261C2fcE0), // _mintr
    address(0xD533a949740bb3306d119CC777fa900bA034cd52), // _crv
    address(0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51), // _curve
    address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2), // _weth
    address(0x6B175474E89094C44Da98b954EedeAC495271d0F), // _dai
    address(0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01), // _yDai
    address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D) // _uniswap
    */

    // yDAIyUSDCyUSDTyTUSD (yCRV)
    address constant public yCrv = address(0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8);
    address constant public pool = address(0xFA712EE4788C042e2B7BB55E6cb8ec569C4530c1);

    address constant public mintr = address(0xd061D61a4d941c39E5453435B6345Dc261C2fcE0);
    address constant public crv = address(0xD533a949740bb3306d119CC777fa900bA034cd52);
    address constant public uni = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    address constant public weth = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2); // used for crv <> weth <> dai route

    address constant public dai = address(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    address constant public yDai = address(0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01);
    address constant public curve = address(0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51);

    constructor(address _controller, address _vault) public {
        require(_controller != address(0)); // dev: controller == zero address
        require(_vault != address(0)); // dev: vault == zero address
        // require(IVault(_vault).token() == underlyingToken); // dev: vault.token !== strategy.token

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

    function _getBalance() internal view returns (uint) {
        return Gauge(pool).balanceOf(address(this));
    }

    function getBalance() external view returns (uint) {
        return _getBalance();
    }

    function getExchangeRate() external view returns (uint, uint) {
        return (_getBalance(), underlyingTotal);
    }

    function _deposit(address _from, uint _amount, uint _min) internal {
        require(_amount > 0); // amount == 0

        underlyingTotal = underlyingTotal.add(_amount);

        IERC20(underlyingToken).safeTransferFrom(_from, address(this), _amount);

        // DAI to yDAI
        uint256 daiBal = IERC20(dai).balanceOf(address(this));
        if (daiBal > 0) {
            // IERC20(dai).approve(yDai, 0);
            IERC20(dai).approve(yDai, daiBal); // TODO: infinite approve?
            yVault(yDai).deposit(daiBal);
        }

        // yDAI to yCRV
        uint256 yDaiBal = IERC20(yDai).balanceOf(address(this));
        if (yDaiBal > 0) {
            // IERC20(yDai).approve(curve, 0);
            IERC20(yDai).approve(curve, yDaiBal); // TODO: infinite approve?
            // NOTE: mints yCRV, reverts if amount of yCRV < _min
            ICurveFi(curve).add_liquidity([yDaiBal, 0, 0, 0], _min);
        }

        uint256 yCrvBal = IERC20(yCrv).balanceOf(address(this));
        if (yCrvBal > 0) {
            // IERC20(underlying).safeApprove(pool, 0);
            IERC20(yCrv).safeApprove(pool, yCrvBal);
            Gauge(pool).deposit(yCrvBal);
        }
    }

    function deposit(uint _amount, uint _min) external onlyVault {
        // NOTE: msg.sender == vault
        _deposit(msg.sender, _amount, _min);
    }

    // NOTE: amount of DAI to withdraw
    // TODO: how to handle dust?
    // function withdraw(uint _amount) override external onlyVault {
    //     require(_amount > 0); // dev: amount == 0

    //     // NOTE: save underlying total before withdraw
    //     uint underlyingTotalBefore = underlyingTotal;
    //     underlyingTotal = underlyingTotal.sub(_amount);

    //     uint yCrvTotal = Guage(pool).balanceOf(address(this));

    //     // get yCrv amount from dai amount * yCrv / dai exchange rate
    //     uint yCrvAmount = _amount.mul(yCrvTotal).div(underlyingTotalBefore);

    //     Guage(pool).withdraw(yCrvAmount);

    //     uint yCrvBal = IERC20(yCrv).balanceOf(address(this));
    //     if (yCrvBal < yCrvAmount) {
    //         yCrvAmount = yCrvBal;
    //     }

    //     // yCrv to yDai
    //     // TODO: set min?
    //     uint min = 0;
    //     ICurveFi(curve).remove_liquidity(yCrvAmount, [min, 0, 0, 0])

    //     // withdraw yDai for Dai
    //     uint yDaiBal = yVault(yDai).balanceOf(address(this));
    //     yVault(yDai).withdraw(yDaiBal);

    //     uint daiBal = IERC(dai).balanceOf(address(this));
    //     uint fee = daiBal.mul(withdrawFee).div(withdrawFeeMax);
    //     if (fee > 0) {
    //         address treasury = IController(controller).treasury();
    //         require(treasury != address(0)); // dev: treasury == zero address

    //         IERC20(dai).safeTransfer(treasury, fee);
    //     }

    //     // NOTE: msg.sender == vault
    //     IERC20(dai).safeTransfer(msg.sender, daiBal.sub(fee));
    // }

    // function harvest() external onlyAdmin {
    //     Mintr(mintr).mint(pool);

    //     uint crvBal = IERC20(crv).balanceOf(address(this));
    //     if (crvBal > 0) {
    //         IERC20(crv).safeApprove(uni, 0);
    //         IERC20(crv).safeApprove(uni, crvBal);

    //         address[] memory path = new address[](3);
    //         path[0] = crv;
    //         path[1] = weth;
    //         path[2] = dai;

    //         Uni(uni).swapExactTokensForTokens(crvBal, uint(0), path, address(this), now.add(1800));
    //     }

    //     uint daiBal = IERC20(dai).balanceOf(address(this));
    //     if (daiBal > 0) {
    //         // transfer fee to treasury
    //         uint fee = daiBal.mul(performanceFee).div(performanceMax);
    //         IERC20(dai).safeTransfer(IController(controller).treasury(), fee);

    //         _deposit(address(this), daiBal.sub(fee));
    //     }
    // }
}
