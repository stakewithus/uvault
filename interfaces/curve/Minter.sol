pragma solidity ^0.6.0;

// https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/Minter.vy
interface Minter {
    function mint(address) external;
}