// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Expensive {
    uint256[] public numbers;

    function addNumbers(uint256[] memory nums) public {
        for (uint i = 0; i < nums.length; i++) {
            numbers.push(nums[i]); // каждый push — дорого
        }
    }

    function sum() public view returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < numbers.length; i++) {
            total += numbers[i]; // loop over storage — дорого
        }
        return total;
    }
}
