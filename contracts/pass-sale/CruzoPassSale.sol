//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "../tokens/Cruzo1155.sol";

import "./ICruzo1155FactoryDeprecated.sol";

contract CruzoPassSale is Ownable {
    uint256 public constant MAX_PER_ACCOUNT = 3;
    uint256 public constant REWARDS = 20;
    uint256 public constant ALLOCATION = 180;
    uint256 public constant MAX_SUPPLY = ALLOCATION + REWARDS;

    Cruzo1155 public token;
    address public signerAddress;
    uint256 public price;

    uint256 public tokenId;

    mapping(address => uint256) public allocation;

    bool public saleActive;
    bool public publicSale;

    event Mint(address to, uint256 tokenId);

    constructor(
        address _factoryAddress,
        address _signerAddress,
        address _rewardsAddress,
        string memory _contractURI,
        string memory _baseURI,
        uint256 _price
    ) {
        price = _price;
        signerAddress = _signerAddress;

        token = Cruzo1155(
            ICruzo1155FactoryDeprecated(_factoryAddress).create(
                "CRUZO Collectors NFT Pass - OFFICIAL",
                "CNP",
                _contractURI,
                false
            )
        );

        // URIType.ID
        token.setURIType(2);
        token.setBaseURI(_baseURI);

        // Mint rewards
        for (uint256 i = 0; i < REWARDS; i++) {
            _mint(_rewardsAddress);
        }
    }

    function buy(uint256 _amount, bytes calldata _signature) external payable {
        require(saleActive, "CruzoPassSale: sale is not active");

        require(
            publicSale ||
                ECDSA.recover(
                    ECDSA.toEthSignedMessageHash(
                        bytes32(uint256(uint160(msg.sender)))
                    ),
                    _signature
                ) ==
                signerAddress,
            "CruzoPassSale: invalid signature"
        );

        require(_amount > 0, "CruzoPassSale: invalid amount");

        require(
            _amount + allocation[msg.sender] <= MAX_PER_ACCOUNT,
            "CruzoPassSale: too many NFT passes in one hand"
        );

        require(
            msg.value == _amount * price,
            "CruzoPassSale: incorrect value sent"
        );

        allocation[msg.sender] += _amount;
        for (uint256 i = 0; i < _amount; i++) {
            _mint(msg.sender);
        }
    }

    function _mint(address _to) internal {
        require(++tokenId <= MAX_SUPPLY, "CruzoPassSale: not enough supply");
        token.create(
            tokenId,
            1,
            _to,
            "",
            "",
            address(this),
            // royalty = 10%
            1000
        );
        emit Mint(_to, tokenId);
    }

    function withdraw(address payable _to) external onlyOwner {
        Address.sendValue(_to, address(this).balance);
    }

    function transferTokenOwnership(address _to) external onlyOwner {
        token.transferOwnership(_to);
    }

    function setSaleActive(bool _saleActive) external onlyOwner {
        saleActive = _saleActive;
    }

    function setPublicSale(bool _publicSale) external onlyOwner {
        publicSale = _publicSale;
    }
}
