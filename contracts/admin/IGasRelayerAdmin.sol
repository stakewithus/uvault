pragma solidity 0.5.17;

// Interface to use on Remix by admin
interface IGasRelayerAdmin {
    function admin() external view returns (address);

    function gasToken() external view returns (address);

    function authorize(address _addr) external;

    function unauthorize(address _addr) external;

    function authorized(address _addr) external view returns (bool);

    function setGasToken(address _gasToken) external;

    function mintGasToken(uint _amount) external;

    function transferGasToken(address _to, uint _amount) external;

    function relayTx(
        address _to,
        bytes calldata _data,
        uint _maxGasToken
    ) external;
}
