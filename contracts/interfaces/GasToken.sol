pragma solidity 0.5.17;

interface GasToken {
    function mint(uint amount) external;

    function free(uint amount) external returns (bool);

    function freeUpTo(uint amount) external returns (uint);

    // ERC20
    function transfer(address _to, uint _amount) external returns (bool);

    function balanceOf(address account) external view returns (uint);
}
