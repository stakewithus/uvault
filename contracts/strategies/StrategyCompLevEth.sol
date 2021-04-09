// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "../protocol/IController.sol";
import "../StrategyETH_V3.sol";
import "../interfaces/uniswap/Uniswap.sol";
import "../interfaces/compound/CEth.sol";
import "../interfaces/compound/Comptroller.sol";

/*
APY estimate

c = collateral ratio
i_s = supply interest rate (APY)
i_b = borrow interest rate (APY)
c_s = supply COMP reward (APY)
c_b = borrow COMP reward (APY)

leverage APY = 1 / (1 - c) * (i_s + c_s - c * (i_b - c_b))

plugging some numbers
31.08 = 4 * (7.01 + 4 - 0.75 * (9.08 - 4.76))
*/

contract StrategyCompLevEth is StrategyETH_V3 {
    event Deposit(uint amount);
    event Withdraw(uint amount);
    event Harvest(uint profit);
    event Skim(uint profit);

    // Uniswap //
    address private constant UNISWAP = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    // Compound //
    address private constant COMPTROLLER = 0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B;
    address private constant COMP = 0xc00e94Cb662C3520282E6f5717214004A7f26888;
    address private immutable cToken;

    // buffer to stay below market collateral ratio, scaled up by 1e18
    uint public buffer = 0.04 * 1e18;

    constructor(
        address _controller,
        address _vault,
        address _cToken,
        address _keeper
    ) public StrategyETH_V3(_controller, _vault, _keeper) {
        require(_cToken != address(0), "cToken = zero address");
        cToken = _cToken;

        // These tokens are never held by this contract
        // so the risk of them getting stolen is minimal
        IERC20(COMP).safeApprove(UNISWAP, type(uint).max);
    }

    receive() external payable {
        // Don't allow vault to accidentally send ETH
        require(msg.sender != vault, "msg.sender = vault");
    }

    function setBuffer(uint _buffer) external onlyAdmin {
        require(_buffer > 0 && _buffer < 1e18, "buffer");
        buffer = _buffer;
    }

    function _sendEthToVault(uint _amount) private {
        (bool sent, ) = vault.call{value: _amount}("");
        require(sent, "Send ETH failed");
    }

    function _increaseDebt(uint _amount) private {
        totalDebt = totalDebt.add(_amount);
    }

    function _decreaseDebt(uint _amount) private {
        if (_amount >= totalDebt) {
            totalDebt = 0;
        } else {
            totalDebt -= _amount;
        }
        _sendEthToVault(_amount);
    }

    function _totalAssets() private view returns (uint) {
        // WARNING: This returns balance last time someone transacted with cToken
        (uint error, uint cTokenBal, uint borrowed, uint exchangeRate) =
            CEth(cToken).getAccountSnapshot(address(this));

        if (error > 0) {
            // something is wrong, return 0
            return 0;
        }

        uint supplied = cTokenBal.mul(exchangeRate) / 1e18;
        if (supplied < borrowed) {
            // something is wrong, return 0
            return 0;
        }

        uint bal = address(this).balance;
        // supplied >= borrowed
        return bal.add(supplied - borrowed);
    }

    /*
    @notice Returns amount of ETH locked in this contract
    */
    function totalAssets() external view override returns (uint) {
        return _totalAssets();
    }

    function _getMarketCollateralRatio() private view returns (uint) {
        /*
        This can be changed by Compound Governance, with a minimum waiting
        period of five days
        */
        (, uint col, ) = Comptroller(COMPTROLLER).markets(cToken);
        return col;
    }

    function _getSafeCollateralRatio(uint _marketCol) private view returns (uint) {
        return _marketCol.sub(buffer);
    }

    // Not view function
    function _getSupplied() private returns (uint) {
        return CEth(cToken).balanceOfUnderlying(address(this));
    }

    // Not view function
    function _getBorrowed() private returns (uint) {
        return CEth(cToken).borrowBalanceCurrent(address(this));
    }

    // Not view function. Call using static call from web3
    function getLivePosition()
        external
        returns (
            uint supplied,
            uint borrowed,
            uint marketCol,
            uint safeCol
        )
    {
        supplied = _getSupplied();
        borrowed = _getBorrowed();
        marketCol = _getMarketCollateralRatio();
        safeCol = _getSafeCollateralRatio(marketCol);
    }

    // @dev This returns balance last time someone transacted with cToken
    function getCachedPosition()
        external
        view
        returns (
            uint supplied,
            uint borrowed,
            uint marketCol,
            uint safeCol
        )
    {
        // ignore first output, which is error code
        (, uint cTokenBal, uint _borrowed, uint exchangeRate) =
            CEth(cToken).getAccountSnapshot(address(this));

        supplied = cTokenBal.mul(exchangeRate) / 1e18;
        borrowed = _borrowed;
        marketCol = _getMarketCollateralRatio();
        safeCol = _getSafeCollateralRatio(marketCol);
    }

    // @dev This modifier checks collateral ratio after leverage or deleverage
    modifier checkCollateralRatio() {
        _;
        uint supplied = _getSupplied();
        uint borrowed = _getBorrowed();
        uint marketCol = _getMarketCollateralRatio();
        uint safeCol = _getSafeCollateralRatio(marketCol);

        // borrowed / supplied <= safe col
        // supplied can = 0 so we check borrowed <= supplied * safe col
        // max borrow
        uint max = supplied.mul(safeCol) / 1e18;
        require(borrowed <= max, "borrowed > max");
    }

    function _supply(uint _amount) private {
        CEth(cToken).mint{value: _amount}();
    }

    // @dev Execute manual recovery by admin
    // @dev `_amount` must be >= balance of ETH
    function supply(uint _amount) external onlyAdmin {
        _supply(_amount);
    }

    function _borrow(uint _amount) private {
        require(CEth(cToken).borrow(_amount) == 0, "borrow");
    }

    // @dev Execute manual recovery by admin
    function borrow(uint _amount) external onlyAdmin {
        _borrow(_amount);
    }

    function _repay(uint _amount) private {
        CEth(cToken).repayBorrow{value: _amount}();
    }

    // @dev Execute manual recovery by admin
    // @dev `_amount` must be >= balance of ETH
    function repay(uint _amount) external onlyAdmin {
        _repay(_amount);
    }

    function _redeem(uint _amount) private {
        require(CEth(cToken).redeemUnderlying(_amount) == 0, "redeem");
    }

    // @dev Execute manual recovery by admin
    function redeem(uint _amount) external onlyAdmin {
        _redeem(_amount);
    }

    function _getMaxLeverageRatio(uint _col) private pure returns (uint) {
        /*
        c = collateral ratio

        geometric series converges to
            1 / (1 - c)
        */
        // multiplied by 1e18
        return uint(1e36).div(uint(1e18).sub(_col));
    }

    function _getBorrowAmount(
        uint _supplied,
        uint _borrowed,
        uint _col
    ) private pure returns (uint) {
        /*
        c = collateral ratio
        s = supplied
        b = borrowed
        x = amount to borrow

        (b + x) / s <= c
        becomes
        x <= sc - b
        */
        // max borrow
        uint max = _supplied.mul(_col) / 1e18;
        if (_borrowed >= max) {
            return 0;
        }
        return max - _borrowed;
    }

    /*
    Find total supply S_n after n iterations starting with
    S_0 supplied and B_0 borrowed

    c = collateral ratio
    S_i = supplied after i iterations
    B_i = borrowed after i iterations

    S_0 = current supplied
    B_0 = current borrowed

    borrowed and supplied after n iterations
        B_n = cS_(n-1)
        S_n = S_(n-1) + (cS_(n-1) - B_(n-1))

    you can prove using algebra and induction that
        B_n / S_n <= c

        S_n - S_(n-1) = c^(n-1) * (cS_0 - B_0)

        S_n = S_0 + sum (c^i * (cS_0 - B_0)), 0 <= i <= n - 1
            = S_0 + (1 - c^n) / (1 - c)

        S_n <= S_0 + (cS_0 - B_0) / (1 - c)
    */
    function _leverage(uint _targetSupply) private checkCollateralRatio {
        uint supplied = _getSupplied();
        uint borrowed = _getBorrowed();
        uint unleveraged = supplied.sub(borrowed); // supply with 0 leverage
        require(_targetSupply >= unleveraged, "leverage");

        uint marketCol = _getMarketCollateralRatio();
        uint safeCol = _getSafeCollateralRatio(marketCol);
        uint lev = _getMaxLeverageRatio(safeCol);
        // 99% to be safe, and save gas
        uint max = (unleveraged.mul(lev) / 1e18).mul(9900) / 10000;
        if (_targetSupply >= max) {
            _targetSupply = max;
        }

        uint i;
        while (supplied < _targetSupply) {
            // target is usually reached in 9 iterations
            require(i < 25, "max iteration");

            // use market collateral to calculate borrow amount
            // this is done so that supplied can reach _targetSupply
            // 99.99% is borrowed to be safe
            uint borrowAmount =
                _getBorrowAmount(supplied, borrowed, marketCol).mul(9999) / 10000;
            require(borrowAmount > 0, "borrow = 0");

            if (supplied.add(borrowAmount) > _targetSupply) {
                // borrow > 0 since supplied < _targetSupply
                borrowAmount = _targetSupply.sub(supplied);
            }
            _borrow(borrowAmount);
            // end loop with _supply, this ensures no borrowed amount is unutilized
            _supply(borrowAmount);

            // supplied > _getSupplied(), by about 3 * 1e12 %, but we use local variable to save gas
            supplied = supplied.add(borrowAmount);
            // _getBorrowed == borrowed
            borrowed = borrowed.add(borrowAmount);
            i++;
        }
    }

    function leverage(uint _targetSupply) external onlyAuthorized {
        _leverage(_targetSupply);
    }

    function _deposit() private {
        uint bal = address(this).balance;
        if (bal > 0) {
            _supply(bal);
            // leverage to max
            _leverage(type(uint).max);
        }
    }

    /*
    @notice Deposit ETH into this strategy
    */
    function deposit() external payable override onlyAuthorized {
        require(msg.value > 0, "deposit = 0");

        _increaseDebt(msg.value);
        _deposit();

        emit Deposit(msg.value);
    }

    function _getRedeemAmount(
        uint _supplied,
        uint _borrowed,
        uint _col
    ) private pure returns (uint) {
        /*
        c = collateral ratio
        s = supplied
        b = borrowed
        r = redeem

        b / (s - r) <= c
        becomes
        r <= s - b / c
        */
        // min supply
        // b / c = min supply needed to borrow b
        uint min = _borrowed.mul(1e18).div(_col);

        if (_supplied <= min) {
            return 0;
        }
        return _supplied - min;
    }

    /*
    Find S_0, amount of supply with 0 leverage, after n iterations starting with
    S_n supplied and B_n borrowed

    c = collateral ratio
    S_n = current supplied
    B_n = current borrowed

    S_(n-i) = supplied after i iterations
    B_(n-i) = borrowed after i iterations
    R_(n-i) = Redeemable after i iterations
        = S_(n-i) - B_(n-i) / c
        where B_(n-i) / c = min supply needed to borrow B_(n-i)

    For 0 <= k <= n - 1
        S_k = S_(k+1) - R_(k+1)
        B_k = B_(k+1) - R_(k+1)
    and
        S_k - B_k = S_(k+1) - B_(k+1)
    so
        S_0 - B_0 = S_1 - S_2 = ... = S_n - B_n

    S_0 has 0 leverage so B_0 = 0 and we get
        S_0 = S_0 - B_0 = S_n - B_n
    ------------------------------------------

    Find S_(n-k), amount of supply, after k iterations starting with
    S_n supplied and B_n borrowed

    with algebra and induction you can derive that

    R_(n-k) = R_n / c^k
    S_(n-k) = S_n - sum R_(n-i), 0 <= i <= k - 1
            = S_n - R_n * ((1 - 1/c^k) / (1 - 1/c))

    Equation above is valid for S_(n - k) k < n
    */
    function _deleverage(uint _targetSupply) private checkCollateralRatio {
        uint supplied = _getSupplied();
        uint borrowed = _getBorrowed();
        uint unleveraged = supplied.sub(borrowed);
        require(_targetSupply <= supplied, "deleverage");

        uint marketCol = _getMarketCollateralRatio();

        // min supply
        if (_targetSupply <= unleveraged) {
            _targetSupply = unleveraged;
        }

        uint i;
        while (supplied > _targetSupply) {
            // target is usually reached in 8 iterations
            require(i < 25, "max iteration");

            // 99.99% to be safe
            uint redeemAmount =
                (_getRedeemAmount(supplied, borrowed, marketCol)).mul(9999) / 10000;
            require(redeemAmount > 0, "redeem = 0");

            if (supplied.sub(redeemAmount) < _targetSupply) {
                // redeem > 0 since supplied > _targetSupply
                redeemAmount = supplied.sub(_targetSupply);
            }
            _redeem(redeemAmount);
            _repay(redeemAmount);

            // supplied < _geSupplied(), by about 7 * 1e12 %
            supplied = supplied.sub(redeemAmount);
            // borrowed == _getBorrowed()
            borrowed = borrowed.sub(redeemAmount);
            i++;
        }
    }

    function deleverage(uint _targetSupply) external onlyAuthorized {
        _deleverage(_targetSupply);
    }

    // @dev Returns amount available for transfer
    function _withdraw(uint _amount) private returns (uint) {
        uint bal = address(this).balance;
        if (bal >= _amount) {
            return _amount;
        }

        uint redeemAmount = _amount - bal;
        /*
        c = collateral ratio
        s = supplied
        b = borrowed
        r = amount to redeem
        x = amount to repay

        where
            r <= s - b (can't redeem more than unleveraged supply)
        and
            x <= b (can't repay more than borrowed)
        and
            (b - x) / (s - x - r) <= c (stay below c after redeem and repay)

        so pick x such that
            (b - cs + cr) / (1 - c) <= x <= b

        when b <= cs left side of equation above <= cr / (1 - c) so pick x such that
            cr / (1 - c) <= x <= b
        */
        uint supplied = _getSupplied();
        uint borrowed = _getBorrowed();
        uint marketCol = _getMarketCollateralRatio();
        uint safeCol = _getSafeCollateralRatio(marketCol);
        uint unleveraged = supplied.sub(borrowed);

        // r <= s - b
        if (redeemAmount > unleveraged) {
            redeemAmount = unleveraged;
        }
        // cr / (1 - c) <= x <= b
        uint repayAmount = redeemAmount.mul(safeCol).div(uint(1e18).sub(safeCol));
        if (repayAmount > borrowed) {
            repayAmount = borrowed;
        }

        _deleverage(supplied.sub(repayAmount));
        _redeem(redeemAmount);

        uint balAfter = address(this).balance;
        if (balAfter < _amount) {
            return balAfter;
        }
        return _amount;
    }

    /*
    @notice Withdraw undelying token to vault
    @param _amount Amount of ETH to withdraw
    @dev Caller should implement guard against slippage
    */
    function withdraw(uint _amount) external override onlyAuthorized {
        require(_amount > 0, "withdraw = 0");
        // available <= _amount
        uint available = _withdraw(_amount);
        if (available > 0) {
            _decreaseDebt(available);
        }

        emit Withdraw(available);
    }

    // @dev withdraw all creates dust in supplied
    function _withdrawAll() private {
        _withdraw(type(uint).max);

        // In case there is dust, re-calculate balance
        uint bal = address(this).balance;
        if (bal > 0) {
            _sendEthToVault(bal);
            totalDebt = 0;
        }

        emit Withdraw(bal);
    }

    /*
    @notice Withdraw all ETH to vault
    @dev Caller should implement guard agains slippage
    */
    function withdrawAll() external override onlyAuthorized {
        _withdrawAll();
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
        // claim COMP
        address[] memory cTokens = new address[](1);
        cTokens[0] = cToken;
        Comptroller(COMPTROLLER).claimComp(address(this), cTokens);

        uint compBal = IERC20(COMP).balanceOf(address(this));
        if (compBal > 0) {
            _swapToEth(COMP, compBal);
            // Now this contract has ETH
        }
    }

    /*
    @notice Claim and sell any rewards
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
            // _supply() to decrease collateral ratio and earn interest
            // use _supply() instead of _deposit() to save gas
            uint profit = bal.sub(fee);
            _supply(profit);

            emit Harvest(profit);
        }
    }

    /*
    @notice Increase total debt if profit > 0
    */
    function skim() external override onlyAuthorized {
        uint bal = address(this).balance;
        uint supplied = _getSupplied();
        uint borrowed = _getBorrowed();
        uint unleveraged = supplied.sub(borrowed);
        uint total = bal.add(unleveraged);
        require(total > totalDebt, "total <= debt");

        uint profit = total - totalDebt;

        // Incrementing totalDebt has the same effect as transferring profit
        // back to vault and then depositing into this strategy
        // Here we simply increment totalDebt to save gas
        totalDebt = total;

        emit Skim(profit);
    }

    /*
    @notice Exit from strategy, transfer all ETH back to vault
            unless forceExit = true
    */
    function exit() external override onlyAuthorized {
        if (forceExit) {
            return;
        }
        _claimRewards();
        _withdrawAll();
    }

    /*
    @notice Transfer token accidentally sent here to admin
    @param _token Address of token to transfer
    */
    function sweep(address _token) external override onlyAdmin {
        require(_token != cToken, "protected token");
        require(_token != COMP, "protected token");
        IERC20(_token).safeTransfer(admin, IERC20(_token).balanceOf(address(this)));
    }
}
