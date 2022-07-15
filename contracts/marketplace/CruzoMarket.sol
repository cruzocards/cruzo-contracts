//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

contract CruzoMarket is
    Initializable,
    ContextUpgradeable,
    UUPSUpgradeable,
    ERC1155HolderUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    event TradeOpened(
        address tokenAddress,
        uint256 tokenId,
        address seller,
        uint256 amount,
        uint256 price
    );

    event TradeExecuted(
        address tokenAddress,
        uint256 tokenId,
        address seller,
        address buyer,
        uint256 amount,
        address addressee
    );

    event TradeClosed(address tokenAddress, uint256 tokenId, address seller);

    event TradePriceChanged(
        address tokenAddress,
        uint256 tokenId,
        address seller,
        uint256 price
    );

    event WithdrawalCompleted(address beneficiaryAddress, uint256 _amount);

    struct Trade {
        uint256 amount;
        uint256 price;
    }

    // tokenAddress => tokenId => seller => trade
    mapping(address => mapping(uint256 => mapping(address => Trade)))
        public trades;

    // Service fee percentage in basis point (100bp = 1%)
    uint16 public serviceFee;

    constructor() {}

    function initialize(uint16 _serviceFee) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __Context_init();
        __ReentrancyGuard_init();
        setServiceFee(_serviceFee);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function openTrade(
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _price
    ) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(
            trades[_tokenAddress][_tokenId][_msgSender()].amount == 0,
            "Trade is already open"
        );
        IERC1155Upgradeable(_tokenAddress).safeTransferFrom(
            _msgSender(),
            address(this),
            _tokenId,
            _amount,
            ""
        );
        trades[_tokenAddress][_tokenId][_msgSender()] = Trade({
            amount: _amount,
            price: _price
        });
        emit TradeOpened(
            _tokenAddress,
            _tokenId,
            _msgSender(),
            _amount,
            _price
        );
    }

    function _executeTrade(
        address _tokenAddress,
        uint256 _tokenId,
        address _seller,
        uint256 _amount,
        address _to,
        uint256 value
    ) internal nonReentrant {
        require(
            _msgSender() != _seller,
            "Trade cannot be executed by the seller"
        );
        Trade storage trade = trades[_tokenAddress][_tokenId][_seller];
        require(_amount > 0, "Amount must be greater than 0");
        require(trade.amount >= _amount, "Not enough items in trade");
        require(
            value == trade.price * _amount,
            "Ether value sent is incorrect"
        );
        trade.amount -= _amount;
        IERC1155Upgradeable(_tokenAddress).safeTransferFrom(
            address(this),
            _to,
            _tokenId,
            _amount,
            ""
        );
        AddressUpgradeable.sendValue(
            payable(_seller),
            (value * (10000 - uint256(serviceFee))) / 10000
        );
        emit TradeExecuted(
            _tokenAddress,
            _tokenId,
            _seller,
            _msgSender(),
            _amount,
            _to
        );
    }

    function buyItem(
        address _tokenAddress,
        uint256 _tokenId,
        address _seller,
        uint256 _amount
    ) external payable {
        _executeTrade(
            _tokenAddress,
            _tokenId,
            _seller,
            _amount,
            _msgSender(),
            msg.value
        );
    }

    function giftItem(
        address _tokenAddress,
        uint256 _tokenId,
        address _seller,
        uint256 _amount,
        address _to
    ) external payable {
        require(_msgSender() != _to, "useless operation");
        require(_to != address(0), "trying to send gift to 0 address");
        require(_to != address(this), "trying to send gift to market");

        _executeTrade(
            _tokenAddress,
            _tokenId,
            _seller,
            _amount,
            _to,
            msg.value
        );
    }

    function closeTrade(address _tokenAddress, uint256 _tokenId)
        external
        nonReentrant
    {
        Trade memory trade = trades[_tokenAddress][_tokenId][_msgSender()];
        require(trade.amount > 0, "Trade is not open");
        IERC1155Upgradeable(_tokenAddress).safeTransferFrom(
            address(this),
            _msgSender(),
            _tokenId,
            trade.amount,
            ""
        );
        delete trades[_tokenAddress][_tokenId][_msgSender()];
        emit TradeClosed(_tokenAddress, _tokenId, _msgSender());
    }

    function setServiceFee(uint16 _serviceFee) public onlyOwner {
        require(
            _serviceFee <= 10000,
            "Service fee can not exceed 10,000 basis points"
        );
        serviceFee = _serviceFee;
    }

    function withdraw(address _beneficiaryAddress, uint256 _amount)
        public
        onlyOwner
    {
        AddressUpgradeable.sendValue(payable(_beneficiaryAddress), _amount);
        emit WithdrawalCompleted(_beneficiaryAddress, _amount);
    }

    function changePrice(
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _newPrice
    ) external nonReentrant {
        Trade storage trade = trades[_tokenAddress][_tokenId][_msgSender()];
        require(trade.amount > 0, "Trade is not open");
        trade.price = _newPrice;
        emit TradePriceChanged(
            _tokenAddress,
            _tokenId,
            _msgSender(),
            _newPrice
        );
    }
}
