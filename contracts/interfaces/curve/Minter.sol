pragma solidity ^0.5.16;

// https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/Minter.vy
interface Minter {
    function mint(address) external;
}