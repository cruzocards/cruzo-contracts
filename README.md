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
yarn deployVault --network <network>
```

### Export ABI

```sh
yarn abi
```

### Verify contract

```sh
yarn verify --contract <contract source:contract name> --network <netowrk> <contract> [<arg1> <arg2> ...]
```

#### Verify Vault
```sh
yarn verify --network ethGoerli --contract contracts/utils/Cruzo1155Vault.sol:Cruzo1155Vault <address>
```

## Upgrades, Proxy approach

We use UUPS proxy pattern for CruzoMarket, CruzoVault contracts and BeaconProxy for instances of Cruzo1155 contracts.

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
yarn upgradeVault --network <network>
```

## Networks
### Binance
- bscTestnet
- bscMainnet
### Polygon
- polygonMumbai
- polygonMainnet
### Cronos
- cronosMainnetBeta
- cronosTestnet
### Avalanche
- avaxMainnet
- avaxFuji

## Compile
`yarn compile`

## Deploy
`yarn deploy --network <supported network>`

### Legacy scripts:

    "deploy-contract-cronos-mainnet": "npx hardhat run scripts/deploy.ts --network cronosMainnetBeta",
    "deploy-contract-cronos-testnet": "npx hardhat run scripts/deploy.ts --network cronosTestnet",
    "deploy-contract-avax-mainnet": "npx hardhat run scripts/deploy.ts --network avaxMainnet",
    "deploy-contract-avax-testnet": "npx hardhat run scripts/deploy.ts --network avaxFuji"