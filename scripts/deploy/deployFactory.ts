import { ethers, network } from "hardhat";
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
  let beaconAddress = getAddress(chainId)?.beacon;
  if (!beaconAddress) {
    throw `Beacon address is undefined, terminating`;
  }

  let transferProxyAddress = getAddress(chainId)?.transferProxy;
  if (!transferProxyAddress) {
    throw `TransferProxy address is undefined, terminating`;
  }

  console.log("Deploying Factory contract");
  const Factory = await ethers.getContractFactory("Cruzo1155Factory");
  const factory = await Factory.deploy(beaconAddress, transferProxyAddress);

  console.log("Factory Contract Deployed");
  console.log("Factory Contract Address : ", factory.address);

  setAddress(chainId, ContractType.factory, factory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
