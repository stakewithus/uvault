pragma solidity 0.5.17;

interface IController {
    function admin() external view returns (address);
    function treasury() external view returns (address);
    function harvest(address _strategy) external;
    function withdrawAll(address _strategy) external;
    function exit(address _strategy) external;
}