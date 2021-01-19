// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../interfaces/curve/StableSwapCompound.sol";
import "../interfaces/curve/DepositCompound.sol";
import "../interfaces/curve/LiquidityGauge.sol";
import "../interfaces/curve/Minter.sol";
import "../StrategyBaseV2.sol";
import "../UseUniswap.sol";

contract StrategyCusdV2 is StrategyBaseV2, UseUniswap {
    // StableSwapCompound
    address private constant SWAP = 0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56;
    address internal constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address internal constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    // DAI = 0 | USDC = 1
    uint internal underlyingIndex;
    // precision to convert 10 ** 18  to underlying decimals
    uint[2] private PRECISION_DIVS = [1, 1e12];

    // Curve //
    // liquidity provider token (cDAI/cUSDC)
    address private constant LP = 0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2;
    // DepositCompound
    address private constant POOL = 0xeB21209ae4C2c9FF2a86ACA31E123764A3B6Bc06;
    // LiquidityGauge
    address private constant GAUGE = 0x7ca5b0a2910B33e9759DC7dDB0413949071D7575;
    // Minter
    address private constant MINTER = 0xd061D61a4d941c39E5453435B6345Dc261C2fcE0;
    // DAO
    address private constant CRV = 0xD533a949740bb3306d119CC777fa900bA034cd52;

    // prevent slippage from deposit / withdraw into Curve ppol
    uint public slippage = 100;
    uint private constant SLIPPAGE_MAX = 10000;

    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public StrategyBaseV2(_controller, _vault, _underlying) {}

    function setSlippage(uint _slippage) external onlyAdmin {
        require(_slippage <= SLIPPAGE_MAX, "slippage > max");
        slippage = _slippage;
    }

    function _totalAssets() internal view override returns (uint) {
        uint lpBal = LiquidityGauge(GAUGE).balanceOf(address(this));
        /*
        get_virtual_price is calculated with exchange rate of cToken to underlying.
        So price per share = underlying price per LP share
        */
        uint pricePerShare = StableSwapCompound(SWAP).get_virtual_price();

        return lpBal.mul(pricePerShare).div(PRECISION_DIVS[underlyingIndex]) / 1e18;
    }

    /*
    @notice deposit token into curve
    */
    function _deposit(address _token, uint _index) internal {
        // token to LP
        uint bal = IERC20(_token).balanceOf(address(this));
        if (bal > 0) {
            IERC20(_token).safeApprove(POOL, 0);
            IERC20(_token).safeApprove(POOL, bal);

            // mint LP
            uint[2] memory amounts;
            amounts[_index] = bal;

            /*
            shares = underlying amount * precision div * 1e18 / price per share
            */
            uint pricePerShare = StableSwapCompound(POOL).get_virtual_price();
            uint shares = bal.mul(PRECISION_DIVS[_index]).mul(1e18).div(pricePerShare);
            uint min = shares.mul(SLIPPAGE_MAX - slippage).div(SLIPPAGE_MAX);

            DepositCompound(POOL).add_liquidity(amounts, min);
        }

        // stake into LiquidityGauge
        uint lpBal = IERC20(LP).balanceOf(address(this));
        if (lpBal > 0) {
            IERC20(LP).safeApprove(GAUGE, 0);
            IERC20(LP).safeApprove(GAUGE, lpBal);
            LiquidityGauge(GAUGE).deposit(lpBal);
        }
    }

    /*
    @notice Deposits underlying to LiquidityGauge
    */
    function _depositUnderlying() internal override {
        _deposit(underlying, underlyingIndex);
    }

    function _getTotalShares() internal view override returns (uint) {
        return LiquidityGauge(GAUGE).balanceOf(address(this));
    }

    function _withdrawUnderlying(uint _lpAmount) internal override {
        // withdraw LP from  LiquidityGauge
        LiquidityGauge(GAUGE).withdraw(_lpAmount);

        // withdraw underlying //
        uint lpBal = IERC20(LP).balanceOf(address(this));

        // remove liquidity
        IERC20(LP).safeApprove(POOL, 0);
        IERC20(LP).safeApprove(POOL, lpBal);

        /*
        underlying amount = (shares * price per shares) / (1e18 * precision div)
        */
        uint pricePerShare = StableSwapCompound(POOL).get_virtual_price();
        uint underlyingAmount =
            lpBal.mul(pricePerShare).div(PRECISION_DIVS[underlyingIndex]) / 1e18;
        uint min = underlyingAmount.mul(SLIPPAGE_MAX - slippage).div(SLIPPAGE_MAX);
        // withdraw creates LP dust
        DepositCompound(POOL).remove_liquidity_one_coin(
            lpBal,
            int128(underlyingIndex),
            min,
            false
        );
        // Now we have underlying
    }

    /*
    @notice Returns address and index of token with lowest balance in Curve POOL
    */

    function _getMostPremiumToken() internal view returns (address, uint) {
        uint[2] memory balances;
        balances[0] = StableSwapCompound(SWAP).balances(0); // DAI
        balances[1] = StableSwapCompound(SWAP).balances(1).mul(1e12); // USDC

        /*
        DAI  0
        USDC 1
        */
        if (balances[0] < balances[1]) {
            return (DAI, 0);
        }

        return (USDC, 1);
    }

    function _swapCrvFor(address _token) private {
        Minter(MINTER).mint(GAUGE);

        uint crvBal = IERC20(CRV).balanceOf(address(this));
        if (crvBal > 0) {
            _swap(CRV, _token, crvBal);
            // Now this contract has token
        }
    }

    /*
    @notice Claim CRV and deposit most premium token into Curve
    */
    function harvest() external override onlyAuthorized {
        (address token, uint index) = _getMostPremiumToken();

        _swapCrvFor(token);

        uint bal = IERC20(token).balanceOf(address(this));
        if (bal > 0) {
            // transfer fee to treasury
            uint fee = bal.mul(performanceFee) / PERFORMANCE_FEE_MAX;
            if (fee > 0) {
                address treasury = IControllerV2(controller).treasury();
                require(treasury != address(0), "treasury = zero address");

                IERC20(token).safeTransfer(treasury, fee);
            }

            _deposit(token, index);
        }
    }

    /*
    @notice Exit strategy by harvesting CRV to underlying token and then
            withdrawing all underlying to vault
    @dev Must return all underlying token to vault
    @dev Caller should implement guard agains slippage
    */
    function exit() external override onlyAuthorized {
        _swapCrvFor(underlying);
        _withdrawAll();
    }
}
