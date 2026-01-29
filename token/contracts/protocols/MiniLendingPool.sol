// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MiniLendingPool {
    IERC20 public immutable token;
    mapping(address => uint256) public balances;
    uint256 public totalDeposits;

    constructor(address _token) {
        require(_token != address(0), "invalid token");
        token = IERC20(_token);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "amount = 0");
        balances[msg.sender] += amount;
        totalDeposits += amount;
        require(token.transferFrom(msg.sender, address(this), amount), "transferFrom failed");
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "amount = 0");
        uint256 bal = balances[msg.sender];
        require(bal >= amount, "insufficient balance");
        unchecked {
            balances[msg.sender] = bal - amount;
            totalDeposits -= amount;
        }
        require(token.transfer(msg.sender, amount), "transfer failed");
    }
}

