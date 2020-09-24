pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/GasToken.sol";

contract GasRelayer {
    address public admin;
    address public gasToken;
    // mapping(address => bool) public whitelist;

    constructor(address _gasToken) public {
        require(_gasToken != address(0), "gas token = zero address");

        admin = msg.sender;
        gasToken = _gasToken;
        // whitelist[msg.sender] = true;
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

    // function addWhitelist(address[5] calldata _addresses) external onlyAdmin {
    //     // NOTE: using uint8 for index
    //     for (uint8 i = 0; i < 5; i++) {
    //         address addr = _addresses[i];
    //         if (addr != address(0)) {
    //             whitelist[addr] = true;
    //         }
    //     }
    // }

    // function removeWhitelist(address[5] calldata _addresses) external onlyAdmin {
    //     // NOTE: using uint8 for index
    //     for (uint8 i = 0; i < 5; i++) {
    //         address addr = _addresses[i];
    //         if (addr != address(0)) {
    //             whitelist[addr] = false;
    //         }
    //     }
    // }

    function mintGasToken(uint _value) external {
        GasToken(gasToken).mint(_value);
    }

    function transferGasToken(address _to, uint _value) external onlyAdmin {
        IERC20(gasToken).transfer(_to, _value);
    }

    function relayTx(uint _value, address _to, bytes calldata _data)
        external onlyAdmin
    {
        // require(whitelist[msg.sender], "!whitelist");

        if (_value > 0) {
            GasToken(gasToken).freeUpTo(_value);
        }

        (bool success,) = _to.call(_data);
        require(success, "relay failed");
    }
}