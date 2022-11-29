//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./ITransferProxy.sol";

abstract contract OperatorRole is OwnableUpgradeable {
    mapping(address => bool) public operators;

    function setOperator(address operator, bool value) external onlyOwner {
        operators[operator] = value;
    }

    modifier onlyOperator() {
        require(
            operators[_msgSender()],
            "OperatorRole: caller is not the operator"
        );
        _;
    }

    uint256[50] private __gap;
}
