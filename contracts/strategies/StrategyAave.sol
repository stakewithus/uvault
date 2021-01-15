// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../interfaces/curve/StableSwapAave.sol";
import "../interfaces/curve/LiquidityGaugeV2.sol";
import "../interfaces/curve/Minter.sol";
import "../StrategyBaseV2.sol";
import "../UseUniswap.sol";

contract StrategyAave is StrategyBaseV2, UseUniswap {
    address internal constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address internal constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address internal constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    // DAI = 0 | USDC = 1 | USDT = 2
    uint internal underlyingIndex;
    // precision to convert 10 ** 18  to underlying decimals
    uint internal precisionDiv;

    // Curve //
    // liquidity provider token (Curve aDAI/aUSDC/aUSDT)
    address private constant LP = 0xFd2a8fA60Abd58Efe3EeE34dd494cD491dC14900;
    // StableSwapAave
    address private constant POOL = 0xDeBF20617708857ebe4F679508E7b7863a8A8EeE;
    // LiquidityGaugeV2
    address private constant GAUGE = 0xd662908ADA2Ea1916B3318327A97eB18aD588b5d;
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
        uint lpBal = LiquidityGaugeV2(GAUGE).balanceOf(address(this));
        uint pricePerShare = StableSwapAave(POOL).get_virtual_price();

        return lpBal.mul(pricePerShare).div(precisionDiv) / 1e18;
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
            uint[3] memory amounts;
            amounts[_index] = bal;

            uint pricePerShare = StableSwapAave(POOL).get_virtual_price();
            uint shares = bal.mul(precisionDiv).mul(1e18).div(pricePerShare);
            uint min = shares.mul(SLIPPAGE_MAX - slippage).div(SLIPPAGE_MAX);

            StableSwapAave(POOL).add_liquidity(amounts, min, true);
        }

        // stake into LiquidityGaugeV2
        uint lpBal = IERC20(LP).balanceOf(address(this));
        if (lpBal > 0) {
            IERC20(LP).safeApprove(GAUGE, 0);
            IERC20(LP).safeApprove(GAUGE, lpBal);
            LiquidityGaugeV2(GAUGE).deposit(lpBal);
        }
    }

    /*
    @notice Deposits underlying to LiquidityGaugeV2
    */
    function _depositUnderlying() internal override {
        _deposit(underlying, underlyingIndex);
    }

    function _getTotalShares() internal view override returns (uint) {
        return LiquidityGaugeV2(GAUGE).balanceOf(address(this));
    }

    function _withdrawUnderlying(uint _lpAmount) internal override {
        // withdraw LP from  LiquidityGaugeV2
        LiquidityGaugeV2(GAUGE).withdraw(_lpAmount);

        // withdraw underlying //
        uint lpBal = IERC20(LP).balanceOf(address(this));

        // remove liquidity
        IERC20(LP).safeApprove(POOL, 0);
        IERC20(LP).safeApprove(POOL, _lpAmount);

        /*
        (shares * price per shares) / (1e18 * precisionDiv) = underlying amount
        */
        uint pricePerShare = StableSwapAave(POOL).get_virtual_price();
        uint underlyingAmount = _lpAmount.mul(pricePerShare).div(precisionDiv) / 1e18;
        uint min = underlyingAmount.mul(SLIPPAGE_MAX - slippage).div(SLIPPAGE_MAX);
        // withdraw creates LP dust
        StableSwapAave(POOL).remove_liquidity_one_coin(
            lpBal,
            int128(underlyingIndex),
            min,
            true
        );
        // Now we have underlying
    }

    /*
    @notice Returns address and index of token with lowest balance in Curve POOL
    */
    function _getMostPremiumToken() private view returns (address, uint) {
        uint[3] memory balances;
        balances[0] = StableSwapAave(POOL).balances(0); // DAI
        balances[1] = StableSwapAave(POOL).balances(1).mul(1e12); // USDC
        balances[2] = StableSwapAave(POOL).balances(2).mul(1e12); // USDT

        uint minIndex = 0;
        for (uint i = 1; i < balances.length; i++) {
            if (balances[i] <= balances[minIndex]) {
                minIndex = i;
            }
        }

        if (minIndex == 0) {
            return (DAI, 0);
        }
        if (minIndex == 1) {
            return (USDC, 1);
        }
        return (USDT, 2);
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
