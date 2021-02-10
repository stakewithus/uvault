// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../StrategyERC20.sol";
import "../interfaces/uniswap/Uniswap.sol";
import "../interfaces/curve/StableSwapSBTC.sol";
import "../interfaces/curve/StableSwapOBTC.sol";
import "../interfaces/curve/DepositOBTC.sol";
import "../interfaces/curve/LiquidityGaugeV2.sol";
import "../interfaces/curve/Minter.sol";

contract StrategyObtc is StrategyERC20 {
    // Uniswap //
    address private constant UNISWAP = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    // SushiSwap //
    address private constant SUSHI = 0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F;

    address internal constant OBTC = 0x8064d9Ae6cDf087b1bcd5BDf3531bD5d8C537a68;
    address internal constant REN_BTC = 0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D;
    address internal constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
    address internal constant SBTC = 0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6;

    // oBTC = 0 | renBTC = 1 | wBTC = 2 | sBTC = 3
    uint internal underlyingIndex;
    // precision to convert 10 ** 18  to underlying decimals
    uint[4] private PRECISION_DIV = [1, 1e10, 1e10, 1];

    // Curve //
    // liquidity provider token (Curve oBTC / sBTC)
    address private constant LP = 0x2fE94ea3d5d4a175184081439753DE15AeF9d614;
    // StableSwapSBTC
    address private constant BASE_POOL = 0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714;
    // StableSwapOBTC
    address private constant SWAP = 0xd81dA8D904b52208541Bade1bD6595D8a251F8dd;
    // DepositOBTC
    address private constant DEPOSIT = 0xd5BCf53e2C81e1991570f33Fa881c49EEa570C8D;
    // LiquidityGaugeV2
    address private constant GAUGE = 0x11137B10C210b579405c21A07489e28F3c040AB1;
    // Minter
    address private constant MINTER = 0xd061D61a4d941c39E5453435B6345Dc261C2fcE0;
    // CRV
    address private constant CRV = 0xD533a949740bb3306d119CC777fa900bA034cd52;

    // BoringDAO //
    /*
    BOR is rewarded on Gauge deposit, withdraw and claim_rewards
    */
    address private constant BOR = 0x3c9d6c1C73b31c837832c72E04D3152f051fc1A9;
    // flag to enable / disable selling of BOR on SushiSwap
    bool public shouldSellBor = true;

    /*
    Best exchange for swapping tokens

    CRV OBTC    sushi
    CRV REN_BTC uni
    CRV WBTC    uni
    CRV SBTC    n/a (1 inch) 

    BOR  WETH    sushi

    WETH OBTC    sushi
    WETH REN_BTC uni
    WETH WBTC    uni
    WETH SBTC    n/a (1 inch)
    */
    bool public disableSbtc = true;
    address[2] private ROUTERS = [UNISWAP, SUSHI];
    // index from underlying index to ROUTERS index
    uint[4] public wethBtcRouter = [1, 0, 0, 0];

    constructor(
        address _controller,
        address _vault,
        address _underlying
    ) public StrategyERC20(_controller, _vault, _underlying) {
        // These tokens are never held by this contract
        // so the risk of them getting stolen is minimal
        IERC20(CRV).safeApprove(UNISWAP, uint(-1));
        IERC20(CRV).safeApprove(SUSHI, uint(-1));

        IERC20(WETH).safeApprove(UNISWAP, uint(-1));
        IERC20(WETH).safeApprove(SUSHI, uint(-1));

        // Minted on Gauge deposit, withdraw and claim_rewards
        // only this contract can spend on SUSHI
        IERC20(BOR).safeApprove(SUSHI, uint(-1));
    }

    function setShouldSellBor(bool _shouldSellBor) external onlyAdmin {
        shouldSellBor = _shouldSellBor;
    }

    function setDisableSbtc(bool _disable) external onlyAdmin {
        disableSbtc = _disable;
    }

    function setWethBtcRouter(uint[4] calldata _wethBtcRouter) external onlyAdmin {
        for (uint i = 0; i < _wethBtcRouter.length; i++) {
            require(_wethBtcRouter[i] <= 1, "router index > 1");
            wethBtcRouter[i] = _wethBtcRouter[i];
        }
    }

    function _totalAssets() internal view override returns (uint) {
        uint lpBal = LiquidityGaugeV2(GAUGE).balanceOf(address(this));
        uint pricePerShare = StableSwapOBTC(SWAP).get_virtual_price();

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
            uint pricePerShare = StableSwapOBTC(SWAP).get_virtual_price();
            uint shares = bal.mul(PRECISION_DIV[_index]).mul(1e18).div(pricePerShare);
            uint min = shares.mul(SLIPPAGE_MAX - slippage) / SLIPPAGE_MAX;

            DepositOBTC(DEPOSIT).add_liquidity(amounts, min);
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
        uint pricePerShare = StableSwapOBTC(SWAP).get_virtual_price();
        uint underlyingAmount =
            lpBal.mul(pricePerShare).div(PRECISION_DIV[underlyingIndex]) / 1e18;
        uint min = underlyingAmount.mul(SLIPPAGE_MAX - slippage) / SLIPPAGE_MAX;
        // withdraw creates LP dust
        DepositOBTC(DEPOSIT).remove_liquidity_one_coin(
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
        uint[2] memory balances;
        balances[0] = StableSwapOBTC(SWAP).balances(0).mul(1e10); // OBTC
        balances[1] = StableSwapOBTC(SWAP).balances(1); // SBTC pool

        if (balances[0] <= balances[1]) {
            return (OBTC, 0);
        } else {
            uint[3] memory baseBalances;
            baseBalances[0] = StableSwapSBTC(BASE_POOL).balances(0).mul(1e10); // REN_BTC
            baseBalances[1] = StableSwapSBTC(BASE_POOL).balances(1).mul(1e10); // WBTC
            baseBalances[2] = StableSwapSBTC(BASE_POOL).balances(2); // SBTC

            uint minIndex = 0;
            for (uint i = 1; i < baseBalances.length; i++) {
                if (baseBalances[i] <= baseBalances[minIndex]) {
                    minIndex = i;
                }
            }

            /*
            REN_BTC 1
            WBTC    2
            SBTC    3
            */

            if (minIndex == 0) {
                return (REN_BTC, 1);
            }
            if (minIndex == 1) {
                return (WBTC, 2);
            }
            // SBTC has low liquidity, so buying is disabled by default
            if (!disableSbtc) {
                return (SBTC, 3);
            }
            return (WBTC, 2);
        }
    }

    /*
    @dev Uniswap fails with zero address so no check is necessary here
    */
    function _swap(
        // uniswap or sushi
        address _router,
        address _from,
        address _to,
        uint _amount
    ) private {
        address[] memory path;

        if (_from == WETH || _to == WETH) {
            path = new address[](2);
            path[0] = _from;
            path[1] = _to;
        } else {
            path = new address[](3);
            path[0] = _from;
            path[1] = WETH;
            path[2] = _to;
        }

        // NOTE: Uniswap and SushiSwap can be called with the same interface
        Uniswap(_router).swapExactTokensForTokens(
            _amount,
            1,
            path,
            address(this),
            block.timestamp
        );
    }

    function _claimRewards(address _token, uint _tokenIndex) private {
        // claim CRV
        Minter(MINTER).mint(GAUGE);

        uint routerIndex = wethBtcRouter[_tokenIndex];
        address router = ROUTERS[routerIndex];

        if (shouldSellBor) {
            // claim BOR
            LiquidityGaugeV2(GAUGE).claim_rewards();

            uint borBal = IERC20(BOR).balanceOf(address(this));
            if (borBal > 0) {
                // BOR is available on SUSHI but not UNISWAP
                _swap(SUSHI, BOR, WETH, borBal);

                uint wethBal = IERC20(WETH).balanceOf(address(this));
                if (wethBal > 0) {
                    _swap(router, WETH, _token, wethBal);
                    // Now this contract has token
                }
            }
        }

        // Infinity approval for Uniswap and Sushi set inside constructor
        uint crvBal = IERC20(CRV).balanceOf(address(this));
        if (crvBal > 0) {
            _swap(router, CRV, _token, crvBal);
            // Now this contract has token
        }
    }

    /*
    @notice Claim CRV and deposit most premium token into Curve
    */
    function harvest() external override onlyAuthorized {
        (address token, uint index) = _getMostPremiumToken();

        _claimRewards(token, index);

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
        _claimRewards(underlying, underlyingIndex);
        _withdrawAll();
    }

    function sweep(address _token) external override onlyAdmin {
        require(_token != underlying, "protected token");
        require(_token != GAUGE, "protected token");
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
