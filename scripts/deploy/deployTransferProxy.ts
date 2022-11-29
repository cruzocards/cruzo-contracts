import { ethers, network, upgrades } from "hardhat";
import { ContractType, setAddress } from "../../utils/addressTracking";

async function main() {
  const chainId = network.config.chainId;
  if (!chainId) {
    throw "Chain ID is undefined, terminating";
  }
  console.log("Deploying TransferProxy contract");
  const TransferProxy = await ethers.getContractFactory("TransferProxy");

  const transferProxy = await upgrades.deployProxy(TransferProxy, [], {
    kind: "uups",
  });
  await transferProxy.deployed();

  console.log("TransferProxy Contract Deployed");
  console.log("TransferProxy Contract Address : ", transferProxy.address);

  setAddress(chainId, ContractType.transferProxy, transferProxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
