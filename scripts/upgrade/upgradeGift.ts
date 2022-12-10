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
  let giftAddress = getAddress(chainId)?.gift;
  if (!giftAddress) {
    throw `Gift address is undefined, terminating`;
  }

  console.log("Upgrading Gift contract");
  const Gift = await ethers.getContractFactory("CruzoGift");
  const gift = await upgrades.upgradeProxy(giftAddress, Gift);
  await gift.deployed();

  console.log("Gift Contract upgraded");
  console.log("Gift Contract Address : ", gift.address);

  setAddress(chainId, ContractType.gift, gift.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
