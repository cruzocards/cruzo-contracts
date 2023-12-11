import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-abi-exporter";
import "hardhat-gas-reporter";
import "@openzeppelin/hardhat-upgrades";

import { task, HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";

task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});

dotenv.config();
const PKS =
  process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [];
const {
  ETHERSCAN_API_KEY = "",
  POLYGONSCAN_API_KEY = "",
  BSC_API_KEY = "",
  MOONBEAM_API_KEY = "",
  EVMOS_API_KEY = "",
  CUBE_API_KEY = "",
} = process.env;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.13",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    ethMainnet: {
      url: "https://mainnet.infura.io/v3/2439f263ff0c4b29bfa0cf70da744d46",
      chainId: 1,
      accounts: PKS,
    },
    ethGoerli: {
      url: "https://goerli.infura.io/v3/2439f263ff0c4b29bfa0cf70da744d46",
      chainId: 5,
      accounts: PKS,
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 15000000000,
      accounts: PKS,
    },
    bscMainnet: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: PKS,
    },
    polygonMumbai: {
      url: "https://polygon-mumbai.infura.io/v3/2439f263ff0c4b29bfa0cf70da744d46", // https://rpc-mumbai.maticvigil.com
      chainId: 80001,
      accounts: PKS,
    },
    polygonMainnet: {
      url: "https://polygon-mainnet.infura.io/v3/2439f263ff0c4b29bfa0cf70da744d46", // https://rpc-mainnet.matic.network
      chainId: 137,
      accounts: PKS,
    },
    cronosMainnetBeta: {
      url: "https://evm-cronos.crypto.org",
      chainId: 25,
      accounts: PKS,
    },
    cronosTestnet: {
      url: "https://cronos-testnet-3.crypto.org:8545",
      chainId: 338,
      accounts: PKS,
    },
    avaxMainnet: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      gasPrice: 225000000000,
      chainId: 43114,
      accounts: PKS,
    },
    avaxFuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      gasPrice: 225000000000,
      chainId: 43113,
      accounts: PKS,
    },
    moonbeam: {
      url: "https://rpc.api.moonbeam.network",
      chainId: 1284,
      accounts: PKS,
    },
    moonbaseAlpha: {
      url: "https://rpc.api.moonbase.moonbeam.network",
      chainId: 1287,
      accounts: PKS,
    },
    bobaMainnet: {
      url: "https://mainnet.boba.network",
      chainId: 288,
      accounts: PKS,
    },
    bobaRinkeby: {
      url: "https://rinkeby.boba.network",
      chainId: 28,
      accounts: PKS,
    },
    bitTorrentMainnet: {
      url: "https://rpc.bt.io",
      chainId: 199,
      accounts: PKS,
    },
    bitTorrentDonau: {
      url: "https://pre-rpc.bt.io",
      chainId: 1029,
      accounts: PKS,
    },
    xdcMainnet: {
      url: "https://rpc.xinfin.network/",
      chainId: 50,
      accounts: PKS,
    },
    xdcApothem: {
      url: "https://rpc.apothem.network",
      chainId: 51,
      accounts: PKS,
    },
    l16Testnet: {
      url: "https://rpc.l16.lukso.network",
      chainId: 2828,
      accounts: PKS,
    },
    evmosTestnet: {
      url: "https://eth.bd.evmos.dev:8545",
      chainId: 9000,
      accounts: PKS,
    },
    cubeMainnet: {
      url: "https://http-mainnet.cube.network",
      chainId: 1818,
      accounts: PKS,
    },
    cubeTestnet: {
      url: "https://http-testnet.cube.network",
      chainId: 1819,
      accounts: PKS,
      gas: 10000000,
      gasPrice: 2000000000,
    },
    klaytnMainnet: {
      url: "https://public-node-api.klaytnapi.com/v1/cypress",
      chainId: 8217,
      accounts: PKS,
    },
    klaytnTestnet: {
      url: "https://public-node-api.klaytnapi.com/v1/baobab",
      chainId: 1001,
      accounts: PKS,
    },
    filHyperspace: {
      url: "https://api.hyperspace.node.glif.io/rpc/v1",
      chainId: 3141,
      accounts: PKS,
      timeout: 1000 * 60 * 10,
    },
    optimismGoerli: {
      url: "https://goerli.optimism.io",
      chainId: 420,
      accounts: PKS,
    },
    gnosisChiadoTestnet: {
      url: "https://rpc.chiadochain.net",
      chainId: 10200,
      accounts: PKS,
    },
    scrollAlphaTestnet: {
      url: "https://alpha-rpc.scroll.io/l2",
      chainId: 534353,
      accounts: PKS,
    },
    iceArctic: {
      url: 'https://arctic-rpc.icenetwork.io:9933',
      chainId: 553,
      accounts: PKS
    },
    polygonZkEvmTestnet: {
      url: 'https://rpc.public.zkevm-test.net',
      chainId: 1442,
      accounts: PKS
    },
    thetaTestnet: {
      url: 'https://eth-rpc-api-testnet.thetatoken.org/rpc',
      chainId: 365,
      accounts: PKS
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      chainId: 31337,
      accounts: PKS,
    },
    artheraTestnet: {
      url: 'https://rpc-test.arthera.net',
      chainId: 10243,
      accounts: PKS,
    }
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      rinkeby: ETHERSCAN_API_KEY,
      goerli: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
      bsc: BSC_API_KEY,
      bscTestnet: BSC_API_KEY,
      moonbeam: MOONBEAM_API_KEY,
      moonbaseAlpha: MOONBEAM_API_KEY,
      evmosTestnet: EVMOS_API_KEY,
      cubeTestnet: CUBE_API_KEY,
    },
    customChains: [
      {
        network: "evmosTestnet",
        chainId: 9000,
        urls: {
          apiURL: "https://evm.evmos.dev/api",
          browserURL: "https://evm.evmos.dev",
        },
      },
      {
        network: "cubeTestnet",
        chainId: 1819,
        urls: {
          apiURL: "https://openapi-testnet.cubescan.network/api",
          browserURL: "https://testnet.cubescan.network",
        },
      },
    ],
  },
  abiExporter: {
    path: "./data/abi",
    runOnCompile: true,
    clear: false,
    flat: true,
    spacing: 2,
    pretty: false,
  },
  gasReporter: {
    enabled: true,
  },
};

export default config;
