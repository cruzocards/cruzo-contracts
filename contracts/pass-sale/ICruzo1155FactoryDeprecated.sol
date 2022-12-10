//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface ICruzo1155FactoryDeprecated {
    function create(
        string calldata _name,
        string calldata _symbol,
        string calldata _contractURI,
        bool _publiclyMintable
    ) external returns (address);
}
