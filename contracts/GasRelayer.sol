pragma solidity ^0.5.16;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface GasToken {
    function mint(uint amount) external;
    function free(uint amount) external returns (bool);
    function freeUpTo(uint amount) external returns (uint);
}

contract GasRelayer {
    using SafeERC20 for IERC20;

    address public owner;
    address public gasToken;
    mapping(address => bool) public whitelist;

    constructor(address _gasToken) public {
        require(_gasToken != address(0)); // dev: gas token == zero address

        owner = msg.sender;
        gasToken = _gasToken;
        whitelist[msg.sender] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner); // dev: !owner
        _;
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }

    function setGasToken(address _gasToken) external onlyOwner {
        gasToken = _gasToken;
    }

    function addWhitelist(address[5] calldata _addresses) external onlyOwner {
        // NOTE: using uint8 for index
        for (uint8 i = 0; i < 5; i++) {
            address addr = _addresses[i];
            if (addr != address(0)) {
                whitelist[addr] = true;
            }
        }
    }

    function removeWhitelist(address[5] calldata _addresses) external onlyOwner {
        // NOTE: using uint8 for index
        for (uint8 i = 0; i < 5; i++) {
            address addr = _addresses[i];
            if (addr != address(0)) {
                whitelist[addr] = false;
            }
        }
    }

    function mintGasToken(uint _value) external {
        GasToken(gasToken).mint(_value);
    }

    function transferGasToken(address _to, uint _value) external onlyOwner {
        IERC20(gasToken).safeTransfer(_to, _value);
    }

    function relayTx(uint _value, address _to, bytes calldata _data) external {
        require(whitelist[msg.sender]); // dev: !whitelist

        if (_value > 0) {
            GasToken(gasToken).freeUpTo(_value);
        }

        (bool success,) = _to.call(_data);
        require(success); // dev: relay tx failed
    }
}