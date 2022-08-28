//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";

error Vault__GivenHashIsNotEmpty();
error Vault__NoGiftByGivenHash(bytes32);
error Vault__CallerIsNotMarket();

contract Cruzo1155TempVault is
    Initializable,
    ContextUpgradeable,
    UUPSUpgradeable,
    ERC1155HolderUpgradeable,
    OwnableUpgradeable
{
    modifier isCallerMarket() {
        if (_msgSender() != marketAddress) {
            revert Vault__CallerIsNotMarket();
        }
        _;
    }

    modifier isGiftExists(string calldata secretKey) {
        if (
            hashToToken[keccak256(bytes(secretKey))].tokenAddress == address(0)
        ) {
            revert Vault__NoGiftByGivenHash(keccak256(bytes(secretKey)));
        }
        _;
    }
    modifier isGivenHashEmpty(bytes32 _hash) {
        if (hashToToken[_hash].tokenAddress != address(0)) {
            revert Vault__GivenHashIsNotEmpty();
        }
        _;
    }

    constructor() {}

    function initialize(address inittialMarketAddress) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __Context_init();
        marketAddress = inittialMarketAddress;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    event GiftVaulted(
        address indexed tokenAddress,
        uint256 indexed tokenId,
        uint256 indexed amount
    );
    event GiftClaimed(
        address indexed claimer,
        address indexed tokenAddress,
        uint256 indexed tokenId,
        uint256 amount
    );
    struct TokenCredentials {
        uint256 tokenId;
        uint256 amount;
        address tokenAddress;
    }

    address public marketAddress;

    mapping(bytes32 => TokenCredentials) hashToToken;

    function claimGift(string calldata userSecretKey)
        external
        isGiftExists(userSecretKey)
    {
        bytes32 _hash = keccak256(bytes(userSecretKey));
        TokenCredentials memory token = hashToToken[_hash];
        IERC1155Upgradeable(token.tokenAddress).safeTransferFrom(
            address(this),
            _msgSender(),
            token.tokenId,
            token.amount,
            ""
        );
        delete hashToToken[_hash];
        emit GiftClaimed(
            _msgSender(),
            token.tokenAddress,
            token.tokenId,
            token.amount
        );
    }

    function holdGift(
        bytes32 _hash,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount
    ) external isGivenHashEmpty(_hash) isCallerMarket {
        hashToToken[_hash] = TokenCredentials(tokenId, amount, tokenAddress);
        emit GiftVaulted(tokenAddress, tokenId, amount);
    }

    function setMarketAddress(address newAddress) external onlyOwner {
        marketAddress = newAddress;
    }
}
