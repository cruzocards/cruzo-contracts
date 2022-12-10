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

  let transferProxyAddress = getAddress(chainId)?.transferProxy;
  if (!transferProxyAddress) {
    throw `TransferProxy address is undefined, terminating`;
  }

  console.log("Deploying Gift contract");
  const Gift = await ethers.getContractFactory("CruzoGift");
  const gift = await upgrades.deployProxy(Gift, [transferProxyAddress], {
    kind: "uups",
  });
  await gift.deployed();

  console.log("Gift Contract Deployed");
  console.log("Gift Contract Address : ", gift.address);

  setAddress(chainId, ContractType.gift, gift.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
