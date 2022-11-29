//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "../transfer-proxy/ITransferProxy.sol";

contract CruzoGift is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    event Gift(
        uint256 id,
        address tokenAddress,
        uint256 tokenId,
        address from,
        address to,
        uint256 amount
    );

    CountersUpgradeable.Counter private giftIds;

    ITransferProxy public transferProxy;

    constructor() {}

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function initialize(ITransferProxy _transferProxy) public initializer {
        __Ownable_init();
        transferProxy = _transferProxy;
    }

    function gift(
        address _tokenAddress,
        uint256 _tokenId,
        address _to,
        uint256 _amount
    ) external {
        require(_amount > 0, "Gift: amount must be greater than 0");
        giftIds.increment();
        transferProxy.safeTransferFrom(
            IERC1155Upgradeable(_tokenAddress),
            _msgSender(),
            _to,
            _tokenId,
            _amount,
            ""
        );
        emit Gift(
            giftIds.current(),
            _tokenAddress,
            _tokenId,
            _msgSender(),
            _to,
            _amount
        );
    }
}
