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

  console.log("Upgrading TransferProxy contract");
  const TransferProxy = await ethers.getContractFactory("TransferProxy");
  const transferProxy = await upgrades.upgradeProxy(
    transferProxyAddress,
    TransferProxy
  );
  await transferProxy.deployed();

  console.log("TransferProxy Contract upgraded");
  console.log("TransferProxy Contract Address : ", transferProxy.address);

  setAddress(chainId, ContractType.transferProxy, transferProxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
