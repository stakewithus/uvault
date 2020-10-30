pragma solidity 0.5.17;
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Timelock {
    using SafeMath for uint;

    event NewAdmin(address admin);
    event NewDelay(uint delay);
    event QueueTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint value,
        bytes data,
        uint eta
    );
    event ExecuteTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint value,
        bytes data,
        uint eta
    );
    event CancelTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint value,
        bytes data,
        uint eta
    );

    uint public constant GRACE_PERIOD = 14 days;
    uint public constant MIN_DELAY = 1 days;
    uint public constant MAX_DELAY = 30 days;

    address public admin;
    uint public delay;

    mapping(bytes32 => bool) public queued;

    constructor(uint _delay) public {
        require(_delay >= MIN_DELAY, "delay < min");
        require(_delay <= MAX_DELAY, "delay > max");

        admin = msg.sender;
        delay = _delay;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "!admin");
        _;
    }

    function() external payable {}

    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0), "admin = zero address");
        admin = _admin;
        emit NewAdmin(_admin);
    }

    function setDelay(uint _delay) external {
        require(msg.sender == address(this), "!timelock");
        require(_delay >= MIN_DELAY, "delay < min");
        require(_delay <= MAX_DELAY, "delay > max");
        delay = _delay;

        emit NewDelay(delay);
    }

    function queue(
        address target,
        uint value,
        bytes calldata data,
        uint eta
    ) external onlyAdmin returns (bytes32) {
        require(eta >= block.timestamp.add(delay), "eta < timestamp + delay");

        bytes32 txHash = keccak256(abi.encode(target, value, data, eta));
        queued[txHash] = true;

        emit QueueTransaction(txHash, target, value, data, eta);

        return txHash;
    }

    function execute(
        address target,
        uint value,
        bytes calldata data,
        uint eta
    ) external payable onlyAdmin returns (bytes memory) {
        bytes32 txHash = keccak256(abi.encode(target, value, data, eta));
        require(queued[txHash], "!queued");
        require(block.timestamp >= eta, "eta < timestamp");
        require(block.timestamp <= eta.add(GRACE_PERIOD), "eta expired");

        queued[txHash] = false;

        // solium-disable-next-line security/no-call-value
        (bool success, bytes memory returnData) = target.call.value(value)(data);
        require(success, "tx failed");

        emit ExecuteTransaction(txHash, target, value, data, eta);

        return returnData;
    }

    function cancel(
        address target,
        uint value,
        bytes calldata data,
        uint eta
    ) external onlyAdmin {
        bytes32 txHash = keccak256(abi.encode(target, value, data, eta));
        require(queued[txHash], "!queued");

        queued[txHash] = false;

        emit CancelTransaction(txHash, target, value, data, eta);
    }
}
