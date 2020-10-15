pragma solidity ^0.5.17;

contract AccessControl {
    event Authorize(address addr);
    event Unauthorize(address addr);

    mapping(address => bool) public authorized;

    modifier onlyAuthorized() {
        require(authorized[msg.sender], "!authorized");
        _;
    }

    function _authorize(address _addr) internal {
        authorized[_addr] = true;

        emit Authorize(_addr);
    }

    function _unauthorize(address _addr) internal {
        authorized[_addr] = false;

        emit Unauthorize(_addr);
    }
}
