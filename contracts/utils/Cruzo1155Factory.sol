//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract Cruzo1155Factory is Context, Ownable {
    event NewTokenCreated(
        address indexed tokenAddress,
        address indexed creator
    );

    address private immutable beacon;

    bytes4 public selector;
    string public baseUri;
    address public marketAddress;
    address public last;

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

    function create(
        string calldata _name,
        string calldata _symbol,
        string calldata _contractURI
    ) external returns (address) {
        BeaconProxy proxy = new BeaconProxy(
            address(beacon),
            abi.encodeWithSelector(
                selector,
                _name,
                _symbol,
                baseUri,
                _contractURI,
                marketAddress,
                _msgSender()
            )
        );
        last = address(proxy);
        emit NewTokenCreated(address(proxy), _msgSender());
        return address(proxy);
    }

    function updateInitSelector(string calldata rowStr) external onlyOwner {
        selector = bytes4(keccak256(bytes(rowStr)));
    }

    function getImplementation() external view returns (address) {
        return beacon;
    }

    function changeBaseUri(string memory newBaseUri) external onlyOwner {
        baseUri = newBaseUri;
    }
}
