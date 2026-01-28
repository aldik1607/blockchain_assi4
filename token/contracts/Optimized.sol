// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Optimized {
    uint256[] public numbers;
    uint256 public totalSum;

    function addNumbers(uint256[] memory nums) public {
        uint256 tempSum = 0;
        for (uint i = 0; i < nums.length; i++) {
            numbers.push(nums[i]);
            tempSum += nums[i]; // считаем сразу сумму
        }
        totalSum += tempSum;
    }

    function sum() public view returns (uint256) {
        return totalSum; // читаем готовую сумму
    }
}
