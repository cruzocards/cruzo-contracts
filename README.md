# Cruzo Contracts

## Contracts 
- Cruzo1155
- CruzoMarket

## Networks
| Blockchain | Network | Name  |
|---        |---        |---|
| Ethereum  | mainnet   | ethMainnet        |
| Ethereum  | testnet   | ethRinkeby        |
| Binance   | mainnet   | bscMainnet        |
| Binance   | testnet   | bscTestnet        |
| Polygon   | mainnet   | polygonMainnet    |
| Polygon   | testnet   | polygonMumbai     |
| Cronos    | mainnet   | cronosMainnetBeta |
| Cronos    | testnet   | cronosTestnet     |
| Avalanche | mainnet   | avaxMainnet       |
| Avalanche | testnet   | avaxFuji          |
| Moonbeam  | mainnet   | moonbeam          |
| Moonbeam  | testnet   | moonbaseAlpha     |
| Boba      | mainnet   | bobaMainnet       |
| Boba      | testnet   | bobaRinkeby       |

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
yarn deploy --network <network>
```

### Export ABI
```sh
yarn abi
```

## Upgrades, Proxy approach
We use UUPS proxy pattern.

**Requires:** openzeppelin/hardhat-upgrades

### Simple rules to upgrade contract:

1. Don't forget to implement upgrade method inside implementation(_authorizeUpgrade).
2. Append new variables to the end of the variables list.
3. Don't delete old variables.

### In code

#### To deploy proxy:
`upgrades.deployProxy(ContractFactory, [contructor args], { kind : "uups" })`

#### To update proxy:
`upgrades.upgradeProxy(address of old impl, newContractFactory)`

### Through command line

```sh
yarn upgradeMarket --network <network>
```
[comment]: <> (yarn upgradeToken --network <network>)

