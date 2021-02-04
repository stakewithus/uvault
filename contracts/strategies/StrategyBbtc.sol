// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../StrategyERC20.sol";
import "../interfaces/uniswap/Uniswap.sol";
import "../interfaces/curve/StableSwapSBTC.sol";
import "../interfaces/curve/StableSwapBBTC.sol";
import "../interfaces/curve/DepositBBTC.sol";
import "../interfaces/curve/LiquidityGaugeV2.sol";
import "../interfaces/curve/Minter.sol";

contract StrategyBbtc is StrategyERC20 {
    // Uniswap //
    address private constant UNISWAP = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    address internal constant BBTC = 0x9BE89D2a4cd102D8Fecc6BF9dA793be995C22541;
    address internal constant REN_BTC = 0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D;
    address internal constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
    address internal constant SBTC = 0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6;

    // bBTC = 0 | renBTC = 1 | wBTC = 2 | sBTC = 3
    uint internal underlyingIndex;
    // precision to convert 10 ** 18  to underlying decimals
    uint[4] private PRECISION_DIV = [1e10, 1e10, 1e10, 1];

    // Curve //
    // liquidity provider token (Curve bBTC / sBTC)
    address private constant LP = 0x410e3E86ef427e30B9235497143881f717d93c2A;
    // StableSwapSBTC
    address private constant BASE_POOL = 0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714;
    // StableSwapBBTC
    address private constant SWAP = 0x071c661B4DeefB59E2a3DdB20Db036821eeE8F4b;
    // DepositBBTC
    address private constant DEPOSIT = 0xC45b2EEe6e09cA176Ca3bB5f7eEe7C47bF93c756;
    // LiquidityGaugeV2
    address private constant GAUGE = 0xdFc7AdFa664b08767b735dE28f9E84cd30492aeE;
    // Minter
    address private constant MINTER = 0xd061D61a4d941c39E5453435B6345Dc261C2fcE0;
    // CRV
    address private constant CRV = 0xD533a949740bb3306d119CC777fa900bA034cd52;

    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public StrategyERC20(_controller, _vault, _underlying) {
        // These tokens are never held by this contract
        // so the risk of them being stolen is minimal
        IERC20(CRV).safeApprove(UNISWAP, uint(-1));
    }

    function _totalAssets() internal view override returns (uint) {
        uint lpBal = LiquidityGaugeV2(GAUGE).balanceOf(address(this));
        uint pricePerShare = StableSwapBBTC(SWAP).get_virtual_price();

        return lpBal.mul(pricePerShare).div(PRECISION_DIV[underlyingIndex]) / 1e18;
    }

    /*
    @notice deposit token into curve
    */
    function _depositIntoCurve(address _token, uint _index) private {
        // token to LP
        uint bal = IERC20(_token).balanceOf(address(this));
        if (bal > 0) {
            IERC20(_token).safeApprove(DEPOSIT, 0);
            IERC20(_token).safeApprove(DEPOSIT, bal);

            // mint LP
            uint[4] memory amounts;
            amounts[_index] = bal;

            /*
            shares = underlying amount * precision div * 1e18 / price per share
            */
            uint pricePerShare = StableSwapBBTC(SWAP).get_virtual_price();
            uint shares = bal.mul(PRECISION_DIV[_index]).mul(1e18).div(pricePerShare);
            uint min = shares.mul(SLIPPAGE_MAX - slippage) / SLIPPAGE_MAX;

            DepositBBTC(DEPOSIT).add_liquidity(amounts, min);
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
    function _deposit() internal override {
        _depositIntoCurve(underlying, underlyingIndex);
    }

    function _getTotalShares() internal view override returns (uint) {
        return LiquidityGaugeV2(GAUGE).balanceOf(address(this));
    }

    function _withdraw(uint _lpAmount) internal override {
        // withdraw LP from  LiquidityGaugeV2
        LiquidityGaugeV2(GAUGE).withdraw(_lpAmount);

        // withdraw underlying //
        uint lpBal = IERC20(LP).balanceOf(address(this));

        // remove liquidity
        IERC20(LP).safeApprove(DEPOSIT, 0);
        IERC20(LP).safeApprove(DEPOSIT, lpBal);

        /*
        underlying amount = (shares * price per shares) / (1e18 * precision div)
        */
        uint pricePerShare = StableSwapBBTC(SWAP).get_virtual_price();
        uint underlyingAmount =
            lpBal.mul(pricePerShare).div(PRECISION_DIV[underlyingIndex]) / 1e18;
        uint min = underlyingAmount.mul(SLIPPAGE_MAX - slippage) / SLIPPAGE_MAX;
        // withdraw creates LP dust
        DepositBBTC(DEPOSIT).remove_liquidity_one_coin(
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
        uint[4] memory balances;
        balances[0] = StableSwapBBTC(SWAP).balances(0).mul(1e10); // OBTC
        balances[1] = StableSwapSBTC(BASE_POOL).balances(0).mul(1e10); // REN_BTC
        balances[2] = StableSwapSBTC(BASE_POOL).balances(1).mul(1e10); // WBTC
        balances[3] = StableSwapSBTC(BASE_POOL).balances(2); // SBTC

        uint minIndex = 0;
        for (uint i = 1; i < balances.length; i++) {
            if (balances[i] <= balances[minIndex]) {
                minIndex = i;
            }
        }

        if (minIndex == 0) {
            return (BBTC, 0);
        }
        if (minIndex == 1) {
            return (REN_BTC, 1);
        }
        if (minIndex == 2) {
            return (WBTC, 1);
        }
        return (SBTC, 2);
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
        // BBTC gauge has no rewards so don't call
        // LiquidityGaugeV2(GAUGE).claim_rewards();
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
        _claimRewards(underlying);
        _withdrawAll();
    }

    function sweep(address _token) external override onlyAdmin {
        require(_token != underlying, "protected token");
        require(_token != GAUGE, "protected token");
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
