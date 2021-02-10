// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../StrategyERC20.sol";
import "../interfaces/uniswap/Uniswap.sol";
import "../interfaces/curve/LiquidityGauge.sol";
import "../interfaces/curve/Minter.sol";
import "../interfaces/curve/StableSwapPax.sol";
import "../interfaces/curve/DepositPax.sol";

contract StrategyPaxV2 is StrategyERC20 {
    // Uniswap //
    address private constant UNISWAP = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    address internal constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address internal constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address internal constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address internal constant PAX = 0x8E870D67F660D95d5be530380D0eC0bd388289E1;

    // DAI = 0 | USDC = 1 | USDT = 2 | PAX = 3
    uint internal underlyingIndex;
    // precision to convert 10 ** 18  to underlying decimals
    uint[4] private PRECISION_DIV = [1, 1e12, 1e12, 1];

    // Curve //
    // StableSwapPax
    address private constant SWAP = 0x06364f10B501e868329afBc005b3492902d6C763;
    // liquidity provider token (ypaxCrv DAI/USDC/USDT/PAX)
    address private constant LP = 0xD905e2eaeBe188fc92179b6350807D8bd91Db0D8;
    // DepositPax
    address private constant DEPOSIT = 0xA50cCc70b6a011CffDdf45057E39679379187287;
    // LiquidityGauge
    address private constant GAUGE = 0x64E3C23bfc40722d3B649844055F1D51c1ac041d;
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
        // so the risk of them getting stolen is minimal
        IERC20(CRV).safeApprove(UNISWAP, uint(-1));
    }

    function _totalAssets() internal view override returns (uint) {
        uint lpBal = LiquidityGauge(GAUGE).balanceOf(address(this));
        uint pricePerShare = StableSwapPax(SWAP).get_virtual_price();

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
            uint pricePerShare = StableSwapPax(SWAP).get_virtual_price();
            uint shares = bal.mul(PRECISION_DIV[_index]).mul(1e18).div(pricePerShare);
            uint min = shares.mul(SLIPPAGE_MAX - slippage) / SLIPPAGE_MAX;

            DepositPax(DEPOSIT).add_liquidity(amounts, min);
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
        _depositIntoCurve(underlying, underlyingIndex);
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
        IERC20(LP).safeApprove(DEPOSIT, 0);
        IERC20(LP).safeApprove(DEPOSIT, lpBal);

        /*
        underlying amount = (shares * price per shares) / (1e18 * precision div)
        */
        uint pricePerShare = StableSwapPax(SWAP).get_virtual_price();
        uint underlyingAmount =
            lpBal.mul(pricePerShare).div(PRECISION_DIV[underlyingIndex]) / 1e18;
        uint min = underlyingAmount.mul(SLIPPAGE_MAX - slippage) / SLIPPAGE_MAX;
        // withdraw creates LP dust
        DepositPax(DEPOSIT).remove_liquidity_one_coin(
            lpBal,
            int128(underlyingIndex),
            min,
            false
        );
        // Now we have underlying
    }

    /*
    @notice Returns address and index of token with lowest balance in Curve StableSwap
    */
    function _getMostPremiumToken() internal view returns (address, uint) {
        uint[4] memory balances;
        balances[0] = StableSwapPax(SWAP).balances(0); // DAI
        balances[1] = StableSwapPax(SWAP).balances(1).mul(1e12); // USDC
        balances[2] = StableSwapPax(SWAP).balances(2).mul(1e12); // USDT
        balances[3] = StableSwapPax(SWAP).balances(3); // PAX

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
        if (minIndex == 2) {
            return (USDT, 2);
        }
        return (PAX, 3);
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
