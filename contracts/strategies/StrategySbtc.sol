// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../StrategyERC20.sol";
import "../interfaces/uniswap/Uniswap.sol";
import "../interfaces/curve/StableSwapSBTC.sol";
import "../interfaces/curve/LiquidityGaugeReward.sol";
import "../interfaces/curve/Minter.sol";

contract StrategySbtc is StrategyERC20 {
    // Uniswap //
    address private constant UNISWAP = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    address internal constant REN_BTC = 0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D;
    address internal constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
    address internal constant SBTC = 0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6;

    // renBTC = 0 | wBTC = 1 | sBTC = 2
    uint internal underlyingIndex;
    // precision to convert 10 ** 18  to underlying decimals
    uint[3] private PRECISION_DIV = [1e10, 1e10, 1];

    // Curve //
    // liquidity provider token (Curve renBTC / wBTC / sBTC)
    address private constant LP = 0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3;
    // StableSwapSBTC
    address private constant SWAP = 0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714;
    // LiquidityGaugeReward
    address private constant GAUGE = 0x705350c4BcD35c9441419DdD5d2f097d7a55410F;
    // Minter
    address private constant MINTER = 0xd061D61a4d941c39E5453435B6345Dc261C2fcE0;
    // CRV
    address private constant CRV = 0xD533a949740bb3306d119CC777fa900bA034cd52;

    // SBTC has low liquidity on DEX (Uniswap, Sushi, 1 Inch), so disable buying SBTC
    bool public disableSbtc = true;

    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public StrategyERC20(_controller, _vault, _underlying) {
        // These tokens are never held by this contract
        // so the risk of them getting stolen is minimal
        IERC20(CRV).safeApprove(UNISWAP, uint(-1));
    }

    function setDisableSbtc(bool _disable) external onlyAdmin {
        disableSbtc = _disable;
    }

    function _totalAssets() internal view override returns (uint) {
        uint lpBal = LiquidityGaugeReward(GAUGE).balanceOf(address(this));
        uint pricePerShare = StableSwapSBTC(SWAP).get_virtual_price();

        return lpBal.mul(pricePerShare).div(PRECISION_DIV[underlyingIndex]) / 1e18;
    }

    /*
    @notice deposit token into curve
    */
    function _depositIntoCurve(address _token, uint _index) private {
        // token to LP
        uint bal = IERC20(_token).balanceOf(address(this));
        if (bal > 0) {
            IERC20(_token).safeApprove(SWAP, 0);
            IERC20(_token).safeApprove(SWAP, bal);

            // mint LP
            uint[3] memory amounts;
            amounts[_index] = bal;

            /*
            shares = underlying amount * precision div * 1e18 / price per share
            */
            uint pricePerShare = StableSwapSBTC(SWAP).get_virtual_price();
            uint shares = bal.mul(PRECISION_DIV[_index]).mul(1e18).div(pricePerShare);
            uint min = shares.mul(SLIPPAGE_MAX - slippage) / SLIPPAGE_MAX;

            StableSwapSBTC(SWAP).add_liquidity(amounts, min);
        }

        // stake into LiquidityGaugeReward
        uint lpBal = IERC20(LP).balanceOf(address(this));
        if (lpBal > 0) {
            IERC20(LP).safeApprove(GAUGE, 0);
            IERC20(LP).safeApprove(GAUGE, lpBal);
            LiquidityGaugeReward(GAUGE).deposit(lpBal);
        }
    }

    /*
    @notice Deposits underlying to LiquidityGaugeReward
    */
    function _deposit() internal override {
        _depositIntoCurve(underlying, underlyingIndex);
    }

    function _getTotalShares() internal view override returns (uint) {
        return LiquidityGaugeReward(GAUGE).balanceOf(address(this));
    }

    function _withdraw(uint _lpAmount) internal override {
        // withdraw LP from  LiquidityGaugeReward
        LiquidityGaugeReward(GAUGE).withdraw(_lpAmount);

        // withdraw underlying //
        uint lpBal = IERC20(LP).balanceOf(address(this));

        /*
        underlying amount = (shares * price per shares) / (1e18 * precision div)
        */
        uint pricePerShare = StableSwapSBTC(SWAP).get_virtual_price();
        uint underlyingAmount =
            lpBal.mul(pricePerShare).div(PRECISION_DIV[underlyingIndex]) / 1e18;
        uint min = underlyingAmount.mul(SLIPPAGE_MAX - slippage) / SLIPPAGE_MAX;
        // withdraw creates LP dust
        StableSwapSBTC(SWAP).remove_liquidity_one_coin(
            lpBal,
            int128(underlyingIndex),
            min
        );
        // Now we have underlying
    }

    /*
    @notice Returns address and index of token with lowest balance in Curve SWAP
    */
    function _getMostPremiumToken() private view returns (address, uint) {
        uint[3] memory balances;
        balances[0] = StableSwapSBTC(SWAP).balances(0).mul(1e10); // REN_BTC
        balances[1] = StableSwapSBTC(SWAP).balances(1).mul(1e10); // WBTC
        balances[2] = StableSwapSBTC(SWAP).balances(2); // SBTC

        uint minIndex = 0;
        for (uint i = 1; i < balances.length; i++) {
            if (balances[i] <= balances[minIndex]) {
                minIndex = i;
            }
        }

        if (minIndex == 0) {
            return (REN_BTC, 0);
        }
        if (minIndex == 1) {
            return (WBTC, 1);
        }
        // SBTC has low liquidity, so buying is disabled by default
        if (!disableSbtc) {
            return (SBTC, 2);
        }
        return (WBTC, 1);
    }

    /*
    @dev Uniswap fails with zero address so no check is necessary here
    */
    function _swap(
        address _from,
        address _to,
        uint _amount
    ) private {
        // create dynamic array with 3 elements
        address[] memory path = new address[](3);
        path[0] = _from;
        path[1] = WETH;
        path[2] = _to;

        Uniswap(UNISWAP).swapExactTokensForTokens(
            _amount,
            1,
            path,
            address(this),
            block.timestamp
        );
    }

    function _claimRewards(address _token) private {
        LiquidityGaugeReward(GAUGE).claim_rewards();
        // claim CRV
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

        _claimRewards(token);

        uint bal = IERC20(token).balanceOf(address(this));
        if (bal > 0) {
            // transfer fee to treasury
            uint fee = bal.mul(performanceFee) / PERFORMANCE_FEE_MAX;
            if (fee > 0) {
                address treasury = IController(controller).treasury();
                require(treasury != address(0), "treasury = zero address");

                IERC20(token).safeTransfer(treasury, fee);
            }

            _depositIntoCurve(token, index);
        }
    }

    /*
    @notice Exit strategy by harvesting CRV to underlying token and then
            withdrawing all underlying to vault
    @dev Must return all underlying token to vault
    @dev Caller should implement guard agains slippage
    */
    function exit() external override onlyAuthorized {
        if (forceExit) {
            return;
        }
        _claimRewards(underlying);
        _withdrawAll();
    }

    function sweep(address _token) external override onlyAdmin {
        require(_token != underlying, "protected token");
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
