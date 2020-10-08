pragma solidity ^0.5.17;

contract BaseStrategy {
    address public admin;
    address public controller;
    address public vault;

    // performance fee sent to treasury when harvest() generates profit
    uint public performanceFee = 100;
    uint internal constant PERFORMANCE_FEE_MAX = 10000;

    constructor(address _controller, address _vault) public {
        require(_controller != address(0), "controller = zero address");
        require(_vault != address(0), "vault = zero address");

        admin = msg.sender;
        controller = _controller;
        vault = _vault;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "!admin");
        _;
    }

    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0), "admin = zero address");
        admin = _admin;
    }

    function setController(address _controller) external onlyAdmin {
        require(_controller != address(0), "controller = zero address");
        controller = _controller;
    }

    function setPerformanceFee(uint _fee) external onlyAdmin {
        require(_fee <= PERFORMANCE_FEE_MAX, "performance fee > max");
        performanceFee = _fee;
    }
}
