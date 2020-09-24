pragma solidity 0.5.17;

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

    function relayTx(uint _amount, address _to, bytes calldata _data)
        external onlyAdmin
    {
        if (_amount > 0) {
            GasToken(gasToken).freeUpTo(_amount);
        }

        (bool success,) = _to.call(_data);
        require(success, "relay failed");
    }
}