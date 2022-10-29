//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "../tokens/Cruzo1155.sol";

import "../utils/Cruzo1155Factory.sol";

contract CruzoPassSale is Ownable {
    uint256 public constant MAX_PER_ACCOUNT = 3;
    uint256 public constant REWARDS = 20;
    uint256 public constant ALLOCATION = 180;
    uint256 public constant MAX_SUPPLY = ALLOCATION + REWARDS;

    address public tokenAddress;
    address public signerAddress;
    URI[MAX_SUPPLY] private uris;
    uint256 public price;

    uint256 public tokenId;

    mapping(address => uint256) public allocation;

    bool public saleActive;
    bool public publicSale;

    event Mint(address to, uint256 tokenId);

    struct URI {
        // Example: [bafkreihfdlvzii7famwufwck56bcoen][som4ohfjdysxd4nmwg6zm6hro7m]
        bytes32 left;
        bytes27 right;
    }

    constructor(
        address _factoryAddress,
        address _signerAddress,
        address _rewardsAddress,
        URI[MAX_SUPPLY] memory _uris,
        uint256 _price
    ) {
        tokenAddress = Cruzo1155Factory(_factoryAddress).create(
            "CRUZO Collectors NFT Pass - OFFICIAL",
            "CCP",
            // contractURI
            "ipfs://bafkreic7g3c57uef4sw7yxn7exx6eeugv4ynuoxle5yalorxkzqw5kz7xq",
            false
        );
        price = _price;
        uris = _uris;
        signerAddress = _signerAddress;

        // Mint rewards
        for (uint256 i = 0; i < REWARDS; i++) {
            _mint(_rewardsAddress);
        }
    }

    function _mint(address _to) internal {
        require(++tokenId <= MAX_SUPPLY, "CruzoPassSale: not enough supply");
        Cruzo1155(tokenAddress).create(
            tokenId,
            1,
            _to,
            string(
                abi.encodePacked(
                    uris[tokenId - 1].left,
                    uris[tokenId - 1].right
                )
            ),
            "",
            _to,
            // royalty = 10%
            1000
        );
        emit Mint(_to, tokenId);
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

    function withdraw(address payable _to) external onlyOwner {
        Address.sendValue(_to, address(this).balance);
    }

    function transferTokenOwnership(address _to) external onlyOwner {
        Ownable(tokenAddress).transferOwnership(_to);
    }

    function setSaleActive(bool _saleActive) external onlyOwner {
        saleActive = _saleActive;
    }

    function setPublicSale(bool _publicSale) external onlyOwner {
        publicSale = _publicSale;
    }
}
