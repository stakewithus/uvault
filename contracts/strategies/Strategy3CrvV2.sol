// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../StrategyERC20.sol";
import "../interfaces/uniswap/Uniswap.sol";
import "../interfaces/curve/LiquidityGauge.sol";
import "../interfaces/curve/Minter.sol";
import "../interfaces/curve/StableSwap3Pool.sol";

contract Strategy3CrvV2 is StrategyERC20 {
    // Uniswap //
    address private constant UNISWAP = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    address internal constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address internal constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address internal constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    // DAI = 0 | USDC = 1 | USDT = 2
    uint private immutable UNDERLYING_INDEX;
    // precision to convert 10 ** 18  to underlying decimals
    uint[3] private PRECISION_DIV = [1, 1e12, 1e12];
    // precision div of underlying token (used to save gas)
    uint private immutable PRECISION_DIV_UNDERLYING;

    // Curve //
    // liquidity provider token (3CRV)
    address private constant LP = 0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490;
    // StableSwap3Pool
    address private constant SWAP = 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7;
    // LiquidityGauge
    address private constant GAUGE = 0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A;
    // Minter
    address private constant MINTER = 0xd061D61a4d941c39E5453435B6345Dc261C2fcE0;
    // CRV
    address private constant CRV = 0xD533a949740bb3306d119CC777fa900bA034cd52;

    constructor(
        address _controller,
        address _vault,
        address _underlying,
        uint _underlyingIndex
    ) public StrategyERC20(_controller, _vault, _underlying) {
        UNDERLYING_INDEX = _underlyingIndex;
        PRECISION_DIV_UNDERLYING = PRECISION_DIV[_underlyingIndex];

        // These tokens are never held by this contract
        // so the risk of them getting stolen is minimal
        IERC20(CRV).safeApprove(UNISWAP, uint(-1));
    }

    function _totalAssets() internal view override returns (uint) {
        uint lpBal = LiquidityGauge(GAUGE).balanceOf(address(this));
        uint pricePerShare = StableSwap3Pool(SWAP).get_virtual_price();

        return lpBal.mul(pricePerShare) / (PRECISION_DIV_UNDERLYING * 1e18);
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
            uint pricePerShare = StableSwap3Pool(SWAP).get_virtual_price();
            uint shares = bal.mul(PRECISION_DIV[_index]).mul(1e18).div(pricePerShare);
            uint min = shares.mul(SLIPPAGE_MAX - slippage) / SLIPPAGE_MAX;

            StableSwap3Pool(SWAP).add_liquidity(amounts, min);
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
    function _deposit() internal override {
        _depositIntoCurve(underlying, UNDERLYING_INDEX);
    }

    function _getTotalShares() internal view override returns (uint) {
        return LiquidityGauge(GAUGE).balanceOf(address(this));
    }

    function _withdraw(uint _lpAmount) internal override {
        // withdraw LP from  LiquidityGauge
        LiquidityGauge(GAUGE).withdraw(_lpAmount);

        // withdraw underlying //
        uint lpBal = IERC20(LP).balanceOf(address(this));

        // remove liquidity
        /*
        underlying amount = (shares * price per shares) / (1e18 * precision div)
        */
        uint pricePerShare = StableSwap3Pool(SWAP).get_virtual_price();
        uint underlyingAmount =
            lpBal.mul(pricePerShare) / (PRECISION_DIV_UNDERLYING * 1e18);
        uint min = underlyingAmount.mul(SLIPPAGE_MAX - slippage) / SLIPPAGE_MAX;
        // withdraw creates LP dust
        StableSwap3Pool(SWAP).remove_liquidity_one_coin(
            lpBal,
            int128(UNDERLYING_INDEX),
            min
        );
        // Now we have underlying
    }

    /*
    @notice Returns address and index of token with lowest balance in Curve SWAP
    */
    function _getMostPremiumToken() private view returns (address, uint) {
        uint[3] memory balances;
        balances[0] = StableSwap3Pool(SWAP).balances(0); // DAI
        balances[1] = StableSwap3Pool(SWAP).balances(1).mul(1e12); // USDC
        balances[2] = StableSwap3Pool(SWAP).balances(2).mul(1e12); // USDT

        // DAI
        if (balances[0] <= balances[1] && balances[0] <= balances[2]) {
            return (DAI, 0);
        }

        // USDC
        if (balances[1] <= balances[0] && balances[1] <= balances[2]) {
            return (USDC, 1);
        }

        return (USDT, 2);
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
