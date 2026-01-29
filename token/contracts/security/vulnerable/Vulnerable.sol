// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VulnerableBank {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 _amount) external {
        require(balances[msg.sender] >= _amount, "Insufficient balance");

        (bool ok, ) = msg.sender.call{value: _amount}("");
        require(ok, "ETH transfer failed");

        unchecked {
            balances[msg.sender] -= _amount;
        }
    }

    function getBankBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

