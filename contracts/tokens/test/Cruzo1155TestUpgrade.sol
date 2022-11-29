//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../Cruzo1155.sol";

contract Cruzo1155TestUpgrade is Cruzo1155 {
    function testUpgrade() external pure returns (string memory) {
        return "hello";
    }
}
