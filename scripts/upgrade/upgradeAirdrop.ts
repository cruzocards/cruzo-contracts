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
  let airdropAddress = getAddress(chainId)?.airdrop;
  if (!airdropAddress) {
    throw `Airdrop address is undefined, terminating`;
  }

  console.log("Upgrading Airdrop contract");
  const Airdrop = await ethers.getContractFactory("CruzoAirdrop");
  const airdrop = await upgrades.upgradeProxy(airdropAddress, Airdrop);
  await airdrop.deployed();

  console.log("Airdrop Contract upgraded");
  console.log("Airdrop Contract Address : ", airdrop.address);

  setAddress(chainId, ContractType.airdrop, airdrop.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
