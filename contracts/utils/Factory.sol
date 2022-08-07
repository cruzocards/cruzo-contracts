//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract Factory is Context, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    mapping(uint256 => address) private tokens;

    address private immutable beacon;

    bytes4 public selector;
    string public baseUri;
    address public marketAddress;

    constructor(
        address _beacon,
        string memory rawFuncInit,
        string memory initBaseUri,
        address initMarketAddress
    ) {
        beacon = _beacon;
        selector = bytes4(keccak256(bytes(rawFuncInit)));
        marketAddress = initMarketAddress;
        baseUri = initBaseUri;
    }

    function create(string calldata _name, string calldata _symbol)
        external
        returns (address)
    {
        _tokenIds.increment();
        BeaconProxy proxy = new BeaconProxy(
            address(beacon),
            abi.encodeWithSelector(
                selector,
                _name,
                _symbol,
                baseUri,
                marketAddress,
                msg.sender
            )
        );
        tokens[_tokenIds.current()] = address(proxy);
        return address(proxy);
    }

    function updateInitSelector(string calldata rowStr) external onlyOwner {
        selector = bytes4(keccak256(bytes(rowStr)));
    }

    function getImplementation() external view returns (address) {
        return beacon;
    }

    function getToken(uint256 _id) external view returns (address) {
        return tokens[_id];
    }

    function changeBaseUri(string memory newBaseUri) external onlyOwner {
        baseUri = newBaseUri;
    }
}
