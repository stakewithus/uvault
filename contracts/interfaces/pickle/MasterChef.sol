pragma solidity 0.5.17;

interface MasterChef {
    function userInfo(uint _pid, address _user)
        external
        view
        returns (uint _amount, uint _rewardDebt);

    function deposit(uint _pid, uint _amount) external;

    function withdraw(uint _pid, uint _amount) external;
}
