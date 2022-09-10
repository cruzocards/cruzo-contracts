# Cruzo Contracts

## Contracts

-   Cruzo1155
-   CruzoMarket
-   Factory
-   Vault

## Networks

| Blockchain | Network | Name              |
| ---------- | ------- | ----------------- |
| Ethereum   | mainnet | ethMainnet        |
| Ethereum   | testnet | ethRinkeby        |
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
yarn deployBeacon --network <network>
yarn deployMarket --network <network>
yarn deployFactory --network <network>
yarn deployToken --network <network>
```

### Export ABI

```sh
yarn abi
```

### Verify contract

```sh
yarn verify --network <netowrk> <contract> [<arg1> <arg2> ...]
```

## Upgrades, Proxy approach

We use UUPS proxy pattern for CruzoMarket, CruzoVault contracts and BeaconProxy for instances of Cruzo1155 contracts.

**Requires:** openzeppelin/hardhat-upgrades

### Simple rules to upgrade contract:

1. Don't forget to implement upgrade method inside implementation(\_authorizeUpgrade)(for UUPS proxy pattern).
2. Append new variables to the end of the variables list.
3. Don't delete old variables.

### In code

#### To deploy UUPS proxy:

`upgrades.deployProxy(ContractFactory, [contructor args], { kind : "uups" })`

#### To update UUPS proxy:

`upgrades.upgradeProxy(address of old impl, newContractFactory)`

#### To deploy Beacon proxy:

`await upgrades.deployBeacon(TokenFactory)`

#### To update Beacon proxy:

`await upgrades.upgradeBeacon(beaconAddress, newTokenFactory)`

### Through command line

```sh
yarn upgradeMarket --network <network>
yarn upgradeBeacon --network <network>
```
