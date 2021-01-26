// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./interfaces/uniswap/Uniswap.sol";

/* Changes from V1
- remove IERC20 approve
- remove check on token addresses
- add swapToEth
*/

contract UseUniswapV2 {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    // Uniswap //
    address private constant UNISWAP = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address internal constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    function _swap(
        address _from,
        address _to,
        uint _amount
    ) internal {
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

        Uniswap(UNISWAP).swapExactTokensForTokens(
            _amount,
            1,
            path,
            address(this),
            block.timestamp
        );
    }

    /*
    @dev Child contract must implement receive() external payable
    */
    function _swapToEth(address _from, uint _amount) internal {
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
}
