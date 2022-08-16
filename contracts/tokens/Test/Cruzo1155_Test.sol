//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "../ERC1155URI.sol";

contract Cruzo1155_v2 is Initializable, ERC1155URI {
    address public marketAddress;

    string public name;
    string public symbol;
    string public contractURI;

    function initialize(
        string calldata _name,
        string calldata _symbol,
        string memory _baseMetadataURI,
        string memory _contractURI,
        address _marketAddress,
        address owner
    ) public initializer {
        __Ownable_init();
        __Context_init();
        __Pausable_init();
        __ERC1155Supply_init();
        __ERC1155_init(_baseMetadataURI);
        setBaseURI(_baseMetadataURI);
        marketAddress = _marketAddress;
        name = _name;
        symbol = _symbol;
        contractURI = _contractURI;
        setURIType(1);
        _transferOwnership(owner);
    }

    function setMarketAddress(address _new) public onlyOwner {
        marketAddress = _new;
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
    function _mintToken(
        uint256 _tokenId,
        uint256 _amount,
        address _to,
        bytes memory _data
    ) internal returns (uint256) {
        _mint(_to, _tokenId, _amount, _data);
        setApprovalForAll(marketAddress, true);
        return _tokenId;
    }

    /**
     *
     * @notice Internal function to mint to `_amount` of tokens of new tokens to `_to` address
     * @param _to - The to address to which the token is to be minted
     * @param _amount - The amount of tokens to be minted
     * @param _uri - The token metadata uri (optional if tokenURI is set)
     * @dev Used internally to mint new tokens
     */
    function _createToken(
        uint256 _tokenId,
        uint256 _amount,
        address _to,
        string memory _uri,
        bytes memory _data
    ) internal returns (uint256) {
        creators[_tokenId] = _msgSender();

        if (bytes(_uri).length > 0) {
            _setTokenURI(_tokenId, _uri);
        }
        creators[_tokenId] = _msgSender();

        return _mintToken(_tokenId, _amount, _to, _data);
    }

    /**
     *
     * @notice This function can be used to mint a new token to a specific address
     * @param _to - The to address to which the token is to be minted
     * @param _amount - The amount of tokens to be minted
     * @dev Mint a new token  to `to` address
     *
     */
    function create(
        uint256 _tokenId,
        uint256 _amount,
        address _to,
        string memory _uri,
        bytes memory _data
    ) public returns (uint256) {
        return _createToken(_tokenId, _amount, _to, _uri, _data);
    }

    /**
     *
     * @notice Mint a specific token to `_to` address in `_amount` quantiy
     * @param _tokenId The token ID to be minted
     * @param _amount - The amount of tokens to be minted
     * @param _to - The to address to which the token is to be minted
     * Requirements-
     *     - Token ID must exist
     */
    function mintTo(
        uint256 _tokenId,
        uint256 _amount,
        address _to,
        bytes memory _data
    ) public onlyCreator(_tokenId) returns (uint256) {
        require(
            creators[_tokenId] != address(0),
            "token doesn't exist; try using `mintNewTo()`"
        );
        return _mintToken(_tokenId, _amount, _to, _data);
    }

    /**
     *
     * @notice SET Uri Type from {DEFAULT,IPFS,ID}
     * @param _uriType - The uri type selected from {DEFAULT,IPFS,ID}
     */

    function setURIType(uint256 _uriType) public onlyOwner {
        _setURIType(_uriType);
    }

    function uri(uint256 id) public view override returns (string memory) {
        require(creators[id] != address(0), "Cruzo1155:non existent tokenId");
        return _tokenURI(id);
    }

    function setTokenURI(uint256 _id, string memory _uri) public {
        require(creators[_id] != address(0), "Cruzo1155:non existent tokenId");
        _setTokenURI(_id, _uri);
    }

    function setBaseURI(string memory _baseURI) public onlyOwner {
        _setBaseURI(_baseURI);
    }

    function setContractURI(string memory _newURI) external onlyOwner {
        contractURI = _newURI;
    }

    function check() external pure returns (string memory) {
        return "hello";
    }
}
