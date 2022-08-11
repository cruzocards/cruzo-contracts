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
  if (!addressEntry || !addressEntry.beacon) {
    throw "Beacon address is undefined, nothing to update, terminating";
  }

  console.log("Upgrading Beacon contract");
  const Token = await ethers.getContractFactory("Cruzo1155");
  const beacon = await upgrades.upgradeBeacon(addressEntry.beacon, Token);

  console.log("Beacon Contract upgraded");
  console.log("Beacon Contract Address : ", beacon.address);
  // TODO: replace with appropriate website depending on the network
  // console.log(`https://polygonscan.com/token/${token.address}`);
  // console.log(`https://mumbai.polygonscan.com/token/${token.address}`);

  setAddress(chainId, ContractType.beacon, beacon.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
