# Cruzo Contracts

## Contracts

- Cruzo1155
- CruzoMarket
- Factory
- CruzoGift
- CruzoPassSale

## Networks

| Blockchain | Network | Name              |
| ---------- | ------- | ----------------- |
| Ethereum   | mainnet | ethMainnet        |
| Ethereum   | testnet | ethGoerli         |
| Binance    | mainnet | bscMainnet        |
| Binance    | testnet | bscTestnet        |
| Polygon    | mainnet | polygonMainnet    |
| Polygon    | testnet | polygonMumbai     |
| Cronos     | mainnet | cronosMainnetBeta |
| Cronos     | testnet | cronosTestnet     |
| Avalanche  | mainnet | avaxMainnet       |
| Avalanche  | testnet | avaxFuji          |
| Moonbeam   | mainnet | moonbeam          |
| Moonbeam   | testnet | moonbaseAlpha     |
| Boba       | mainnet | bobaMainnet       |
| Boba       | testnet | bobaRinkeby       |
| BitTorrent | mainnet | bitTorrentMainnet |
| BitTorrent | testnet | bitTorrentDonau   |
| XDC        | mainnet | xdcMainnet        |
| XDC        | testnet | xdcApothem        |
| Lukso      | testnet | l16Testnet        |
| Evmos      | testnet | evmosTestnet      |
| Cube       | mainnet | cubeMainnet       |
| Cube       | testnet | cubeTestnet       |
| Klaytn     | mainnet | klaytnMainnet     |
| Klaytn     | testnet | klaytnTestnet     |

## Configuration

- `ADDRESS_MAPPING_FILENAME` should point to environment specific JSON file

## Scripts

### Compile

```sh
yarn compile
```

### Generate typings

```sh
yarn typegen
```

### Run tests

```sh
yarn test
```

### Lint

```sh
yarn lint
```

### Deploy

```sh
yarn deployTransferProxy --network <network>
yarn deployMarket --network <network>
yarn deployGift --network <network>
yarn setTransferProxyOperators --network <network>

yarn deployBeacon --network <network>
yarn deployFactory --network <network>
yarn deployToken --network <network>
```

### Export ABI

```sh
yarn abi
```

### Verify contract

```sh
yarn verify --contract <contract source:contract name> --network <netowrk> <contract> [<arg1> <arg2> ...]
```

### Verify TransferProxy

```sh
yarn verify --network ethGoerli --contract contracts/transfer-proxy/TransferProxy.sol:TransferProxy <address>
```

#### Verify Market

```sh
yarn verify --network ethGoerli --contract contracts/marketplace/CruzoMarket.sol:CruzoMarket <address>
```

#### Verify Factory

```sh
yarn verify --network ethGoerli --contract contracts/factory/CruzoFactory.sol:CruzoFactory <address> <beaconAddress> <transferProxyAddress>
```

#### Verify Token

TBD

#### Verify Gift

```sh
yarn verify --network ethGoerli --contract contracts/gift/CruzoGift.sol:CruzoGift <address>
```

#### Verify Pass Sale

```sh
yarn verify --network ethGoerli --contract contracts/pass-sale/CruzoPassSale.sol:CruzoPassSale --constructor-args data/pass-sale/verify-args.js <address>
```

## Upgrades, Proxy approach

We use UUPS proxy pattern for TransferProxy, CruzoMarket, CruzoGift contracts and BeaconProxy for instances of Cruzo1155 contracts.

**Requires:** openzeppelin/hardhat-upgrades

### Simple rules to upgrade contract:

1. Don't forget to implement upgrade method inside implementation(\_authorizeUpgrade)(for UUPS proxy pattern).
2. Append new variables to the end of the variables list.
3. Don't delete old variables.

### In code

#### Deploy UUPS proxy:

`upgrades.deployProxy(ContractFactory, [contructor args], { kind : "uups" })`

#### Update UUPS proxy:

`upgrades.upgradeProxy(address of old impl, newContractFactory)`

#### Deploy Beacon proxy:

`await upgrades.deployBeacon(TokenFactory)`

#### Update Beacon proxy:

`await upgrades.upgradeBeacon(beaconAddress, newTokenFactory)`

### Through command line

```sh
yarn upgradeMarket --network <network>
yarn upgradeBeacon --network <network>
yarn upgradeGift --network <network>
yarn upgradeTransferProxy --network <network>
```

## NFT Pass

### Generate contractURI and baseURI

```sh
# open https://nft.storage/manage/ to get a token
$ NFTSTORAGE_TOKEN=<token> yarn run ts-node scripts/pass-sale/generate-uris.ts
```

### Generate Signatures

[data/pass-sale/addresses.json](data/pass-sale/addresses.json)

[data/pass-sale/signatures.json](data/pass-sale/signatures.json)

```sh
$ SIGNER_KEY=<key> yarn run ts-node scripts/pass-sale/sign.ts
```

### Deploy

```sh
# make sure you deploy these contracts before
# yarn deployBeacon --network <network>
# yarn deployMarket --network <network>
# yarn deployFactory --network <network>

$ SIGNER_ADDRESS=<address> REWARDS_ADDRESS=<address> yarn deployPassSale --network <network>
```
