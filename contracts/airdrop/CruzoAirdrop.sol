//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";

import "../transfer-proxy/ITransferProxy.sol";

contract CruzoAirdrop is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ERC1155HolderUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    struct Drop {
        address tokenAddress;
        uint256 tokenId;
        uint256 amount;
        uint256 claimed;
        mapping(address => bool) claimers;
    }

    event DropCreated(
        uint256 id,
        address tokenAddress,
        uint256 tokenId,
        address creator,
        uint256 amount
    );

    event DropClaimed(uint256 id, address claimer);

    CountersUpgradeable.Counter private ids;

    ITransferProxy public transferProxy;

    mapping(uint256 => Drop) public drops;

    constructor() {}

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function initialize(ITransferProxy _transferProxy) public initializer {
        __Ownable_init();
        transferProxy = _transferProxy;
    }

    function claim(uint256 _id) external {
        Drop storage drop = drops[_id];
        require(drop.amount > 0, "Airdrop: not found");
        require(drop.claimed < drop.amount, "Airdrop: closed");
        require(!drop.claimers[_msgSender()], "Airdrop: already claimed");
        drop.claimed++;
        drop.claimers[_msgSender()] = true;
        transferProxy.safeTransferFrom(
            IERC1155Upgradeable(drop.tokenAddress),
            address(this),
            _msgSender(),
            drop.tokenId,
            1,
            ""
        );
        emit DropClaimed(_id, _msgSender());
    }

    function create(
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _amount
    ) external onlyOwner {
        require(_amount > 0, "Airdrop: amount must be greater than 0");
        ids.increment();
        Drop storage drop = drops[ids.current()];
        drop.tokenAddress = _tokenAddress;
        drop.tokenId = _tokenId;
        drop.amount = _amount;
        transferProxy.safeTransferFrom(
            IERC1155Upgradeable(_tokenAddress),
            _msgSender(),
            address(this),
            _tokenId,
            _amount,
            ""
        );
        emit DropCreated(
            ids.current(),
            _tokenAddress,
            _tokenId,
            _msgSender(),
            _amount
        );
    }
}
