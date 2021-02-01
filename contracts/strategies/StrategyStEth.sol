// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../StrategyETH.sol";
import "../interfaces/uniswap/Uniswap.sol";
import "../interfaces/curve/LiquidityGaugeV2.sol";
import "../interfaces/curve/Minter.sol";
import "../interfaces/curve/StableSwapSTETH.sol";
import "../interfaces/lido/StETH.sol";

contract StrategyStEth is StrategyETH {
    // Uniswap //
    address private constant UNISWAP = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    // Curve //
    // liquidity provider token (Curve ETH/STETH)
    address private constant LP = 0x06325440D014e39736583c165C2963BA99fAf14E;
    // StableSwapSTETH
    address private constant POOL = 0xDC24316b9AE028F1497c275EB9192a3Ea0f67022;
    // LiquidityGaugeV2
    address private constant GAUGE = 0x182B723a58739a9c974cFDB385ceaDb237453c28;
    // Minter
    address private constant MINTER = 0xd061D61a4d941c39E5453435B6345Dc261C2fcE0;
    // CRV
    address private constant CRV = 0xD533a949740bb3306d119CC777fa900bA034cd52;

    // LIDO //
    address private constant ST_ETH = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;
    address private constant LDO = 0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32;

    constructor(address _controller, address _vault)
        public
        StrategyETH(_controller, _vault)
    {
        // TODO inifinity approval?

        // These tokens are never stored inside this contract
        // so risk of them being stolen is minimal
        IERC20(ST_ETH).safeApprove(POOL, uint(-1));
        IERC20(LDO).safeApprove(UNISWAP, uint(-1));
        IERC20(CRV).safeApprove(UNISWAP, uint(-1));
    }

    receive() external payable {
        // Don't allow vault to accidentally send ETH
        require(msg.sender != vault, "msg.sender == vault");
    }

    function _totalAssets() internal view override returns (uint) {
        uint shares = LiquidityGaugeV2(GAUGE).balanceOf(address(this));
        uint pricePerShare = StableSwapSTETH(POOL).get_virtual_price();

        return shares.mul(pricePerShare) / 1e18;
    }

    /*
    @notice Deposits ETH to LiquidityGaugeV2
    */
    function _deposit() internal override {
        uint bal = address(this).balance;
        if (bal > 0) {
            uint half = bal / 2;
            if (half > 0) {
                uint dy = StableSwapSTETH(POOL).get_dy(0, 1, half);
                /*
                if stETH more valuable than ETH, buy stETH
                */
                if (dy < half) {
                    StETH(ST_ETH).submit{value: half}(address(this));
                }
            }

            uint ethBal = address(this).balance;
            uint stEthBal = IERC20(ST_ETH).balanceOf(address(this));

            /*
            shares = eth amount * 1e18 / price per share
            */
            uint pricePerShare = StableSwapSTETH(POOL).get_virtual_price();
            uint shares = bal.mul(1e18).div(pricePerShare);
            uint min = shares.mul(SLIPPAGE_MAX - slippage) / SLIPPAGE_MAX;

            StableSwapSTETH(POOL).add_liquidity{value: ethBal}([ethBal, stEthBal], min);
        }

        // stake into LiquidityGaugeV2
        uint lpBal = IERC20(LP).balanceOf(address(this));
        if (lpBal > 0) {
            IERC20(LP).safeApprove(GAUGE, lpBal);
            LiquidityGaugeV2(GAUGE).deposit(lpBal);
        }
    }

    function _getTotalShares() internal view override returns (uint) {
        return LiquidityGaugeV2(GAUGE).balanceOf(address(this));
    }

    function _withdraw(uint _lpAmount) internal override {
        // withdraw LP from  LiquidityGaugeV2
        LiquidityGaugeV2(GAUGE).withdraw(_lpAmount);

        uint lpBal = IERC20(LP).balanceOf(address(this));
        /*
        eth amount = (shares * price per shares) / 1e18
        */
        uint pricePerShare = StableSwapSTETH(POOL).get_virtual_price();
        uint ethAmount = lpBal.mul(pricePerShare) / 1e18;
        uint min = ethAmount.mul(SLIPPAGE_MAX - slippage) / SLIPPAGE_MAX;

        StableSwapSTETH(POOL).remove_liquidity_one_coin(lpBal, 0, min);
        // Now we have ETH
    }

    /*
    @dev Uniswap fails with zero address so no check is necessary here
    */
    function _swapToEth(address _from, uint _amount) private {
        // create dynamic array with 2 elements
        address[] memory path = new address[](2);
        path[0] = _from;
        path[1] = WETH;

        Uniswap(UNISWAP).swapExactTokensForETH(
            _amount,
            1,
            path,
            address(this),
            block.timestamp
        );
    }

    function _claimRewards() private {
        // claims LDO
        LiquidityGaugeV2(GAUGE).claim_rewards();
        // claim CRV
        Minter(MINTER).mint(GAUGE);

        // Infinity approval for Uniswap to spend on LDO and CRV set inside constructor
        uint ldoBal = IERC20(LDO).balanceOf(address(this));
        if (ldoBal > 0) {
            _swapToEth(LDO, ldoBal);
        }

        uint crvBal = IERC20(CRV).balanceOf(address(this));
        if (crvBal > 0) {
            _swapToEth(CRV, crvBal);
        }
    }

    /*
    @notice Claim CRV and deposit most premium token into Curve
    */
    function harvest() external override onlyAuthorized {
        _claimRewards();

        uint bal = address(this).balance;
        if (bal > 0) {
            // transfer fee to treasury
            uint fee = bal.mul(performanceFee) / PERFORMANCE_FEE_MAX;
            if (fee > 0) {
                address treasury = IController(controller).treasury();
                require(treasury != address(0), "treasury = zero address");
                // treasury must be able to receive ETH
                (bool sent, ) = treasury.call{value: fee}("");
                require(sent, "Send ETH failed");
            }
            _deposit();
        }
    }

    /*
    @notice Exit strategy by harvesting CRV to underlying token and then
            withdrawing all underlying to vault
    @dev Must return all underlying token to vault
    @dev Caller should implement guard agains slippage
    */
    function exit() external override onlyAuthorized {
        _claimRewards();
        _withdrawAll();
    }

    function sweep(address _token) external override onlyAdmin {
        require(_token != GAUGE, "protected token");
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
