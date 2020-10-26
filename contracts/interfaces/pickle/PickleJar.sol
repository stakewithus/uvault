pragma solidity 0.5.17;

interface PickleJar {
    /*
    @notice returns price of token / share
    @dev ratio is multiplied by 10 ** 18
    */
    function getRatio() external view returns (uint);

    function deposit(uint _amount) external;

    function withdraw(uint _amount) external;
}
