pragma solidity 0.5.17;

import "@openzeppelin/contracts/math/Math.sol";
import "./interfaces/GasToken.sol";

contract GasRelayer {
    address public admin;
    address public gasToken;

    constructor(address _gasToken) public {
        require(_gasToken != address(0), "gas token = zero address");

        admin = msg.sender;
        gasToken = _gasToken;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "!admin");
        _;
    }

    // @dev use CHI token from 1inch to burn gas token
    // https://medium.com/@1inch.exchange/1inch-introduces-chi-gastoken-d0bd5bb0f92b
    modifier useChi(uint _max) {
        uint gasStart = gasleft();
        _;
        uint gasSpent = 21000 + gasStart - gasleft() + 16 * msg.data.length;

        if (_max > 0) {
            GasToken(gasToken).freeUpTo(Math.min(_max, (gasSpent + 14154) / 41947));
        }
    }

    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0), "admin = zero address");
        admin = _admin;
    }

    function setGasToken(address _gasToken) external onlyAdmin {
        require(_gasToken != address(0), "gas token = zero address");
        gasToken = _gasToken;
    }

    function mintGasToken(uint _amount) external {
        GasToken(gasToken).mint(_amount);
    }

    function transferGasToken(address _to, uint _amount) external onlyAdmin {
        GasToken(gasToken).transfer(_to, _amount);
    }

    function relayTx(
        address _to,
        bytes calldata _data,
        uint _maxGasToken
    ) external onlyAdmin useChi(_maxGasToken) {
        (bool success, ) = _to.call(_data);
        require(success, "relay failed");
    }
}
