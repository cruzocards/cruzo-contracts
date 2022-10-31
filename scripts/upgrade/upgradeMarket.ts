import { ethers, network, upgrades } from "hardhat";
import {
  ContractType,
  getAddress,
  setAddress,
} from "../../utils/addressTracking";

async function main() {
  const chainId = network.config.chainId;
  if (!chainId) {
    throw "Chain ID is undefined, terminating";
  }
  const addressEntry = getAddress(chainId);
  if (!addressEntry || !addressEntry.market) {
    throw "Market address is undefined, nothing to update, terminating";
  }

  console.log("Upgrading market contract");
  const Market = await ethers.getContractFactory("CruzoMarket");
  const market = await upgrades.upgradeProxy(addressEntry.market, Market);
  await market.deployed();

  console.log("Market Contract upgraded");
  console.log("Market Contract Address : ", market.address);
  // TODO: replace with appropriate website depending on the network
  // console.log(`https://polygonscan.com/token/${market.address}`);
  // console.log(`https://mumbai.polygonscan.com/token/${market.address}`);

  setAddress(chainId, ContractType.market, market.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
