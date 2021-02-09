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
        // These tokens are never held by this contract
        // so the risk of them getting stolen is minimal
        IERC20(CRV).safeApprove(UNISWAP, uint(-1));
        // Minted on Gauge deposit, withdraw and claim_rewards
        // only this contract can spend on UNISWAP
        IERC20(LDO).safeApprove(UNISWAP, uint(-1));
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

    function _getStEthDepositAmount(uint _ethBal) private view returns (uint) {
        /*
        Goal is to find a0 and a1 such that b0 + a0 is close to b1 + a1 

        E = amount of ETH
        b0 = balance of ETH in Curve
        b1 = balance of stETH in Curve
        a0 = amount of ETH to deposit into Curve
        a1 = amount of stETH to deposit into Curve

        d = |b0 - b1|

        if d >= E
            if b0 >= b1
                a0 = 0
                a1 = E
            else
                a0 = E
                a1 = 0
        else
            if b0 >= b1
                # add d to balance Curve pool, plus half of remaining
                a1 = d + (E - d) / 2 = (E + d) / 2
                a0 = E - a1
            else
                a0 = (E + d) / 2
                a1 = E - a0
        */
        uint[2] memory balances;
        balances[0] = StableSwapSTETH(POOL).balances(0);
        balances[1] = StableSwapSTETH(POOL).balances(1);

        uint diff;
        if (balances[0] >= balances[1]) {
            diff = balances[0] - balances[1];
        } else {
            diff = balances[1] - balances[0];
        }

        // a0 = ETH amount is ignored, recomputed after stEth is bought
        // a1 = stETH amount
        uint a1;
        if (diff >= _ethBal) {
            if (balances[0] >= balances[1]) {
                a1 = _ethBal;
            }
        } else {
            if (balances[0] >= balances[1]) {
                a1 = (_ethBal.add(diff)) / 2;
            } else {
                a1 = _ethBal.sub((_ethBal.add(diff)) / 2);
            }
        }

        // a0 is ignored, recomputed after stEth is bought
        return a1;
    }

    /*
    @notice Deposits ETH to LiquidityGaugeV2
    */
    function _deposit() internal override {
        uint bal = address(this).balance;
        if (bal > 0) {
            uint stEthAmount = _getStEthDepositAmount(bal);
            if (stEthAmount > 0) {
                StETH(ST_ETH).submit{value: stEthAmount}(address(this));
            }

            uint ethBal = address(this).balance;
            uint stEthBal = IERC20(ST_ETH).balanceOf(address(this));

            if (stEthBal > 0) {
                // ST_ETH is proxy so don't allow infinite approval
                IERC20(ST_ETH).safeApprove(POOL, stEthBal);
            }

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
        // claim LDO
        LiquidityGaugeV2(GAUGE).claim_rewards();
        // claim CRV
        Minter(MINTER).mint(GAUGE);

        // Infinity approval for Uniswap set inside constructor
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
        if (forceExit) {
            return;
        }
        _claimRewards();
        _withdrawAll();
    }

    function sweep(address _token) external override onlyAdmin {
        require(_token != GAUGE, "protected token");
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
