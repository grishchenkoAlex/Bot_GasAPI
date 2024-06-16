// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

contract TestContract {
    uint256 public value;

    function setValue(uint256 newValue) public {
        value = newValue;
    }

    function getValue() public view returns (uint256) {
        return value;
    }
}