//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "hardhat/console.sol";

/// @title The Cruzo721 NFT Contract implementing ERC721 standard
/// @notice This contract can will be the token for Cruzo NFT's
/// @dev Only the contract owner can mint the tokens
contract Cruzo1155 is ERC1155Supply, Pausable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address public marketAddress;

    constructor(address _marketAddress)
        ERC1155("https://somthing.something/{id}.json")
    {
        marketAddress = _marketAddress;
    }

    /**
     * @notice Inorder pause all transfer on the occurence of a major bug
     * @dev See {ERC1155-_beforeTokenTransfer}.
     *
     * Requirements:
     *
     * - the contract must not be paused.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        require(!paused(), "ERC1155Pausable: token transfer while paused");
    }

    /**
     *
     * @notice This function return totalNumber of unique tokentypes
     * @dev This will only return the total number of individual unique tokentypes only
     * @dev It will not return total inluding suppply of fungible tokens
     *
     */
    function total() public view onlyOwner returns (uint256) {
        return _tokenIds.current();
    }

    /**
     *
     * @notice Internal function to mint to `_amount` of tokens of `_tokenId` to `_to` address
     * @param _tokenId - The Id of the token to be minted
     * @param _to - The to address to which the token is to be minted
     * @param _amount - The amount of tokens to be minted
     * @dev Can be used to mint any specific tokens
     *
     */
    function _mintTokens(
        uint256 _tokenId,
        uint256 _amount,
        address _to
    ) internal returns (uint256) {
        _mint(_to, _tokenId, _amount, "");
        setApprovalForAll(marketAddress, true);
        return _tokenId;
    }

    /**
     *
     * @notice Internal function to mint to `_amount` of tokens of new tokens to `_to` address
     * @param _to - The to address to which the token is to be minted
     * @param _amount - The amount of tokens to be minted
     * @dev Used internally to mint new tokens
     */
    function _mintNewTokens(uint256 _amount, address _to)
        internal
        returns (uint256)
    {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        return _mintTokens(newItemId, _amount, _to);
    }

    /**
     *
     * @notice This function can be used to mint a new token to a specific address
     * @param _to - The to address to which the token is to be minted
     * @param _amount - The amount of tokens to be minted
     * @dev Mint a new token  to `to` address
     *
     */
    function mintNew(uint256 _amount, address _to)
        public
        onlyOwner
        returns (uint256)
    {
        return _mintNewTokens(_amount, _to);
    }

    /**
     *
     * @notice This function can be used to mint a new token to a `msg.sender`
     * @param _amount - The amount of tokens to be minted
     * @dev Mint a new token  to `msg.sender` address
     *
     */
    function mintNew(uint256 _amount) public onlyOwner returns (uint256) {
        return _mintNewTokens(_amount, msg.sender);
    }
}
